const Product = require("../models/product");
const Order = require("../models/order");
const Productcancel = require("../models/productcancel");
const Productreturn = require("../models/productreturn");
const Ledger = require("../models/ledger");
const Shipping = require("../models/shipping");

const {
  Types: { ObjectId },
} = require("mongoose");
//orders, orderStatus

exports.orders = async (req, res) => {
  let orders = await Order.find({
    $or: [
      {
        orderAccept: { $in: ["Under", "Yes"] },
        orderStatus: {
          $in: ["Not Processed", "Processing", "Dispatched"],
        },
      },
      {
        $and: [{ orderStatus: "Delivered" }, { isPaid: false }],
      },
    ],
  })
    .sort("createdAt")
    .populate("products.product")
    .populate("orderdBy")
    .exec();

  res.json(orders);
};

exports.rejectedOrders = async (req, res) => {
  let rejectedOrders = await Order.find({
    orderAccept: "No",
    orderStatus: "Cancelled",
  })
    .sort("-createdAt")
    .populate("products.product")
    .populate("orderdBy")
    .exec();

  res.json(rejectedOrders);
};
exports.completedOrders = async (req, res) => {
  let rejectedOrders = await Order.find({
    $and: [
      { orderStatus: "Delivered" },
      { isPaid: true },
      { isDelivered: true },
    ],
  })
    .sort("-createdAt")
    .populate("products.product")
    .populate("orderdBy")
    .exec();

  res.json(rejectedOrders);
};
exports.returnedOrders = async (req, res) => {
  let returnedOrders = await Order.find({
    orderStatus: "Returned",
  })
    .sort("-createdAt")
    .populate("products.product")
    .populate("orderdBy")
    .exec();

  res.json(returnedOrders);
};

