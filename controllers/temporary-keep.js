const { userCart } = require("./user");

// corrected by me -- star based search controller
const handleStar = async (req, res, stars) => {
  const aggregates = await Product.aggregate([
    {
      $project: {
        document: "$$ROOT",
        // title: "$title",
        floorAverage: {
          $floor: { $avg: "$ratings.star" }, // floor value of 3.33 will be 3
        },
      },
    },
    { $match: { floorAverage: stars } },
  ])
    .limit(12)
    .exec();

  const products = await Product.find({ _id: aggregates })
    .populate("category", "_id name")
    .populate("subs", "_id name")
    // .populate("postedBy", "_id name")
    .exec();

  res.json(products);
};

// inside userCart .remove() not function error
// if (cartExistByThisUser) {
//   await Cart.findOneAndRemove({
//     orderdBy: user._id,
//   }).exec();
// }

// const handleStar = async (req, res, stars) => {
//   const aggregates = await Product.aggregate([
//     {
//       $project: {
//         document: "$$ROOT",
//         // title: "$title",
//         floorAverage: {
//           $floor: { $avg: "$ratings.star" }, // floor value of 3.33 will be 3
//         },
//       },
//     },
//     { $match: { floorAverage: stars } },
//   ])
//     .limit(12)
//     .exec();

//   const products = await Product.find({ _id: aggregates })
//     .populate("category", "_id name")
//     .populate("subs", "_id name")
//     // .populate("postedBy", "_id name")
//     .exec();

//   res.json(products);
// };

// code for ledger entries
// let latestLedgerEntry = await Ledger.findOne({})
// .sort({ date: -1 })
// .exec();
// let initialBalance = 0;
// if (latestLedgerEntry) {
// initialBalance = latestLedgerEntry.balance;
// }
