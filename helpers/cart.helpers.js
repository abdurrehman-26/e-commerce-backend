import { Cart } from "../models/cart.model.js";

// utils/cart.helpers.js
export const getCartOwner = (req) => {
  if (req.user?._id) return req.user._id;
  if (req.guestID) return req.guestID;
  throw new Error("No cart owner identified");
};

export const buildCartQuery = (req) => {
  const owner = getCartOwner(req);
  return req.user?._id ? { user: owner } : { guestID: owner };
};

export const getNormalizedCart = async (cart_id) => {
  const cart =  await Cart.aggregate([
    { $match: { _id: cart_id } },
    { $unwind: "$items" },
    {
      $lookup: {
        from: "products",
        localField: "items.productID",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    {
      $addFields: {
        items: {
          productID: "$product._id",
          title: "$product.title",
          price: "$product.price",
          compare_at_price: "$product.compare_at_price",
          image: { $first: "$product.images" },
          slug: "$product.slug",
        },
      },
    },
    {
      $group: {
        _id: "$_id",
        items: { $push: "$items" },
      },
    },
  ]);
  return cart[0]
};
