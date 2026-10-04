require('dotenv').config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined. Set it in backend/.env (see .env.example).');
  process.exit(1);
}

const connectDB = require('./config/db');
const app = require('./app');

connectDB();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 Fintrack API running on http://localhost:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
