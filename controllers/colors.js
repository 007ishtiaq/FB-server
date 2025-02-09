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

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Color.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming the JSON data is sent in the request body

    // Transform data if necessary (convert $oid and $date formats)
    const transformColors = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformColorItem);
      }
      return transformColorItem(data);
    };

    const transformColorItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id,
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : item.createdAt,
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : item.updatedAt,
    });

    const transformedData = transformColors(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const color = new Color(item);
        await color.validate(); // Validate each item
      }
      await Color.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const color = new Color(transformedData);
      await color.validate(); // Validate single document
      await Color.create(transformedData);
    }

    res.json({ success: true, message: "Colors uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading colors:", error);
    res
      .status(500)
      .json({ error: "Failed to upload colors", details: error.message });
  }
};
