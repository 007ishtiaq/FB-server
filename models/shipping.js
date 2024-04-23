const mongoose = require("mongoose");

const shippingSchema = new mongoose.Schema(
  {
    weightstart: {
      type: Number,
      required: "Weight Start is required",
    },
    weightend: {
      type: Number,
      required: "Weight End is required",
    },
    charges: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Shipping", shippingSchema);
