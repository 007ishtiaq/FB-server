const mongoose = require("mongoose");
const { ObjectId } = mongoose.Schema;

const productSchema = new mongoose.Schema(
  {
    art: {
      type: Number,
      unique: true,
      trim: true,
      required: true,
      text: true,
    },
    title: {
      type: String,
      trim: true,
      required: true,
      text: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
      text: true,
    },
    price: {
      type: Number,
      required: true,
      trim: true,
      maxlength: 32,
    },
    disprice: {
      type: Number,
      trim: true,
      maxlength: 32,
    },
    category: {
      type: ObjectId,
      ref: "Category",
    },
    attributes: [
      {
        subs: {
          type: ObjectId,
          ref: "Sub",
        },
        subs2: [
          {
            type: ObjectId,
            ref: "Sub2",
          },
        ],
      },
    ],
    weight: {
      type: Number,
      default: 0,
    },
    quantity: Number,
    sold: {
      type: Number,
      default: 0,
    },
    images: {
      type: Array,
    },
    shipping: {
      type: String,
      enum: ["Yes", "No"],
    },
    color: {
      type: String,
    },
    brand: {
      type: String,
    },
    ratings: [
      {
        star: Number,
        comment: { type: String, trim: true },
        postedBy: { type: ObjectId, ref: "User" },
        isRead: { type: Boolean, default: false },
        postedOn: {
          type: Number,
          default: new Date(),
        },
      },
    ],
    onSale: {
      type: String,
      enum: ["Yes", "No"],
    },
    saleTime: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
