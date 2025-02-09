const Category = require("../models/category");
const Product = require("../models/product");
const Sub = require("../models/sub");
const Sub2 = require("../models/sub2");
const slugify = require("slugify");

exports.create = async (req, res) => {
  try {
    const { name, svg, image } = req.body;
    res.json(
      await new Category({ name, svg, slug: slugify(name), image }).save()
    );
  } catch (err) {
    // console.log(err);
    res.status(400).send("Create category failed");
  }
};

exports.list = async (req, res) =>
  res.json(await Category.find({}).sort({ createdAt: 1 }).exec());

exports.read = async (req, res) => {
  try {
    let category = await Category.findOne({ slug: req.params.slug }).exec();
    if (!category) {
      // If brand is not found, return 404
      return res.status(404).json({ error: "Category not found" });
    }

    // res.json(category);
    const products = await Product.find({ category })
      .populate("category")
      .exec();

    res.json({
      category,
      products,
    });
  } catch (error) {
    // Handle other errors
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.update = async (req, res) => {
  const { name, svg, image } = req.body;
  try {
    const updated = await Category.findOneAndUpdate(
      { slug: req.params.slug },
      { name, slug: slugify(name), svg, image },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(400).send("Category update failed");
  }
};

exports.remove = async (req, res) => {
  try {
    const deleted = await Category.findOneAndDelete({ slug: req.params.slug });
    res.json(deleted);
  } catch (err) {
    res.status(400).send("Category delete failed");
  }
};

exports.getSubs = async (req, res) => {
  try {
    const subs = await Sub.find({ parent: req.params._id }).exec();
    res.json(subs);
  } catch (err) {
    console.log(err);
    res.status(400).send("Category delete failed");
  }
};

// reading categories for slider - code with category , sub and sub 2
// exports.getCategoriesWithChildren = async (req, res) => {
//   try {
//     const categories = await Category.find().exec();
//     const categoriesWithChildren = categories.map(async (category) => {
//       const subs = await Sub.find({ parent: category._id }).exec();

//       const subsWithChildren = await Promise.all(
//         subs.map(async (sub) => {
//           const sub2s = await Sub2.find({ parent: sub._id }).exec();

//           const sub2sWithChildren = sub2s.map((sub2) => ({
//             _id: sub2._id,
//             name: sub2.name,
//             slug: sub2.slug,
//           }));

//           return {
//             _id: sub._id,
//             name: sub.name,
//             slug: sub.slug,
//             image: sub.image,
//             children: sub2sWithChildren,
//           };
//         })
//       );
//       return {
//         _id: category._id,
//         name: category.name,
//         slug: category.slug,
//         svg: category.svg,
//         parent: category.parent,
//         children: subsWithChildren,
//       };
//     });
//     const result = await Promise.all(categoriesWithChildren);
//     res.json(result);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

// reading categories for slider - code with category , sub
exports.getCategoriesWithChildren = async (req, res) => {
  try {
    const categories = await Category.find().exec();

    const categoriesWithChildren = await Promise.all(
      categories.map(async (category) => {
        const subs = await Sub.find({ parent: category._id }).exec();

        const subsWithChildren = subs.map((sub) => ({
          _id: sub._id,
          name: sub.name,
          slug: sub.slug,
          image: sub.image,
          parent: sub.parent,
        }));

        return {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          svg: category.svg,
          children: subsWithChildren,
        };
      })
    );

    res.json(categoriesWithChildren);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getjsondata = async (req, res) => {
  try {
    // Fetch all data from the collection
    const data = await Category.find({});
    res.json(data); // Send data as JSON
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch data" });
  }
};

exports.uploadjsondata = async (req, res) => {
  try {
    const jsonData = req.body; // Assuming the JSON data is sent in the request body

    // Transform data if necessary (convert $oid and $date formats)
    const transformCategories = (data) => {
      if (Array.isArray(data)) {
        return data.map(transformCategoryItem);
      }
      return transformCategoryItem(data);
    };

    const transformCategoryItem = (item) => ({
      ...item,
      _id: item._id?.$oid || item._id,
      createdAt: item.createdAt?.$date
        ? new Date(item.createdAt.$date)
        : item.createdAt,
      updatedAt: item.updatedAt?.$date
        ? new Date(item.updatedAt.$date)
        : item.updatedAt,
    });

    const transformedData = transformCategories(jsonData);

    // Validate and insert JSON data
    if (Array.isArray(transformedData)) {
      for (const item of transformedData) {
        const category = new Category(item);
        await category.validate(); // Validate each item
      }
      await Category.insertMany(transformedData, { ordered: false }); // Allow partial success
    } else {
      const category = new Category(transformedData);
      await category.validate(); // Validate single document
      await Category.create(transformedData);
    }

    res.json({ success: true, message: "Categories uploaded successfully!" });
  } catch (error) {
    console.error("Error uploading categories:", error);
    res
      .status(500)
      .json({ error: "Failed to upload categories", details: error.message });
  }
};
