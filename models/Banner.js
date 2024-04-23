const mongoose = require("mongoose");

const bannerSchema = new mongoose.Schema(
  {
    identity: {
      type: String,
      trim: true,
      required: "Identity is required",
      minlength: [2, "Too short"],
      maxlength: [32, "Too long"],
    },
    bannerNum: {
      type: Number,
    },
    name: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    link: {
      type: String,
      trim: true,
    },
    image: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Banner", bannerSchema);
