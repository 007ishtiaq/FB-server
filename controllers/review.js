const Review = require("../models/review");

const RatingProduct = async (req, res) => {
  try {
    const review = await Review.findOne({
      userId: req.user._id,
      productId: req.params.id,
    });
    if (review) {
      return res.send("you are already rate this product");
    }
    let comment;
    if (req.body.comment && req.body.comment.trim().length > 0) {
      comment = req.body.comment;
    }
    const newreview = new Review({
      userId: req.user._id,
      productId: req.params.id,
      rating: Number(req.body.rate),
      comment,
    });

    await newreview.save();

    const ratingdata = await Review.aggregate([
      { $match: { productId: ObjectId(req.params.id) } },
      {
        $group: {
          _id: "",
          totalcount: { $count: {} },
          totalrate: { $sum: "$rating" },
        },
      },
    ]);
    res.status(200).json({ newreview });
    await Product.findByIdAndUpdate(req.params.id, {
      $set: {
        numReviews: ratingdata[0].totalcount,
        rating: (ratingdata[0].totalrate / ratingdata[0].totalcount).toFixed(1),
      },
    });
  } catch (error) {
    res.status(404).json(error.message);
  }
};

const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: "category",
      select: " name",
    });
    const Rating = await Review.aggregate([
      { $match: { productId: ObjectId(req.params.id) } },
      {
        $group: {
          _id: "$rating",
          users: { $count: {} },
        },
      },
    ]);

    const comments = await Review.find({
      productId: req.params.id,
      comment: { $exists: true },
    })
      .populate("userId", "username")
      .select("comment  createdAt rating");

    const patern = product.name.substring(0, product.name.lastIndexOf("-"));
    let Products = [];
    if (patern) {
      Products = await Product.find({
        name: { $regex: patern },
        brand: product.brand,
        _id: { $ne: product._id },
      }).select("images name");
    }

    const similarProducts = [];
    Products &&
      Products.map((prod) => {
        similarProducts.push({
          _id: prod._id,
          img: prod.images[0],
          name: prod.name,
          category: prod.category,
        });
      });

    res.status(200).json({ product, Rating, comments, similarProducts });
  } catch (error) {
    res.status(400).send(error);
  }
};

const allowToRate = async (req, res) => {
  try {
    const ids = await Order.distinct("orderItems.product", {
      user: req.user._id,
    });

    const products = [];
    for (let i of ids) {
      let isRated = await Review.findOne({
        userId: req.user._id,
        productId: i,
      });
      if (!isRated) {
        let product = await Product.findById(i).select("images name ");
        products.push(product);
      }
    }

    res.status(200).json({ products });
  } catch (error) {
    res.status(400).json(error);
  }
};
