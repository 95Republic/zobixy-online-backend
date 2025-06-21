const { Schema, model } = require('mongoose');

const paystackSchema = new Schema({
  sellerId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'users', // Optional: reference to your user model
    unique: true
  },
  subaccount_code: {
    type: String,
    required: true
  },
  business_name: {
    type: String,
    required: true
  },
  account_number: {
    type: String,
    required: true
  },
  bank_name: {
    type: String,
    required: true
  }
}, { timestamps: true });

module.exports = model('paystacks', paystackSchema);
