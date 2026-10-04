const request = require('supertest');
const {
  app, startDb, stopDb, clearDb, registerUser, createAccount, getBalance,
} = require('./helpers');

beforeAll(startDb);
afterAll(stopDb);
afterEach(clearDb);

let token;
let account;

beforeEach(async () => {
  ({ token } = await registerUser());
  account = await createAccount(token);
});

const authed = (req) => req.set('Authorization', `Bearer ${token}`);

const createTxn = (body) =>
  authed(request(app).post('/api/transactions')).send({
    account: account._id,
    date: '2024-03-01',
    description: 'Test',
    amount: -10,
    ...body,
  });

const importCsv = (csv) =>
  authed(request(app).post('/api/transactions/import'))
    .field('accountId', account._id)
    .attach('file', Buffer.from(csv), 'statement.csv');

describe('account balance', () => {
  it('is updated when a transaction is created', async () => {
    await createTxn({ amount: 100 });
    await createTxn({ amount: -30 });
    expect(await getBalance(token, account._id)).toBe(70);
  });

  it('is adjusted when a transaction amount is edited', async () => {
    const { body } = await createTxn({ amount: -50 });
    const res = await authed(request(app).put(`/api/transactions/${body.transaction._id}`)).send({ amount: -80 });

    expect(res.status).toBe(200);
    expect(res.body.transaction.amount).toBe(-80);
    expect(await getBalance(token, account._id)).toBe(-80);
  });

  it('is unchanged when a non-amount field is edited', async () => {
    const { body } = await createTxn({ amount: -50 });
    await authed(request(app).put(`/api/transactions/${body.transaction._id}`)).send({ description: 'Renamed' });
    expect(await getBalance(token, account._id)).toBe(-50);
  });

  it('is reversed when a transaction is deleted', async () => {
    const { body } = await createTxn({ amount: -50 });
    await authed(request(app).delete(`/api/transactions/${body.transaction._id}`));
    expect(await getBalance(token, account._id)).toBe(0);
  });
});

describe('POST /api/transactions/import', () => {
  it('imports rows and auto-categorises them', async () => {
    const res = await importCsv('date,description,amount\n2024-01-01,REWE Supermarket,-25.50\n2024-01-02,Salary,2000\n');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ inserted: 2, duplicates: 0 });
    expect(await getBalance(token, account._id)).toBeCloseTo(1974.5);

    const list = await authed(request(app).get('/api/transactions'));
    const categories = list.body.transactions.map((t) => t.category).sort();
    expect(categories).toEqual(['groceries', 'income']);
  });

  it('skips duplicates and only counts new rows towards the balance', async () => {
    await importCsv('date,description,amount\n2024-01-01,AAA,-5\n');
    // The duplicate comes first — balance must only include the new row
    const res = await importCsv('date,description,amount\n2024-01-01,AAA,-5\n2024-01-02,BBB,-100\n');

    expect(res.body).toMatchObject({ inserted: 1, duplicates: 1 });
    expect(await getBalance(token, account._id)).toBe(-105);
  });

  it('reports missing columns', async () => {
    const res = await importCsv('foo,bar\n1,2\n');
    expect(res.status).toBe(400);
    expect(res.body.detectedColumns).toEqual(['foo', 'bar']);
  });

  it('rejects an account owned by another user', async () => {
    const other = await registerUser({ email: 'other@example.com' });
    const otherAccount = await createAccount(other.token);

    const res = await authed(request(app).post('/api/transactions/import'))
      .field('accountId', otherAccount._id)
      .attach('file', Buffer.from('date,description,amount\n2024-01-01,X,-1\n'), 's.csv');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/transactions', () => {
  it('treats search input as plain text, not a regex', async () => {
    await createTxn({ description: 'Coffee (large)' });
    await createTxn({ description: 'Coffee small' });

    const res = await authed(request(app).get('/api/transactions')).query({ search: '(large)' });

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].description).toBe('Coffee (large)');
  });

  it('returns 400 for an invalid account id', async () => {
    const res = await authed(request(app).get('/api/transactions')).query({ account: 'not-an-id' });
    expect(res.status).toBe(400);
  });

  it('only returns the current user\'s transactions', async () => {
    await createTxn({ description: 'Mine' });
    const other = await registerUser({ email: 'other@example.com' });

    const res = await request(app).get('/api/transactions').set('Authorization', `Bearer ${other.token}`);
    expect(res.body.transactions).toHaveLength(0);
  });
});
