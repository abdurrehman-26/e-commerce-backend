import express from "express";
import { addProduct, deleteProduct, getProductDetails, getProducts, getProductsfortable, updateProductDetails } from "../controllers/product.controller.js";
import { adminOnly, blockunAuth, verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router()

router.route("/add-product").post(verifyJWT, blockunAuth, adminOnly, addProduct)
router.route("/getdetails/:slug").get(getProductDetails)
router.route("/").get(getProducts)
router.route("/getproductsfortable").get(getProductsfortable)
router.route("/update/:slug").put(verifyJWT, blockunAuth, adminOnly, updateProductDetails)
router.route("/:id").delete(verifyJWT, blockunAuth, adminOnly, deleteProduct)

export default router