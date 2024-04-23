const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const productreturnSchema = new mongoose.Schema(
  {
    order: {
      type: ObjectId,
      ref: "Order",
    },
    prod: {
      type: String,
    },
    RequestNumber: Number,
    quantity: Number,
    reasonForReturn: {
      type: String,
      enum: [
        "Wrong Item",
        "Damaged/Faulty",
        "Not as Described",
        "Changed Mind",
        "Other",
      ],
    },
    otherReasonText: String,
    conditionOfProduct: {
      type: String,
      enum: ["Unused", "Unopened", "Opened (but not used)", "Used"],
    },
    preferredResolution: {
      type: String,
      enum: ["Refund", "Exchange", "Store Credit", "Repair"],
    },
    declaration: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Productreturn", productreturnSchema);
