const Product = require("../models/product");

exports.getAllRatings = async (req, res) => {
  try {
    const result = await Product.aggregate([
      {
        $unwind: "$ratings",
      },
      {
        $lookup: {
          from: "users",
          localField: "ratings.postedBy",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          "ratings.star": 1,
          "ratings.comment": 1,
          "ratings.postedOn": 1,
          "ratings._id": 1,
          "ratings.productId": "$_id",
          "ratings.isRead": "$ratings.isRead", // Include isRead from ratings
          "user.name": 1,
          "user.email": 1,
          title: 1,
          slug: 1, // Include the slug field in the output
        },
      },
    ]);

    const allRatings = result.map((rating) => ({
      ...rating.ratings,
      isRead: rating.ratings.isRead, // Include isRead in the output
      postedBy: {
        _id: rating.user._id,
        name: rating.user.name,
        email: rating.user.email,
      },
      product: {
        _id: rating.ratings.productId,
        title: rating.title,
        slug: rating.slug, // Include the slug in the product field
      },
    }));

    res.json(allRatings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.markRead = async (req, res) => {
  const { productId, ratingId } = req.body;
  try {
    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Find the rating within the product's ratings array by ID
    const rating = product.ratings.find((r) => r._id.toString() === ratingId);

    if (!rating) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found" });
    }

    // Toggle the value of isRead
    rating.isRead = !rating.isRead;

    // Save the updated product
    await product.save();

    res.json({
      success: true,
      message: "isRead updated successfully",
      isRead: rating.isRead,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

exports.deleteComment = async (req, res) => {
  const { productId, ratingId } = req.body;

  try {
    // Find the product by ID
    const product = await Product.findById(productId);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Find the index of the rating with the given ratingId
    const ratingIndex = product.ratings.findIndex(
      (r) => r._id.toString() === ratingId
    );

    if (ratingIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Rating not found in the product" });
    }

    // Remove the rating from the product's ratings array
    product.ratings.splice(ratingIndex, 1);

    // Save the updated product
    await product.save();

    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
