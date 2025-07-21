import mongoose from "mongoose";
import { Product } from "../models/product.model.js";
import slugify from "slugify";

export const addProduct = async (req, res) => {
  try {
    const {
      title,
      price,
      compare_at_price,
      sku,
      images,
      description
    } = req.body;


    // 1. Slug generation (keep DRY)
    const generateUniqueSlug = async (title) => {
      const base = slugify(title, { lower: true, strict: true });
      let slug = base;
      let count = 1;

      while (await Product.exists({ slug })) {
        slug = `${base}-${count++}`;
      }

      return slug;
    };
    const slug = await generateUniqueSlug(title);

    // 2. Schema validation logic

    // If no variants, require sku, basePrice, baseStock, images
      if (!sku || !price || !images || images.length === 0) {
        return res.status(400).json({
          status: "failed",
          message: "For simple products, 'sku', 'price', and 'images' are required",
        });
      }
    // 3. Create product
    const newProduct = await Product.create({
      title,
      slug,
      description,
      sku,
      images,
      price,
      compare_at_price,
    });

    // 5. Check result
    if (!newProduct) {
      return res.status(500).json({
        status: "failed",
        message: "Product creation failed. Check server logs",
      });
    }

    res.status(201).json({
      status: "success",
      message: "Product added successfully",
      product: newProduct,
    });

  } catch (error) {
    console.error("Product Add Error:", error);
    res.status(500).json({
      status: "failed",
      message: "Something went wrong on the server",
    });
  }
};

export const getProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;       // Get page from query, default to 1
    const limit = 30;                                // Items per page
    const skip = (page - 1) * limit;  

    const products = await Product.find()
    .skip(skip)
    .limit(limit)
    .exec();

    const total = await Product.countDocuments();     // Total products
    const totalPages = Math.ceil(total / limit);      // Calculate total pages

    res.status(200).json({
      status: "success",
      data: products,
      pagination: {
        total,
        page,
        totalPages,
        limit
      }
    });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};
export const getProductsfortable = async (req, res) => {
  try {
    const products = await Product.find();
    const productsData = products.map((product) => {
      return {
      title: product.title,
      slug: product.slug,
      image: product.images[0],
      price: product.price
     }
    })
    res.status(200).json({ status: "success", data: productsData });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
}
export const getProductDetails = async (req, res) => {
  const { slug } = req.params;
  try {
    const product = await Product.findOne({ slug });
    if (!product) {
      return res
        .status(404)
        .json({ status: "failed", message: "Product not found" });
    }
    res.status(200).json({ status: "success", data: product });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};
export const updateProductDetails = async (req, res) => {
  try {
    const updated = await Product.findOneAndUpdate(
      { slug: req.params.slug }, // ✅ filter by slug
      req.body,                  // ✅ new data
      { new: true }              // ✅ return the updated document
    );
    res.status(200).json({ status: "success", data: updated });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};
export const deleteProduct = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res
      .status(400)
      .json({ status: "failed", message: "Invalid Product ID" });
  }
  try {
    await Product.findByIdAndDelete(id);
    res.status(200).json({ status: "success", message: "Product deleted" });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};