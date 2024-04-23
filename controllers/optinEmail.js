const OptInEmail = require("../models/optinEmail");

exports.create = async (req, res) => {
  try {
    const newOptIn = await new OptInEmail({
      email: req.body.optinEmail,
    }).save();
    res.json(newOptIn);
  } catch (err) {
    console.log(err);
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.list = async (req, res) =>
  res.json(await OptInEmail.find({}).sort({ createdAt: 1 }).exec());
