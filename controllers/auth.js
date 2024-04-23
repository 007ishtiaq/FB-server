const User = require("../models/user");

exports.createOrUpdateUser = async (req, res) => {
  const { name, picture, email } = req.user;
  let updatedName = name || email.split("@")[0];

  const user = await User.findOneAndUpdate(
    { email },
    { picture },
    { new: true }
  );
  if (user) {
    // console.log("USER UPDATED", user);
    res.json(user);
  } else {
    const newUser = await new User({
      email,
      name: updatedName,
      picture,
    }).save();
    // console.log("USER CREATED", newUser);
    res.json(newUser);
  }
};

// exports.createOrUpdatePhoneUser = async (req, res) => {
//   const { name, phoneNumber } = req.body;

//   const user = await User.findOneAndUpdate(
//     { contact: phoneNumber },
//     { name, email: "noEmail" },
//     { new: true }
//   );
//   if (user) {
//     res.json(user);
//   } else {
//     const newUser = await new User({
//       contact: phoneNumber,
//       email: "noEmail",
//       name,
//     }).save();
//     res.json(newUser);
//   }
// };

exports.currentUser = async (req, res) => {
  const user = await User.findOne({ email: req.user.email }).exec();
  res.json(user);
};
