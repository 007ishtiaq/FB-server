const User = require("../models/user");
const Product = require("../models/product");
const Cart = require("../models/cart");
const Coupon = require("../models/coupon");
const Order = require("../models/order");
const uniqueid = require("uniqueid");
const Shipping = require("../models/shipping");
const EmailOptIn = require("../models/optinEmail");
const Productcancel = require("../models/productcancel");
const Productreturn = require("../models/productreturn");
const Ledger = require("../models/ledger");
const moment = require("moment");

const {
  Types: { ObjectId },
} = require("mongoose");

exports.userCart = async (req, res) => {
  const { cart, newsletter } = req.body;

  if (newsletter) {
    // Check if the email already exists in EmailOptIn
    const existingEmailOptIn = await EmailOptIn.findOne({
      email: req.user.email,
    });

    if (!existingEmailOptIn) {
      // Add the email to EmailOptIn if it doesn't exist
      const newEmailOptIn = new EmailOptIn({ email: req.user.email });
      await newEmailOptIn.save();
    }
  }

  let products = [];

  const user = await User.findOne({ email: req.user.email }).exec();

  // Check if a cart for the logged-in user already exists
  let cartExistByThisUser = await Cart.findOne({ orderdBy: user._id }).exec();
  if (cartExistByThisUser) {
    await Cart.findOneAndRemove({ orderdBy: user._id }).exec();
  }

  // Iterate through the items in the cart
  for (let i = 0; i < cart.length; i++) {
    let object = {};

    // Get product details from the database
    let productFromDb = await Product.findById(cart[i]._id)
      .select("price disprice sizes shippingcharges")
      .exec();

    if (!productFromDb) {
      return res.status(400).json({
        error:
          "Some items do not exist on the site from your cart, please remove them before proceed",
      });
    }

    object.product = cart[i]._id;
    object.count = cart[i].count;
    object.color = cart[i].color;
    object.size = cart[i].size;

    // Check if the product has a sizes array and find the matching size
    if (
      productFromDb.sizes &&
      productFromDb.sizes.length > 0 &&
      productFromDb.sizes[0].size &&
      productFromDb.sizes[0].prices.length > 0
    ) {
      const matchingSize = productFromDb.sizes.find(
        (sizeObj) => sizeObj.size === cart[i].size
      );

      if (matchingSize) {
        const dispriceObj = matchingSize.prices.find(
          (price) => price.type === "disprice"
        );
        const priceObj = matchingSize.prices.find(
          (price) => price.type === "price"
        );

        object.price =
          dispriceObj && dispriceObj.value !== null
            ? dispriceObj.value
            : priceObj
            ? priceObj.value
            : 0; // Default to 0 if neither price is available
      } else {
        // Fall back to the product's price and disprice if no matching size
        object.price =
          productFromDb.disprice !== null
            ? productFromDb.disprice
            : productFromDb.price;
      }
    } else {
      // Fall back to the product's price and disprice if no sizes array
      object.price =
        productFromDb.disprice !== null
          ? productFromDb.disprice
          : productFromDb.price;
    }

    products.push(object);
  }

  // Calculate the cart total
  let cartTotal = products.reduce(
    (total, prod) => total + prod.price * prod.count,
    0
  );

  // Calculate the total shipping fee
  let shippingfee = 0;
  for (let i = 0; i < products.length; i++) {
    let productFromDb = await Product.findById(products[i].product)
      .select("shippingcharges")
      .exec();

    if (productFromDb) {
      if (products[i].price === 0) {
        shippingfee += productFromDb.shippingcharges * products[i].count;
      } else {
        shippingfee += productFromDb.shippingcharges;
      }
    }
  }

  // Save the new cart
  let newCart = await new Cart({
    products,
    cartTotal,
    shippingfee,
    orderdBy: user._id,
  }).save();

  res.json({ ok: true });
};

