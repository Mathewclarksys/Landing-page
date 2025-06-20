const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

let messages = [];

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto('https://t.me/s/solanatrendingcherry', {
    waitUntil: 'domcontentloaded'
  });

  console.log('🚀 Cloud scraper running every 1s...');

  setInterval(async () => {
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });

      const newMessages = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.tgme_widget_message_text'))
          .map(el => el.innerText.trim())
          .filter(Boolean);
      });

      if (newMessages.length) {
        const latest = newMessages.slice(-10); // only keep 10
        if (JSON.stringify(latest) !== JSON.stringify(messages)) {
          messages = latest;
          console.log(`✅ Updated @ ${new Date().toLocaleTimeString()} | ${messages.length} messages`);
        }
      }
    } catch (e) {
      console.error('❌ Scrape failed:', e.message);
    }
  }, 1000);
})();

// Expose the latest messages
app.get('/api/messages', (req, res) => {
  res.json(messages);
});

// Serve a simple viewer
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head><title>Live Telegram Feed</title></head>
      <body style="background:#151C24;color:#e6ecf3;font-family:sans-serif;padding:20px;">
        <h2>🧠 Live Telegram Messages</h2>
        <div id="msgs"></div>
        <script>
          async function load() {
            const res = await fetch('/api/messages');
            const msgs = await res.json();
            document.getElementById('msgs').innerHTML = msgs.map(m => 
              '<div style="margin-bottom:20px;padding:10px;border:1px solid #2e3c4e;border-radius:10px;">' + 
              m.replace(/\\n/g,'<br>') + 
              '</div>').join('');
          }
          load();
          setInterval(load, 1000);
        </script>
      </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`🌐 Server running at http://localhost:${PORT}`);
});
