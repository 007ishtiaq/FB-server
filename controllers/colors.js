const Color = require("../models/Color");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    res.json(await new Color({ name, slug: slugify(name) }).save());
  } catch (err) {
    // console.log(err);
    res.status(400).send("Create Color failed");
  }
};

exports.list = async (req, res) =>
  res.json(await Color.find({}).sort({ createdAt: 1 }).exec());

exports.remove = async (req, res) => {
  try {
    const deleted = await Color.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Color delete failed");
  }
};
