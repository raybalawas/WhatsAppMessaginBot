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
import {
  checkAdmin,
  checkAuth,
  checkUser,
} from "../Middlewares/AuthMiddleware.js";
import {
  userSubmitCampaign,
  getAllCampaigns,
  deleteAllCampaign,
  deleteCampaign,
  getCampaignsByUserId,
  getReportsForUser,
  getCampaignsForUser,
} from "../Controllers/UserCampaignController.js";
import multer from "multer";

const router = e.Router();
// const upload = multer({ dest: "uploads/" }); // temp folder
import upload from "../Middlewares/upload.js";

router.post("/signup", Signup);
router.post("/login", Signin);
router.get("/list", checkAuth, checkAdmin, UserList);
router.get("/view/:id", checkAuth, checkAdmin, UserView);
router.put("/update/:id", checkAuth, checkAdmin, userUpdate);
router.delete("/delete/:id", checkAuth, checkAdmin, userdelete);
router.put("/user-profile-update", checkAuth, checkUser, userUpdateProfile);
router.post(
  "/submit-campaign",
  checkAuth,
  checkUser,
  upload.fields([
    { name: "csvfile", maxCount: 1 },
    { name: "design", maxCount: 1 },
  ]),
  userSubmitCampaign
);
router.get("/get-campaigns", checkAuth, checkAdmin, getAllCampaigns);
router.delete(
  "/delete-all-campaigns",
  checkAuth,
  checkAdmin,
  deleteAllCampaign
);
router.delete("/delete-campaign/:id", checkAuth, checkAdmin, deleteCampaign);
router.get("/get-camp-by-user-id/:id", checkAuth, checkAdmin, getCampaignsByUserId);
router.get("/reports/:id", checkAuth, checkUser, getReportsForUser);
router.get("/camp-status/:id", checkAuth, checkUser, getCampaignsForUser);

export default router;
