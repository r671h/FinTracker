const mongoose = require('mongoose');

const CATEGORIES = [
  'groceries', 'dining', 'transport', 'shopping', 'utilities',
  'health', 'entertainment', 'income', 'transfer', 'savings',
  'housing', 'education', 'travel', 'insurance', 'other',
];

const CATEGORY_KEYWORDS = {
  groceries: ['supermarket', 'tesco', 'aldi', 'lidl', 'sainsbury', 'morrisons', 'waitrose', 'co-op', 'grocery', 'rewe', 'edeka', 'kaufland'],
  dining: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonalds', 'kfc', 'burger', 'pizza', 'food', 'eat', 'bistro', 'bar ', 'pub '],
  transport: ['uber', 'lyft', 'taxi', 'bus', 'train', 'tube', 'rail', 'transport', 'petrol', 'fuel', 'parking', 'transit', 'bahn', 'flixbus'],
  shopping: ['amazon', 'ebay', 'zara', 'h&m', 'primark', 'shop', 'store', 'retail', 'clothing', 'zalando', 'otto'],
  utilities: ['electricity', 'gas', 'water', 'internet', 'broadband', 'phone', 'bill', 'utility', 'council', 'telekom', 'vodafone'],
  health: ['pharmacy', 'apotheke', 'doctor', 'hospital', 'dentist', 'gym', 'fitness', 'health', 'medical', 'sport'],
  entertainment: ['netflix', 'spotify', 'disney', 'apple', 'cinema', 'game', 'steam', 'entertainment', 'hobby'],
  income: ['salary', 'wage', 'payment received', 'transfer in', 'income', 'deposit', 'interest', 'gehalt', 'lohn'],
  transfer: ['transfer', 'überweisung', 'sepa'],
  housing: ['rent', 'mortgage', 'miete', 'landlord', 'immobilien'],
  insurance: ['insurance', 'versicherung', 'allianz', 'axa'],
  travel: ['hotel', 'airbnb', 'booking', 'flight', 'lufthansa', 'ryanair', 'easyjet'],
  education: ['university', 'school', 'course', 'udemy', 'coursera', 'tuition'],
};

function autoCategory(description) {
  const lower = description.toLowerCase();
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return cat;
  }
  return 'other';
}

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Account',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    category: {
      type: String,
      enum: CATEGORIES,
      default: 'other',
    },
    tags: [{ type: String, trim: true }],
    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    importId: {
      // Prevents duplicate CSV imports
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-categorise before save if not set
transactionSchema.pre('save', function (next) {
  if (this.category === 'other' || !this.category) {
    this.category = autoCategory(this.description);
  }
  next();
});

// Compound indexes for fast filtering
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, account: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });
transactionSchema.index({ importId: 1 }, { sparse: true });

// Export helper
transactionSchema.statics.autoCategory = autoCategory;
transactionSchema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Transaction', transactionSchema);
