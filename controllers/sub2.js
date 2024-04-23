const Sub2 = require("../models/sub2");
const Product = require("../models/product");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    const { name, parent } = req.body;
    res.json(await new Sub2({ name, parent, slug: slugify(name) }).save());
  } catch (err) {
    console.log("SUB2 CREATE ERR ----->", err);
    res.status(400).send("Create sub2 failed");
  }
};

exports.list = async (req, res) =>
  res.json(await Sub2.find({}).sort({ createdAt: -1 }).exec());

exports.read = async (req, res) => {
  let sub2 = await Sub2.findOne({ slug: req.params.slug }).exec();
  const products = await Product.find({ subs2: sub2 }).populate("sub2").exec();

  res.json({
    sub2,
    products,
  });
};

exports.update = async (req, res) => {
  const { name, parent } = req.body;
  try {
    const updated = await Sub2.findOneAndUpdate(
      { slug: req.params.slug },
      { name, parent, slug: slugify(name) },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).send("Sub2 update failed");
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Sub2.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Sub2 delete failed");
  }
};
