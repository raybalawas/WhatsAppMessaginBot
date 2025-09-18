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

/* Download file*/
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
        'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
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

/* ---------- Message Sender ---------- */
// const MessageSend = async (req, res) => {
//   try {
//     const message = req.body?.message?.trim();
//     const csvFilePath = req.files?.csvfile?.[0]?.path || null;
//     const anyDesignFile = req.files?.design?.[0]?.path || null;

//     if (!message && !anyDesignFile) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "Message or creative is required" });
//     }

//     // Upload files to Cloudinary
//     let csvUrl = null;
//     let designUrl = null;

//     if (csvFilePath) {
//       const uploadCsv = await cloudinary.uploader.upload(csvFilePath, {
//         folder: "whatsapp_csv",
//         resource_type: "raw",
//       });
//       csvUrl = uploadCsv.secure_url;
//     }
//     if (anyDesignFile) {
//       const uploadDesign = await cloudinary.uploader.upload(anyDesignFile, {
//         folder: "whatsapp_designs",
//         resource_type: "auto",
//       });
//       designUrl = uploadDesign.secure_url;
//     }

//     // Save campaign in DB
//     // const saved = await messageModel.create({
//     //   message,
//     //   csvFilePath: csvUrl || "N/A",
//     //   anyDesignFile: designUrl || "N/A",
//     // });

//     // Parse numbers
//     const rawPhones = await parseCsv(csvFilePath);
//     if (!rawPhones.length) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "No numbers in CSV." });
//     }

//     // Browser
//     const browser = await getBrowser();
//     if (!browser)
//       return res
//         .status(500)
//         .json({ status: "error", message: "Browser not available" });

//     const page = await getWhatsappPage(browser);
//     await page.goto("https://web.whatsapp.com");
//     console.log("✅ Using saved session. Scan QR if first time.");
//     await sleep(20000); // Wait for QR if needed

//     const processed = [];

//     for (const rawPhone of rawPhones) {
//       const phone = formatPhone(rawPhone);

//       if (!/^\d{10,15}$/.test(phone)) {
//         console.log(`⚠️ Invalid number: ${rawPhone}`);
//         processed.push({ phone: rawPhone, status: "invalid" });
//         continue;
//       }

//       try {
//         console.log(`🔍 Sending to ${phone}...`);
//         await page.goto(
//           `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
//             message
//           )}`,
//           { waitUntil: "domcontentloaded", timeout: 60000 }
//         );

//         // Wait for chat input
//         const inputBox = await page.waitForSelector(
//           'div[contenteditable="true"]',
//           {
//             visible: true,
//             timeout: 30000,
//           }
//         );

//         // Ensure message is typed
//         await inputBox.click();

//         // Retry send button logic
//         let sent = false;

//         for (let attempt = 1; attempt <= 3; attempt++) {
//           try {
//             console.log(`🚀 Attempt ${attempt} to send message to ${phone}...`);

//             // 1️⃣ Try modern send icon
//             try {
//               const sendIcon = await page.waitForSelector(
//                 'span[data-icon="send"]',
//                 {
//                   timeout: 5000,
//                 }
//               );
//               await sendIcon.click();
//               console.log("✅ Clicked send icon");
//             } catch {
//               console.log("⚠️ Send icon not found, trying fallback...");

//               // 2️⃣ Try button with aria-label
//               try {
//                 const sendButton = await page.waitForSelector(
//                   'button[data-tab="11"][aria-label="Send"]',
//                   { timeout: 5000 }
//                 );
//                 await sendButton.click();
//                 console.log("✅ Clicked send button (aria-label)");
//               } catch {
//                 console.log("⚠️ Send button not found, pressing Enter...");

//                 // 3️⃣ Final fallback → press Enter
//                 await page.keyboard.press("Enter");
//                 console.log("✅ Pressed Enter key");
//               }
//             }

//             // ✅ Confirm message actually appeared in chat
//             await page.waitForSelector("div.message-out", { timeout: 10000 });
//             console.log(`📩 Message confirmed sent to ${phone}`);
//             sent = true;
//             break;
//           } catch (err) {
//             console.log(
//               `❌ Attempt ${attempt} failed for ${phone}: ${err.message}`
//             );
//             await sleep(2000); // wait before retry
//           }
//         }

