const cloudinary = require("cloudinary");

// config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// req.files.file.path
exports.upload = async (req, res) => {
  try {
    let result = await cloudinary.uploader.upload(req.body.image, {
      public_id: `${Date.now()}`,
      resource_type: "auto", // jpeg, png
    });
    res.json({
      public_id: result.public_id,
      url: result.secure_url,
    });
  } catch (err) {
    console.log("Cloudinary upload error:", err);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

exports.remove = (req, res) => {
  let image_id = req.body.public_id;

  cloudinary.uploader.destroy(image_id, (err, result) => {
    if (err) return res.json({ success: false, err });
    res.send("ok");
  });
};

exports.removeImages = async (req, res) => {
  const { public_ids } = req.body; // Expect an array of public_ids
  if (!public_ids || public_ids.length === 0) {
    return res.status(400).json({ message: "No images provided" });
  }

  try {
    // Delete multiple images using Cloudinary's bulk delete feature
    const deleteResponse = await cloudinary.v2.api.delete_resources(public_ids);

    res.json({ success: true, result: deleteResponse });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete images" });
  }
};