exports.orderStatus = async (req, res) => {
  const { orderId, orderStatus } = req.body;

  const foundOrder = await Order.findById(orderId);
  const previousStatus = foundOrder.orderStatus;

  if (previousStatus === "Cancelled" || previousStatus === "Returned") {
    if (
      orderStatus === "Not Processed" ||
      orderStatus === "Processing" ||
      orderStatus === "Dispatched"
    ) {
      if (foundOrder.isCashBack) {
        return res.json({
          error: "Order Status Cannot be Changed, as Order is CashBacked",
        });
      } else {
        if (previousStatus === "Returned" && !foundOrder.isDelivered) {
          return res.json({
            error:
              "Order Status Cannot be Changed, as Order Items not received back",
          });
        } else {
          // Check if orignal order already exists or not
          let orignalOrder = await Order.findOne({ _id: foundOrder.CloneId });
          if (!orignalOrder) {
            // changing the discount and total amound after edit item qty or price
            let productsTotal = 0;
            for (let i = 0; i < foundOrder.products.length; i++) {
              productsTotal =
                productsTotal +
                foundOrder.products[i].price * foundOrder.products[i].count;
            }

            let discounted = "";
            if (foundOrder.paymentIntent.dispercent) {
              discounted =
                (productsTotal * foundOrder.paymentIntent.dispercent) / 100;
            }

            let updatedOrder = await Order.findByIdAndUpdate(
              orderId,
              {
                orderAccept: "Yes",
                isDelivered: false,
                deliveredAt: "",
                $set: {
                  "paymentIntent.amount":
                    productsTotal - discounted + foundOrder.shippingfee,
                  "paymentIntent.discounted": discounted,
                },
                orderStatus,
              },
              { new: true }
            ).exec();
            res.json({ success: true, order: updatedOrder });
          } else {
            // Loop through the products array inside foundOrder
            for (const productData of foundOrder.products) {
              const product = productData.product;
              const count = productData.count;
              const color = productData.color;
              const price = productData.price;

              orignalOrder.products.push({
                product,
                count,
                color,
                price,
              });
            }

            //shipping re-calculation
            let totalWeightorignal = 0;
            for (let i = 0; i < orignalOrder.products.length; i++) {
              let productFromDb = await Product.findById(
                orignalOrder.products[i].product
              )
                .select("weight")
                .exec();
              totalWeightorignal =
                totalWeightorignal +
                productFromDb.weight * orignalOrder.products[i].count;
            }

            let shippingfeeorignal = 0;
            let shippings = await Shipping.find({}).exec();
            for (let i = 0; i < shippings.length; i++) {
              if (
                totalWeightorignal <= shippings[i].weightend &&
                totalWeightorignal >= shippings[i].weightstart
              ) {
                shippingfeeorignal = shippings[i].charges;
              }
            }
            orignalOrder.shippingfee = shippingfeeorignal;

            // changing the discount and total amount after removing item from orignal order

            let productsTotal = 0;
            for (let i = 0; i < orignalOrder.products.length; i++) {
              productsTotal =
                productsTotal +
                orignalOrder.products[i].price * orignalOrder.products[i].count;
            }

            let discounted = "";
            if (orignalOrder.paymentIntent.dispercent) {
              discounted =
                (productsTotal * orignalOrder.paymentIntent.dispercent) / 100;
            }

            // Update amount and discount in originalOrder
            let dispercent = orignalOrder.paymentIntent.dispercent;
            let currency = orignalOrder.paymentIntent.currency;
            let created = orignalOrder.paymentIntent.created;
            orignalOrder.paymentIntent = {};
            orignalOrder.paymentIntent.amount =
              productsTotal - discounted + orignalOrder.shippingfee;
            orignalOrder.paymentIntent.discounted = discounted;
            orignalOrder.paymentIntent.dispercent = dispercent;
            orignalOrder.paymentIntent.currency = currency;
            orignalOrder.paymentIntent.created = created;

            // Remove the foundOrder
            await Order.deleteOne({ _id: foundOrder._id });

            // Save the updated clonedOrder
            await orignalOrder.save();

            res.json({ success: true, order: orignalOrder });
          }

          // product qty and sold updation
          for (const productData of foundOrder.products) {
            const product = productData.product;
            const count = productData.count;
            await Product.findByIdAndUpdate(product._id, {
              $inc: { quantity: -count, sold: count },
            }).exec();
          }
        }
      }
    }

    if (orderStatus === "Delivered") {
      if (foundOrder.isCashBack) {
        return res.json({
          error: "Order Status Cannot be Changed, as Order is CashBacked",
        });
      } else {
        if (previousStatus === "Returned" && !foundOrder.isDelivered) {
          return res.json({
            error:
              "Order Status Cannot be Changed, as Order Items not received back",
          });
        } else {
          // Check if orignal order already exists or not
          let orignalOrder = await Order.findOne({ _id: foundOrder.CloneId });
          if (!orignalOrder) {
            // changing the discount and total amound after edit item qty or price
            let productsTotal = 0;
            for (let i = 0; i < foundOrder.products.length; i++) {
              productsTotal =
                productsTotal +
                foundOrder.products[i].price * foundOrder.products[i].count;
            }

            let discounted = "";
            if (foundOrder.paymentIntent.dispercent) {
              discounted =
                (productsTotal * foundOrder.paymentIntent.dispercent) / 100;
            }

            let updatedOrder = await Order.findByIdAndUpdate(
              orderId,
              {
                orderAccept: "Yes",
                isDelivered: true,
                deliveredAt: Date.now(),
                $set: {
                  "paymentIntent.amount":
                    productsTotal - discounted + foundOrder.shippingfee,
                  "paymentIntent.discounted": discounted,
                },
                orderStatus,
              },
              { new: true }
            ).exec();

            res.json({ success: true, order: updatedOrder });
          } else {
            // Loop through the products array inside foundOrder
            for (const productData of foundOrder.products) {
              const product = productData.product;
              const count = productData.count;
              const color = productData.color;
              const price = productData.price;

              orignalOrder.products.push({
                product,
                count,
                color,
                price,
              });
            }

            //shipping re-calculation
            let totalWeightorignal = 0;
            for (let i = 0; i < orignalOrder.products.length; i++) {
              let productFromDb = await Product.findById(
                orignalOrder.products[i].product
              )
                .select("weight")
                .exec();
              totalWeightorignal =
                totalWeightorignal +
                productFromDb.weight * orignalOrder.products[i].count;
            }

            let shippingfeeorignal = 0;
            let shippings = await Shipping.find({}).exec();
            for (let i = 0; i < shippings.length; i++) {
              if (
                totalWeightorignal <= shippings[i].weightend &&
                totalWeightorignal >= shippings[i].weightstart
              ) {
                shippingfeeorignal = shippings[i].charges;
              }
            }
            orignalOrder.shippingfee = shippingfeeorignal;

            // changing the discount and total amount after removing item from orignal order
            let productsTotal = 0;
            for (let i = 0; i < orignalOrder.products.length; i++) {
              productsTotal =
                productsTotal +
                orignalOrder.products[i].price * orignalOrder.products[i].count;
            }

            let discounted = "";
            if (orignalOrder.paymentIntent.dispercent) {
              discounted =
                (productsTotal * orignalOrder.paymentIntent.dispercent) / 100;
            }

            // Update amount and discount in originalOrder
            let dispercent = orignalOrder.paymentIntent.dispercent;
            let currency = orignalOrder.paymentIntent.currency;
            let created = orignalOrder.paymentIntent.created;
            orignalOrder.paymentIntent = {};
            orignalOrder.paymentIntent.amount =
              productsTotal - discounted + orignalOrder.shippingfee;
            orignalOrder.paymentIntent.discounted = discounted;
            orignalOrder.paymentIntent.dispercent = dispercent;
            orignalOrder.paymentIntent.currency = currency;
            orignalOrder.paymentIntent.created = created;

            // Remove the foundOrder
            await Order.deleteOne({ _id: foundOrder._id });

            // Save the updated clonedOrder
            await orignalOrder.save();

            res.json({ success: true, order: orignalOrder });
          }

          // product qty and sold updation
          for (const productData of foundOrder.products) {
            const product = productData.product;
            const count = productData.count;
            await Product.findByIdAndUpdate(product._id, {
              $inc: { quantity: -count, sold: count },
            }).exec();
          }
        }
      }
    }

    if (orderStatus === "Cancelled" || orderStatus === "Returned") {
      if (foundOrder.isCashBack) {
        return res.json({
          error: "Order Status Cannot be Changed, as Order is CashBacked",
        });
      } else {
        if (previousStatus === "Returned" && !foundOrder.isDelivered) {
          return res.json({
            error:
              "Order Status Cannot be Changed, as Order Items not received back",
          });
        } else if (previousStatus === "Cancelled") {
          return res.json({
            error: "Order Cancelled to Returned Not Allowed",
          });
        } else {
          let updated = await Order.findByIdAndUpdate(
            orderId,
            {
              orderAccept: "No",
              isDelivered: false,
              deliveredAt: "",
              orderStatus,
            },
            { new: true }
          ).exec();

          res.json({ success: true, order: updated });
        }
      }
    }
  }

  if (
    previousStatus === "Not Processed" ||
    previousStatus === "Processing" ||
    previousStatus === "Dispatched"
  ) {
    if (orderStatus === "Cancelled" || orderStatus === "Returned") {
      if (orderStatus === "Returned") {
        return res.json({
          error: `From Order "${previousStatus}" to , Order "${orderStatus}" Not Allow.`,
        });
      } else {
        // Check if clone order already exists
        let clonedOrder = await Order.findOne({ _id: foundOrder.CloneId });

        if (!clonedOrder) {
          // changing the discount and total amount after removing item from orignal order
          let productsTotal = 0;
          for (let i = 0; i < foundOrder.products.length; i++) {
            productsTotal =
              productsTotal +
              foundOrder.products[i].price * foundOrder.products[i].count;
          }

          let discounted = "";
          if (foundOrder.paymentIntent.dispercent) {
            discounted =
              (productsTotal * foundOrder.paymentIntent.dispercent) / 100;
          }

          let updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
              orderAccept: "No",
              isDelivered: false,
              deliveredAt: "",
              $set: {
                "paymentIntent.amount":
                  productsTotal - discounted + foundOrder.shippingfee,
                "paymentIntent.discounted": discounted,
              },
              orderStatus,
            },
            { new: true }
          ).exec();

          res.json({ success: true, order: updatedOrder });
        } else if (clonedOrder && clonedOrder.isCashBack) {
          return res.json({
            error: "Item Cannot be removed, as Order's Clone is CashBacked",
          });
        } else {
          // Loop through the products array inside foundOrder
          for (const productData of foundOrder.products) {
            const product = productData.product;
            const count = productData.count;
            const color = productData.color;
            const price = productData.price;

            clonedOrder.products.push({
              product,
              count,
              color,
              price,
            });
          }

          //shipping re-calculation
          let totalWeight = 0;
          for (let i = 0; i < clonedOrder.products.length; i++) {
            let productFromDb = await Product.findById(
              clonedOrder.products[i].product
            )
              .select("weight")
              .exec();
            totalWeight =
              totalWeight +
              productFromDb.weight * clonedOrder.products[i].count;
          }

          let shippingfee = 0;
          let shippings = await Shipping.find({}).exec();
          for (let i = 0; i < shippings.length; i++) {
            if (
              totalWeight <= shippings[i].weightend &&
              totalWeight >= shippings[i].weightstart
            ) {
              shippingfee = shippings[i].charges;
            }
          }
          clonedOrder.shippingfee = shippingfee;

          // changing the discount and total amount after removing item from orignal order

          let productsTotal = 0;
          for (let i = 0; i < clonedOrder.products.length; i++) {
            productsTotal =
              productsTotal +
              clonedOrder.products[i].price * clonedOrder.products[i].count;
          }

          let discounted = "";
          if (clonedOrder.paymentIntent.dispercent) {
            discounted =
              (productsTotal * clonedOrder.paymentIntent.dispercent) / 100;
          }

          // Update amount and discount in originalOrder
          let dispercent = clonedOrder.paymentIntent.dispercent;
          let currency = clonedOrder.paymentIntent.currency;
          let created = clonedOrder.paymentIntent.created;
          clonedOrder.paymentIntent = {};
          clonedOrder.paymentIntent.amount =
            productsTotal - discounted + clonedOrder.shippingfee;
          clonedOrder.paymentIntent.discounted = discounted;
          clonedOrder.paymentIntent.dispercent = dispercent;
          clonedOrder.paymentIntent.currency = currency;
          clonedOrder.paymentIntent.created = created;

          // Remove the foundOrder
          await Order.deleteOne({ _id: foundOrder._id });

          // Save the updated clonedOrder
          await clonedOrder.save();

          res.json({ success: true, order: clonedOrder });
        }

        // product qty and sold updation
        for (const productData of foundOrder.products) {
          const product = productData.product;
          const count = productData.count;
          await Product.findByIdAndUpdate(product._id, {
            $inc: { quantity: count, sold: -count },
          }).exec();
        }
      }
    }
    if (
      orderStatus === "Not Processed" ||
      orderStatus === "Processing" ||
      orderStatus === "Dispatched"
    ) {
      let updated = await Order.findByIdAndUpdate(
        orderId,
        {
          orderAccept: "Yes",
          isDelivered: false,
          deliveredAt: "",
          orderStatus,
        },
        { new: true }
      ).exec();

      res.json({ success: true, order: updated });
    }
    if (orderStatus === "Delivered") {
      let updated = await Order.findByIdAndUpdate(
        orderId,
        {
          orderAccept: "Yes",
          isDelivered: true,
          deliveredAt: Date.now(),
          orderStatus,
        },
        { new: true }
      ).exec();

      res.json({ success: true, order: updated });
    }
  }

  if (previousStatus === "Delivered") {
    if (orderStatus === "Cancelled" || orderStatus === "Returned") {
      if (orderStatus === "Cancelled") {
        return res.json({
          error: `From Order "${previousStatus}" to , Order "${orderStatus}" Not Allow.`,
        });
      } else {
        // Check if clone order already exists
        let clonedOrder = await Order.findOne({ _id: foundOrder.CloneId });

        if (!clonedOrder) {
          // changing the discount and total amount after removing item from orignal order
          let productsTotal = 0;
          for (let i = 0; i < foundOrder.products.length; i++) {
            productsTotal =
              productsTotal +
              foundOrder.products[i].price * foundOrder.products[i].count;
          }

          let discounted = "";
          if (foundOrder.paymentIntent.dispercent) {
            discounted =
              (productsTotal * foundOrder.paymentIntent.dispercent) / 100;
          }

          let updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            {
              orderAccept: "No",
              isDelivered: false,
              deliveredAt: "",
              $set: {
                "paymentIntent.amount":
                  productsTotal - discounted + foundOrder.shippingfee,
                "paymentIntent.discounted": discounted,
              },
              orderStatus,
            },
            { new: true }
          ).exec();

          res.json({ success: true, order: updatedOrder });
        } else if (clonedOrder && clonedOrder.isCashBack) {
          return res.json({
            error: "Item Cannot be returned, as Order's Clone is CashBacked",
          });
        } else {
          // Loop through the products array inside foundOrder
          for (const productData of foundOrder.products) {
            const product = productData.product;
            const count = productData.count;
            const color = productData.color;
            const price = productData.price;

            clonedOrder.products.push({
              product,
              count,
              color,
              price,
            });
          }

          //shipping re-calculation
          let totalWeight = 0;
          for (let i = 0; i < clonedOrder.products.length; i++) {
            let productFromDb = await Product.findById(
              clonedOrder.products[i].product
            )
              .select("weight")
              .exec();
            totalWeight =
              totalWeight +
              productFromDb.weight * clonedOrder.products[i].count;
          }

          let shippingfee = 0;
          let shippings = await Shipping.find({}).exec();
          for (let i = 0; i < shippings.length; i++) {
            if (
              totalWeight <= shippings[i].weightend &&
              totalWeight >= shippings[i].weightstart
            ) {
              shippingfee = shippings[i].charges;
            }
          }
          clonedOrder.shippingfee = shippingfee;

          // changing the discount and total amount after removing item from orignal order
          let productsTotal = 0;
          for (let i = 0; i < clonedOrder.products.length; i++) {
            productsTotal =
              productsTotal +
              clonedOrder.products[i].price * clonedOrder.products[i].count;
          }

          let discounted = "";
          if (clonedOrder.paymentIntent.dispercent) {
            discounted =
              (productsTotal * clonedOrder.paymentIntent.dispercent) / 100;
          }

          // Update amount and discount in originalOrder
          let dispercent = clonedOrder.paymentIntent.dispercent;
          let currency = clonedOrder.paymentIntent.currency;
          let created = clonedOrder.paymentIntent.created;
          clonedOrder.paymentIntent = {};
          clonedOrder.paymentIntent.amount =
            productsTotal - discounted + clonedOrder.shippingfee;
          clonedOrder.paymentIntent.discounted = discounted;
          clonedOrder.paymentIntent.dispercent = dispercent;
          clonedOrder.paymentIntent.currency = currency;
          clonedOrder.paymentIntent.created = created;

          // Remove the foundOrder
          await Order.deleteOne({ _id: foundOrder._id });

          // Save the updated clonedOrder
          await clonedOrder.save();

          res.json({ success: true, order: clonedOrder });
        }
      }
    }
    if (
      orderStatus === "Not Processed" ||
      orderStatus === "Processing" ||
      orderStatus === "Dispatched"
    ) {
      let updated = await Order.findByIdAndUpdate(
        orderId,
        {
          orderAccept: "Yes",
          isDelivered: false,
          deliveredAt: "",
          orderStatus,
        },
        { new: true }
      ).exec();

      res.json({ success: true, order: updated });
    }
  }
};

