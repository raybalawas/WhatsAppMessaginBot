import puppeteer from "puppeteer";
import fs from "fs";
import csv from "csv-parser";
import messageModel from "../models/MessageModel.js";
import VerifiedNumber from "../models/verifiedNumber.js";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

        console.log("Parsed number:", val);

        if (val && /^\d+$/.test(val)) {
          // only digits
          numbers.push(String(val).trim());
        }
      })
      .on("end", () => resolve(numbers))
      .on("error", reject);
  });

const MessageDone = async (req, res) => {
  console.log("working");
  return res.json({ Message: "working" });
};
/*
// const MessageSend = async (req, res) => {
//   try {
//     const message = req.body?.message?.trim();
//     const csvFilePath = req.files?.csvfile?.[0]?.path || null;
//     const anyDesignFile = req.files?.design?.[0]?.path || null;

//     if (!message || !csvFilePath) {
//       return res.status(400).json({
//         status: "error",
//         message: "message & csvfile are required (multipart/form-data).",
//       });
//     }

//     // Save request to DB
//     const saved = await messageModel.create({
//       message,
//       csvFilePath,
//       anyDesignFile,
//     });

//     const phoneNumbers = await parseCsv(csvFilePath);
//     if (!phoneNumbers.length) {
//       return res.status(400).json({
//         status: "error",
//         message: "No numbers found in CSV file.",
//       });
//     }

//     // 👇 Use installed Chrome instead of Puppeteer Chromium
//     const browser = await puppeteer.launch({
//       headless: false,
//       executablePath:
//         "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", // adjust to your OS
//       userDataDir: "./whatsapp-session",
//       defaultViewport: null,
//       args: ["--start-maximized"],
//     });

//     const page = await browser.newPage();
//     await page.goto("https://web.whatsapp.com");
//     console.log("✅ Using saved session. If first time, scan QR.");
//     await sleep(20000); // wait for QR scan if needed

//     const processed = [];
//     console.log(`🚀 Starting to process ${phoneNumbers.length} numbers...`);
//     console.log(
//       `phone of first 5: ${phoneNumbers
//         .slice(0, phoneNumbers.length >= 5 ? 5 : phoneNumbers.length)
//         .join(", ")}`
//     );
//     for (const phone of phoneNumbers) {
//       try {
//         console.log(`📨 Trying to send message to ${phone}...`);
//         const formattedPhone = phone.replace(/[^0-9]/g, "");

//         // STEP 1: Search
//         let chatOpened = false;
//         try {
//           const searchBox = await page.waitForSelector(
//             'div[role="textbox"][contenteditable="true"]',
//             { timeout: 10000 }
//           );
//           await searchBox.focus();
//           await page.keyboard.down("Control");
//           await page.keyboard.press("A");
//           await page.keyboard.up("Control");
//           await page.keyboard.press("Backspace");

//           await searchBox.type(formattedPhone, { delay: 200 });
//           await sleep(4000);

//           const results = await page.$$('div[role="gridcell"]');
//           if (results.length > 0) {
//             await results[0].click();
//             chatOpened = true;
//             console.log(`🔍 Found ${phone} in search`);
//           } else {
//             console.log(`❌ No result for ${phone}`);
//           }
//         } catch (err) {
//           console.log(`❌ Search failed for ${phone}: ${err.message}`);
//         }

//         // STEP 2: If not found → fallback wa.me
//         let waPage = null;
//         if (!chatOpened) {
//           waPage = await browser.newPage();
//           await waPage.goto(`https://wa.me/${formattedPhone}`, {
//             waitUntil: "domcontentloaded",
//           });
//           try {
//             const continueBtn = await waPage.waitForSelector(
//               'a[href*="api.whatsapp.com/send"]',
//               { timeout: 5000 }
//             );
//             await continueBtn.click();
//             await waPage.waitForNavigation({ waitUntil: "domcontentloaded" });
//             const useWebBtn = await waPage.waitForSelector(
//               'a[href*="web.whatsapp.com/send"]',
//               { timeout: 5000 }
//             );
//             await useWebBtn.click();
//             await waPage.waitForSelector(
//               'div[contenteditable="true"][data-tab="10"]',
//               { timeout: 15000 }
//             );
//             console.log(`🌐 Opened wa.me chat for ${phone}`);
//           } catch {
//             console.log(`⚠️ ${phone} is not on WhatsApp, skipping...`);
//             if (waPage) await waPage.close();
//             processed.push({ phone, status: "not_on_whatsapp" });
//             continue;
//           }
//         }

//         // STEP 3: Send message
//         const activePage = waPage || page;
//         const inputBox = await activePage.$(
//           'div[contenteditable="true"][data-tab="10"]'
//         );
//         await inputBox.type(message, { delay: 50 });
//         const sendBtn = await page.$('span[data-icon="send"]');
//         await sendBtn.click();
//         // await activePage.keyboard.press("Enter");
//         console.log(`✅ Message sent to ${phone}`);

//         // STEP 4: Attach file if provided
//         if (anyDesignFile) {
//           try {
//             const attachBtn = await activePage.waitForSelector(
//               'span[data-icon="clip"], span[data-icon="plus-rounded"]',
//               { timeout: 10000 }
//             );
//             await attachBtn.click();
//             const fileInput = await activePage.waitForSelector(
//               'input[type="file"]',
//               { timeout: 10000 }
//             );
//             await fileInput.uploadFile(anyDesignFile);
//             const sendBtn = await activePage.waitForSelector(
//               'span[data-icon="send"]',
//               { timeout: 10000 }
//             );
//             await sendBtn.click();
//             console.log(`📎 File sent to ${phone}`);
//           } catch (err) {
//             console.log(`❌ Failed to send file to ${phone}: ${err.message}`);
//           }
//         }

//         processed.push({ phone, status: "sent" });
//         if (waPage) await waPage.close();
//       } catch (err) {
//         console.log(`❌ Failed for ${phone}: ${err.message}`);
//         processed.push({ phone, status: "error" });
//       }
//       await sleep(5000);
//     }

//     fs.writeFileSync(
//       "processed_numbers.csv",
//       `phone,status\n${processed
//         .map((p) => `${p.phone},${p.status}`)
//         .join("\n")}`,
//       "utf8"
//     );

//     return res.json({
//       status: "success",
//       message: "Processing complete",
//       savedRecordId: saved._id,
//       total: processed.length,
//       sent: processed.filter((p) => p.status === "sent").length,
//       failed: processed.filter((p) => p.status === "error").length,
//     });
//   } catch (error) {
//     console.error("Error sending message:", error);
//     return res.status(500).json({ status: "error", message: "Server Error" });
//   }
// };
*/

