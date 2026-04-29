const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const auth = require('../middleware/auth');


const router = express.Router();
router.use(auth);

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// POST /api/ai/analyse
router.post('/analyse', async (req, res) => {
  const { message, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required' });

  // Build financial context from DB
  const [accounts, stats, recentTxns] = await Promise.all([
    Account.find({ user: req.user._id, isArchived: false }),
    Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: null,
          totalIncome: { $sum: { $cond: [{ $gt: ['$amount', 0] }, '$amount', 0] } },
          totalExpenses: { $sum: { $cond: [{ $lt: ['$amount', 0] }, '$amount', 0] } },
          count: { $sum: 1 },
        },
      },
    ]),
    Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(50)
      .populate('account', 'name'),
  ]);

  const byCategory = await Transaction.aggregate([
    { $match: { user: req.user._id, amount: { $lt: 0 } } },
    { $group: { _id: '$category', total: { $sum: { $abs: '$amount' } } } },
    { $sort: { total: -1 } },
  ]);

  const s = stats[0] || {};
  const context = `
User: ${req.user.name} | Currency: ${req.user.currency || 'EUR'}
Accounts: ${accounts.map((a) => `${a.name} (${a.type}): ${a.balance.toFixed(2)}`).join(', ')}
Total income: ${(s.totalIncome || 0).toFixed(2)} | Total expenses: ${Math.abs(s.totalExpenses || 0).toFixed(2)} | Net: ${((s.totalIncome || 0) + (s.totalExpenses || 0)).toFixed(2)}
Spending by category: ${byCategory.map((c) => `${c._id}: ${c.total.toFixed(2)}`).join(', ')}
Recent transactions (last 50): ${recentTxns.map((t) => `${new Date(t.date).toLocaleDateString()} | ${t.description} | ${t.amount.toFixed(2)} (${t.category})`).join('\n')}
  `.trim();

  const messages = [
    ...history.slice(-10), // keep last 10 turns
    { role: 'user', content: message },
  ];

  const prompt = `You are a friendly, expert personal finance analyst. You have access to the user's real financial data below. 
  Give clear, actionable, concise insights. Format numbers with 2 decimal places and currency symbol. 
  Keep responses under 200 words unless detail is requested,
  but it can be longer and dont use **text**. Your answer must clarify the information that is requested from the user.\n\n${context}`
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const reply = text || 'Sorry, I could not generate a response.';
  res.json({ reply });
});

module.exports = router;
