const Banner = require("../models/Banner");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    const { name, image, identity, link, bannerNum } = req.body;

    // let count = await Banner.find({ identity }).exec();

    let data = {
      identity,
      bannerNum,
      name,
      link,
      slug: slugify(name),
      image,
    };

    res.json(await new Banner(data).save());
  } catch (err) {
    // console.log(err);
    res.status(400).json({
      err: err.message,
    });
  }
};

exports.list = async (req, res) =>
  res.json(await Banner.find({}).sort({ createdAt: 1 }).exec());

exports.remove = async (req, res) => {
  try {
    const deleted = await Banner.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Banner delete failed");
  }
};

exports.listRelated = async (req, res) => {
  // console.table(req.body);
  try {
    const { identity } = req.body;

    const banners = await Banner.find({ identity })
      .sort({ bannerNum: -1 })
      .exec();

    res.json(banners);
  } catch (err) {
    console.log(err);
    res.status(400).send("Banner read failed");
  }
};

exports.update = async (req, res) => {
  const { name, image, identity, link, bannerNum } = req.body;
  try {
    const updated = await Banner.findOneAndUpdate(
      { slug: req.params.slug },
      { identity, bannerNum, name, slug: slugify(name), link, image },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).send("Banner update failed");
  }
};

exports.read = async (req, res) => {
  let banner = await Banner.findOne({ slug: req.params.slug }).exec();

  res.json({
    banner,
  });
};

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Banner.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming JSON data is sent in the request body

    // Transform data if necessary (convert $oid and $date formats)
    const transformBanners = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformBannerItem);
      }
      return transformBannerItem(data);
    };

    const transformBannerItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id,
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : new Date(item.createdAt),
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : new Date(item.updatedAt),
    });

    const transformedData = transformBanners(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const banner = new Banner(item);
        await banner.validate(); // Validate each item before insertion
      }
      await Banner.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const banner = new Banner(transformedData);
      await banner.validate(); // Validate single document
      await Banner.create(transformedData);
    }

    res.json({ success: true, message: "Banners uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading banners:", error);
    res
      .status(500)
      .json({ error: "Failed to upload banners", details: error.message });
  }
};
