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


/* ---------------- HTML Report Generator ---------------- */
const generateHtmlReport = (processed, message) => {
  const sent = processed.filter((p) => p.status === "sent").length;
  const invalid = processed.filter((p) => p.status === "invalid").length;
  const failed = processed.filter((p) => p.status === "error").length;

  const timestamp = new Date().toLocaleString();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>WhatsApp Campaign Summary</title>
    <style>
      body { font-family: Arial, sans-serif; background: #ece5dd; margin: 20px; padding: 0; }
      .container { max-width: 800px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; }
      h1 { color: #075e54; }
      .summary { margin-bottom: 20px; }
      .summary p { margin: 6px 0; }
      table { width: 100%; border-collapse: collapse; }
      th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; }
      th { background: #075e54; color: white; }
      tr:nth-child(even) { background: #f9f9f9; }
      .sent { color: green; font-weight: bold; }
      .failed { color: red; font-weight: bold; }
      .invalid { color: orange; font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>WhatsApp Campaign Summary</h1>
      <div class="summary">
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Date:</strong> ${timestamp}</p>
        <p><strong>Total Numbers:</strong> ${processed.length}</p>
        <p><strong>✅ Sent:</strong> ${sent}</p>
        <p><strong>❌ Failed:</strong> ${failed}</p>
        <p><strong>📵 Invalid:</strong> ${invalid}</p>
      </div>

      <table>
        <thead>
          <tr>
            <th>Phone Number</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${processed
      .map(
        (p) =>
          `<tr>
                  <td>${p.phone}</td>
                  <td class="${p.status}">${p.status}</td>
                </tr>`
      )
      .join("")}
        </tbody>
      </table>
    </div>
  </body>
  </html>`;
};

/* ---------------- PDF Report Generator ---------------- */
const generatePdfReport = async (processed, outputPath, message) => {
  const htmlContent = generateHtmlReport(processed, message);

  // Launch separate Chrome instance for PDF
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", // ✅ same as WhatsApp
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  await page.pdf({
    path: outputPath,
    format: "A4",
    printBackground: true,
  });

  await browser.close();
};

/* ---------------- Campaign Sender ---------------- */
// const MessageSend = async (req, res) => {
//   try {
//     const { userId, messageId, message, csvFileUrl, designFileUrl } = req.body;

//     if (!message && !designFileUrl) {
//       return res.status(400).json({
//         status: "error",
//         message: "Message or creative is required",
//       });
//     }

//     // Download files temporarily
//     const timestamp = Date.now();
//     const tempCsvPath = path.join("uploads", `temp-csv-${timestamp}.csv`);
//     const tempPdfPath = path.join("uploads", `report-${messageId}.pdf`);

//     await downloadFile(csvFileUrl, tempCsvPath);

//     let tempDesignPath = null;
//     if (designFileUrl) {
//       const ext = path.extname(new URL(designFileUrl).pathname) || ".png";
//       tempDesignPath = path.join("uploads", `temp-design-${timestamp}${ext}`);
//       await downloadFile(designFileUrl, tempDesignPath);
//     }

//     // Upload CSV & Design to Cloudinary
//     const uploadCsv = await cloudinary.uploader.upload(tempCsvPath, {
//       folder: "whatsapp_csv",
//       resource_type: "raw",
//     });

//     const uploadDesign = tempDesignPath
//       ? await cloudinary.uploader.upload(tempDesignPath, {
//         folder: "whatsapp_designs",
//         resource_type: "auto",
//       })
//       : null;

//     const csvUrl = uploadCsv.secure_url;
//     const designUrl = uploadDesign?.secure_url || null;

//     // Parse numbers
//     const rawPhones = await parseCsv(tempCsvPath);
//     if (!rawPhones.length) {
//       return res
//         .status(400)
//         .json({ status: "error", message: "No numbers in CSV." });
//     }

//     // Puppeteer flow
//     const browser = await getBrowser();
//     const page = await getWhatsappPage(browser);
//     await page.goto("https://web.whatsapp.com");
//     await sleep(20000);

//     const processed = [];
//     for (const rawPhone of rawPhones) {
//       const phone = formatPhone(rawPhone);

//       if (!/^\d{10,15}$/.test(phone)) {
//         processed.push({ phone: rawPhone, status: "invalid" });
//         continue;
//       }

//       try {
//         console.log(`📨 Sending to ${phone}...`);
//         await page.goto(
//           `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(
//             message
//           )}`,
//           { waitUntil: "domcontentloaded", timeout: 60000 }
//         );

//         // const inputBox = await page.waitForSelector(
//         //   'div[contenteditable="true"]',
//         //   { visible: true, timeout: 30000 }
//         // );
//         // await inputBox.click();
//         // await page.keyboard.press("Enter");
//         const inputBox = await page.$('div[contenteditable="true"]');
//         if (inputBox) {
//           await inputBox.focus();
//           await page.keyboard.press("Enter");
//           console.log(`✅ Message sent to ${phone} (via Enter key)`);
//         // Confirm text sent
//         await page.waitForSelector("div.message-out", { timeout: 10000 });
//         processed.push({ phone, status: "sent" });
//         await randomSleep();

//         if (tempDesignPath) {
//           try {
//             const attachBtn = await page.waitForSelector(
//               'span[data-icon="plus-rounded"]',
//               { timeout: 10000 }
//             );
//             await attachBtn.click();
//             await sleep(2000);

//             const fileInput = await page.$('input[type="file"]');
//             if (!fileInput) throw new Error("File input not found");
//             await fileInput.uploadFile(tempDesignPath);

//             await sleep(4000);

//             let sendFileBtn = await page.$('button[aria-label="Send"]');
//             if (!sendFileBtn) {
//               sendFileBtn = await page.$('span[data-icon="send"]');
//             }

//             if (sendFileBtn) {
//               await sendFileBtn.click();
//               console.log(`✅ Creative sent to ${phone}`);
//             } else {
//               console.log("⚠️ Send button not found, trying Enter key...");
//               const captionBox = await page.$('div[contenteditable="true"]');
//               if (captionBox) {
//                 await captionBox.focus();
//                 await page.keyboard.press("Enter");
//                 console.log(`✅ Creative sent to ${phone} (via Enter key)`);
//               } else {
//                 throw new Error("Send button and Enter key both failed");
//               }
//             }
//           } catch (fileErr) {
//             console.error(`❌ Failed to send creative to ${phone}:`, fileErr.message);
//             processed.push({ phone, status: "file_error" });
//           }
//           await randomSleep();
//         }

//       } catch (err) {
//         console.error(`❌ Error for ${phone}: ${err.message}`);
//         processed.push({ phone, status: "error" });
//       }
//     }

//     // Generate PDF report with HTML template
//     await generatePdfReport(processed, tempPdfPath, message);

//     const uploadReport = await cloudinary.uploader.upload(tempPdfPath, {
//       folder: "whatsapp_reports",
//       resource_type: "raw",
//       format: "pdf",
//       public_id: `report-${messageId}`
//     });
//     // console.log("Report uploaded && the url is:", uploadReport.secure_url);
//     // const reportUrl = uploadReport.secure_url;
//     // const reportUrl = `${uploadReport.secure_url}?fl_attachment`;
//     // force download with filename
//     const fileName = `report-${messageId}.pdf`;
//     const downloadUrl = `${uploadReport.secure_url}?fl_attachment=${fileName}`;
//     // const reportUrl = cloudinary.url(uploadReport.public_id, {
//     //   resource_type: "raw",
//     //   format: "pdf",
//     //   attachment: true,               // 👈 Force download
//     //   filename_override: `report-${messageId}.pdf`
//     // });

//     // const reportUrl = cloudinary.url(uploadReport.secure_url, {
//     //   resource_type: "raw",
//     //   format: "pdf",
//     //   flags: fileName,  // 👈 forces download + custom filename
//     // });

//     // Save status
//     const statusDocs = await statusModel.create({
//       userId,
//       messageId: messageId,
//       message,
//       generatedFile: downloadUrl,
//     });
//     // console.log("Download URL                 :", downloadUrl);
//     // Update Message Table
//     console.log(`📌 Updating Message record with ID: ${downloadUrl}`);
//     console.log("status ki id jo messagemodel me store hogi:", statusDocs._id);
//     if (messageId) {
//       await messageModel.findByIdAndUpdate(
//         messageId,
//         {
//           statusId: statusDocs._id,
//           status: "completed",
//           numbersCount: processed.length,
//           sentCount: processed.filter((p) => p.status === "sent").length,
//         },
//         { new: true }
//       );
//     }
//     if(!messageId) console.log("⚠️ No messageId provided to update record.");
//     console.log("✅ Message record updated.");
//     // Cleanup
//     if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
//     if (tempDesignPath && fs.existsSync(tempDesignPath))
//       fs.unlinkSync(tempDesignPath);
//     if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);

//     console.log("🎉 Campaign finished.");
//     return res.json({
//       status: "success",
//       total: processed.length,
//       sent: processed.filter((p) => p.status === "sent").length,
//       invalid: processed.filter((p) => p.status === "invalid").length,
//       failed: processed.filter((p) => p.status === "error").length,
//       report: downloadUrl,
//     });
//   } catch (err) {
//     console.error("❌ Error in MessageSend:", err);
//     return res.status(500).json({ status: "error", message: "Server error" });
//   }
// };

const MessageSend = async (req, res) => {
  try {
    const { userId, messageId, message, csvFileUrl, designFileUrl } = req.body;

    if (!message && !designFileUrl) {
      return res.status(400).json({
        status: "error",
        message: "Message or creative is required",
      });
    }

    // Temporary file paths
    const timestamp = Date.now();
    const tempCsvPath = path.join("uploads", `temp-csv-${timestamp}.csv`);
    const tempPdfPath = path.join("uploads", `report-${messageId}.pdf`);

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
      })
      : null;

    const csvUrl = uploadCsv.secure_url;
    const designUrl = uploadDesign?.secure_url || null;

    // Parse numbers
    const rawPhones = await parseCsv(tempCsvPath);
    if (!rawPhones.length) {
      return res.status(400).json({
        status: "error",
        message: "No numbers in CSV.",
      });
    }

    // Puppeteer setup
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
          `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`,
          { waitUntil: "domcontentloaded", timeout: 60000 }
        );

        const inputBox = await page.$('div[contenteditable="true"]');
        if (inputBox) {
          await inputBox.focus();
          await page.keyboard.press("Enter");
          console.log(`✅ Message sent to ${phone}`);
          await page.waitForSelector("div.message-out", { timeout: 10000 });
          processed.push({ phone, status: "sent" });
        } else {
          processed.push({ phone, status: "failed" });
          continue;
        }

        await randomSleep();

        // If creative file exists
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

            let sendFileBtn = await page.$('button[aria-label="Send"]');
            if (!sendFileBtn) {
              sendFileBtn = await page.$('span[data-icon="send"]');
            }

            if (sendFileBtn) {
              await sendFileBtn.click();
              console.log(`✅ Creative sent to ${phone}`);
            } else {
              console.log("⚠️ Send button not found, fallback to Enter");
              const captionBox = await page.$('div[contenteditable="true"]');
              if (captionBox) {
                await captionBox.focus();
                await page.keyboard.press("Enter");
              } else {
                throw new Error("Send button and Enter both failed");
              }
            }
          } catch (fileErr) {
            console.error(`❌ Failed to send creative to ${phone}:`, fileErr.message);
            processed.push({ phone, status: "file_error" });
          }
          await randomSleep();
        }
      } catch (err) {
        console.error(`❌ Error for ${phone}: ${err.message}`);
        processed.push({ phone, status: "error" });
      }
    } // ✅ this closes the for loop properly

    // Generate report PDF
    try {
      await generatePdfReport(processed, tempPdfPath, message);
    } catch (err) {
      console.error("⚠️ PDF generation failed, skipping:", err.message);
    }


    const uploadReport = await cloudinary.uploader.upload(tempPdfPath, {
      folder: "whatsapp_reports",
      resource_type: "raw",
      format: "pdf",
      public_id: `report-${messageId}`,
    });

    const fileName = `report-${messageId}.pdf`;
    const downloadUrl = `${uploadReport.secure_url}?fl_attachment=${fileName}`;

    // Save status in DB
    const statusDocs = await statusModel.create({
      userId,
      messageId,
      message,
      generatedFile: downloadUrl,
    });

    if (messageId) {
      await messageModel.findByIdAndUpdate(
        messageId,
        {
          statusId: statusDocs._id,
          status: "completed",
          numbersCount: processed.length,
          sentCount: processed.filter((p) => p.status === "sent").length,
        },
        { new: true }
      );
    }

    // Cleanup temp files
    if (fs.existsSync(tempCsvPath)) fs.unlinkSync(tempCsvPath);
    if (tempDesignPath && fs.existsSync(tempDesignPath)) fs.unlinkSync(tempDesignPath);
    if (fs.existsSync(tempPdfPath)) fs.unlinkSync(tempPdfPath);

    console.log("🎉 Campaign finished.");
    return res.json({
      status: "success",
      total: processed.length,
      sent: processed.filter((p) => p.status === "sent").length,
      invalid: processed.filter((p) => p.status === "invalid").length,
      failed: processed.filter((p) => p.status === "error").length,
      report: downloadUrl,
    });
  } catch (err) {
    console.error("❌ Error in MessageSend:", err);
    return res.status(500).json({
      status: "error",
      message: "Server error",
    });
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
