const mongoose = require("mongoose");

const emailOptInSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  optedInAt: {
    type: Date,
    default: Date.now,
  },
});

const OptInEmail = mongoose.model("EmailOptIn", emailOptInSchema);

module.exports = OptInEmail;
