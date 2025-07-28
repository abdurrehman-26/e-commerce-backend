import express from "express"
import { addAddress, checkLogin, deleteAddress, getAllAddresses, getloggedinuser, getUsersList, loginUser, logoutUser, resgisterUser, setDefaultAddress, updateAddress, updateName, updatePassword } from "../controllers/user.controller.js"
import { adminOnly, blockunAuth, verifyJWT } from "../middlewares/auth.middleware.js"

const router = express.Router()

router.route("/signup").post(resgisterUser)
router.route("/login").post(loginUser)
router.route("/logout").get(verifyJWT, blockunAuth, logoutUser)
router.route("/update-name").post(verifyJWT, blockunAuth, updateName)
router.route("/update-password").patch(verifyJWT, blockunAuth, updatePassword)
router.route("/checklogin").get(checkLogin)
router.route("/getloggedinuser").get(verifyJWT, blockunAuth, getloggedinuser)
router.route("/getuserslist").get(verifyJWT, blockunAuth, adminOnly, getUsersList)
router.route("/addresses/add").post(verifyJWT, blockunAuth, addAddress)
router.route("/addresses/update/:addressID").patch(verifyJWT, blockunAuth, updateAddress)
router.route("/addresses/delete/:addressID").delete(verifyJWT, blockunAuth, deleteAddress)
router.route("/addresses").get(verifyJWT, blockunAuth, getAllAddresses)
router.route('/addresses/:addressID/set-default').patch(verifyJWT, blockunAuth, setDefaultAddress)

export default router