//         if (!sent) {
//           console.log(`🚨 Failed to send message to ${phone} after 3 retries`);
//           processed.push({ phone, status: "error" });
//         } else {
//           processed.push({ phone, status: "sent" });
//         }

//         if (!sent) throw new Error("Send button failed");

//         // If file
//         if (anyDesignFile) {
//           const attachBtn = await page.waitForSelector(
//             'span[data-icon="clip"]',
//             { timeout: 10000 }
//           );
//           await attachBtn.click();

//           const fileInput = await page.waitForSelector('input[type="file"]', {
//             timeout: 10000,
//           });
//           await fileInput.uploadFile(anyDesignFile);

//           await sleep(4000);
//           const sendFileBtn = await page.waitForSelector(
//             'span[data-icon="send"]',
//             { timeout: 10000 }
//           );
//           await sendFileBtn.click();

//           console.log(`📎 File sent to ${phone}`);
//         }

//         processed.push({ phone, status: "sent" });
//         await randomSleep();
//       } catch (err) {
//         console.log(`❌ Error for ${phone}: ${err.message}`);
//         processed.push({ phone, status: "error" });
//       }
//     }

//     // Save results to CSV After processing all numbers, instead of writing a raw CSV, dynamically generate an HTML file
//     // fs.writeFileSync(
//     //   "processed_numbers.csv",
//     //   `phone,status\n${processed
//     //     .map((p) => `${p.phone},${p.status}`)
//     //     .join("\n")}`,
//     //   "utf8"
//     // );

//     const generateHtmlReport = ({ message, processed, timestamp }) => {
//       const sentCount = processed.filter((p) => p.status === "sent").length;
//       const failedCount = processed.filter((p) => p.status === "error").length;
//       const invalidCount = processed.filter(
//         (p) => p.status === "invalid"
//       ).length;

//       return `
//     <!DOCTYPE html>
//     <html lang="en">
//     <head>
//       <meta charset="UTF-8" />
//       <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
//       <title>WhatsApp Campaign Summary</title>
//       <style>
//         body { font-family: Arial, sans-serif; background: #ece5dd; margin: 20px; padding: 0; }
//         .container { max-width: 800px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
//         h1 { color: #075e54; }
//         .summary { margin-bottom: 20px; }
//         table { width: 100%; border-collapse: collapse; }
//         th, td { padding: 10px; border-bottom: 1px solid #ddd; }
//         th { background: #075e54; color: white; }
//       </style>
//     </head>
//     <body>
//       <div class="container">
//         <h1>WhatsApp Campaign Summary</h1>
//         <div class="summary">
//           <p><strong>Message:</strong> ${message}</p>
//           <p><strong>Date:</strong> ${timestamp}</p>
//           <p><strong>Total Numbers:</strong> ${processed.length}</p>
//           <p><strong>Sent:</strong> ${sentCount}</p>
//           <p><strong>Failed:</strong> ${failedCount}</p>
//           <p><strong>Invalid:</strong> ${invalidCount}</p>
//         </div>

//         <table>
//           <thead>
//             <tr>
//               <th>Phone Number</th>
//               <th>Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             ${processed
//           .map((p) => `<tr><td>${p.phone}</td><td>${p.status}</td></tr>`)
//           .join("")}
//           </tbody>
//         </table>
//       </div>
//     </body>
//     </html>
//   `;
//     };

//     const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
//     const reportFilename = `whatsapp-report-${timestamp}.html`;
//     const reportPath = path.join("uploads", reportFilename);

//     fs.writeFileSync(
//       reportPath,
//       generateHtmlReport({ message, processed, timestamp }),
//       "utf8"
//     );

//     const uploadReport = await cloudinary.uploader.upload(reportPath, {
//       folder: "whatsapp_reports",
//       resource_type: "auto",
//     });

//     const reportUrl = uploadReport.secure_url;
//     const userId = req.params?.id;
//     console.log(`users id from parameters: ${userId}`);
//     await statusModel.create({
//       userId,
//       message,
//       generatedFile: reportUrl,
//     });