exports.getUserCart = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).exec();

    // Check if the user is subscribed to the newsletter
    const existingEmailOptIn = await EmailOptIn.findOne({
      email: req.user.email,
    });

    const isSubscribed = !!existingEmailOptIn; // true if found, false otherwise

    let cart = null;
    if (user) {
      cart = await Cart.findOne({ orderdBy: user._id }).exec();
    }

    if (cart) {
      const {
        cartTotal,
        discounted,
        discountType,
        dispercent,
        totalAfterDiscount,
        shippingfee,
      } = cart;
      return res.json({
        isSubscribed,
        cartTotal,
        discounted,
        discountType,
        dispercent,
        totalAfterDiscount,
        shippingfee,
      });
    }

    return res.json({
      isSubscribed,
      cartTotal: 0,
      discounted: 0,
      totalAfterDiscount: 0,
      shippingfee: 0,
    });
  } catch (error) {
    console.error("Error fetching user cart:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
};

exports.emptyCart = async (req, res) => {
  // console.log("empty cart");
  const user = await User.findOne({ email: req.user.email }).exec();

  const cart = await Cart.findOneAndRemove({ orderdBy: user._id }).exec();
  res.json(cart);
};

exports.saveAddress = async (req, res) => {
  const address = {
    Address: req.body.values.Address,
    City: req.body.values.City,
    Province: req.body.values.Province,
    Area: req.body.values.Area,
    LandMark: req.body.values.LandMark,
  };

  const userAddress = await User.findOneAndUpdate(
    { email: req.user.email },
    {
      name: req.body.values.Name ? req.body.values.Name : userAddress.name,
      address,
      contact: req.body.values.Contact
        ? req.body.values.Contact
        : userAddress.contact,
    }
  ).exec();

  res.json({ ok: true });
};

exports.getAddress = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();
  if (user) {
    let address = {
      Name: user.name,
      Contact: user.contact,
    };
    if (user.address) {
      address = {
        ...address,
        Address: user.address.Address,
        City: user.address.City,
        Province: user.address.Province,
        Area: user.address.Area,
        LandMark: user.address.LandMark,
      };
    }

    res.json(address);
  }
};

exports.saveProfile = async (req, res) => {
  const profile = {
    DOB: req.body.values.DOB,
    Gender: req.body.values.Gender,
  };
  let userProfile = null;
  try {
    if (!req.user.email) {
      return res.status(400).json({ error: "User email not provided" });
    }

    userProfile = await User.findOneAndUpdate(
      { email: req.user.email },
      { name: req.body.values.Name, profile, contact: req.body.values.Contact },
      { new: true }
    ).exec();
    res.json(userProfile.name);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();
  let profile = {
    Name: user.name,
    Contact: user.contact,
    Email: req.user.email,
  };

  if (user.profile) {
    profile = {
      ...profile,
      DOB: user.profile.DOB,
      Gender: user.profile.Gender,
    };
  }
  res.json(profile);
};

exports.couponValidation = async (req, res) => {
  const { coupon } = req.body;

  const couponDetails = await Coupon.findOne({ name: coupon }).exec();
  // console.log("couponDetails", couponDetails);

  if (couponDetails === null) {
    return res.json({
      err: "Invalid coupon",
    });
  }

  // taking user cart total to check min value of card
  const user = await User.findOne({ email: req.user.email }).exec();
  let { cartTotal, products } = await Cart.findOne({
    orderdBy: user._id,
  }).exec();

  // console.log("cart in coupon validation", products);

  const hasFreeItem = products.some((item) => item.price === 0);
  if (hasFreeItem) {
    return res.json({
      err: `Coupon not applicable for free items.`,
    });
  }

  if (cartTotal < parseInt(couponDetails.condition)) {
    return res.json({
      err: `Cart value should be more then "$ ${couponDetails.condition}".`,
    });
  }

  const expiry = new Date(couponDetails.expiry).getTime();
  const now = new Date().getTime();
  const gap = expiry - now;

  if (gap <= 0) {
    return res.json({
      err: "Coupon Expired",
    });
  }
  res.json(couponDetails);
};

exports.applyCouponToUserCart = async (req, res) => {
  const { coupon } = req.body;
  // console.log("COUPON", coupon);

  const validCoupon = await Coupon.findOne({ name: coupon }).exec();
  if (validCoupon === null) {
    return res.json({
      err: "Invalid coupon",
    });
  }

  const expiry = new Date(validCoupon.expiry).getTime();
  const now = new Date().getTime();
  const gap = expiry - now;

  if (gap <= 0) {
    return res.json({
      err: "Coupon Expired",
    });
  }
  // console.log("VALID COUPON", validCoupon);

  const user = await User.findOne({ email: req.user.email }).exec();

  // taking user cart total to check min value of card
  let { products, cartTotal, shippingfee } = await Cart.findOne({
    orderdBy: user._id,
  }).exec();

  const hasFreeItem = products.some((item) => item.price === 0);
  if (hasFreeItem) {
    return res.json({
      err: `Coupon not applicable for free items.`,
    });
  }

  if (cartTotal < parseInt(validCoupon.condition)) {
    return res.json({
      err: `Cart value should be more then "$ ${validCoupon.condition}".`,
    });
  }

  let discounted = 0;
  let totalAfterDiscount = 0;

  // in case of discount in persentage
  if (validCoupon.type === "Discount") {
    discounted = (cartTotal * validCoupon.discount) / 100;
    // calculate the total after discount
    totalAfterDiscount = (
      cartTotal -
      (cartTotal * validCoupon.discount) / 100 +
      shippingfee
    ).toFixed(2); // 99.99
  }

  // in case of discount in cash
  if (validCoupon.type === "Cash") {
    discounted = validCoupon.discount;
    // calculate the total after discount
    totalAfterDiscount = (
      cartTotal -
      validCoupon.discount +
      shippingfee
    ).toFixed(2); // 99.99
  }

  // in case of discount in shipping fee
  if (validCoupon.type === "Shipping") {
    discounted = shippingfee;
    // calculate the total after discount
    totalAfterDiscount = (cartTotal + shippingfee - shippingfee).toFixed(2); // 99.99
  }

  Cart.findOneAndUpdate(
    { orderdBy: user._id },
    {
      discounted,
      discountType: validCoupon.type,
      dispercent: validCoupon.discount,
      totalAfterDiscount,
    },
    { new: true }
  ).exec();

  res.json({ ok: true });
};

exports.removeCouponFromUserCart = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();

  let userCart = await Cart.findOne({ orderdBy: user._id });

  if (userCart !== null) {
    let { totalAfterDiscount } = await Cart.findOneAndUpdate(
      { orderdBy: user._id },
      { discounted: 0, totalAfterDiscount: 0 },
      { new: true }
    ).exec();

    return res.json(totalAfterDiscount);
  }

  res.json({ totalAfterDiscount: 0 });
};

