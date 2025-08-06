const puppeteer = require("puppeteer");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

const message =
  "Hi, Is there any job opening for a backend developer with 2+ years of experience? Tech: Node.js & PHP (Laravel)";
const csvFilePath = "phone_numbers.csv";
const resumePath = path.resolve(__dirname, "resume.pdf");

let phoneNumbers = [];

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on("data", (row) => {
    phoneNumbers.push(row.phone_number);
  })
  .on("end", async () => {
    const browser = await puppeteer.launch({
      headless: false,
      userDataDir: "./whatsapp-session",
      defaultViewport: null,
      args: ["--start-maximized"],
    });

    const page = await browser.newPage();
    await page.goto("https://web.whatsapp.com");
    console.log("✅ Using saved session. If first time, scan QR.");
    await new Promise((resolve) => setTimeout(resolve, 20000));

    const processed = [];

    for (const phone of phoneNumbers) {
      try {
        console.log(`📨 Searching chat for ${phone}...`);

        // Focus and clear search box THIS IS FOR SAVED NUMBERS
        /* const searchBox = await page.$(
          'div[contenteditable="true"][data-tab="3"]'
        );
        await searchBox.click({ clickCount: 3 });
        await page.keyboard.press("Backspace");
        await new Promise((r) => setTimeout(r, 1000));

        // Type phone number
        await searchBox.type(phone, { delay: 100 });
        await new Promise((r) => setTimeout(r, 3000));

        // Click the first result
        await page.waitForSelector('div[role="gridcell"]', { timeout: 10000 });
        const firstResult = await page.$('div[role="gridcell"]');
        if (!firstResult) throw new Error("No search result found");
        await firstResult.click();*/
        // ✅ Open direct WhatsApp chat URL
        const formattedPhone = phone.replace(/[^0-9]/g, ""); // remove non-digit chars
        await page.goto(`https://wa.me/${formattedPhone}`);
        await page.waitForSelector('a[href*="send"]', { timeout: 15000 });

        const startChatBtn = await page.$('a[href*="send"]');
        if (!startChatBtn) throw new Error("Start chat button not found");

        await startChatBtn.click();
        await page.waitForSelector(
          'div[contenteditable="true"][data-tab="10"]',
          {
            timeout: 15000,
          }
        );

        await new Promise((r) => setTimeout(r, 3000));

        // Send text message
        const inputBox = await page.$(
          'div[contenteditable="true"][data-tab="10"]'
        );
        await inputBox.type(message, { delay: 50 });
        await page.waitForSelector('span[data-icon="wds-ic-send-filled"]', {
          timeout: 5000,
        });
        await page.click('span[data-icon="wds-ic-send-filled"]');
        console.log(`✅ Text message sent to ${phone}`);

        // Attach resume
        console.log("📎 Trying to click attach button...");

        try {
          // This selector now works as of mid-2025
          await page.waitForSelector('span[data-icon="plus-rounded"]', {
            timeout: 15000,
          });

          const attachBtn = await page.$('span[data-icon="plus-rounded"]');
          await attachBtn.click();

          console.log("📎 Attach button clicked, waiting for file input...");
          await page.waitForSelector('input[type="file"]', {
            timeout: 10000,
          });

          const fileInput = await page.$('input[type="file"]');
          await fileInput.uploadFile(resumePath);
          console.log("📁 File uploaded, waiting for send button...");

          // Wait for the send button to appear
          await page.waitForSelector('span[data-icon="send"]', {
            timeout: 10000,
          });

          const sendBtn = await page.$('span[data-icon="send"]');
          await sendBtn.click();
          console.log(`📎 Resume sent to ${phone}`);
        } catch (error) {
          console.log(`❌ Could not send resume to ${phone}: ${error.message}`);
        }

        await new Promise((r) => setTimeout(r, 2000));

        const fileInput = await page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.uploadFile(resumePath);
          await new Promise((r) => setTimeout(r, 3000));

          const sendDocBtn = await page.$(
            'span[data-icon="wds-ic-send-filled"]'
          );
          if (sendDocBtn) {
            await sendDocBtn.click();
            console.log(`📎 Resume sent to ${phone}`);
          } else {
            console.log(`❌ Resume send button not found`);
          }
        } else {
          console.log(`❌ File input not found`);
        }

        processed.push({ phone, status: "whatsapp_sent" });
      } catch (err) {
        console.log(`❌ Failed for ${phone}: ${err.message}`);
        processed.push({ phone, status: "error" });
      }

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }

    const result = processed.map((p) => `${p.phone},${p.status}`).join("\n");
    fs.writeFileSync("processed_numbers.csv", `phone,status\n${result}`);

    console.log("✅ All done. Results saved to processed_numbers.csv");
    await browser.close();
  });
