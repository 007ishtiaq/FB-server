const Coupon = require("../models/coupon");

// create, remove, list

exports.create = async (req, res) => {
  try {
    // console.log(req.body);
    // return;
    const { name, type, condition, expiry, discount } = req.body.coupon;
    res.json(
      await new Coupon({ name, type, condition, expiry, discount }).save()
    );
  } catch (err) {
    console.log(err);
  }
};

exports.remove = async (req, res) => {
  try {
    res.json(await Coupon.findByIdAndDelete(req.params.couponId).exec());
  } catch (err) {
    console.log(err);
  }
};

exports.list = async (req, res) => {
  try {
    res.json(await Coupon.find({}).sort({ createdAt: -1 }).exec());
  } catch (err) {
    console.log(err);
  }
};
exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Coupon.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming JSON data is sent in the request body

    // Transform data if necessary (e.g., handle $oid and $date formats)
    const transformCouponData = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformCouponItem);
      }
      return transformCouponItem(data);
    };

    const transformCouponItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id, // Handle $oid if present
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : new Date(item.createdAt), // Convert $date or ISO strings to Date
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : new Date(item.updatedAt),
      expiry: item.expiry ? new Date(item.expiry) : null, // Convert expiry to Date if it's present
    });

    const transformedData = transformCouponData(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const coupon = new Coupon(item);
        await coupon.validate(); // Validate each item before insertion
      }
      await Coupon.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const coupon = new Coupon(transformedData);
      await coupon.validate(); // Validate single document
      await Coupon.create(transformedData);
    }

    res.json({ success: true, message: "Coupon data uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading coupon data:", error);
    res
      .status(500)
      .json({ error: "Failed to upload coupon data", details: error.message });
  }
};
