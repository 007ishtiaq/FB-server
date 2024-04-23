const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      unique: true,
      uppercase: true,
      required: "Name is required",
      minlength: [4, "Too short"],
      maxlength: [12, "Too long"],
    },
    type: {
      type: String,
      required: true,
      enum: ["Discount", "Cash", "Shipping"],
    },
    condition: {
      type: String,
    },
    expiry: {
      type: Date,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
