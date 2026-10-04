const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

const app = require('../app');

let mongo;

async function startDb() {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}

async function stopDb() {
  await mongoose.disconnect();
  await mongo.stop();
}

async function clearDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

async function registerUser(overrides = {}) {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name: 'Test User', email: 'user@example.com', password: 'password123', ...overrides });
  return { token: res.body.token, user: res.body.user };
}

async function createAccount(token, overrides = {}) {
  const res = await request(app)
    .post('/api/accounts')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Main', type: 'current', ...overrides });
  return res.body.account;
}

async function getBalance(token, accountId) {
  const res = await request(app)
    .get(`/api/accounts/${accountId}`)
    .set('Authorization', `Bearer ${token}`);
  return res.body.account.balance;
}

module.exports = { app, startDb, stopDb, clearDb, registerUser, createAccount, getBalance };
