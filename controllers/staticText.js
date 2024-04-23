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
