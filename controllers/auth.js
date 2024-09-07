const User = require("../models/user");
const { mailgun, transporter } = require("../middlewares/utils");
const OtpVerification = require("../models/otp");
const bcrypt = require("bcrypt");

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

// OTP sending endpoint
exports.sendOTP = async (req, res) => {
  const { email } = req.body;

  // Check if user exists in your database
  const user = await User.findOne({ email });
  // if (user) {
  //   return res.status(400).json({ error: "User already exists" });
  // } else {
  // Generate a random 6-digit OTP

  const otp = Math.floor(1000 + Math.random() * 9000);
  const saltRounds = 10;

  try {
    // Hash the OTP before saving it to the database
    const hashedOtp = await bcrypt.hash(otp.toString(), saltRounds);

    // Save the OTP with email and timestamps in your database
    const otpVerification = new OtpVerification({
      userEmail: email,
      otp: hashedOtp,
      createdAt: new Date(),
      expiredAt: new Date(Date.now() + 10 * 60 * 1000), // OTP expires in 10 minutes
    });

    await otpVerification.save();

    // Email content
    const mailOptions = {
      from: "Your App <ishtiaqahmad427427@gmail.com>",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It will expire in 10 minutes.`,
    };

    // Send email using Mailjet
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP email" });
  }
  // }
};

exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body.values;

  try {
    // Find the OTP record for the email
    const otpRecord = await OtpVerification.findOne({ userEmail: email });

    if (!otpRecord) {
      return res.status(400).json({
        err: "OTP not found or expired",
      });
    }

    // Check if OTP has expired
    if (new Date() > otpRecord.expiredAt) {
      return res.status(400).json({ err: "OTP has expired" });
    }

    // Compare the OTP provided by the user with the hashed OTP
    const isMatch = await bcrypt.compare(otp.toString(), otpRecord.otp);

    if (!isMatch) {
      return res.status(400).json({ err: "Invalid OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });

    // Optionally, delete the OTP record after verification
    await OtpVerification.deleteOne({ userEmail: email });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
};
