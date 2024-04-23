const Brand = require("../models/brand");
const slugify = require("slugify");
const Product = require("../models/product");

exports.create = async (req, res) => {
  try {
    const { name, svg, image } = req.body;
    res.json(await new Brand({ name, svg, slug: slugify(name), image }).save());
  } catch (err) {
    // console.log(err);
    res.status(400).send("Create Brand failed");
  }
};

exports.list = async (req, res) =>
  res.json(await Brand.find({}).sort({ createdAt: 1 }).exec());

exports.remove = async (req, res) => {
  try {
    const deleted = await Brand.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Brand delete failed");
  }
};

exports.read = async (req, res) => {
  try {
    let brand = await Brand.findOne({ slug: req.params.slug }).exec();
    if (!brand) {
      // If brand is not found, return 404
      return res.status(404).json({ error: "Brand not found" });
    }

    const products = await Product.find({ brand: brand.name }).exec();

    res.json({
      brand,
      products,
    });
  } catch (error) {
    // console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.update = async (req, res) => {
  const { name, svg, image } = req.body;
  try {
    const updated = await Brand.findOneAndUpdate(
      { slug: req.params.slug },
      { name, slug: slugify(name), svg, image },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).send("Category update failed");
  }
};
