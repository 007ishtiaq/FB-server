const Color = require("../models/color");
const slugify = require("slugify");

// Function to capitalize the first letter and lowercase the rest
const capitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

exports.create = async (req, res) => {
  try {
    let { name } = req.body;
    if (!name) return res.status(400).send("Name is required");

    name = capitalizeFirstLetter(name); // Capitalize first letter

    // Check if the color name already exists in the database
    const existingColor = await Color.findOne({ name });
    if (existingColor) return res.status(400).send("Color already exists");

    // Save new color
    const newColor = new Color({ name, slug: slugify(name) });
    await newColor.save();

    res.json(newColor);
  } catch (err) {
    console.log(err);
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
