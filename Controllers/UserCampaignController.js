import messageModel from "../models/MessageModel.js";
import cloudinary from "../utils/cloudinary.js"; // assuming you use cloudinary
import { errorResponse } from "../utils/response.js";
import fs from "fs/promises";

const userSubmitCampaign = async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user?.id;

    let csvUrl = null;
    let designUrl = null;

    if (req.files?.csvfile) {
      const csvPath = req.files.csvfile[0].path;
      const csvUpload = await cloudinary.uploader.upload(csvPath, {
        folder: "whatsapp_csv",
        resource_type: "raw",
      });
      csvUrl = csvUpload.secure_url;

      try {
        await fs.unlink(csvPath);
      } catch (err) {
        console.warn("⚠️ Failed to delete local CSV:", err.message);
      }
    }

    if (req.files?.design) {
      const designPath = req.files.design[0].path;
      const designUpload = await cloudinary.uploader.upload(designPath, {
        folder: "whatsapp_designs",
        resource_type: "auto",
      });
      designUrl = designUpload.secure_url;

      try {
        await fs.unlink(designPath);
      } catch (err) {
        console.warn("⚠️ Failed to delete local design:", err.message);
      }
    }

    // ✅ Save in DB using csvUrl and designUrl
    const campaign = await messageModel.create({
      userId,
      message,
      csvFilePath: csvUrl, // Correct variable here
      anyDesignFile: designUrl,
    });

    return res.status(201).json({
      success: true,
      message: "Campaign submitted successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Error submitting campaign:", error);
    return errorResponse(res, "Something went wrong", 500);
  }
};

const getAllCampaigns = async (req, res) => {
  try {
    const campaigns = await messageModel.find();
    return res.status(200).json({
      Message: "campaigns fetched successfully",
      data: campaigns,
    });
  } catch (error) {
    console.log(`Error while fetching all campaigns:`, error.message);
    alert(`Server Error`);
  }
};

const deleteAllCampaign = async (req, res) => {
  try {
    await messageModel.deleteMany({}); // Delete all campaigns

    return res.status(200).json({
      message: "All campaigns have been deleted successfully!",
    });
  } catch (error) {
    console.error("Error while deleting all campaigns:", error.message);
    return res.status(500).json({ message: "Server Error" });
  }
};

const getCampaignsByUserId = async (req, res) => {
  try {
    const userId = req.params.id;
    const camps = await messageModel
      .find({ userId })
      .populate("userId", "name email mobile")
      .sort({_id:-1});
    console.log(camps);
    if (!camps || camps.length === 0) {
      return res.status(400).json({
        Message: "User has not uploaded a single Campaign yet!",
        data: [],
      });
    }
    return res.status(200).json({
      Message: "Campaigns fetched successfully!",
      Data: camps,
    });
  } catch (error) {
    console.log(`Error while fetching campaigns by user id:${error.message}`);
    return res.status(500).json({
      Message: "Server error! try again.",
    });
  }
};

export {
  userSubmitCampaign,
  getAllCampaigns,
  deleteAllCampaign,
  getCampaignsByUserId,
};
