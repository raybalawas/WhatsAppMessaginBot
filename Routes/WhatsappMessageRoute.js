import e from "express";
import multer from "multer";
import puppeteer from "puppeteer";
import fs from "fs";
import csv from "csv-parser";

import {
  MessageDone,
  // MessageSend,
  OTPSend,
} from "../Controllers/WhatsappMessageController.js";

const router = e.Router();

// Configure Multer storage (files go in ./uploads folder)
// const upload = multer({ dest: "uploads/" });

// router.post(
//   "/whatsapp-message-send",
//   upload.fields([
//     { name: "csvfile", maxCount: 1 },
//     { name: "design", maxCount: 1 },
//   ]),
//   MessageSend
// );

router.post("/whatsapp-otp-verify", OTPSend);
router.get("/whatsapp-messages-done-list", MessageDone);

export default router;
