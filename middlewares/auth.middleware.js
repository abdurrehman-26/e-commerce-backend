import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = async (req, res, next) => {
  try {
    const token =
      req.cookies?.accesstoken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      req.user = null;
      req.authError = "Access token not found";
      return next();
    }
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken._id);
    if (!user) {
      req.user = null;
      req.authError = "User not found";
      return next();
    }
    req.user = user;
    next();
  } catch (error) {
    req.user = null;
    req.authError = error.message;
    next();
  }
};

export const blockunAuth = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({status: "failed", message: req.authError });
  }
  next();
};

export const adminOnly = (req, res, next) => {
  if (req.user?.isAdmin) next(); else res.status(403).json({ message: "Admin access only" });
};

export const superAdminOnly = (req, res, next) => {
  if (req.user?.isAdmin) next(); else res.status(403).json({ message: "Admin access only" });
};