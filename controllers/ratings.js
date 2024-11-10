const Product = require("../models/product");
const Review = require("../models/review");

exports.getAllRatings = async (req, res) => {
  try {
    const result = await Review.aggregate([
      {
        $lookup: {
          from: "products", // The Product collection
          localField: "product", // Product reference in Review
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $unwind: "$productDetails",
      },
      {
        $lookup: {
          from: "users", // The User collection
          localField: "postedBy", // User reference in Review
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $project: {
          star: 1,
          comment: 1,
          postedOn: 1,
          isRead: 1,
          images: 1, // Include images array if needed
          "userDetails.name": 1,
          "userDetails.email": 1,
          "productDetails._id": 1,
          "productDetails.title": 1,
          "productDetails.slug": 1,
        },
      },
      {
        $sort: { postedOn: -1 }, // Sort reviews by postedOn in descending order
      },
    ]);

    const allRatings = result.map((rating) => ({
      _id: rating._id,
      star: rating.star,
      comment: rating.comment,
      postedOn: rating.postedOn,
      isRead: rating.isRead,
      images: rating.images,
      postedBy: {
        _id: rating.userDetails._id,
        name: rating.userDetails.name,
        email: rating.userDetails.email,
      },
      product: {
        _id: rating.productDetails._id,
        title: rating.productDetails.title,
        slug: rating.productDetails.slug,
      },
    }));

    res.json(allRatings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.markRead = async (req, res) => {
  const { ratingId } = req.body;

  try {
    // Find the review by its ID
    const review = await Review.findById(ratingId);

    if (!review) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Toggle the value of isRead
    review.isRead = !review.isRead;

    // Save the updated review
    await review.save();

    res.json({
      success: true,
      message: "isRead updated successfully",
      isRead: review.isRead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteComment = async (req, res) => {
  const { ratingId } = req.body;

  try {
    // Find and delete the review by ID
    const deletedReview = await Review.findByIdAndDelete(ratingId);

    if (!deletedReview) {
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
