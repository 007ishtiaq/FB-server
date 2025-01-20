const User = require("../models/user");
const Cart = require("../models/cart");
const Product = require("../models/product");
const Coupon = require("../models/coupon");
const coupon = require("../models/coupon");
const stripe = require("stripe")(process.env.STRIPE_PRIVATE_KEY);

exports.createPaymentIntent = async (req, res) => {
  const { coupon } = req.body;

  try {
    // Fetch user and cart info
    const user = await User.findOne({ email: req.user.email }).exec();
    const cartinfo = await Cart.findOne({ orderdBy: user._id }).exec();

    if (!cartinfo) {
      return res.status(400).send({ error: "Cart not found." });
    }

    const { cartTotal, shippingfee, totalAfterDiscount, products } = cartinfo;

    // Calculate final amount
    let finalAmount = 0;
    if (coupon && coupon.applied && totalAfterDiscount) {
      finalAmount = totalAfterDiscount * 100;
    } else {
      finalAmount = (cartTotal + shippingfee) * 100;
    }

    // Prepare product metadata
    const productMetadata = products.map((product, index) => ({
      [`product_${index + 1}_id`]: product.product.toString(),
      [`product_${index + 1}_count`]: product.count.toString(),
      [`product_${index + 1}_color`]: product.color,
      [`product_${index + 1}_size`]: product.size,
      [`product_${index + 1}_price`]: product.price.toString(),
    }));

    // Flatten the metadata array for Stripe
    const flatMetadata = productMetadata.reduce((acc, item) => {
      return { ...acc, ...item };
    }, {});

    // Add user-related metadata
    const userMetadata = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      contact: user.contact || "N/A",
      DOB: user.profile?.DOB || "N/A",
      Gender: user.profile?.Gender || "N/A",
      Address: user.address?.Address || "N/A",
      City: user.address?.City || "N/A",
      Province: user.address?.Province || "N/A",
      Area: user.address?.Area || "N/A",
      LandMark: user.address?.LandMark || "N/A",
    };

    // Combine all metadata
    const metadata = {
      ...flatMetadata,
      ...userMetadata,
      cartTotal: cartTotal.toString(),
      shippingfee: shippingfee.toString(),
      totalAfterDiscount: totalAfterDiscount
        ? totalAfterDiscount.toString()
        : "0",
    };

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: "usd",
      metadata,
    });

    // Send the response
    res.send({
      clientSecret: paymentIntent.client_secret,
      cartTotal,
      totalAfterDiscount,
      payable: finalAmount,
      shippingfee,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).send({ error: "Failed to create payment intent." });
  }
};