//     fs.unlinkSync(reportPath);
//     console.log("🎉 Campaign finished. Browser left open for next use.");

//     return res.json({
//       status: "success",
//       message: "Processing complete",
//       // savedRecordId: saved._id,
//       total: processed.length,
//       sent: processed.filter((p) => p.status === "sent").length,
//       invalid: processed.filter((p) => p.status === "invalid").length,
//       failed: processed.filter((p) => p.status === "error").length,
//     });
//   } catch (error) {
//     console.error("❌ Error in MessageSend:", error);
//     return res.status(500).json({ status: "error", message: "Server Error" });
//   }
// };

/* Generate PDF Report */
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
    doc.fontSize(12).text(`${i + 1}. ${item.phone} - ${statusIcon} ${item.status}`);
  });

  doc.end();
};

const MessageSend = async (req, res) => {
  try {
    const { userId, message, csvFileUrl, designFileUrl } = req.body;

    if (!message && !designFileUrl) {
      return res.status(400).json({
        status: "error",
        message: "Message or creative is required",
      });
    }

    // Download files temporarily
    const timestamp = Date.now();
    const tempCsvPath = path.join(
      "uploads",
      `temp-csv-${timestamp}.csv`
    );
    const tempDesignPath = path.join(
      "uploads",
      `temp-design-${timestamp}`
    );
    const tempPdfPath = path.join(
      "uploads",
      `report-${timestamp}.pdf`
    );

    await downloadFile(csvFileUrl, tempCsvPath);

    if (designFileUrl) {
      await downloadFile(designFileUrl, tempDesignPath);
    }

    // Upload to Cloudinary
    const uploadCsv = await cloudinary.uploader.upload(tempCsvPath, {
      folder: "whatsapp_csv",
      resource_type: "raw",
    });

    const uploadDesign = designFileUrl
      ? await cloudinary.uploader.upload(tempDesignPath, {
        folder: "whatsapp_designs",
        resource_type: "auto",
      })
      : null;

    const csvUrl = uploadCsv.secure_url;
    const designUrl = uploadDesign?.secure_url || null;

    // Parse numbers
    const rawPhones = await parseCsv(tempCsvPath);
    if (!rawPhones.length) {
      return res
        .status(400)
        .json({ status: "error", message: "No numbers in CSV." });
    }

    // Puppeteer flow (same as before)
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

        await page.waitForSelector("div.message-out", { timeout: 10000 });
        processed.push({ phone, status: "sent" });

        if (designFileUrl) {
          const attachBtn = await page.waitForSelector(
            'span[data-icon="clip"]',
            { timeout: 10000 }
          );
          await attachBtn.click();

          const fileInput = await page.waitForSelector(
            'input[type="file"]',
            { timeout: 10000 }
          );

          await fileInput.uploadFile(tempDesignPath);
          await sleep(4000);

          const sendFileBtn = await page.waitForSelector(
            'span[data-icon="send"]',
            { timeout: 10000 }
          );
          await sendFileBtn.click();
        }

        await randomSleep();
      } catch (err) {
        processed.push({ phone, status: "error" });
      }
    }

    // Clean up temp files
    fs.unlinkSync(tempCsvPath);
    if (designFileUrl) fs.unlinkSync(tempDesignPath);
    // Generate PDF report
    generatePdfReport(processed, tempPdfPath, message);

    // Upload report to Cloudinary
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
    // status update in messageModel
    const AuthUserId = req.params?.id;
    console.log(`users id from parameters: ${userId}`);
    // const updateStatus = await messageModel.findByIdAndUpdate(AuthUserId, {
    //   status: "completed",
    // });
    // if (!updateStatus) {
    //   console.log("❌ Failed to update message status");
    //   try {
    //     return res
    //       .status(500)
    //       .json({ status: "error", message: "Failed to update message status" });
    //   } catch (error) {
    //     console.error("❌ Error sending failure response:", error.message);
    //     return;
    //   }
    // }
    // Cleanup temp files
    fs.unlinkSync(tempCsvPath);
    if (designFileUrl) fs.unlinkSync(tempDesignPath);
    fs.unlinkSync(tempPdfPath);
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
    return res
      .status(500)
      .json({ status: "error", message: "Server error" });
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
