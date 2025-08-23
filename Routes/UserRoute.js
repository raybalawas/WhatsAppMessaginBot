import {
  Signup,
  Signin,
  UserList,
  UserView,
  userUpdate,
  userdelete,
  userUpdateProfile,
} from "../Controllers/UserController.js";

import e from "express";
import { checkAdmin, checkAuth, checkUser } from "../Middlewares/AuthMiddleware.js";

const router = e.Router();

router.post("/signup", Signup);
router.post("/login", Signin);
router.get("/list", checkAuth, checkAdmin, UserList);
router.get("/view/:id", checkAuth, checkAdmin, UserView);
router.put("/update/:id", checkAuth, checkAdmin, userUpdate);
router.delete("/delete/:id", checkAuth, checkAdmin, userdelete);
router.put("/user-profile-update", checkAuth, checkUser, userUpdateProfile);


export default router;
