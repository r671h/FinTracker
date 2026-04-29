const express = require('express');
const { body, validationResult } = require('express-validator');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

// GET /api/accounts
router.get('/', async (req, res) => {
  const accounts = await Account.find({
    user: req.user._id,
    isArchived: false,
  }).sort({ createdAt: 1 });

  // Attach transaction counts
  const counts = await Transaction.aggregate([
    { $match: { user: req.user._id } },
    { $group: { _id: '$account', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  counts.forEach((c) => { countMap[c._id.toString()] = c.count; });

  const result = accounts.map((a) => ({
    ...a.toJSON(),
    transactionCount: countMap[a._id.toString()] || 0,
  }));

  res.json({ accounts: result });
});

// GET /api/accounts/:id
router.get('/:id', async (req, res) => {
  const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json({ account });
});

// POST /api/accounts
router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Account name is required'),
    body('type').isIn(['current', 'savings', 'credit', 'investment', 'cash']),
    body('balance').optional().isNumeric(),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const account = await Account.create({
      user: req.user._id,
      ...req.body,
    });

    res.status(201).json({ account });
  }
);

// PUT /api/accounts/:id
router.put('/:id', async (req, res) => {
  const allowed = ['name', 'type', 'balance', 'color', 'institution', 'iban', 'currency'];
  const updates = {};
  allowed.forEach((f) => {
    if (req.body[f] !== undefined) updates[f] = req.body[f];
  });

  const account = await Account.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updates,
    { new: true, runValidators: true }
  );

  if (!account) return res.status(404).json({ error: 'Account not found' });
  res.json({ account });
});

// DELETE /api/accounts/:id
router.delete('/:id', async (req, res) => {
  const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
  if (!account) return res.status(404).json({ error: 'Account not found' });

  // Soft-delete (archive)
  account.isArchived = true;
  await account.save();

  res.json({ message: 'Account archived successfully' });
});

// GET /api/accounts/:id/stats
router.get('/:id/stats', async (req, res) => {
  const account = await Account.findOne({ _id: req.params.id, user: req.user._id });
  if (!account) return res.status(404).json({ error: 'Account not found' });

  const stats = await Transaction.aggregate([
    { $match: { account: account._id, user: req.user._id } },
    {
      $group: {
        _id: null,
        totalIncome: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
        totalExpenses: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
        count: { $sum: 1 },
      },
    },
  ]);

  res.json({ stats: stats[0] || { totalIncome: 0, totalExpenses: 0, count: 0 } });
});

module.exports = router;
