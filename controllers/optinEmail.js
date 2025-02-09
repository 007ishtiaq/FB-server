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

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await OptInEmail.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming you're sending the JSON in the request body

    // Check if it's an array of data or a single object
    if (Array.isArray(jsonData)) {
      await OptInEmail.insertMany(jsonData, { ordered: false }); // `ordered: false` allows continuation if duplicates are present
    } else {
      await OptInEmail.create(jsonData);
    }

    res.json({
      success: true,
      message: "Opt-in email data uploaded successfully!",
    });
  } catch (error) {
    console.error("Error uploading opt-in email data:", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to upload opt-in email data.",
        error,
      });
  }
};