exports.orders = async (req, res) => {
  try {
    const { page } = req.body;
    const currentPage = page || 1;
    const perPage = 5;

    let user = await User.findOne({ email: req.user.email }).exec();

    let userOrders = await Order.find({ orderdBy: user._id })
      .sort([["createdAt", "desc"]])
      .exec();

    if (!userOrders) {
      return res.status(404).json({ message: "Orders not found" });
    }

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = currentPage * perPage;

    const orders = userOrders.slice(startIndex, endIndex);

    const totalOrders = userOrders.length;

    res.json({ orders, totalOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.cancelledorders = async (req, res) => {
  try {
    const { page } = req.body;
    const currentPage = page || 1;
    const perPage = 5;

    let user = await User.findOne({ email: req.user.email }).exec();

    let userOrders = await Order.find({
      orderdBy: user._id,
      orderStatus: "Cancelled",
    })
      .sort([["createdAt", "desc"]])
      .exec();

    if (!userOrders) {
      return res.status(404).json({ message: "Orders not found" });
    }

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = currentPage * perPage;

    const orders = userOrders.slice(startIndex, endIndex);

    const totalOrders = userOrders.length;

    res.json({ orders, totalOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.returnedorders = async (req, res) => {
  try {
    const { page } = req.body;
    const currentPage = page || 1;
    const perPage = 5;

    let user = await User.findOne({ email: req.user.email }).exec();

    let userOrders = await Order.find({
      orderdBy: user._id,
      orderStatus: "Returned",
    })
      .sort([["createdAt", "desc"]])
      .exec();

    if (!userOrders) {
      return res.status(404).json({ message: "Orders not found" });
    }

    const startIndex = (currentPage - 1) * perPage;
    const endIndex = currentPage * perPage;

    const orders = userOrders.slice(startIndex, endIndex);

    const totalOrders = userOrders.length;

    res.json({ orders, totalOrders });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.order = async (req, res) => {
  try {
    const myOrder = await Order.findById(req.params.id).exec();

    res.json(myOrder);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.addToWishlist = async (req, res) => {
  const { productId } = req.body;
  try {
    const user = await User.findOne({ email: req.user.email });
    const item = user.wishlist.includes(productId);
    if (item) {
      user.wishlist = user.wishlist.filter((p) => p != productId);
    } else {
      user.wishlist.push(productId);
    }
    await user.save();
    res.status(200).json({ ok: true });
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.wishlistFull = async (req, res) => {
  try {
    const list = await User.findOne({ email: req.user.email })
      .select("wishlist")
      .populate("wishlist")
      .exec();

    if (list) {
      res.json(list);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.wishlistByPage = async (req, res) => {
  const { page = 1, perPage = 10 } = req.body;

  try {
    // Find the user's wishlist
    const user = await User.findOne({ email: req.user.email })
      .select("wishlist")
      .populate({
        path: "wishlist",
        options: {
          skip: (page - 1) * perPage, // Skip for pagination
          limit: perPage, // Limit the number of results per page
          sort: { _id: -1 }, // Sort by _id in descending order (newest items first)
        },
      })
      .exec();

    if (user && user.wishlist) {
      // Get the total count of wishlist items
      const wishlistCount = await User.findOne({ email: req.user.email })
        .select("wishlist")
        .exec();

      const totalWishlistCount = wishlistCount.wishlist.length;

      res.json({
        wishlist: user.wishlist, // Paginated wishlist
        wishlistCount: totalWishlistCount, // Total number of items in the wishlist
        currentPage: page, // Current page
      });
    } else {
      res.json({
        wishlist: [],
        wishlistCount: 0,
        currentPage: page,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// exports.wishlist = async (req, res) => {
//   try {
//     const list = await User.findOne({ email: req.user.email })
//       .select("wishlist")
//       .populate({
//         path: "wishlist",
//         populate: {
//           path: "category subs subs2",
//           model: "Category Sub Sub2",
//         },
//       })
//       .exec();

//     res.json(list);
//   } catch (error) {
//     res.status(500).json({ error: "Internal server error" });
//   }
// };

exports.removeFromWishlist = async (req, res) => {
  const { productId } = req.params;
  const user = await User.findOneAndUpdate(
    { email: req.user.email },
    { $pull: { wishlist: productId } }
  ).exec();

  res.json({ ok: true });
};

function generateNumericID() {
  const timestamp = Date.now().toString(); // Get current timestamp as string
  const randomNum = Math.floor(Math.random() * 100000); // Generate random number between 0 and 99999
  const uniqueID = timestamp + randomNum.toString().padStart(5, "0"); // Combine and pad with leading zeros if necessary
  return uniqueID.slice(-8); // Ensure the length is exactly 8 digits
}

exports.createCashOrder = async (req, res) => {
  const { COD, couponApplied, values, paymentId, newsletter } = req.body;

  console.log("newsletter", newsletter);

  // if COD is true, create order with status of Cash On Delivery
  if (!COD) return res.json({ error: "Create cash order failed" });

  // if Contact details missing ib form values
  if (!values.Contact) return res.json({ error: "Contact Details missing*" });

  // if Shipping Address missing ib form values
  if (!values.Address) return res.json({ error: "Shipping address missing*" });

  if (newsletter) {
    // Check if the email already exists in EmailOptIn
    const existingEmailOptIn = await EmailOptIn.findOne({
      email: req.user.email,
    });

    if (!existingEmailOptIn) {
      // Add the email to EmailOptIn if it doesn't exist
      const newEmailOptIn = new EmailOptIn({ email: req.user.email });
      await newEmailOptIn.save();
    }
  }

  const user = await User.findOne({ email: req.user.email }).exec();

  const userCart = await Cart.findOne({ orderdBy: user._id })
    .populate({
      path: "products.product",
      model: "Product",
      populate: [{ path: "category", model: "Category", select: "name slug" }],
    })
    .exec();

  // User Cart checking
  if (!userCart) return res.json({ error: "Cart is Empty" });

  let finalAmount = 0;

  if (couponApplied.applied && userCart.totalAfterDiscount) {
    finalAmount = userCart.totalAfterDiscount;
  } else {
    finalAmount = userCart.cartTotal + userCart.shippingfee;
  }

  let newOrder = await new Order({
    products: userCart.products,
    paymentIntent: {
      amount: finalAmount,
      discounted: userCart.discounted,
      dispercent: userCart.dispercent,
      discountType: userCart.discountType,
      currency: "$",
      created: Date.now(),
    },
    OrderId: generateNumericID(),
    shippingto: values,
    email: req.user.email,
    shippingfee: userCart.shippingfee,
    orderdBy: user._id,
    paymentStatus: "Credit Card Charged",
    StripePaymentId: paymentId,
  }).save();

  // decrement quantity, increment sold
  let bulkOption = userCart.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product._id }, // IMPORTANT item.product
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  let updated = await Product.bulkWrite(bulkOption, {});

  // email sending using mailjet

  res.json({ orderId: newOrder.OrderId });
};

exports.createOrder = async (req, res) => {
  const { image, BFT, couponApplied, values, newsletter } = req.body;

  // if Contact details missing ib form values
  if (!values.Contact) return res.json({ error: "Contact Details missing*" });

  // if Shipping Address missing ib form values
  if (!values.Address) return res.json({ error: "Shipping address missing*" });

  if (newsletter) {
    // Check if the email already exists in EmailOptIn
    const existingEmailOptIn = await EmailOptIn.findOne({
      email: req.user.email,
    });

    if (!existingEmailOptIn) {
      // Add the email to EmailOptIn if it doesn't exist
      const newEmailOptIn = new EmailOptIn({ email: req.user.email });
      await newEmailOptIn.save();
    }
  }

  const user = await User.findOne({ email: req.user.email }).exec();

  const userCart = await Cart.findOne({ orderdBy: user._id })
    .populate({
      path: "products.product",
      model: "Product",
      populate: [{ path: "category", model: "Category", select: "name slug" }],
    })
    .exec();

  // User Cart checking
  if (!userCart) return res.json({ error: "Cart is Empty" });

  let finalAmount = 0;

  if (couponApplied.applied && userCart.totalAfterDiscount) {
    finalAmount = userCart.totalAfterDiscount;
  } else {
    finalAmount = userCart.cartTotal + userCart.shippingfee;
  }

  let newOrder = "";

  if (BFT) {
    newOrder = await new Order({
      products: userCart.products,
      paymentIntent: {
        amount: finalAmount,
        discounted: userCart.discounted,
        dispercent: userCart.dispercent,
        discountType: userCart.discountType,
        currency: "$",
        created: Date.now(),
      },
      OrderId: generateNumericID(),
      shippingto: values,
      email: req.user.email,
      shippingfee: userCart.shippingfee,
      PaymentSlip: image,
      orderdBy: user._id,
      paymentStatus: "Bank Fund Transfer",
    }).save();
  }
  // decrement quantity, increment sold
  let bulkOption = userCart.products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product._id }, // IMPORTANT item.product
        update: { $inc: { quantity: -item.count, sold: +item.count } },
      },
    };
  });

  let updated = await Product.bulkWrite(bulkOption, {});

  res.json({ orderId: newOrder.OrderId });
};

// shipping controllers
exports.shippingcreate = async (req, res) => {
  try {
    // console.log(req.body);
    // return;
    const { weightstart, weightend, charges } = req.body.shipping;
    res.json(await new Shipping({ weightstart, weightend, charges }).save());
  } catch (err) {
    console.log(err);
  }
};

exports.shippingremove = async (req, res) => {
  try {
    res.json(await Shipping.findByIdAndDelete(req.params.shippingId).exec());
  } catch (err) {
    console.log(err);
  }
};

exports.shippinglist = async (req, res) => {
  try {
    res.json(await Shipping.find({}).sort({ createdAt: -1 }).exec());
  } catch (err) {
    console.log(err);
  }
};

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Shipping.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming JSON data is sent in the request body

    // Transform data if necessary (e.g., handle $oid and $date formats)
    const transformShippingData = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformShippingItem);
      }
      return transformShippingItem(data);
    };

    const transformShippingItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id, // Handle $oid if present
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : new Date(item.createdAt), // Convert $date or ISO strings to Date
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : new Date(item.updatedAt),
    });

    const transformedData = transformShippingData(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const shipping = new Shipping(item);
        await shipping.validate(); // Validate each item before insertion
      }
      await Shipping.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const shipping = new Shipping(transformedData);
      await shipping.validate(); // Validate single document
      await Shipping.create(transformedData);
    }

    res.json({
      success: true,
      message: "Shipping data uploaded successfully!",
    });
  } catch (error) {
    console.error("Error uploading shipping data:", error);
    res
      .status(500)
      .json({
        error: "Failed to upload shipping data",
        details: error.message,
      });
  }
};

exports.createCancellation = async (req, res) => {
  const { id, itemid, cancelForm } = req.body;
  // console.log(cancelForm);

  try {
    // Check for missing data in cancelForm
    if (
      !id ||
      !itemid ||
      !cancelForm ||
      !cancelForm.quantity ||
      !cancelForm.reason ||
      !cancelForm.comment ||
      !cancelForm.resolution ||
      !cancelForm.declaration
    ) {
      return res.json({ error: "Missing Data in cancelForm" });
    }

    const request = await Productcancel.findOne({
      prod: itemid,
    });

    if (request) {
      return res.json({
        error: "Cancellation Request already submitted",
      });
    }

    const order = await Order.findOne({
      _id: new ObjectId(id),
      "products._id": new ObjectId(itemid),
    });
    // console.log("order found", order);
    if (order) {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: new ObjectId(id),
          "products._id": new ObjectId(itemid),
        },
        {
          $set: {
            "products.$.isCancelled": true,
          },
        },
        { new: true }
      );
    }

    let newCancellation = await new Productcancel({
      order: id,
      prod: itemid,
      RequestNumber: order.OrderId,
      quantity: cancelForm.quantity,
      reasonForReturn: cancelForm.reason,
      otherReasonText: cancelForm.comment,
      preferredResolution: cancelForm.resolution,
      declaration: cancelForm.declaration,
    }).save();

    res
      .status(200)
      .json({ success: true, RequestNumber: newCancellation.RequestNumber });
  } catch (error) {
    res.status(400).json({ error: "Bad Request - Invalid Input" });
  }
};

exports.createReturn = async (req, res) => {
  const { id, itemid, returnForm } = req.body;

  try {
    // Check for missing data in cancelForm
    if (
      !id ||
      !itemid ||
      !returnForm ||
      !returnForm.quantity ||
      !returnForm.reason ||
      !returnForm.comment ||
      !returnForm.condition ||
      !returnForm.resolution ||
      !returnForm.declaration
    ) {
      return res.json({ error: "Missing Data in ReturnForm" });
    }

    const request = await Productreturn.findOne({
      prod: itemid,
    });

    if (request) {
      return res.json({
        error: "Return Request already submitted",
      });
    }

    const order = await Order.findOne({
      _id: new ObjectId(id),
      "products._id": new ObjectId(itemid),
    });

    if (
      order.orderStatus !== "Delivered" ||
      moment(order.deliveredAt).isBefore(moment().subtract(15, "days"))
    ) {
      return res.json({
        error:
          "Order is not eligible for return. It must be delivered within the last 15 days.",
      });
    }

    if (order) {
      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: new ObjectId(id),
          "products._id": new ObjectId(itemid),
        },
        {
          $set: {
            "products.$.isReturned": true,
          },
        },
        { new: true }
      );
    }

    let newReturn = await new Productreturn({
      order: id,
      prod: itemid,
      RequestNumber: order.OrderId,
      quantity: returnForm.quantity,
      reasonForReturn: returnForm.reason,
      otherReasonText: returnForm.comment,
      conditionOfProduct: returnForm.condition,
      preferredResolution: returnForm.resolution,
      declaration: returnForm.declaration,
    }).save();

    res
      .status(200)
      .json({ success: true, RequestNumber: newReturn.RequestNumber });
  } catch (error) {
    res.status(400).json({ error: "Bad Request - Invalid Input" });
  }
};

exports.handlenewsletterSubscribe = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Check if the user's email exists in EmailOptIn
    const existingEmailOptIn = await EmailOptIn.findOne({ email: userEmail });

    if (existingEmailOptIn) {
      // If the email exists, remove it
      await EmailOptIn.deleteOne({ email: userEmail });
      res.status(200).json({ message: "Email unsubscribed successfully" });
    } else {
      // If the email doesn't exist, add it
      const newEmailOptIn = new EmailOptIn({ email: userEmail });
      await newEmailOptIn.save();
      res.status(200).json({ message: "Email subscribed successfully" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
};
exports.handlechecknewsSubs = async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Check if the user's email exists in EmailOptIn
    const existingEmailOptIn = await EmailOptIn.findOne({ email: userEmail });

    if (existingEmailOptIn) {
      // If the email exists,
      res.status(200).json({ ok: true });
    } else {
      // If the email doesn't exist,
      res.status(200).json({ ok: false });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
};
