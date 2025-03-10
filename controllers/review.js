const Product = require("../models/product");
const Review = require("../models/review");
const User = require("../models/user");

// do rating on product
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

// list reviews based on createdOn date
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

    // Get all reviews for this product (without pagination) to calculate average rating and star counts
    const allReviews = await Review.find({ product: product._id }).exec();

    // Calculate the average rating
    const totalReviews = allReviews.length;
    const totalStars = allReviews.reduce((sum, review) => sum + review.star, 0);
    const avgRating =
      totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : 0;

    // Accumulate the number of reviews for each star rating (1 to 5)
    const starCounts = await Review.aggregate([
      { $match: { product: product._id } },
      {
        $group: {
          _id: "$star", // Group by star rating
          count: { $sum: 1 }, // Count the number of reviews for each star rating
        },
      },
      { $sort: { _id: -1 } }, // Sort by star rating (descending)
    ]);

    // Format starCounts as an object with star ratings from 1 to 5
    let starAccumulator = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    starCounts.forEach((item) => {
      starAccumulator[item._id] = item.count;
    });

    // Get reviews with pagination, sorted by postedOn date (newer to older)
    const reviews = await Review.find({ product: product._id })
      .sort({ postedOn: -1 }) // Sort by postedOn in descending order (newer first)
      .skip((currentPage - 1) * perPage) // Skip reviews for pagination
      .limit(perPage) // Limit the number of reviews per page
      .populate("postedBy", "_id name") // Populate postedBy with user details
      .exec();

    res.json({ reviews, totalReviews, avgRating, starAccumulator });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// list reviews based on user
exports.ratedProducts = async (req, res) => {
  const { page, perPage } = req.body;

  try {
    // Find the user by their email
    const user = await User.findOne({ email: req.user.email }).exec();

    // Calculate the total number of reviews posted by this user
    const totalReviews = await Review.countDocuments({ postedBy: user._id });

    // Find user reviews with pagination
    const userReviews = await Review.find({ postedBy: user._id })
      .populate("product", "_id title slug images color") // Populate product details
      .skip((page - 1) * perPage) // Skip for pagination
      .limit(perPage) // Limit results per page
      .exec();

    // Filter out reviews with deleted products (where product is null)
    const validUserReviews = userReviews.filter((review) => review.product);

    // Prepare the response with product details and ratings
    const ratedProductsWithRatings = validUserReviews.map((review) => ({
      product: {
        _id: review.product._id,
        title: review.product.title,
        slug: review.product.slug,
        images: review.product.images,
        color: review.product.color,
        ratings: [
          {
            star: review.star, // Include the star rating
            comment: review.comment, // Include the comment
            images: review.images, // Include any associated images
          },
        ],
      },
    }));

    // Return the paginated results along with the total count
    res.json({
      ratedProductsWithRatings,
      totalReviews: validUserReviews.length, // Updated count for valid reviews
      currentPage: page,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Review.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming the JSON data is sent in the request body

    // Transform data if necessary (convert $oid and $date formats)
    const transformReviews = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformReviewItem);
      }
      return transformReviewItem(data);
    };

    const transformReviewItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id,
      product: item.product?.$oid || item.product, // Ensure product is correctly referenced as ObjectId
      postedBy: item.postedBy?.$oid || item.postedBy, // Ensure postedBy is correctly referenced as ObjectId
      postedOn: item.postedOn?.$date
        ? new Date(item.postedOn.$date)
        : new Date(item.postedOn),
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : new Date(item.createdAt),
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : new Date(item.updatedAt),
    });

    const transformedData = transformReviews(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const review = new Review(item);
        await review.validate(); // Validate each item
      }
      await Review.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const review = new Review(transformedData);
      await review.validate(); // Validate single document
      await Review.create(transformedData);
    }

    res.json({ success: true, message: "Reviews uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading reviews:", error);
    res
      .status(500)
      .json({ error: "Failed to upload reviews", details: error.message });
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
