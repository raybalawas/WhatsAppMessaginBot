import userModel from "../models/usersModel.js";
import { successResponse, errorResponse } from "../utils/response.js";
import bcrypt from "bcrypt";
import JWT from "jsonwebtoken";
const Signup = async (req, res) => {
  try {
    const { name, userName, email, mobile, password } = req.body;
    if (!name || !userName || !email || !mobile || !password) {
      console.log("All fields are required");
      return errorResponse(res, "All fields are required", 400);
    }

    const ExistUser = await userModel.findOne({
      $or: [{ userName }, { email }, { mobile }],
    });
    console.log(ExistUser);
    if (ExistUser) {
      return errorResponse(
        res,
        "The User Name, mobile or email already exist",
        400
      );
    }
    const hashPass = await bcrypt.hash(password, 10);
    console.log("Normal Password:-", password, "hased Password:-", hashPass);
    const user = await userModel.create({
      name,
      userName,
      email,
      mobile,
      password: hashPass,
    });
    return successResponse(res, "User created successfully!", user);
  } catch (error) {
    console.log(error);
    return errorResponse(res, "Server Error!");
  }
};

// const Signin = async (req, res) => {
//   try {
//     const { userName, email, mobile, password } = req.body;
//     if ((!userName && !email && !mobile) || !password) {
//       console.log("Provide username OR email OR mobile along with password!");
//       return errorResponse(
//         res,
//         "Provide username OR email OR mobile along with password!",
//         400
//       );
//     }

//     const AuthUser = await userModel.findOne({
//       $or: [
//         userName ? { userName } : undefined,
//         email ? { email } : undefined,
//         mobile ? { mobile } : undefined,
//       ].filter(Boolean),
//     });
//     if (!AuthUser) {
//       console.log("User not existing");
//       return errorResponse(
//         res,
//         "User does not exist in our database Signup first"
//       );
//     }
//     const comparepass = await bcrypt.compare(password, AuthUser.password);
//     if (!comparepass) {
//       console.log(`Password does not mathc!`);
//       return errorResponse(res, "password does not matched!", 400);
//     }

//     const token = JWT.sign(
//       { id: AuthUser._id, role: AuthUser.role },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRY }
//     );

//     if (AuthUser.status == 0 && AuthUser.role == 0) {
//       console.log(`Your status is inactive yet! contact Admin`);
//       return errorResponse(res, "Status is Inactive yet!", 400);
//     }

//     if (AuthUser.role == 1) {
//       console.log(`Admin logged in successfully`);
//       return successResponse(res, "Admin Logged in successfully!", {
//         user: AuthUser,
//         token: token,
//       });
//     } else if (AuthUser.role == 0) {
//       console.log(`User logged in successfully`);
//       return successResponse(res, "User Logged in successfully!", {
//         user: AuthUser,
//         token: token,
//       });
//     } else {
//       console.log(`Invalid role access`);
//       return errorResponse(res, "Invalid role access", 400);
//     }
//   } catch (error) {
//     console.log(error);
//     return errorResponse(res, "Server Error");
//   }
// };

const Signin = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return errorResponse(res, "Identifier and password are required", 400);
    }

    const query = {
      $or: [{ userName: identifier }, { email: identifier }],
    };

    // Check if identifier is numeric, then search mobile
    if (!isNaN(identifier)) {
      query.$or.push({ mobile: Number(identifier) });
    }

    const AuthUser = await userModel.findOne(query);

    if (!AuthUser) {
      return errorResponse(
        res,
        "User does not exist. Please signup first.",
        400
      );
    }

    const comparepass = await bcrypt.compare(password, AuthUser.password);

    if (!comparepass) {
      return errorResponse(res, "Incorrect password!", 400);
    }

    const token = JWT.sign(
      { id: AuthUser._id, role: AuthUser.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY }
    );
    
    if (AuthUser.status === "0" || AuthUser.status === 0) {
      return errorResponse(
        res,
        "Your account is inactive! Contact admin.",
        400
      );
    }

    return successResponse(res, "Login successful!", {
      user: AuthUser,
      token: token,
    });
  } catch (error) {
    console.error(error);
    return errorResponse(res, "Server Error");
  }
};

