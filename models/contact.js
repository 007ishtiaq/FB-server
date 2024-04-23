const mongoose = require("mongoose");
const contactSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      trim: true,
      required: true,
      text: true,
    },
    subject: { type: String, trim: true },
    email: { type: String, trim: true },
    text: { type: String, trim: true },
    image: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    isReplied: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Contact", contactSchema);
