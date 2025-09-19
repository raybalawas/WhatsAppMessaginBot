import puppeteer from "puppeteer";
import fs from "fs";
import csv from "csv-parser";
import messageModel from "../models/MessageModel.js";
import cloudinary from "../utils/cloudinary.js";
import path from "path";
import statusModel from "../models/StatusModel.js";
import axios from "axios";
import PDFDocument from "pdfkit";

let browserInstance = null;

/* Download file */
const downloadFile = async (fileUrl, outputLocationPath) => {
  const writer = fs.createWriteStream(outputLocationPath);
  const response = await axios({
    url: fileUrl,
    method: "GET",
    responseType: "stream",
  });

  response.data.pipe(writer);

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
};

/* ---------- Browser Handling ---------- */
async function getBrowser() {
  try {
    if (browserInstance && browserInstance.isConnected()) {
      const pages = await browserInstance.pages();
      for (const p of pages) {
        if (p.url().includes("web.whatsapp.com")) {
          console.log("🔄 Reusing existing WhatsApp page.");
          return browserInstance;
        }
      }
      return browserInstance;
    }

    browserInstance = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ["--start-maximized"],
      executablePath:
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
      userDataDir: "./whatsapp-session800", // Keeps QR session alive
    });

    console.log("✅ Puppeteer launched (new instance).");
    return browserInstance;
  } catch (err) {
    console.log("❌ getBrowser error:", err.message);
    return null;
  }
}

async function getWhatsappPage(browser) {
  const pages = await browser.pages();
  for (const page of pages) {
    if (page.url().includes("web.whatsapp.com")) return page;
  }

  const page = await browser.newPage();
  await page.goto("https://web.whatsapp.com");
  console.log("🌐 Opened WhatsApp Web (new tab).");
  await sleep(8000);
  return page;
}

/* ---------- Helpers ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const randomSleep = async (min = 12000, max = 20000) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`⏳ Waiting ${ms / 1000}s...`);
  return sleep(ms);
};

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
          const clean = String(val).replace(/\D/g, "");
          if (clean.length >= 10) numbers.push(clean);
        }
      })
      .on("end", () => resolve(numbers))
      .on("error", reject);
  });

const formatPhone = (phone) => {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) return "91" + digits.slice(1); // India default
  return digits;
};

/* ---------- PDF Report Generator ---------- */
const generatePdfReport = (processed, outputPath, message) => {
  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(fs.createWriteStream(outputPath));

  // Title
  doc.fontSize(22).text("📊 WhatsApp Campaign Report", { align: "center" });
  doc.moveDown();

  // Campaign details
  doc.fontSize(14).text(`Message: ${message}`);
  doc.text(`Date: ${new Date().toLocaleString()}`);
  doc.moveDown();

  // Summary
  const sent = processed.filter((p) => p.status === "sent").length;
  const invalid = processed.filter((p) => p.status === "invalid").length;
  const failed = processed.filter((p) => p.status === "error").length;

  doc.fontSize(12).text(`Total: ${processed.length}`);
  doc.text(`✅ Sent: ${sent}`);
  doc.text(`❌ Failed: ${failed}`);
  doc.text(`📵 Invalid: ${invalid}`);
  doc.moveDown();

  // Table Header
  doc.fontSize(14).text("Details:", { underline: true });
  doc.moveDown(0.5);

  // Table Rows
  processed.forEach((item, i) => {
    let statusIcon =
      item.status === "sent"
        ? "✅"
        : item.status === "invalid"
          ? "📵"
          : "❌";
    doc
      .fontSize(12)
      .text(`${i + 1}. ${item.phone} - ${statusIcon} ${item.status}`);
  });

  doc.end();
};

