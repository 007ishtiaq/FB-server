const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const productcancelSchema = new mongoose.Schema(
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
    preferredResolution: {
      type: String,
      enum: ["Refund", "Exchange", "Store Credit", "Repair"],
    },
    declaration: Boolean,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Productcancel", productcancelSchema);
