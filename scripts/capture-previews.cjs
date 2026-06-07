const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = null;
}

const projects = [
  'nisha.kyiv.ua',
  'kuzovok.kyiv.ua',
  'eurosto.com.ua',
  'marketeam.com.ua',
  'decorble.com.ua',
  'wolya.com.ua',
  'toramp.com',
  'agroflot.com.ua',
  'servis-piraty.cz',
  'e-kuzov.com.ua',
  'adventukraine.com.ua',
  'majdabekkali.com',
  'majdabekkaliparis.com'
];

const outDir = path.join(process.cwd(), 'previews');
fs.mkdirSync(outDir, { recursive: true });

function slug(domain) {
  return domain.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
}

async function capture(browser, domain) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true
  });
  const candidates = [`https://${domain}`, `http://${domain}`];

  for (const url of candidates) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 18000 });
      await page.waitForTimeout(1800);
      const file = path.join(outDir, `${slug(domain)}.png`);
      await page.screenshot({ path: file, fullPage: false });
      if (sharp) {
        const webpFile = file.replace(/\.png$/, '.webp');
        await sharp(file).webp({ quality: 82 }).toFile(webpFile);
        console.log(`captured ${domain} -> ${webpFile}`);
      } else {
        console.log(`captured ${domain} -> ${file}`);
      }
      await page.close();
      return;
    } catch (error) {
      console.log(`skip ${url}: ${error.message.split('\n')[0]}`);
    }
  }

  await page.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  for (const domain of projects) {
    await capture(browser, domain);
  }

  await browser.close();
})();
