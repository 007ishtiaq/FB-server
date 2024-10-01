const Review = require("../models/review");
const Product = require("../models/product");
const User = require("../models/user");

exports.productStar = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findOne({ email: req.user.email }).exec();
    const { star, comment } = req.body.reviewinfo;

    // Check if the product exists
    const product = await Product.findById(productId).exec();
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user has already left a review for this product
    let existingReview = await Review.findOne({
      product: productId,
      postedBy: user._id,
    }).exec();

    // If the user hasn't left a review, create a new one
    if (!existingReview) {
      const newReview = new Review({
        star,
        comment,
        postedBy: user._id,
        product: productId,
        postedOn: new Date(),
      });

      await newReview.save();
      res.json(newReview);
    } else {
      // If the user already left a review, update the existing review
      existingReview.star = star;
      existingReview.comment = comment;
      existingReview.postedOn = new Date();

      await existingReview.save();
      res.json(existingReview);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.Reviewslist = async (req, res) => {
  try {
    const { productslug, page } = req.body.data;
    const currentPage = page || 1;
    const perPage = 5;

    // Find the product by slug to get its ID
    const product = await Product.findOne({ slug: productslug }).exec();

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Use Review schema to find reviews related to the product with pagination
    const reviews = await Review.find({ product: product._id })
      .skip((currentPage - 1) * perPage) // Skip reviews for pagination
      .limit(perPage) // Limit the number of reviews per page
      .populate("postedBy", "_id name") // Populate postedBy with user details
      .exec();

    // Get total count of reviews for pagination
    const totalReviews = await Review.countDocuments({ product: product._id });

    res.json({ reviews, totalReviews });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// // --------- below mentioned old functions--------
// const RatingProduct = async (req, res) => {
//   try {
//     const review = await Review.findOne({
//       userId: req.user._id,
//       productId: req.params.id,
//     });
//     if (review) {
//       return res.send("you are already rate this product");
//     }
//     let comment;
//     if (req.body.comment && req.body.comment.trim().length > 0) {
//       comment = req.body.comment;
//     }
//     const newreview = new Review({
//       userId: req.user._id,
//       productId: req.params.id,
//       rating: Number(req.body.rate),
//       comment,
//     });

//     await newreview.save();

//     const ratingdata = await Review.aggregate([
//       { $match: { productId: ObjectId(req.params.id) } },
//       {
//         $group: {
//           _id: "",
//           totalcount: { $count: {} },
//           totalrate: { $sum: "$rating" },
//         },
//       },
//     ]);
//     res.status(200).json({ newreview });
//     await Product.findByIdAndUpdate(req.params.id, {
//       $set: {
//         numReviews: ratingdata[0].totalcount,
//         rating: (ratingdata[0].totalrate / ratingdata[0].totalcount).toFixed(1),
//       },
//     });
//   } catch (error) {
//     res.status(404).json(error.message);
//   }
// };

// const getProduct = async (req, res) => {
//   try {
//     const product = await Product.findById(req.params.id).populate({
//       path: "category",
//       select: " name",
//     });
//     const Rating = await Review.aggregate([
//       { $match: { productId: ObjectId(req.params.id) } },
//       {
//         $group: {
//           _id: "$rating",
//           users: { $count: {} },
//         },
//       },
//     ]);

//     const comments = await Review.find({
//       productId: req.params.id,
//       comment: { $exists: true },
//     })
//       .populate("userId", "username")
//       .select("comment  createdAt rating");

//     const patern = product.name.substring(0, product.name.lastIndexOf("-"));
//     let Products = [];
//     if (patern) {
//       Products = await Product.find({
//         name: { $regex: patern },
//         brand: product.brand,
//         _id: { $ne: product._id },
//       }).select("images name");
//     }

//     const similarProducts = [];
//     Products &&
//       Products.map((prod) => {
//         similarProducts.push({
//           _id: prod._id,
//           img: prod.images[0],
//           name: prod.name,
//           category: prod.category,
//         });
//       });

//     res.status(200).json({ product, Rating, comments, similarProducts });
//   } catch (error) {
//     res.status(400).send(error);
//   }
// };

// const allowToRate = async (req, res) => {
//   try {
//     const ids = await Order.distinct("orderItems.product", {
//       user: req.user._id,
//     });

//     const products = [];
//     for (let i of ids) {
//       let isRated = await Review.findOne({
//         userId: req.user._id,
//         productId: i,
//       });
//       if (!isRated) {
//         let product = await Product.findById(i).select("images name ");
//         products.push(product);
//       }
//     }

//     res.status(200).json({ products });
//   } catch (error) {
//     res.status(400).json(error);
//   }
// };