exports.orderAccept = async (req, res) => {
  try {
    const { orderId, orderAccept } = req.body;

    let updated = await Order.findByIdAndUpdate(
      orderId,
      { orderAccept },
      { new: true }
    ).exec();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.orderUpdate = async (req, res) => {
  try {
    const { orderId, prodId, productId, form } = req.body;

    const foundOrder = await Order.findById(orderId);

    if (
      foundOrder.orderStatus === "Cancelled" ||
      foundOrder.orderStatus === "Returned" ||
      foundOrder.orderStatus === "Delivered"
    ) {
      return res.json({
        error: `Order Edit not Allow, Order Status is "${foundOrder.orderStatus}".`,
      });
    }
    if (foundOrder.isPaid) {
      return res.json({
        error: `Order Edit not Allow, Order is Paid.`,
      });
    }

    //destructuring from body
    const newCount = form.Quantity;
    const newPrice = form.Price;

    // Find the document and the product you want to update
    const order = await Order.findOne({
      _id: new ObjectId(orderId),
      "products._id": new ObjectId(prodId),
    });

    // inside order product price and count updation;
    if (order) {
      const itemupdatedOrder = await Order.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
          "products._id": new ObjectId(prodId),
        },
        {
          $set: {
            "products.$.count": newCount,
            "products.$.price": newPrice,
          },
        },
        { new: true }
      );

      //shipping re-calculation
      let totalWeight = 0;
      for (let i = 0; i < itemupdatedOrder.products.length; i++) {
        let productFromDb = await Product.findById(
          itemupdatedOrder.products[i].product
        )
          .select("weight")
          .exec();
        totalWeight =
          totalWeight +
          productFromDb.weight * itemupdatedOrder.products[i].count;
      }

      let shippingfee = 0;
      let shippings = await Shipping.find({}).exec();
      for (let i = 0; i < shippings.length; i++) {
        if (
          totalWeight <= shippings[i].weightend &&
          totalWeight >= shippings[i].weightstart
        ) {
          shippingfee = shippings[i].charges;
        }
      }

      const shippingupdatedOrder = await Order.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
          "products._id": new ObjectId(prodId),
        },
        {
          $set: {
            shippingfee: form.Shipping > 0 ? form.Shipping : shippingfee,
          },
        },
        { new: true }
      );

      // changing the discount and total amound after edit item qty or price
      let productsTotal = 0;
      for (let i = 0; i < shippingupdatedOrder.products.length; i++) {
        productsTotal =
          productsTotal +
          shippingupdatedOrder.products[i].price *
            shippingupdatedOrder.products[i].count;
      }

      let discounted = "";
      if (shippingupdatedOrder.paymentIntent.dispercent) {
        discounted =
          (productsTotal * shippingupdatedOrder.paymentIntent.dispercent) / 100;
      }

      const updatedOrder = await Order.findOneAndUpdate(
        {
          _id: new ObjectId(orderId),
          "products._id": new ObjectId(prodId),
        },
        {
          $set: {
            "paymentIntent.amount":
              productsTotal - discounted + shippingupdatedOrder.shippingfee,
            "paymentIntent.discounted": discounted,
          },
        },
        { new: true }
      );

      // inside orinal product schema quantity and sold updation;
      const product = await Product.findById(productId);

      if (product) {
        const { quantity, sold } = product;
        const countDifference =
          newCount -
          order.products.find((prod) => prod._id.toString() === prodId).count;
        const newQuantity = quantity - countDifference;
        const newSold = sold + countDifference;

        await Product.findByIdAndUpdate(productId, {
          quantity: newQuantity,
          sold: newSold,
        });
      }

      res.json({ success: true, updatedOrder });
    } else {
      res.status(404).json({ error: "Order not found." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  }
};

exports.removeProductandMakeclone = async (req, res) => {
  const { id, prodId } = req.body;
  try {
    const foundOrder = await Order.findById(id);
    if (
      foundOrder.orderStatus === "Cancelled" ||
      foundOrder.orderStatus === "Returned"
    ) {
      return res.json({
        error: `Item remove not Allow, Order Status is ${foundOrder.orderStatus}.`,
      });
    }
    if (
      foundOrder.orderStatus === "Not Processed" ||
      foundOrder.orderStatus === "Processing" ||
      foundOrder.orderStatus === "Dispatched"
    ) {
      const originalOrder = await Order.findById(id).lean();
      if (!originalOrder) {
        throw new Error("Order not found");
      }
      // Check if clone order already exists
      let clonedOrder = await Order.findOne({ _id: originalOrder.CloneId });
      if (!clonedOrder) {
        clonedOrder = new Order({ ...originalOrder, _id: undefined });
        clonedOrder.orderAccept = "No";
        clonedOrder.isDelivered = false;
        clonedOrder.deliveredAt = "";
        clonedOrder.orderStatus = "Cancelled";
        clonedOrder.products = [];
      } else if (clonedOrder && clonedOrder.isCashBack) {
        return res.json({
          error: "Item Cannot be removed, as Order's Clone is CashBacked",
        });
      }
      // Find the index of the product to remove
      const productIndex = originalOrder.products.findIndex(
        (product) => product._id.toString() === prodId.toString()
      );
      if (productIndex === -1) {
        throw new Error("Product not found in order");
      }
      // Remove the product from the original order
      const removedProduct = originalOrder.products.splice(productIndex, 1)[0];
      // Remove _id from removedProduct
      delete removedProduct._id;
      // Add the removed product to the products array of the cloned order
      clonedOrder.products.push(removedProduct);

      //shipping re-calculation
      let totalWeight = 0;
      for (let i = 0; i < clonedOrder.products.length; i++) {
        let productFromDb = await Product.findById(
          clonedOrder.products[i].product
        )
          .select("weight")
          .exec();
        totalWeight =
          totalWeight + productFromDb.weight * clonedOrder.products[i].count;
      }

      let shippingfee = 0;
      let shippings = await Shipping.find({}).exec();
      for (let i = 0; i < shippings.length; i++) {
        if (
          totalWeight <= shippings[i].weightend &&
          totalWeight >= shippings[i].weightstart
        ) {
          shippingfee = shippings[i].charges;
        }
      }
      clonedOrder.shippingfee = shippingfee;

      // changing the discount and total amount after removing item from clone order
      let productsTotalvalue = 0;
      for (let i = 0; i < clonedOrder.products.length; i++) {
        productsTotalvalue =
          productsTotalvalue +
          clonedOrder.products[i].price * clonedOrder.products[i].count;
      }

      let discountedamt = "";
      if (clonedOrder.paymentIntent.dispercent) {
        discountedamt =
          (productsTotalvalue * clonedOrder.paymentIntent.dispercent) / 100;
      }

      // Update amount and discount in clonedOrder
      let dispercent = clonedOrder.paymentIntent.dispercent;
      let currency = clonedOrder.paymentIntent.currency;
      let created = clonedOrder.paymentIntent.created;
      clonedOrder.paymentIntent = {};
      clonedOrder.paymentIntent.amount =
        productsTotalvalue - discountedamt + clonedOrder.shippingfee;
      clonedOrder.paymentIntent.discounted = discountedamt;
      clonedOrder.paymentIntent.dispercent = dispercent;
      clonedOrder.paymentIntent.currency = currency;
      clonedOrder.paymentIntent.created = created;

      // Save orignal order id to cloned order
      clonedOrder.CloneId = originalOrder._id.toString();

      // Save cloned order
      await clonedOrder.save();

      //shipping re-calculation
      let totalWeightorignal = 0;
      for (let i = 0; i < originalOrder.products.length; i++) {
        let productFromDb = await Product.findById(
          originalOrder.products[i].product
        )
          .select("weight")
          .exec();
        totalWeightorignal =
          totalWeightorignal +
          productFromDb.weight * originalOrder.products[i].count;
      }

      let shippingfeeorignal = 0; //here shipping charge fetch line removed, as using above "shippings"
      for (let i = 0; i < shippings.length; i++) {
        if (
          totalWeightorignal <= shippings[i].weightend &&
          totalWeightorignal >= shippings[i].weightstart
        ) {
          shippingfeeorignal = shippings[i].charges;
        }
      }
      originalOrder.shippingfee = shippingfeeorignal;

      // changing the discount and total amount after removing item from orignal order
      let productsTotal = 0;
      for (let i = 0; i < originalOrder.products.length; i++) {
        productsTotal =
          productsTotal +
          originalOrder.products[i].price * originalOrder.products[i].count;
      }

      let discounted = "";
      if (originalOrder.paymentIntent.dispercent) {
        discounted =
          (productsTotal * originalOrder.paymentIntent.dispercent) / 100;
      }

      // Update amount and discount in originalOrder
      originalOrder.paymentIntent.amount =
        productsTotal - discounted + originalOrder.shippingfee;
      originalOrder.paymentIntent.discounted = discounted;

      // Update CloneId in originalOrder
      originalOrder.CloneId = clonedOrder._id;

      // Save original order with CloneId updated
      await Order.findByIdAndUpdate(id, originalOrder);

      // product qty and sold update
      const product = await Product.findById(removedProduct.product);
      if (product) {
        const { quantity, sold } = product;
        const newCount = removedProduct.count;
        const newQuantity = quantity + newCount;
        const newSold = sold - newCount;
        await Product.findByIdAndUpdate(removedProduct.product, {
          quantity: newQuantity,
          sold: newSold,
        });
      }

      // Check if there are no products left in the order then remove orignal order
      if (originalOrder.products.length === 0) {
        // If there are no products left in the order, delete the order
        await Order.findByIdAndDelete(id);
        return res.json({
          success: true,
          message: "Order and product removed successfully",
        });
      }
      res.json({
        success: true,
        message: "Product removed and cloned order created successfully",
      });
    }
    if (foundOrder.orderStatus === "Delivered") {
      const originalOrder = await Order.findById(id).lean();
      if (!originalOrder) {
        throw new Error("Order not found");
      }
      // Check if clone order already exists
      let clonedOrder = await Order.findOne({ _id: originalOrder.CloneId });
      if (!clonedOrder) {
        clonedOrder = new Order({ ...originalOrder, _id: undefined });
        clonedOrder.orderAccept = "No";
        clonedOrder.isDelivered = false;
        clonedOrder.deliveredAt = "";
        clonedOrder.orderStatus = "Returned";
        clonedOrder.products = [];
      } else if (clonedOrder && clonedOrder.isCashBack) {
        return res.json({
          error: "Item Cannot be removed, as Order's Clone is CashBacked",
        });
      }
      // Find the index of the product to remove
      const productIndex = originalOrder.products.findIndex(
        (product) => product._id.toString() === prodId.toString()
      );
      if (productIndex === -1) {
        throw new Error("Product not found in order");
      }
      // Remove the product from the original order
      const removedProduct = originalOrder.products.splice(productIndex, 1)[0];
      // Remove _id from removedProduct
      delete removedProduct._id;
      // Add the removed product to the products array of the cloned order
      clonedOrder.products.push(removedProduct);

      //shipping re-calculation
      let totalWeight = 0;
      for (let i = 0; i < clonedOrder.products.length; i++) {
        let productFromDb = await Product.findById(
          clonedOrder.products[i].product
        )
          .select("weight")
          .exec();
        totalWeight =
          totalWeight + productFromDb.weight * clonedOrder.products[i].count;
      }

      let shippingfee = 0;
      let shippings = await Shipping.find({}).exec();
      for (let i = 0; i < shippings.length; i++) {
        if (
          totalWeight <= shippings[i].weightend &&
          totalWeight >= shippings[i].weightstart
        ) {
          shippingfee = shippings[i].charges;
        }
      }
      clonedOrder.shippingfee = shippingfee;

      // changing the discount and total amount after removing item from clone order
      let productsTotalvalue = 0;
      for (let i = 0; i < clonedOrder.products.length; i++) {
        productsTotalvalue =
          productsTotalvalue +
          clonedOrder.products[i].price * clonedOrder.products[i].count;
      }

      let discountedamt = "";
      if (clonedOrder.paymentIntent.dispercent) {
        discountedamt =
          (productsTotalvalue * clonedOrder.paymentIntent.dispercent) / 100;
      }

      // Update amount and discount in clonedOrder
      let dispercent = clonedOrder.paymentIntent.dispercent;
      let currency = clonedOrder.paymentIntent.currency;
      let created = clonedOrder.paymentIntent.created;
      clonedOrder.paymentIntent = {};
      clonedOrder.paymentIntent.amount =
        productsTotalvalue - discountedamt + clonedOrder.shippingfee;
      clonedOrder.paymentIntent.discounted = discountedamt;
      clonedOrder.paymentIntent.dispercent = dispercent;
      clonedOrder.paymentIntent.currency = currency;
      clonedOrder.paymentIntent.created = created;

      // Save orignal order id to cloned order
      clonedOrder.CloneId = originalOrder._id.toString();

      // Save cloned order
      await clonedOrder.save();

      //shipping re-calculation
      let totalWeightorignal = 0;
      for (let i = 0; i < originalOrder.products.length; i++) {
        let productFromDb = await Product.findById(
          originalOrder.products[i].product
        )
          .select("weight")
          .exec();
        totalWeightorignal =
          totalWeightorignal +
          productFromDb.weight * originalOrder.products[i].count;
      }

      let shippingfeeorignal = 0; //here shipping charge fetch line removed, as using above "shippings"
      for (let i = 0; i < shippings.length; i++) {
        if (
          totalWeightorignal <= shippings[i].weightend &&
          totalWeightorignal >= shippings[i].weightstart
        ) {
          shippingfeeorignal = shippings[i].charges;
        }
      }
      originalOrder.shippingfee = shippingfeeorignal;

      // changing the discount and total amount after removing item from orignal order
      let productsTotal = 0;
      for (let i = 0; i < originalOrder.products.length; i++) {
        productsTotal =
          productsTotal +
          originalOrder.products[i].price * originalOrder.products[i].count;
      }

      let discounted = "";
      if (originalOrder.paymentIntent.dispercent) {
        discounted =
          (productsTotal * originalOrder.paymentIntent.dispercent) / 100;
      }

      // Update amount and discount in originalOrder
      originalOrder.paymentIntent.amount =
        productsTotal - discounted + originalOrder.shippingfee;
      originalOrder.paymentIntent.discounted = discounted;

      // Update CloneId in originalOrder
      originalOrder.CloneId = clonedOrder._id;

      // Save original order with CloneId updated
      await Order.findByIdAndUpdate(id, originalOrder);

      // Check if there are no products left in the order
      if (originalOrder.products.length === 0) {
        // If there are no products left in the order, delete the order
        await Order.findByIdAndDelete(id);
        return res.json({
          success: true,
          message: "Order and product removed successfully",
        });
      }
      res.json({
        success: true,
        message: "Product returned and cloned order created successfully",
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.actionInfo = async (req, res) => {
  const { prodId, currentinfo } = req.body;
  try {
    if (currentinfo === "cancel") {
      let ActionInfo = await Productcancel.findOne({ prod: prodId.toString() });
      res.json(ActionInfo);
    }
    if (currentinfo === "return") {
      let ActionInfo = await Productreturn.findOne({ prod: prodId.toString() });
      res.json(ActionInfo);
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.ledgerInfo = async (req, res) => {
  try {
    let ledgerInfo = await Ledger.find({});
    res.json(ledgerInfo);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setcashback = async (req, res) => {
  const { OrderId } = req.body;
  try {
    // Find the order by OrderId
    const order = await Order.findById(OrderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    if (!order.isPaid) {
      return res.json({
        error: "Order Not Paid, Order cannot be CashBacked",
      });
    } else {
      if (order.orderStatus === "Returned" && !order.isDelivered) {
        return res.json({
          error: "Order Items Not Delivered Back, Order cannot be CashBacked",
        });
      } else {
        // Toggle isCashBack and set CashBackedAt if isCashBack is set to true
        if (!order.isCashBack) {
          order.isCashBack = true;
          order.CashBackedAt = new Date();

          // code for ledger entries
          let allLedgerEntries = await Ledger.find({}).exec();
          let totalDebits = 0;
          let totalCredits = 0;
          allLedgerEntries.forEach((entry) => {
            totalDebits += entry.debit || 0;
            totalCredits += entry.credit || 0;
          });

          let newEntry = await new Ledger({
            date: Date.now(),
            particulars: `${order.orderStatus} "OrderID = ${order.OrderId}"`,
            debit: null,
            credit: order.paymentIntent.amount,
            balance: totalDebits - totalCredits - order.paymentIntent.amount,
          }).save();
        } else {
          order.isCashBack = false;
          order.CashBackedAt = null;

          // Find and delete the ledger entry with the corresponding OrderId in particulars
          await Ledger.deleteOne({
            particulars: `${order.orderStatus} "OrderID = ${order.OrderId}"`,
          });
        }
      }
      // Save the updated order
      await order.save();
      // Return the updated order to the frontend
      res.json({ success: true, isCashBack: order.isCashBack });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.setPaid = async (req, res) => {
  const { OrderId } = req.body;

  try {
    // Find the order by OrderId
    const order = await Order.findById(OrderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    // Toggle isCashBack and set CashBackedAt if isCashBack is set to true
    if (!order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();

      // code for ledger entries
      let allLedgerEntries = await Ledger.find({}).exec();
      let totalDebits = 0;
      let totalCredits = 0;
      allLedgerEntries.forEach((entry) => {
        totalDebits += entry.debit || 0;
        totalCredits += entry.credit || 0;
      });

      let newEntry = await new Ledger({
        date: Date.now(),
        particulars: `Purchase "MOD: ${order.paymentStatus}" "OrderID = ${order.OrderId}"`,
        debit: order.paymentIntent.amount,
        credit: null,
        balance: totalDebits - totalCredits + order.paymentIntent.amount,
      }).save();
    } else {
      order.isPaid = false;
      order.paidAt = null;

      // Find and delete the ledger entry with the corresponding OrderId in particulars
      await Ledger.deleteOne({
        particulars: `Purchase "MOD: ${order.paymentStatus}" "OrderID = ${order.OrderId}"`,
      });
    }
    // Save the updated order
    await order.save();
    // Return the updated order to the frontend
    res.json({ success: true, isPaid: order.isPaid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
exports.setbackDeliver = async (req, res) => {
  const { OrderId } = req.body;

  try {
    // Find the order by OrderId
    const order = await Order.findById(OrderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }
    // Toggle isCashBack and set CashBackedAt if isCashBack is set to true
    if (!order.isDelivered) {
      order.isDelivered = true;
      order.deliveredAt = new Date();

      // product qty and sold updation
      for (const productData of order.products) {
        const product = productData.product;
        const count = productData.count;
        await Product.findByIdAndUpdate(product._id, {
          $inc: { quantity: count, sold: -count },
        }).exec();
      }
    } else {
      order.isDelivered = false;
      order.deliveredAt = null;

      // product qty and sold updation
      for (const productData of order.products) {
        const product = productData.product;
        const count = productData.count;
        await Product.findByIdAndUpdate(product._id, {
          $inc: { quantity: -count, sold: count },
        }).exec();
      }
    }
    // Save the updated order
    await order.save();
    // Return the updated order to the frontend
    res.json({ success: true, isDelivered: order.isDelivered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.makeEntry = async (req, res) => {
  const { Particulars, Debit, Credit } = req.body.newentry;

  if (Debit && Credit) {
    return res.json({
      error: "Debit and Credit both cannot be entred.",
    });
  }

  if (!Particulars || (!Debit && !Credit)) {
    return res.json({
      error: "Particulars or Debit/Credit is missing.",
    });
  }

  // code for ledger entries
  let allLedgerEntries = await Ledger.find({}).exec();
  let totalDebits = 0;
  let totalCredits = 0;
  allLedgerEntries.forEach((entry) => {
    totalDebits += entry.debit || 0;
    totalCredits += entry.credit || 0;
  });

  let balance;

  if (Debit) {
    balance = totalDebits - totalCredits + parseFloat(Debit);
  } else if (Credit) {
    balance = totalDebits - totalCredits - parseFloat(Credit);
  }

  const newEntry = new Ledger({
    date: Date.now(),
    particulars: Particulars,
    debit: Debit || null,
    credit: Credit || null,
    balance: balance || 0,
    editable: true,
  });

  try {
    await newEntry.save();
    res.json({ success: true, message: "Entry added successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteEntry = async (req, res) => {
  try {
    const ledgerEntry = await Ledger.findById(req.params.id);

    // Check if the entry is editable
    if (!ledgerEntry.editable) {
      return res.json({ error: "Delete not allowed. Entry is not editable." });
    }

    const deleted = await Ledger.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).send("Entry delete failed");
  }
};

exports.flashData = async (req, res) => {
  try {
    const products = await Product.find({ onSale: "Yes" })
      .select("slug onSale saleTime")
      .exec();

    res.json(products);
  } catch (err) {
    console.log(err);
    res.status(400).send("Flash Products Data failed");
  }
};

// ----------Dashboard function working-----------

exports.salesData = async (req, res) => {
  const today = new Date();
  const currentYear = new Date(today.getFullYear(), 00, 01, 00, 00); //1/1/2023, 12:00:00 AM  - month day year
  const nextYear = new Date(today.getFullYear() + 1, 00, 01, 00, 00); //1/1/2024, 12:00:00 AM - month day year
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    00,
    00
  ); // 11/13/2023, 12:00:00 AM - month day year

  const todayEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
    00,
    00
  ); // 11/14/2023, 12:00:00 AM - month day year
  const monthStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    01,
    00,
    00
  ); // 11/01/2023, 12:00:00 AM - month day year

  try {
    const totalIncom = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          paidAt: { $gte: currentYear, $lt: nextYear },
          orderStatus: {
            $in: ["Not Processed", "Processing", "Dispatched", "Delivered"],
          },
        },
      },
      {
        $group: {
          _id: { $month: "$paidAt" },
          totalIncom: { $sum: "$paymentIntent.amount" },
        },
      },
    ]).sort({ _id: 1 });

    const yearIncom = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          paidAt: { $gte: currentYear, $lt: nextYear },
          orderStatus: {
            $in: ["Not Processed", "Processing", "Dispatched", "Delivered"],
          },
        },
      },
      {
        $group: {
          _id: "",
          totalIncom: { $sum: "$paymentIntent.amount" },
        },
      },
    ]);

    const dailyIncom = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          paidAt: { $gte: todayStart, $lt: todayEnd },
          orderStatus: {
            $in: ["Not Processed", "Processing", "Dispatched", "Delivered"],
          },
        },
      },
      {
        $group: {
          _id: "",
          totalIncom: { $sum: "$paymentIntent.amount" },
        },
      },
    ]);

    const monthIncom = await Order.aggregate([
      {
        $match: {
          isPaid: true,
          paidAt: { $gte: monthStart, $lt: todayEnd },
          orderStatus: {
            $in: ["Not Processed", "Processing", "Dispatched", "Delivered"],
          },
        },
      },
      {
        $group: {
          _id: "",
          totalIncom: { $sum: "$paymentIntent.amount" },
        },
      },
    ]);

    res.status(200).json({ totalIncom, yearIncom, monthIncom, dailyIncom });
  } catch (error) {
    res.status(400).json({ error });
  }
};
