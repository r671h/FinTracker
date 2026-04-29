const express = require('express');
const multer = require('multer');
const Papa = require('papaparse');
const XLSX = require('xlsx');
const { body, query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const auth = require('../middleware/auth');

const router = express.Router();
router.use(auth);

// Multer: memory storage for CSV / Excel
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const ok =
      allowed.includes(file.mimetype) ||
      /\.(csv|xlsx|xls)$/i.test(file.originalname);
    ok ? cb(null, true) : cb(new Error('Only CSV and Excel files are allowed'), false);
  },
});

// ---------------------------------------------------------------------------
// GET /api/transactions
// Query: page, limit, account, category, search, from, to, type (income|expense)
// ---------------------------------------------------------------------------
router.get('/', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const skip = (page - 1) * limit;

  const filter = { user: req.user._id };

  if (req.query.account) filter.account = req.query.account;
  if (req.query.category) filter.category = req.query.category;
  if (req.query.from || req.query.to) {
    filter.date = {};
    if (req.query.from) filter.date.$gte = new Date(req.query.from);
    if (req.query.to) filter.date.$lte = new Date(req.query.to);
  }
  if (req.query.type === 'income') filter.amount = { $gt: 0 };
  if (req.query.type === 'expense') filter.amount = { $lt: 0 };
  if (req.query.search) {
    filter.description = { $regex: req.query.search, $options: 'i' };
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(filter)
      .populate('account', 'name color type')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Transaction.countDocuments(filter),
  ]);

  res.json({
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/transactions/stats — aggregated dashboard stats
// ---------------------------------------------------------------------------
router.get('/stats', async (req, res) => {
  const userId = req.user._id;
  const { from, to } = req.query;

  const dateFilter = {};
  if (from) dateFilter.$gte = new Date(from);
  if (to) dateFilter.$lte = new Date(to);

  const matchStage = { user: userId };
  if (Object.keys(dateFilter).length) matchStage.date = dateFilter;

  // Monthly spending (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [summary, byCategory, byMonth] = await Promise.all([
    // Total income / expenses
    Transaction.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
          count: { $sum: 1 },
        },
      },
    ]),

    // Expenses by category
    Transaction.aggregate([
      { $match: { ...matchStage, amount: { $lt: 0 } } },
      { $group: { _id: '$category', total: { $sum: { $abs: '$amount' } }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),

    // Monthly totals
    Transaction.aggregate([
      { $match: { user: userId, date: { $gte: sixMonthsAgo }, amount: { $lt: 0 } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: { $abs: '$amount' } },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  res.json({
    summary: summary[0] || { totalIncome: 0, totalExpenses: 0, count: 0 },
    byCategory,
    byMonth,
  });
});

// ---------------------------------------------------------------------------
// POST /api/transactions
// ---------------------------------------------------------------------------
router.post(
  '/',
  [
    body('account').isMongoId().withMessage('Valid account ID required'),
    body('date').isISO8601().withMessage('Valid date required'),
    body('description').trim().notEmpty(),
    body('amount').isNumeric(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    // Verify account ownership
    const account = await Account.findOne({ _id: req.body.account, user: req.user._id });
    if (!account) return res.status(404).json({ error: 'Account not found' });

    const transaction = await Transaction.create({
      user: req.user._id,
      ...req.body,
    });

    // Update account balance
    account.balance += transaction.amount;
    await account.save();

    await transaction.populate('account', 'name color type');
    res.status(201).json({ transaction });
  }
);

// ---------------------------------------------------------------------------
// POST /api/transactions/import — CSV or Excel upload
// ---------------------------------------------------------------------------
router.post('/import', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const accountId = req.body.accountId;
  if (!accountId) return res.status(400).json({ error: 'accountId is required' });

  const account = await Account.findOne({ _id: accountId, user: req.user._id });
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const filename = req.file.originalname.toLowerCase();
  let rows = []; // array of plain objects with header keys

  // ── Parse file ─────────────────────────────────────────────────────────────
  if (filename.endsWith('.xlsx') || filename.endsWith('.xls')) {
    // Excel
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  } else {
    // CSV
    const csvText = req.file.buffer.toString('utf-8');
    const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true, dynamicTyping: false });
    if (parsed.errors.length && parsed.data.length === 0) {
      return res.status(400).json({ error: 'Failed to parse CSV', details: parsed.errors });
    }
    rows = parsed.data;
  }

  if (rows.length === 0) {
    return res.status(400).json({ error: 'File is empty or has no data rows' });
  }

  // ── Auto-detect columns (case-insensitive) ────────────────────────────────
  const headers = Object.keys(rows[0]);

  const detect = (candidates) =>
    headers.find((h) => candidates.includes(h.toLowerCase().trim()));

  const dateCol = detect(['date', 'datum', 'transaction date', 'value date', 'booking date', 'buchungsdatum', 'completed date', 'started date', 'settlement date', 'posting date']);
  const descCol = detect(['description', 'desc', 'payee', 'narrative', 'details', 'name', 'subject', 'verwendungszweck', 'text', 'memo', 'merchant', 'reference']);
  const amtCol  = detect(['amount', 'value', 'betrag', 'sum', 'credit', 'debit', 'transaction amount', 'umsatz', 'local amount']);

  if (!dateCol || !descCol || !amtCol) {
    return res.status(400).json({
      error: 'Could not detect required columns. Ensure the file has: date, description/payee, and amount columns.',
      detectedColumns: headers,
    });
  }

  // ── Build transaction list ────────────────────────────────────────────────
  const toInsert = [];
  const skipped  = [];

  for (const row of rows) {
    const rawDate = row[dateCol];
    const rawDesc = (row[descCol] || '').toString().trim();
    const rawAmt  = (row[amtCol]  || '').toString().replace(/[^0-9.,\-+]/g, '').replace(',', '.');
    const amount  = parseFloat(rawAmt);

    if (!rawDate || !rawDesc || isNaN(amount)) { skipped.push(row); continue; }

    // Handle both JS Date objects (xlsx cellDates) and date strings
    const date = rawDate instanceof Date ? rawDate : new Date(rawDate);
    if (isNaN(date.getTime())) { skipped.push(row); continue; }

    const importId = `${account._id}-${date.toISOString().slice(0, 10)}-${rawDesc.slice(0, 30)}-${amount}`;

    toInsert.push({
      user: req.user._id,
      account: account._id,
      date,
      description: rawDesc,
      amount,
      category: Transaction.autoCategory(rawDesc),
      importId,
    });
  }

  if (toInsert.length === 0) {
    return res.status(400).json({ error: 'No valid transactions found', skipped: skipped.length });
  }

  // Upsert — skip exact duplicates
  const ops = toInsert.map((t) => ({
    updateOne: {
      filter: { importId: t.importId },
      update: { $setOnInsert: t },
      upsert: true,
    },
  }));

  const result    = await Transaction.bulkWrite(ops, { ordered: false });
  const inserted  = result.upsertedCount;
  const duplicates = toInsert.length - inserted;

  // Update account balance by net of newly inserted transactions
  const netNew = toInsert.slice(0, inserted).reduce((s, t) => s + t.amount, 0);
  account.balance += netNew;
  await account.save();

  res.json({ message: 'Import complete', inserted, duplicates, skipped: skipped.length, total: rows.length });
});

// ---------------------------------------------------------------------------
// PUT /api/transactions/:id
// ---------------------------------------------------------------------------
router.put('/:id', async (req, res) => {
  const allowed = ['date', 'description', 'amount', 'category', 'tags', 'notes', 'isRecurring'];
  const updates = {};
  allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

  const transaction = await Transaction.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  ).populate('account', 'name color type');

  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
  res.json({ transaction });
});

// ---------------------------------------------------------------------------
// DELETE /api/transactions/:id
// ---------------------------------------------------------------------------
router.delete('/:id', async (req, res) => {
  const transaction = await Transaction.findOneAndDelete({
    _id: req.params.id,
    user: req.user._id,
  });

  if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

  // Reverse the balance effect
  const account = await Account.findById(transaction.account);
  if (account) {
    account.balance -= transaction.amount;
    await account.save();
  }

  res.json({ message: 'Transaction deleted' });
});

module.exports = router;