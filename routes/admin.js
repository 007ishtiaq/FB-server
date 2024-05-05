const express = require("express");
const { auth } = require("../firebase");

const router = express.Router();

// middlewares
const { authCheck, adminCheck, expiryCheck } = require("../middlewares/auth");

const {
  salesData,
  flashData,
  orders,
  rejectedOrders,
  completedOrders,
  returnedOrders,
  orderStatus,
  orderAccept,
  orderUpdate,
  removeProductandMakeclone,
  actionInfo,
  ledgerInfo,
  setcashback,
  setPaid,
  setbackDeliver,
  makeEntry,
  deleteEntry,
  allratings,
} = require("../controllers/admin");

// routes
router.get("/admin/sales", expiryCheck, authCheck, adminCheck, salesData);
router.get("/admin/flash", expiryCheck, authCheck, adminCheck, flashData);
router.get("/admin/orders", expiryCheck, authCheck, adminCheck, orders);
router.get(
  "/admin/rejected-orders",
  expiryCheck,
  authCheck,
  adminCheck,
  rejectedOrders
);
router.get(
  "/admin/completed-orders",
  expiryCheck,
  authCheck,
  adminCheck,
  completedOrders
);
router.get(
  "/admin/returned-orders",
  expiryCheck,
  authCheck,
  adminCheck,
  returnedOrders
);
router.put(
  "/admin/order-status",
  expiryCheck,
  authCheck,
  adminCheck,
  orderStatus
);
router.put(
  "/admin/order-accept",
  expiryCheck,
  authCheck,
  adminCheck,
  orderAccept
);
router.put(
  "/admin/order-edit",
  expiryCheck,
  authCheck,
  adminCheck,
  orderUpdate
);
router.put(
  "/admin/order/item-delete",
  expiryCheck,
  authCheck,
  adminCheck,
  removeProductandMakeclone
);

// Product Action Info cancel or return
router.put("/order/action", expiryCheck, authCheck, adminCheck, actionInfo);

// Admin Ledger routes
router.get("/admin/ledger", expiryCheck, authCheck, adminCheck, ledgerInfo);

// Admin Order Cashbacked
router.put("/order/cashback", expiryCheck, authCheck, adminCheck, setcashback);

// Admin Order All payments Paid
router.put("/order/paid", expiryCheck, authCheck, adminCheck, setPaid);

// Admin Order Items back delivered
router.put(
  "/order/delivery",
  expiryCheck,
  authCheck,
  adminCheck,
  setbackDeliver
);

// Admin Ledger new entry
router.put("/ledger/entry", expiryCheck, authCheck, adminCheck, makeEntry);
// Admin Ledger remove
router.delete(
  "/ledger/entry/:id",
  expiryCheck,
  authCheck,
  adminCheck,
  deleteEntry
);

module.exports = router;
