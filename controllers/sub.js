const Category = require("../models/category");
const Sub = require("../models/sub");
const Product = require("../models/product");
const slugify = require("slugify");
const Sub2 = require("../models/sub2");

exports.create = async (req, res) => {
  try {
    const { name, parent, image } = req.body;
    let category = await Category.findOne({ _id: parent }).exec();
    res.json(
      await new Sub({
        name,
        parent,
        image,
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
  const { name, parent, image } = req.body;
  console.log(req.body);

  try {
    let category = await Category.findOne({ _id: parent }).exec();
    const updated = await Sub.findOneAndUpdate(
      { slug: req.params.slug },
      { name, parent, image, slug: slugify(`${name} - ${category.name}`) },
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

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Sub.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming the JSON data is sent in the request body

    // Transform data if necessary (convert $oid and $date formats)
    const transformSubs = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformSubItem);
      }
      return transformSubItem(data);
    };

    const transformSubItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id,
      parent: item.parent?.$oid || item.parent, // Ensure parent is correctly referenced as ObjectId
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : item.createdAt,
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : item.updatedAt,
    });

    const transformedData = transformSubs(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const sub = new Sub(item);
        await sub.validate(); // Validate each item
      }
      await Sub.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const sub = new Sub(transformedData);
      await sub.validate(); // Validate single document
      await Sub.create(transformedData);
    }

    res.json({
      success: true,
      message: "Subcategories uploaded successfully!",
    });
  } catch (error) {
    console.error("Error uploading subcategories:", error);
    res
      .status(500)
      .json({
        error: "Failed to upload subcategories",
        details: error.message,
      });
  }
};
