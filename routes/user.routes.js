import express from "express"
import { addAddress, checkLogin, getAllAddresses, getloggedinuser, getUsersList, loginUser, logoutUser, resgisterUser } from "../controllers/user.controller.js"
import { adminOnly, blockunAuth, verifyJWT } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.route("/signup").post(resgisterUser)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJWT, blockunAuth, logoutUser)
router.route("/checklogin").get(checkLogin)
router.route("/getloggedinuser").get(verifyJWT, blockunAuth, getloggedinuser)
router.route("/getuserslist").get(verifyJWT, blockunAuth, adminOnly, getUsersList)
router.route("/addresses/add").post(verifyJWT, blockunAuth, addAddress)
router.route("/addresses").get(verifyJWT, blockunAuth, getAllAddresses)

export default router