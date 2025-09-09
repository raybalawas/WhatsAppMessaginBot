import puppeteer from "puppeteer";
import fs from "fs";
import csv from "csv-parser";
import messageModel from "../models/MessageModel.js";
import cloudinary from "../utils/cloudinary.js";

let browserInstance = null;

async function getBrowser() {
  try {
    // 1. If browser instance exists & still connected → reuse
    if (browserInstance && browserInstance.isConnected()) {
      const pages = await browserInstance.pages();
      if (pages.length) {
        for (const p of pages) {
          const url = p.url();
          if (url.includes("web.whatsapp.com")) {
            console.log("🔄 Reusing existing WhatsApp page.");
            return browserInstance;
          }
        }
      }
      return browserInstance;
    }

    // 2. Otherwise → launch new browser
    browserInstance = await puppeteer.launch({
      // executablePath:
      //   "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      executablePath:
        "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
      headless: false,
      userDataDir: "./whatsapp-session", // keeps QR session alive
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    console.log("✅ Puppeteer launched (new instance).");
    return browserInstance;
  } catch (err) {
    console.log("❌ getBrowser error:", err.message);
    return null;
  }
}

async function getWhatsappPage(browser) {
  // Reuse WhatsApp tab if already open
  const pages = await browser.pages();
  for (const page of pages) {
    if (page.url().includes("web.whatsapp.com")) {
      return page;
    }
  }

  // Otherwise → open new WhatsApp tab
  const page = await browser.newPage();
  await page.goto("https://web.whatsapp.com");
  console.log("🌐 Opened WhatsApp Web (new tab).");
  await sleep(800);
  return page;
}

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

    let csvUrl = null;
    let designUrl = null;
    // ✅ Upload CSV to Cloudinary
    if (csvFilePath) {
      const uploadCsv = await cloudinary.uploader.upload(csvFilePath, {
        folder: "whatsapp_csv",
        resource_type: "raw",
      });
      csvUrl = uploadCsv.secure_url;
    }
    // ✅ Upload Design File (image/pdf/video)
    if (anyDesignFile) {
      const uploadDesign = await cloudinary.uploader.upload(anyDesignFile, {
        folder: "whatsapp_designs",
        resource_type: "auto", // auto detects image/video/pdf
      });
      designUrl = uploadDesign.secure_url;
    }
    // ✅ Save in DB (MongoDB Atlas)
    const saved = await messageModel.create({
      message,
      csvFilePath: csvUrl || "N/A", // now stores URL, not local path
      anyDesignFile: designUrl || "N/A",
    });

    // Parse CSV
    const rawPhones = await parseCsv(csvFilePath);
    if (!rawPhones.length) {
      return res
        .status(400)
        .json({ status: "error", message: "No numbers in CSV." });
    }

    // ✅ Get or reuse browser
    const browser = await getBrowser();
    if (!browser) {
      return res
        .status(500)
        .json({ status: "error", message: "Browser not available" });
    }

    const page = await getWhatsappPage(browser);
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
        const sendButton = await page.waitForSelector(
          'button[data-tab="11"][aria-label="Send"]',
          {
            timeout: 10000,
          }
        );
        if (!sendButton) {
          console.log(`❌ Send button not found for ${phone}`);
          throw new Error("Send button not found");
        }
        await page.click('button[data-tab="11"][aria-label="Send"]');
        // Wait for the last message bubble to appear (your message)
        await page.waitForSelector("div.message-out", { timeout: 10000 });
        // await page.keyboard.press("Enter");
        console.log(`✅ Confirmed: Message sent to ${phone}`);

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

    if (processed.length === rawPhones.length) {
      console.log("🎉 All done! now you can shut down or close the browser");
      await browser.close();
      browserInstance = null;
    }

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

const OTPSend = async (req, res) => {
  try {
    const { whatsappNumber, otp, message } = req.body;

    if (!whatsappNumber || !otp || !message) {
      return res.status(400).json({
        status: "error",
        message: "whatsappNumber, otp & message  required.",
      });
    }

    // Format number
    const fullNumber = /*formatPhone(whatsappNumber) ??*/ whatsappNumber;

    // Replace placeholder with OTP (if present in message)
    const finalMessage = message.includes("{otp}")
      ? message.replace("{otp}", otp)
      : `${message} ${otp}`;

    // ✅ Get or reuse browser
    const browser = await getBrowser();
    if (!browser) {
      return res
        .status(500)
        .json({ status: "error", message: "Browser not available" });
    }

    const page = await getWhatsappPage(browser);
    await page.goto("https://web.whatsapp.com");
    console.log("✅ Using saved session. Scan QR if first time.");
    await sleep(15000); // wait for sync if needed

    const processed = [];

    try {
      console.log(`🔍 Sending OTP to ${fullNumber}...`);

      // Open chat with prefilled text
      await page.goto(
        `https://web.whatsapp.com/send?phone=${fullNumber}&text=${encodeURIComponent(
          finalMessage
        )}`,
        { waitUntil: "domcontentloaded" }
      );

      // Wait for chat input
      const inputBox = await page.waitForSelector(
        'div[contenteditable="true"]',
        { visible: true, timeout: 30000 }
      );

      // Focus and send
      await inputBox.click();
      const sendButton = await page.waitForSelector(
        'button[data-tab="11"][aria-label="Send"]',
        {
          timeout: 10000,
        }
      );
      if (!sendButton) {
        console.log(`❌ Send button not found for ${fullNumber}`);
        throw new Error("Send button not found");
      }
      await page.click('button[data-tab="11"][aria-label="Send"]');

      // await page.keyboard.press("Enter");

      console.log(`✅ OTP sent to ${fullNumber}`);
      processed.push({ phone: fullNumber, status: "sent" });

      await randomSleep();
    } catch (err) {
      console.log(`❌ Error for ${fullNumber}: ${err.message}`);
      processed.push({ phone: fullNumber, status: "error" });
    }

    // Save results to CSV (append instead of overwrite)
    fs.appendFileSync(
      "processed_OTP_numbers.csv",
      processed.map((p) => `${p.phone},${p.status}\n`).join(""),
      "utf8"
    );

    return res.json({
      status: "success",
      message: "OTP send attempt finished",
      total: processed.length,
      sent: processed.filter((p) => p.status === "sent").length,
      failed: processed.filter((p) => p.status === "error").length,
    });
  } catch (error) {
    console.error("Error in OTPSend:", error);
    return res.status(500).json({ status: "error", message: "Server Error" });
  }
};

/**
 * Just to test API is alive
 */
const MessageDone = async (req, res) => {
  console.log("working");
  return res.json({ Message: "working" });
};

export { MessageDone, MessageSend, OTPSend };
