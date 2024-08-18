const Category = require("../models/category");
const Sub = require("../models/sub");
const Product = require("../models/product");
const slugify = require("slugify");
const Sub2 = require("../models/sub2");

exports.create = async (req, res) => {
  try {
    const { name, parent } = req.body;
    let category = await Category.findOne({ _id: parent }).exec();
    res.json(
      await new Sub({
        name,
        parent,
        slug: slugify(`${name} - ${category.name}`),
      }).save()
    );
  } catch (err) {
    console.log("SUB CREATE ERR ----->", err);
    res.status(400).send("Create sub failed");
  }
};

exports.list = async (req, res) =>
  res.json(await Sub.find({}).sort({ createdAt: -1 }).exec());

exports.read = async (req, res) => {
  let sub = await Sub.findOne({ slug: req.params.slug }).exec();
  const products = await Product.find({ subs: sub })
    .populate("category")
    .exec();

  res.json({
    sub,
    products,
  });
};

exports.update = async (req, res) => {
  const { name, parent } = req.body;
  try {
    let category = await Category.findOne({ _id: parent }).exec();
    const updated = await Sub.findOneAndUpdate(
      { slug: req.params.slug },
      { name, parent, slug: slugify(`${name} - ${category.name}`) },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).send("Sub update failed");
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Sub.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Subs getting failed");
  }
};

exports.getSubs2 = async (req, res) => {
  try {
    const subs2 = await Sub2.find({ parent: req.params._id }).exec();
    res.json(subs2);
  } catch (err) {
    console.log(err);
    res.status(400).send("Subs2 getting failed");
  }
};
