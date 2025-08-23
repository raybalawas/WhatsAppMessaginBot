import JWT from "jsonwebtoken";
import userModel from "../models/usersModel.js";
import { errorResponse } from "../utils/response.js";

const checkAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log("Auth Header From AuthMiddleware:", authHeader);
    if (!authHeader) {
      return errorResponse(
        res,
        "No token provided, authorization denied!",
        400
      );
    }

    const token = authHeader.split(" ")[1];
    console.log("Token From AuthMiddleware:", token);
    const decoded = JWT.verify(token, process.env.JWT_SECRET);
    console.log("Decoded From AuthMiddleware:", decoded);
    req.user = decoded;

    const user = await userModel.findById(decoded.id).select("-password");
    if (!user) {
      return errorResponse(res, "user not found!", 400);
    }
    req.user = user;
    next();
  } catch (error) {
    console.error(`Auth Error: ${error.message}`);
    return errorResponse(res, "Server Error!");
  }
};

const checkAdmin = async (req, res, next) => {
  if (req.user.role != 1) {
    return errorResponse(res, "Access denied! Admins Only!", 403);
  }
  next();
};

const checkUser = async (req, res, next) => {
  if (req.user.role != 0) {
    return errorResponse(res, "Access denied! Users Only", 403);
  }
  next();
};

export { checkAdmin, checkAuth, checkUser };
