import puppeteer from "puppeteer";
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

    const browser = await puppeteer.launch({
      headless: false,
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

        // STEP 1: Try search box
        let chatOpened = false;
        try {
          const searchBox = await page.waitForSelector(
            'div[contenteditable="true"][data-tab="3"]',
            { timeout: 5000 }
          );

          await searchBox.click({ clickCount: 3 });
          await page.keyboard.press("Backspace");
          await searchBox.type(formattedPhone, { delay: 100 });
          await sleep(3000);

          const firstResult = await page.$('div[role="gridcell"]');
          if (firstResult) {
            await firstResult.click();
            chatOpened = true;
            console.log(`🔍 Found ${phone} in search`);
          }
        } catch {
          console.log(`❌ Not found in contacts: ${phone}`);
        }

        // STEP 2: If not found in search → fallback to wa.me
        if (!chatOpened) {
          await page.goto(`https://wa.me/${formattedPhone}`);
          await page.waitForSelector('a[href*="send"]', { timeout: 15000 });
          const startChatBtn = await page.$('a[href*="send"]');
          await startChatBtn.click();
          await page.waitForSelector(
            'div[contenteditable="true"][data-tab="10"]',
            {
              timeout: 15000,
            }
          );
          console.log(`🌐 Opened chat with wa.me for ${phone}`);
        }

        // STEP 3: Type and send message
        const inputBox = await page.$(
          'div[contenteditable="true"][data-tab="10"]'
        );
        await inputBox.type(message, { delay: 250 });
        await page.keyboard.press("Enter");
        console.log(`✅ Text sent to ${phone}`);

        // STEP 4: Attach file if provided
        if (anyDesignFile) {
          try {
            const attachBtn = await page.waitForSelector(
              'span[data-icon="plus-rounded"], span[data-icon="clip"]',
              { timeout: 15000 }
            );
            await attachBtn.click();

            const fileInput = await page.waitForSelector('input[type="file"]', {
              timeout: 10000,
            });
            await fileInput.uploadFile(anyDesignFile);

            const sendBtn = await page.waitForSelector(
              'span[data-icon="plus-rounded"]',
              {
                timeout: 5000,
              }
            );
            await sendBtn.click();

            console.log(`📎 File sent to ${phone}.......`);

          } catch (err) {
            console.log(`❌ Failed to send file to ${phone}: ${err.message}`);

            // ⌨️ Press Enter key as fallback
            try {
              await page.keyboard.press("Enter");
              console.log(`🔄 Pressed Enter key for ${phone}`);
            } catch (kbErr) {
              console.log(`⚠️ Could not press Enter: ${kbErr.message}`);
            }
          }
        }

        processed.push({ phone, status: "sent" });
      } catch (err) {
        console.log(`❌ Failed for ${phone}: ${err.message}`);
        processed.push({ phone, status: "error" });
      }

      await sleep(5000); // delay between contacts
    }

    // Save report
    const report = processed.map((p) => `${p.phone},${p.status}`).join("\n");
    fs.writeFileSync(
      "processed_numbers.csv",
      `phone,status\n${report}`,
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
