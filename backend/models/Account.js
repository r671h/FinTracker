const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Account name is required'],
      trim: true,
      maxlength: [60, 'Account name cannot exceed 60 characters'],
    },
    type: {
      type: String,
      required: true,
      enum: ['current', 'savings', 'credit', 'investment', 'cash'],
      default: 'current',
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: 'EUR',
    },
    color: {
      type: String,
      default: '#1D9E75',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'],
    },
    institution: {
      type: String,
      trim: true,
      default: '',
    },
    iban: {
      type: String,
      trim: true,
      default: '',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual: transaction count (populated by query if needed)
accountSchema.virtual('transactionCount', {
  ref: 'Transaction',
  localField: '_id',
  foreignField: 'account',
  count: true,
});

// Index for fast user queries
accountSchema.index({ user: 1, isArchived: 1 });

module.exports = mongoose.model('Account', accountSchema);
