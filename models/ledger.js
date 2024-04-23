const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema({
  date: { type: Date },
  particulars: String,
  debit: Number,
  credit: Number,
  balance: Number,
  editable: { type: Boolean, default: false },
});

module.exports = mongoose.model("Ledger", ledgerSchema);
