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