/* ---------- Campaign Sender ---------- */
const MessageSend = async (req, res) => {
  try {
    const { userId, messageId, message, csvFileUrl, designFileUrl } = req.body;

    if (!message && !designFileUrl) {
      return res.status(400).json({
        status: "error",
        message: "Message or creative is required",
      });
    }

    // Download files temporarily
    const timestamp = Date.now();
    const tempCsvPath = path.join("uploads", `temp-csv-${timestamp}.csv`);
    const tempPdfPath = path.join("uploads", `report-${timestamp}.pdf`);

    await downloadFile(csvFileUrl, tempCsvPath);

    let tempDesignPath = null;
    if (designFileUrl) {
      const ext = path.extname(new URL(designFileUrl).pathname) || ".png";
      tempDesignPath = path.join("uploads", `temp-design-${timestamp}${ext}`);
      await downloadFile(designFileUrl, tempDesignPath);
    }

    // Upload CSV & Design to Cloudinary
    const uploadCsv = await cloudinary.uploader.upload(tempCsvPath, {
      folder: "whatsapp_csv",
      resource_type: "raw",
    });

    const uploadDesign = tempDesignPath
      ? await cloudinary.uploader.upload(tempDesignPath, {
        folder: "whatsapp_designs",
        resource_type: "auto",
      }) : null;

    const csvUrl = uploadCsv.secure_url;
    const designUrl = uploadDesign?.secure_url || null;

    // Parse numbers
    const rawPhones = await parseCsv(tempCsvPath);
    if (!rawPhones.length) {
      return res
        .status(400)
        .json({ status: "error", message: "No numbers in CSV." });
    }

    // Puppeteer flow
    const browser = await getBrowser();
    const page = await getWhatsappPage(browser);
    await page.goto("https://web.whatsapp.com");
    await sleep(20000);

    const processed = [];
    for (const rawPhone of rawPhones) {
      const phone = formatPhone(rawPhone);

      if (!/^\d{10,15}$/.test(phone)) {
        processed.push({ phone: rawPhone, status: "invalid" });
        continue;
      }

      try {
        console.log(`📨 Sending to ${phone}...`);
        await page.goto(
          `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
            message
          )}`,
          { waitUntil: "domcontentloaded", timeout: 60000 }
        );

        const inputBox = await page.waitForSelector(
          'div[contenteditable="true"]',
          { visible: true, timeout: 30000 }
        );
        await inputBox.click();
        await page.keyboard.press("Enter");

        // Confirm text sent
        await page.waitForSelector("div.message-out", { timeout: 10000 });
        processed.push({ phone, status: "sent" });
        randomSleep();
        console.log(`sending message awaiting for seconds ${randomSleep()}`);


        if (tempDesignPath) {
          try {
            const attachBtn = await page.waitForSelector(
              'span[data-icon="plus-rounded"]',
              { timeout: 10000 }
            );
            await attachBtn.click();
            await sleep(2000);

            const fileInput = await page.$('input[type="file"]');
            if (!fileInput) throw new Error("File input not found");
            await fileInput.uploadFile(tempDesignPath);

            await sleep(4000);

            // Try Send button
            let sendFileBtn = await page.$('button[aria-label="Send"]');
            if (!sendFileBtn) {
              sendFileBtn = await page.$('span[data-icon="send"]');
            }

            if (sendFileBtn) {
              await sendFileBtn.click();
              console.log(`✅ Creative sent to ${phone}`);
            } else {
              console.log("⚠️ Send button not found, trying Enter key...");
              const captionBox = await page.$('div[contenteditable="true"]');
              if (captionBox) {
                await captionBox.focus();
                await page.keyboard.press("Enter");
                console.log(`✅ Creative sent to ${phone} (via Enter key)`);
              } else {
                throw new Error("Send button and Enter key both failed");
              }
            }
          } catch (fileErr) {
            console.error(`❌ Failed to send creative to ${phone}:`, fileErr.message);
            processed.push({ phone, status: "file_error" });
          }
        }

        await randomSleep();
      } catch (err) {
        console.error(`❌ Error for ${phone}: ${err.message}`);
        processed.push({ phone, status: "error" });
      }
    }
    // Generate PDF report
    generatePdfReport(processed, tempPdfPath, message);

    const uploadReport = await cloudinary.uploader.upload(tempPdfPath, {
      folder: "whatsapp_reports",
      resource_type: "raw",
    });
    const reportUrl = uploadReport.secure_url;

    // Save status
    await statusModel.create({
      userId,
      message,
      generatedFile: reportUrl,
    });

    // ⚡ Ensure Message Table Update
    console.log(messageId);
    console.log("⚡ Updating Message status in DB...");
    if (!messageId) {
      console.warn("⚠️ No Message ID provided in params, skipping update.");
    }
    console.log(`📌 Updating Message record with ID: ${messageId}`);

    const updateStatus = await messageModel.findByIdAndUpdate(
      messageId,
      {
        status: "completed",
        numbersCount: processed.length,
        sentCount: processed.filter((p) => p.status === "sent").length,
      },
      { new: true }
    );

    if (!updateStatus) {
      console.error("❌ Failed to update Message status in DB");
    } else {
      console.log("✅ Message record updated:", updateStatus._id);
    }

    // Cleanup
    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    if (tempDesignPath && fs.existsSync(tempDesignPath))
      fs.unlinkSync(tempDesignPath);
    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);

    console.log("🎉 Campaign finished. Browser left open for next use.");
    return res.json({
      status: "success",
      total: processed.length,
      sent: processed.filter((p) => p.status === "sent").length,
      invalid: processed.filter((p) => p.status === "invalid").length,
      failed: processed.filter((p) => p.status === "error").length,
    });
  } catch (err) {
    console.error("❌ Error in MessageSend:", err);
    return res.status(500).json({ status: "error", message: "Server error" });
  }
};

/* ---------- OTP Sender ---------- */
const OTPSend = async (req, res) => {
  try {
    const { whatsappNumber, otp, message } = req.body;

    if (!whatsappNumber || !otp || !message) {
      return res.status(400).json({
        status: "error",
        message: "whatsappNumber, otp & message required.",
      });
    }

    const fullNumber = whatsappNumber;
    const finalMessage = message.includes("{otp}")
      ? message.replace("{otp}", otp)
      : `${message} ${otp}`;

    const browser = await getBrowser();
    if (!browser) {
      return res
        .status(500)
        .json({ status: "error", message: "Browser not available" });
    }

    const page = await getWhatsappPage(browser);
    await page.goto("https://web.whatsapp.com");
    await sleep(15000);

    const processed = [];

    try {
      console.log(`🔍 Sending OTP to ${fullNumber}...`);
      await page.goto(
        `https://web.whatsapp.com/send?phone=${fullNumber}&text=${encodeURIComponent(
          finalMessage
        )}`,
        { waitUntil: "domcontentloaded" }
      );

      const inputBox = await page.waitForSelector(
        'div[contenteditable="true"]',
        { visible: true, timeout: 30000 }
      );

      await inputBox.click();
      const sendButton = await page.waitForSelector(
        'button[aria-label="Send"]',
        { timeout: 10000 }
      );
      if (!sendButton) throw new Error("Send button not found");
      await sendButton.click();

      console.log(`✅ OTP sent to ${fullNumber}`);
      processed.push({ phone: fullNumber, status: "sent" });

      await randomSleep();
    } catch (err) {
      console.log(`❌ Error for ${fullNumber}: ${err.message}`);
      processed.push({ phone: fullNumber, status: "error" });
    }

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

/* ---------- Test API ---------- */
const MessageDone = async (req, res) => {
  console.log("working");
  return res.json({ Message: "working" });
};

export { MessageDone, MessageSend, OTPSend };
