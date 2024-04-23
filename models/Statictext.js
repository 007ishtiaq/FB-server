const mongoose = require("mongoose");

const StatictextSchema = new mongoose.Schema(
  {
    identity: {
      type: String,
      trim: true,
      required: "Identity is required",
      minlength: [2, "Too short"],
      maxlength: [32, "Too long"],
    },
    serialNum: {
      type: Number,
    },
    info1: {
      type: String,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    info2: {
      type: String,
      trim: true,
    },
    info3: {
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

module.exports = mongoose.model("Statictext", StatictextSchema);
