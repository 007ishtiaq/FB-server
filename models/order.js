const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Schema;

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        product: {
          _id: Schema.Types.ObjectId,
          art: Number,
          title: String,
          slug: String,
          description: String,
          price: Number,
          disprice: Number,
          shippingcharges: Number,
          images: [],
          color: String,
          brand: String,
        },
        count: Number,
        color: String,
        size: String,
        price: Number,
        isCancelled: { type: Boolean, default: false },
        isReturned: { type: Boolean, default: false },
      },
    ],
    paymentIntent: {},
    OrderId: Number,
    CloneId: { type: String },
    shippingto: {},
    email: {
      type: String,
    },
    shippingfee: Number,
    orderStatus: {
      type: String,
      default: "Not Processed",
      enum: [
        "Not Processed",
        "Processing",
        "Dispatched",
        "Delivered",
        "Cancelled",
        "Returned",
      ],
    },
    paymentStatus: {
      type: String,
      default: "Not Selected",
      enum: [
        "Bank Fund Transfer",
        "Jazz Cash Wallet",
        "Easypesa Wallet",
        "Credit Card Charged",
        "Not Selected",
      ],
    },
    StripePaymentId: {
      type: String,
    },
    PaymentSlip: {
      url: {
        type: String,
      },
      public_id: {
        type: String,
      },
    },
    orderdBy: { type: ObjectId, ref: "User" },
    orderAccept: {
      type: String,
      default: "Under",
      enum: ["Under", "Yes", "No"],
    },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, default: false },
    deliveredAt: { type: Date },
    isCashBack: { type: Boolean, default: false },
    CashBackedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
