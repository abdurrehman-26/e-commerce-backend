import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const resgisterUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.find({ email });
    if (existingUser && existingUser.length !== 0) {
      console.log(existingUser);
      return res.status(200).json({ message: "User with email already exists" });
    }
    const createUser = await User.create({
      name,
      email,
      password,
    });
    const createdUser = await User.findById(createUser).select(
      "-password -createdAt -updatedAt -__v"
    );
    res
      .status(201)
      .json({ status: "success", data: createdUser, message: "User Created successfully" });
  } catch (error) {
    res.status(500).json({status: "failed", message: "something went wrong on server"})
  }
};
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(200).json({ message: "User email not found" });
    }
    const passwordCorrect = await user.isPasswordCorrect(password);
    if (!passwordCorrect) {
      return res.status(200).json({ message: "Password incorrect" });
    }
    const loggedinuser = await User.findById(user._id).select(
      "-password -createdAt -updatedAt -__v"
    );
    const accesstoken = user.generateAccessToken();
    const refreshtoken = user.generateRefreshToken();
    res
      .status(200)
      .cookie("accesstoken", accesstoken, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,                  // Can't be accessed via JavaScript
        secure: true,                    // Only over HTTPS
        domain: ".clixmart.dns-dynamic.net",
        sameSite: "none",  
      })
      .cookie("refreshtoken", refreshtoken, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true,                  // Can't be accessed via JavaScript
        secure: true,                    // Only over HTTPS
        domain: ".clixmart.dns-dynamic.net",
        sameSite: "none",        
      })
      .json({
        loggedinuser,
        accesstoken,
        refreshtoken,
        message: "User loggedin successfully",
      });
  } catch (error) {
    console.log(error)
    res.status(500).json({status: "failed", message: "something went wrong on server"})
  }
};

export const logoutUser = (req, res) => {
  try {
    res
      .clearCookie("accesstoken", {
        httpOnly: true,
        secure: true,
        domain: ".clixmart.dns-dynamic.net",
        sameSite: "none",
      })
      .clearCookie("refreshtoken", {
        httpOnly: true,
        secure: true,
        domain: ".clixmart.dns-dynamic.net",
        sameSite: "none",
      })
      .status(200)
      .json({ status: "success", message: "User logged out successfully" });
  } catch (error) {
    res.status(500).json({ status: "failed", message: "Server error during logout" });
  }
};


export const checkLogin = async (req, res) => {
  try {
    const token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "access token not found" });
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }
    res.status(200).json({ login: true, message: "User is logged in" });
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Access token expired" }); // Explicitly handle token expiration
    } else if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Invalid access token" }); //Handles malformed tokens.
    } else {
      console.error("JWT verification error:", error); // Log other errors
      return res.status(500).json({ message: "Internal server error" }); // Generic error
    }
  }
};

export const getloggedinuser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("name email -_id").lean()
    user.userID = req.user._id
    res
      .status(200)
      .json({ status: "success", user, message: "logged in user fetched successfully" });
  } catch (error) {
    res.status(500).json({status: "failed", message: "something went wrong on server"})
  }
};

export const getUsersList = async (req, res) => {
  try {
    const users = await User.find().select("-password -updatedAt -id -__v -isAdmin");
    res.status(200).json({ status: "success", data: users });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

export const addAddress = async (req, res) => {
  const { 
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault } = req.body;

    const user = await User.findOne({_id: req.user._id});

    const newAddress = {
      fullName,
      phone,
      addressLine1,
      addressLine2,
      city,
      state,
      postalCode,
      country,
      isDefault: isDefault || false,
    };

    if (newAddress.isDefault) {
      user.addresses = user.addresses.map((addr) => ({
        ...addr.toObject(),
        isDefault: false,
      }));
    }

    user.addresses.push(newAddress);
    await user.save();

    res.status(200).json({ status: "success", message: "Address added successfully", addresses: user.addresses });
}
export const getAllAddresses = async (req, res) => {

    const user = await User.findOne({_id: req.user._id});

    res.status(200).json({ status: "success", message: "Addresses fetched successfully", addresses: user.addresses });
}