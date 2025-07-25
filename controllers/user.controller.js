import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";

export const resgisterUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingUser = await User.find({ email });
    if (existingUser && existingUser.length !== 0) {
      console.log(existingUser);
      return res
        .status(200)
        .json({ message: "User with email already exists" });
    }
    const createUser = await User.create({
      name,
      email,
      password,
    });
    const createdUser = await User.findById(createUser).select(
      "-password -createdAt -updatedAt -__v"
    );
    res.status(201).json({
      status: "success",
      data: createdUser,
      message: "User Created successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "failed", message: "something went wrong on server" });
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
        httpOnly: true, // Can't be accessed via JavaScript
        secure: true, // Only over HTTPS
        domain: ".clixmart.dns-dynamic.net",
        sameSite: "none",
      })
      .cookie("refreshtoken", refreshtoken, {
        maxAge: 1000 * 60 * 60 * 24 * 7,
        httpOnly: true, // Can't be accessed via JavaScript
        secure: true, // Only over HTTPS
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
    console.log(error);
    res
      .status(500)
      .json({ status: "failed", message: "something went wrong on server" });
  }
};

export const updateName = async(req, res) => {
  const {name} = req.body
  try {
    if (!name) {
      return res.status(400).json({status: "failed", message: "Name not provided"})
    }
    const updated_user = await User.findByIdAndUpdate(req.user._id, {
      name
    }, {new: true}).select("-password -createdAt -updatedAt -__v -addresses -isEmailVerified")
    res.status(200).json({status: "success", message: "Name changed successfully.", updated_user})
  } catch (error) {
    res.status(500).json({status: "failed", message: "Internal server error"})
  }
}
export const updatePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: "failed",
        message: !oldPassword
          ? "Old password not provided"
          : "New password not provided",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ status: "failed", message: "User not found" });
    }

    const isMatch = await user.isPasswordCorrect(oldPassword);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "failed", message: "Old password is incorrect" });
    }

    user.password = newPassword;
    await user.save(); // 🔐 This triggers the pre-save hashing middleware

    res.status(200).json({
      status: "success",
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: "failed", message: "Internal server error" });
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
    res
      .status(500)
      .json({ status: "failed", message: "Server error during logout" });
  }
};

export const checkLogin = async (req, res) => {
  try {
    const token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res
        .status(401)
        .json({ login: false, message: "User is not logged in" });
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);
    if (!user) {
      return res.status(404).json({ login: false, message: "user not found" });
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
    const user = await User.findById(req.user._id)
      .select("name email -_id isAdmin")
      .lean();
    user.userID = req.user._id;
    res.status(200).json({
      status: "success",
      user,
      message: "logged in user fetched successfully",
    });
  } catch (error) {
    res
      .status(500)
      .json({ status: "failed", message: "something went wrong on server" });
  }
};

export const getUsersList = async (req, res) => {
  try {
    const users = await User.find().select(
      "-password -updatedAt -id -__v -isAdmin"
    );
    res.status(200).json({ status: "success", data: users });
  } catch (err) {
    res.status(500).json({ status: "failed", message: err.message });
  }
};

export const addAddress = async (req, res) => {
  const {
    addressName,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault,
  } = req.body;

  const user = await User.findOne({ _id: req.user._id });

  const newAddress = {
    addressName,
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

  const addedAddress = user.addresses[user.addresses.length - 1];

  res.status(200).json({
    status: "success",
    message: "Address added successfully",
    addedAddress,
  });
};

export const updateAddress = async (req, res) => {
  const { addressID } = req.params;
  const {
    addressName,
    fullName,
    phone,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    isDefault,
  } = req.body;

  try {
    const user = await User.findOne({ _id: req.user._id });

    if (!user) {
      return res
        .status(404)
        .json({ status: "error", message: "User not found" });
    }

    const index = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressID
    );

    if (index === -1) {
      return res
        .status(404)
        .json({ status: "failed", message: "Address not found" });
    }

    const currentAddress = user.addresses[index];
    const isCurrentlyDefault = currentAddress.isDefault;

    // If isDefault is true, unset default for all others
    if (isDefault) {
      user.addresses = user.addresses.map((addr) => ({
        ...addr.toObject(),
        isDefault: false,
      }));
    }

    // If trying to unset the only default, block it
    const isUnsettingOnlyDefault = !isDefault && isCurrentlyDefault;

    if (isUnsettingOnlyDefault) {
      return res.status(400).json({
        status: "failed",
        message: "You must have at least one default address",
      });
    }

    // Update the address
    const addr = user.addresses[index];

    addr.addressName = addressName ?? addr.addressName;
    addr.fullName = fullName ?? addr.fullName;
    addr.phone = phone ?? addr.phone;
    addr.addressLine1 = addressLine1 ?? addr.addressLine1;
    addr.addressLine2 = addressLine2 ?? addr.addressLine2;
    addr.city = city ?? addr.city;
    addr.state = state ?? addr.state;
    addr.postalCode = postalCode ?? addr.postalCode;
    addr.country = country ?? addr.country;
    addr.isDefault = isDefault ?? addr.isDefault;

    await user.save();

    const updatedAddress = user.addresses[index];

    res.status(200).json({
      status: "success",
      message: "Address updated successfully",
      updatedAddress,
    });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ status: "failed", message: "Internal server error" });
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { addressID } = req.params;

    if (!user) {
      return res
        .status(404)
        .json({ status: "failed", message: "User not found" });
    }

    const index = user.addresses.findIndex(
      (addr) => addr._id.toString() === addressID
    );

    if (index === -1) {
      return res
        .status(404)
        .json({ status: "failed", message: "Address not found" });
    }

    if (user.addresses[index].isDefault) {
      return res.status(400).json({
        status: "failed",
        message:
          "You can't delete the default address. Please set another one as default first.",
      });
    }

    user.addresses.splice(index, 1); // <-- the safe and correct way
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Address deleted successfully.",
      addresses: user.addresses,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return res
      .status(500)
      .json({ status: "failed", message: "Internal server error" });
  }
};

export const getAllAddresses = async (req, res) => {
  const user = await User.findOne({ _id: req.user._id });

  const sortedAddresses = [...user.addresses].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.status(200).json({
    status: "success",
    message: "Addresses fetched successfully",
    addresses: sortedAddresses,
  });
};
