// Seeds a demo user with accounts and ~6 months of transactions.
// Usage: npm run seed   (re-running resets the demo user's data)
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Account = require('../models/Account');
const Transaction = require('../models/Transaction');

const DEMO_EMAIL = process.env.DEMO_EMAIL || 'test@test.com';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'password123';

const MONTHLY = [
  { day: 1, description: 'Salary ACME GmbH', amount: 3200, account: 'main' },
  { day: 2, description: 'Rent - Landlord', amount: -1100, account: 'main' },
  { day: 3, description: 'Transfer to savings', amount: -400, account: 'main' },
  { day: 3, description: 'Transfer from current account', amount: 400, account: 'savings' },
  { day: 5, description: 'Vodafone phone bill', amount: -35, account: 'main' },
  { day: 8, description: 'Netflix', amount: -13.99, account: 'main' },
  { day: 8, description: 'Spotify', amount: -10.99, account: 'main' },
  { day: 15, description: 'Fitness First gym', amount: -29.9, account: 'main' },
];

const RANDOM = [
  { description: 'REWE Supermarket', min: 20, max: 90 },
  { description: 'Lidl', min: 10, max: 60 },
  { description: 'Starbucks Coffee', min: 4, max: 9 },
  { description: 'Pizza Hut', min: 15, max: 40 },
  { description: 'Uber trip', min: 8, max: 30 },
  { description: 'Deutsche Bahn train ticket', min: 20, max: 80 },
  { description: 'Amazon order', min: 15, max: 120 },
  { description: 'Apotheke pharmacy', min: 5, max: 35 },
];

// Deterministic PRNG so every seed produces the same data
let state = 42;
const rand = () => ((state = (state * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
const round = (n) => Math.round(n * 100) / 100;

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: DEMO_EMAIL });
  if (existing) {
    await Promise.all([
      Transaction.deleteMany({ user: existing._id }),
      Account.deleteMany({ user: existing._id }),
      existing.deleteOne(),
    ]);
  }

  const user = await User.create({ name: 'Demo User', email: DEMO_EMAIL, password: DEMO_PASSWORD });
  const [main, savings] = await Account.create([
    { user: user._id, name: 'Main Account', type: 'current', color: '#1D9E75', institution: 'Demo Bank' },
    { user: user._id, name: 'Savings', type: 'savings', color: '#378ADD', institution: 'Demo Bank' },
  ]);
  const accounts = { main, savings };

  const txns = [];
  const now = new Date();
  for (let m = 5; m >= 0; m--) {
    const year = now.getFullYear();
    const month = now.getMonth() - m;

    for (const t of MONTHLY) {
      const date = new Date(year, month, t.day);
      if (date <= now) txns.push({ ...t, date, account: accounts[t.account] });
    }
    for (let i = 0; i < 18; i++) {
      const t = RANDOM[Math.floor(rand() * RANDOM.length)];
      const date = new Date(year, month, 1 + Math.floor(rand() * 28));
      if (date > now) continue;
      txns.push({
        description: t.description,
        amount: -round(t.min + rand() * (t.max - t.min)),
        date,
        account: main,
      });
    }
  }

  await Transaction.insertMany(
    txns.map((t) => ({
      user: user._id,
      account: t.account._id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      category: Transaction.autoCategory(t.description),
    }))
  );

  for (const account of [main, savings]) {
    account.balance = round(
      txns.filter((t) => t.account === account).reduce((s, t) => s + t.amount, 0)
    );
    await account.save();
  }

  console.log(`Seeded ${txns.length} transactions for ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

seed()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