const randomSleep = async (min = 15000, max = 25000) => {
  const ms = Math.floor(Math.random() * (max - min + 1) + min);
  console.log(`⏳ Waiting ${ms / 1000}s...`);
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const verifyNumber = async (browser, phone) => {
  const formattedPhone = phone.replace(/[^0-9]/g, "");

  // 1. Cached check
  let cached = await VerifiedNumber.findOne({ phone: formattedPhone });
  if (cached) {
    console.log(`⚡ Cache hit for ${phone} → ${cached.status}`);
    return cached.status === "verified";
  }

  // 2. Open wa.me tab
  const waPage = await browser.newPage();
  await waPage.goto(`https://wa.me/${formattedPhone}`, {
    waitUntil: "domcontentloaded",
  });

  try {
    // Step A: Continue to Chat
    let continueBtn;
    try {
      continueBtn = await waPage.waitForSelector(
        'a[href*="api.whatsapp.com/send"]',
        { timeout: 8000 }
      );
      await continueBtn.click();
    } catch {
      console.log(`⚠️ Retry ContinueToChat for ${phone}`);
      continueBtn = await waPage.waitForSelector(
        'a[href*="api.whatsapp.com/send"]',
        { timeout: 8000 }
      );
      await continueBtn.click();
    }
    await waPage.waitForNavigation({ waitUntil: "domcontentloaded" });

    // Step B: Use WhatsApp Web
    let useWebBtn;
    try {
      useWebBtn = await waPage.waitForSelector(
        'a[href*="web.whatsapp.com/send"]',
        { timeout: 8000 }
      );
      await useWebBtn.click();
    } catch {
      console.log(`⚠️ Retry UseWeb for ${phone}`);
      useWebBtn = await waPage.waitForSelector(
        'a[href*="web.whatsapp.com/send"]',
        { timeout: 8000 }
      );
      await useWebBtn.click();
    }
    const inputBox = await page.waitForSelector('div[contenteditable="true"]', {
      visible: true,
      timeout: 30000,
    });

    // Step C: Wait for input box
    await waPage.waitForSelector(inputBox, {
      timeout: 20000,
    });

    console.log(`✅ ${phone} is registered on WhatsApp`);
    await VerifiedNumber.create({ phone: formattedPhone, status: "verified" });
    return true;
  } catch (err) {
    console.log(`❌ ${phone} is NOT on WhatsApp`);
    await VerifiedNumber.create({
      phone: formattedPhone,
      status: "not_on_whatsapp",
    });
    return false;
  }
};

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

    const saved = await messageModel.create({
      message,
      csvFilePath,
      anyDesignFile,
    });
    const phoneNumbers = await parseCsv(csvFilePath);
    if (!phoneNumbers.length) {
      return res
        .status(400)
        .json({ status: "error", message: "No numbers in CSV." });
    }

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
    await sleep(20000);

    const processed = [];

    // for (const phone of phoneNumbers) {
    //   try {
    //     console.log(`🔍 Checking ${phone}...`);

    //     // Step 1: Verify
    //     const isValid = await verifyNumber(browser, phone);
    //     if (!isValid) {
    //       processed.push({ phone, status: "not_on_whatsapp" });
    //       continue;
    //     }

    //     // Step 2: Random wait
    //     await randomSleep();

    //     // Step 3: Send message
    //     await page.goto(`https://web.whatsapp.com/send?phone=${phone}`);
    //     await page.waitForSelector(inputBox, { timeout: 20000 });

    //     const inputBox = await page.$(inputBox);
    //     await inputBox.type(message, { delay: 150 });
    //     await page.keyboard.press("Enter");

    //     // const sendBtn = await page.$('span[data-icon="send"]');
    //     // await sendBtn.click();
    //     console.log(`✅ Message sent to ${phone}`);

    //     // Step 4: Attach file (if provided)
    //     if (anyDesignFile) {
    //       const attachBtn = await page.waitForSelector(
    //         'span[data-icon="clip"]',
    //         { timeout: 10000 }
    //       );
    //       await attachBtn.click();
    //       const fileInput = await page.waitForSelector('input[type="file"]', {
    //         timeout: 10000,
    //       });
    //       await fileInput.uploadFile(anyDesignFile);
    //       await sleep(5000); // wait for preview to load
    //       const sendFileBtn = await page.waitForSelector(
    //         'span[data-icon="send"]',
    //         { timeout: 10000 }
    //       );
    //       await sendFileBtn.click();
    //       console.log(`📎 File sent to ${phone}`);
    //     }

    //     processed.push({ phone, status: "sent" });
    //   } catch (err) {
    //     console.log(`❌ Error for ${phone}: ${err.message}`);
    //     processed.push({ phone, status: "error" });
    //   }
    // }

    for (const phone of phoneNumbers) {
      try {
        const formatPhone = (phone) => {
          const digits = phone.replace(/\D/g, ""); // keep only digits
          if (digits.startsWith("0")) {
            return "91" + digits.slice(1); // assume India default
          }
          return digits;
        };

        console.log(`🔍 Sending to ${formatPhone}...`);

        if (!/^\d{10,15}$/.test(formatPhone)) {
          console.log(`⚠️ Skipping invalid number: ${phone}`);
          processed.push({ phone, status: "invalid" });
          continue;
        }
        // Open chat
        await page.goto(
          `https://web.whatsapp.com/send?phone=${formatPhone}&text=${encodeURIComponent(
            message
          )}`,
          {
            waitUntil: "domcontentloaded",
          }
        );

        // Wait for chat box
        const inputBox = await page.waitForSelector(
          'div[contenteditable="true"]',
          { visible: true, timeout: 30000 }
        );

        // Type message (only if text param didn’t auto-populate)
        await inputBox.click();
        await page.keyboard.press("Enter"); // send

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

          await sleep(3000); // wait for preview
          const sendFileBtn = await page.waitForSelector(
            'span[data-icon="send"]',
            { timeout: 10000 }
          );
          await sendFileBtn.click();

          console.log(`📎File sent to ${phone}`);
        }

        processed.push({ phone, status: "sent" });
        await randomSleep(); // mimic human behavior
      } catch (err) {
        console.log(`❌ Error for ${phone}: ${err.message}`);
        processed.push({ phone, status: "error" });
      }
    }

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
      not_on_whatsapp: processed.filter((p) => p.status === "not_on_whatsapp")
        .length,
      failed: processed.filter((p) => p.status === "error").length,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ status: "error", message: "Server Error" });
  }
};

export { MessageDone, MessageSend };
