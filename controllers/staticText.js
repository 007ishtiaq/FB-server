const Statictext = require("../models/Statictext");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    const { identity, serialNum, info1, info2, info3, image } = req.body;
    let data = {
      identity,
      serialNum,
      info1,
      slug: slugify(info1),
      info2,
      info3,
      image,
    };

    res.json(await new Statictext(data).save());
  } catch (err) {
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.list = async (req, res) => {
  res.json(await Statictext.find({}).sort({ createdAt: 1 }).exec());
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Statictext.findOneAndDelete({
      slug: req.params.slug,
    });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Statictext delete failed");
  }
};

exports.listRelated = async (req, res) => {
  try {
    const { identity } = req.body;

    const statictext = await Statictext.find({ identity })
      .sort({ serialNum: 1 })
      .exec();

    res.json(statictext);
  } catch (err) {
    console.log(err);
    res.status(400).send("statictext read failed");
  }
};

exports.update = async (req, res) => {
  const { identity, serialNum, info1, info2, info3, image } = req.body;
  try {
    const updated = await Statictext.findOneAndUpdate(
      { slug: req.params.slug },
      { identity, serialNum, info1, slug: slugify(info1), info2, info3, image },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).send("Statictext update failed");
  }
};

exports.read = async (req, res) => {
  let statictext = await Statictext.findOne({ slug: req.params.slug }).exec();

  res.json(statictext);
};

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Statictext.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming JSON data is sent in the request body

    // Transform data if necessary (e.g., handle $oid and $date formats)
    const transformStaticTexts = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformStaticTextItem);
      }
      return transformStaticTextItem(data);
    };

    const transformStaticTextItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id, // Handle $oid if present
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : new Date(item.createdAt), // Convert $date or ISO strings to Date
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : new Date(item.updatedAt),
    });

    const transformedData = transformStaticTexts(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const statictext = new Statictext(item);
        await statictext.validate(); // Validate each item before insertion
      }
      await Statictext.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const statictext = new Statictext(transformedData);
      await statictext.validate(); // Validate single document
      await Statictext.create(transformedData);
    }

    res.json({ success: true, message: "Static texts uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading static texts:", error);
    res
      .status(500)
      .json({ error: "Failed to upload static texts", details: error.message });
  }
};
