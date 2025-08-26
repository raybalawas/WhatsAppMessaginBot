import puppeteer from "puppeteer-core";
import fs from "fs";
import csv from "csv-parser";
import messageModel from "../models/MessageModel.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const parseCsv = (csvPath) =>
  new Promise((resolve, reject) => {
    const numbers = [];
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on("data", (row) => {
        const val = row.phone || row.phone_number || row.mobile || row.number;
        if (val) numbers.push(String(val).trim());
      })
      .on("end", () => resolve(numbers))
      .on("error", reject);
  });

const MessageDone = async (req, res) => {
  console.log("working");
  return res.json({ Message: "working" });
};

const MessageSend = async (req, res) => {
  try {
    const message = req.body?.message?.trim();
    const csvFilePath = req.files?.csvfile?.[0]?.path || null;
    const anyDesignFile = req.files?.design?.[0]?.path || null;

    if (!message || !csvFilePath) {
      return res.status(400).json({
        status: "error",
        message: "message & csvfile are required (multipart/form-data).",
      });
    }

    // Save request to DB
    const saved = await messageModel.create({
      message,
      csvFilePath,
      anyDesignFile,
    });

    const phoneNumbers = await parseCsv(csvFilePath);
    if (!phoneNumbers.length) {
      return res.status(400).json({
        status: "error",
        message: "No numbers found in CSV file.",
      });
    }

    // 👇 Use installed Chrome instead of Puppeteer Chromium
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", // adjust to your OS
      userDataDir: "./whatsapp-session",
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    await page.goto("https://web.whatsapp.com");
    console.log("✅ Using saved session. If first time, scan QR.");
    await sleep(20000); // wait for QR scan if needed

    const processed = [];

    for (const phone of phoneNumbers) {
      try {
        console.log(`📨 Trying to send message to ${phone}...`);
        const formattedPhone = phone.replace(/[^0-9]/g, "");

        // STEP 1: Search
        let chatOpened = false;
        try {
          const searchBox = await page.waitForSelector(
            'div[role="textbox"][contenteditable="true"]',
            { timeout: 10000 }
          );
          await searchBox.focus();
          await page.keyboard.down("Control");
          await page.keyboard.press("A");
          await page.keyboard.up("Control");
          await page.keyboard.press("Backspace");

          await searchBox.type(formattedPhone, { delay: 200 });
          await sleep(4000);

          const results = await page.$$('div[role="gridcell"]');
          if (results.length > 0) {
            await results[0].click();
            chatOpened = true;
            console.log(`🔍 Found ${phone} in search`);
          } else {
            console.log(`❌ No result for ${phone}`);
          }
        } catch (err) {
          console.log(`❌ Search failed for ${phone}: ${err.message}`);
        }

        // STEP 2: If not found → fallback wa.me
        let waPage = null;
        if (!chatOpened) {
          waPage = await browser.newPage();
          await waPage.goto(`https://wa.me/${formattedPhone}`, {
            waitUntil: "domcontentloaded",
          });
          try {
            const continueBtn = await waPage.waitForSelector(
              'a[href*="api.whatsapp.com/send"]',
              { timeout: 5000 }
            );
            await continueBtn.click();
            await waPage.waitForNavigation({ waitUntil: "domcontentloaded" });
            const useWebBtn = await waPage.waitForSelector(
              'a[href*="web.whatsapp.com/send"]',
              { timeout: 5000 }
            );
            await useWebBtn.click();
            await waPage.waitForSelector(
              'div[contenteditable="true"][data-tab="10"]',
              { timeout: 15000 }
            );
            console.log(`🌐 Opened wa.me chat for ${phone}`);
          } catch {
            console.log(`⚠️ ${phone} is not on WhatsApp, skipping...`);
            if (waPage) await waPage.close();
            processed.push({ phone, status: "not_on_whatsapp" });
            continue;
          }
        }

        // STEP 3: Send message
        const activePage = waPage || page;
        const inputBox = await activePage.$(
          'div[contenteditable="true"][data-tab="10"]'
        );
        await inputBox.type(message, { delay: 50 });
        const sendBtn = await page.$('span[data-icon="send"]');
        await sendBtn.click();
        // await activePage.keyboard.press("Enter");
        console.log(`✅ Message sent to ${phone}`);

        // STEP 4: Attach file if provided
        if (anyDesignFile) {
          try {
            const attachBtn = await activePage.waitForSelector(
              'span[data-icon="clip"], span[data-icon="plus-rounded"]',
              { timeout: 10000 }
            );
            await attachBtn.click();
            const fileInput = await activePage.waitForSelector(
              'input[type="file"]',
              { timeout: 10000 }
            );
            await fileInput.uploadFile(anyDesignFile);
            const sendBtn = await activePage.waitForSelector(
              'span[data-icon="send"]',
              { timeout: 10000 }
            );
            await sendBtn.click();
            console.log(`📎 File sent to ${phone}`);
          } catch (err) {
            console.log(`❌ Failed to send file to ${phone}: ${err.message}`);
          }
        }

        processed.push({ phone, status: "sent" });
        if (waPage) await waPage.close();
      } catch (err) {
        console.log(`❌ Failed for ${phone}: ${err.message}`);
        processed.push({ phone, status: "error" });
      }
      await sleep(5000);
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
      failed: processed.filter((p) => p.status === "error").length,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ status: "error", message: "Server Error" });
  }
};

export { MessageDone, MessageSend };
