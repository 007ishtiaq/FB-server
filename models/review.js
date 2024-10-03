const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: ObjectId,
      ref: "Product",
      required: true,
    },
    star: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
    },
    postedBy: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    posterName: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    postedOn: {
      type: Date,
      default: Date.now,
    },
    images: {
      type: Array,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);
