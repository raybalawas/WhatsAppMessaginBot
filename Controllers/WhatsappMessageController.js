import puppeteer from "puppeteer";
import fs from "fs";
import csv from "csv-parser";
import messageModel from "../models/MessageModel.js";
import VerifiedNumber from "../models/verifiedNumber.js";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse CSV and extract numbers safely
 */
const parseCsv = (csvPath) =>
  new Promise((resolve, reject) => {
    const numbers = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        const val =
          row.phone ||
          row.phone_number ||
          row.mobile ||
          row.number ||
          row.mobile_number;

        if (val) {
          const clean = String(val).replace(/\D/g, ""); // only digits
          if (clean.length >= 10) {
            numbers.push(clean);
          }
        }
      })
      .on("end", () => resolve(numbers))
      .on("error", reject);
  });

/**
 * Just to test API is alive
 */
const MessageDone = async (req, res) => {
  console.log("working");
  return res.json({ Message: "working" });
};

/**
 * Random wait to mimic human behaviour
 */
const randomSleep = async (min = 15000, max = 25000) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`⏳ Waiting ${ms / 1000}s...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Ensure phone number has proper format (India default if 0-prefixed)
 */
const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) {
    return "91" + digits.slice(1);
  }
  return digits;
};

/**
 * Send WhatsApp Messages
 */
const MessageSend = async (req, res) => {
  try {
    const message = req.body?.message?.trim();
    const csvFilePath = req.files?.csvfile?.[0]?.path || null;
    const anyDesignFile = req.files?.design?.[0]?.path || null;

    if (!message || !csvFilePath) {
      return res
        .status(400)
        .json({ status: "error", message: "message & csvfile required." });
    }

    // Save in DB
    const saved = await messageModel.create({
      message,
      csvFilePath,
      anyDesignFile,
    });

    // Parse CSV
    const rawPhones = await parseCsv(csvFilePath);
    if (!rawPhones.length) {
      return res
        .status(400)
        .json({ status: "error", message: "No numbers in CSV." });
    }

    // Launch browser with saved session
    const browser = await puppeteer.launch({
      executablePath:
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      headless: false,
      userDataDir: "./whatsapp-session",
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    await page.goto("https://web.whatsapp.com");
    console.log("✅ Using saved session. Scan QR if first time.");
    await sleep(20000); // wait for QR / sync

    const processed = [];

    for (const rawPhone of rawPhones) {
      const phone = formatPhone(rawPhone);

      // Basic validation
      if (!/^\d{10,15}$/.test(phone)) {
        console.log(`⚠️ Skipping invalid number: ${rawPhone}`);
        processed.push({ phone: rawPhone, status: "invalid" });
        continue;
      }

      try {
        console.log(`🔍 Sending to ${phone}...`);

        // Open chat directly
        await page.goto(
          `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
            message
          )}`,
          { waitUntil: "domcontentloaded" }
        );

        // Wait for chat box
        const inputBox = await page.waitForSelector(
          'div[contenteditable="true"]',
          { visible: true, timeout: 30000 }
        );

        // Focus + send
        await inputBox.click();
        await page.keyboard.press("Enter");
        console.log(`✅ Message sent to ${phone}`);

        // If file attached
        if (anyDesignFile) {
          const attachBtn = await page.waitForSelector(
            'span[data-icon="clip"]',
            { timeout: 10000 }
          );
          await attachBtn.click();

          const fileInput = await page.waitForSelector('input[type="file"]', {
            timeout: 10000,
          });
          await fileInput.uploadFile(anyDesignFile);

          await sleep(3000); // wait for preview to load
          const sendFileBtn = await page.waitForSelector(
            'span[data-icon="send"]',
            { timeout: 10000 }
          );
          await sendFileBtn.click();

          console.log(`📎 File sent to ${phone}`);
        }

        processed.push({ phone, status: "sent" });
        await randomSleep();
      } catch (err) {
        console.log(`❌ Error for ${phone}: ${err.message}`);
        processed.push({ phone, status: "error" });
      }
    }

    // Save results to CSV
    fs.writeFileSync(
      "processed_numbers.csv",
      `phone,status\n${processed
        .map((p) => `${p.phone},${p.status}`)
        .join("\n")}`,
      "utf8"
    );

    return res.json({
      status: "success",
      message: "Processing complete",
      savedRecordId: saved._id,
      total: processed.length,
      sent: processed.filter((p) => p.status === "sent").length,
      invalid: processed.filter((p) => p.status === "invalid").length,
      failed: processed.filter((p) => p.status === "error").length,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ status: "error", message: "Server Error" });
  }
};

export { MessageDone, MessageSend };