const UserList = async (req, res) => {
  try {
    const users = await userModel.find({ role: 0 }).select("-password");
    if (!users) {
      console.log(`users not found`);
      return errorResponse(res, "users not found", 300);
    }
    console.log(users);
    return successResponse(res, "Users fetched successfully!", users);
  } catch (error) {
    console.log(`error trying to fetch error`);
    return errorResponse(res, "Server Error!");
  }
};
const UserView = async (req, res) => {
  try {
    const { id } = req.params;
    const users = await userModel.findById(id).select("-password");
    if (!users) {
      console.log(`users not found`);
      return errorResponse(res, "users not found", 300);
    }
    console.log(users);
    return successResponse(res, "User view fetched successfully!", users);
  } catch (error) {
    console.log(`error trying to fetch error`);
    return errorResponse(res, "Server Error!");
  }
};
const userdelete = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await userModel.findByIdAndDelete(id);
    console.log(deletedUser);
    if (!deletedUser) {
      console.log("User not found or not allowed to delete!");
      return res
        .status(404)
        .json({ message: "User not found or not allowed to delete!" });
    }
    return successResponse(res, "user deleted successfully!", 200);
  } catch (error) {
    console.log(error);
    return errorResponse(res, "Server Error");
  }
};

const userUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, userName, email, mobile, role, status, password } = req.body;

    const currentUser = await userModel.findById(id);
    if (!currentUser) {
      return errorResponse(res, "User not found", 404);
    }

    // if body is empty -> return old user (no update)
    if (!req.body || Object.keys(req.body).length === 0) {
      return successResponse(
        res,
        currentUser,
        "No changes provided, user data unchanged"
      );
    }

    // validate role and status if they are passed
    if (role !== undefined && ![0, 1, "0", "1"].includes(role)) {
      return errorResponse(res, "role must be 0 or 1", 400);
    }
    if (status !== undefined && ![0, 1, "0", "1"].includes(status)) {
      return errorResponse(res, "status must be 0 or 1", 400);
    }

    // check for conflicts (only if new email/userName/mobile are provided)
    if (email || userName || mobile) {
      const conflictUser = await userModel.findOne({
        $or: [
          email ? { email } : null,
          userName ? { userName } : null,
          mobile ? { mobile } : null,
        ].filter(Boolean),
        _id: { $ne: id },
      });

      if (conflictUser) {
        return errorResponse(
          res,
          "Email, Username, or Mobile already in use",
          400
        );
      }
    }

    // build update object (fallback to old values if not provided)
    let updateData = {
      name: name ?? currentUser.name,
      userName: userName ?? currentUser.userName,
      email: email ?? currentUser.email,
      mobile: mobile ?? currentUser.mobile,
      role: role ?? currentUser.role,
      status: status ?? currentUser.status,
      password: currentUser.password, // default keep old
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // update user
    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return successResponse(res, updatedUser, "User updated successfully!");
  } catch (error) {
    console.error("Error updating user:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

const userUpdateProfile = async (req, res) => {
  try {
    const id = req.user?.id;
    const { name, userName, email, mobile, password } = req.body;

    const currentUser = await userModel.findById(id);
    if (!currentUser) {
      return errorResponse(res, "User not found", 404);
    }

    // if body is empty -> return old user (no update)
    if (!req.body || Object.keys(req.body).length === 0) {
      return successResponse(
        res,
        currentUser,
        "No changes provided, user data unchanged"
      );
    }

    // check for conflicts (only if new email/userName/mobile are provided)
    if (email || userName || mobile) {
      const conflictUser = await userModel.findOne({
        $or: [
          email ? { email } : null,
          userName ? { userName } : null,
          mobile ? { mobile } : null,
        ].filter(Boolean),
        _id: { $ne: id },
      });

      if (conflictUser) {
        return errorResponse(
          res,
          "Email, Username, or Mobile already in use",
          400
        );
      }
    }

    // build update object (fallback to old values if not provided)
    let updateData = {
      name: name ?? currentUser.name,
      userName: userName ?? currentUser.userName,
      email: email ?? currentUser.email,
      mobile: mobile ?? currentUser.mobile,
      password: currentUser.password, // default keep old
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // update user
    const updatedUser = await userModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return successResponse(res, updatedUser, "User updated successfully!");
  } catch (error) {
    console.error("Error updating user:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

export {
  Signup,
  Signin,
  UserList,
  UserView,
  userUpdate,
  userdelete,
  userUpdateProfile,
};
