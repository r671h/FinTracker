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

  const prompt = `System Role:
Act as a Senior Financial Analyst with 15+ years of experience in market strategy and corporate finance. Your goal is to provide a sophisticated, data-driven answer based strictly on the provided context.

Task:
Analyze the user's question using the provided data. Your response will be displayed directly on a public-facing website interface.

Constraints:

No Markdown Formatting: Do not use bolding (), italics (*), or any other markdown syntax.

Structure: Use clear line breaks and capitalization for emphasis instead of symbols.

Tone: Professional, objective, and authoritative.

Data Integrity: Only use information found in the attached context; do not hallucinate external financial figures unless they are common knowledge (e.g., standard economic definitions).

User Question: ${message} \n\n

Context Data: ${context} \n\n

Conversation History: ${history.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')}

Answer must be short, concise, and directly address the user's question based on the provided data.
`;
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  const reply = text || 'Sorry, I could not generate a response.';
  res.json({ reply });
});

module.exports = router;
