const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const outDir = path.join(process.cwd(), 'output', 'playwright');
fs.mkdirSync(outDir, { recursive: true });

async function assertVisible(page, selector, label) {
  const count = await page.locator(selector).count();
  if (count === 0) {
    throw new Error(`Missing ${label}: ${selector}`);
  }
}

async function revealByScrolling(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const previousScrollBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const steps = 5;
    for (let i = 0; i <= steps; i += 1) {
      window.scrollTo(0, Math.round((max * i) / steps));
      await delay(90);
    }
    window.scrollTo(0, 0);
    await delay(140);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  });
}

async function waitForImages(page) {
  await page.evaluate(async () => {
    const images = Array.from(document.images).filter((img) => img.currentSrc || img.getAttribute('src'));

    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            const timeout = setTimeout(resolve, 600);
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
            img.addEventListener('load', () => clearTimeout(timeout), { once: true });
            img.addEventListener('error', () => clearTimeout(timeout), { once: true });
          });
        }
      })
    );
  });
}

async function mockGithub(page) {
  const end = new Date('2026-07-13T12:00:00Z');
  const days = Array.from({ length: 182 }, (_, index) => {
    const date = new Date(end);
    date.setUTCDate(end.getUTCDate() - (181 - index));
    const count = index % 9 === 0 ? 6 : index % 4 === 0 ? 2 : 0;
    return {
      date: date.toISOString().slice(0, 10),
      count,
      level: count >= 5 ? 3 : count > 0 ? 1 : 0
    };
  });

  await page.route('http://127.0.0.1:4173/api/github-contributions', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total: 122, days })
    });
  });

  await page.route(/https:\/\/avatars\.githubusercontent\.com\/.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#f8f4ed"/><circle cx="32" cy="32" r="22" fill="#bd5b3d"/></svg>'
    });
  });
}

async function mockLivePreviews(page) {
  await page.route(/https:\/\/nisha\.kyiv\.ua\/?.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><html><head><title>Nisha preview</title><style>body{margin:0;font-family:sans-serif;background:#f8f4ed;color:#171613}main{min-height:900px;display:grid;place-items:center}.hero{font-size:64px;font-weight:800}.bar{position:sticky;top:0;padding:16px;background:#bd5b3d;color:white}</style></head><body><div class="bar">Mocked live preview for browser QA</div><main><div class="hero">Nisha</div></main></body></html>'
    });
  });
}

(async () => {
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const launchOptions = { headless: true };
  if (fs.existsSync(systemChrome)) launchOptions.executablePath = systemChrome;

  const browser = await chromium.launch(launchOptions);
  const errors = [];

  for (const [name, url, viewport] of [
    ['en-desktop', 'http://127.0.0.1:4173/', { width: 1440, height: 1100 }],
    ['ua-desktop', 'http://127.0.0.1:4173/ua/', { width: 1440, height: 1100 }],
    ['en-mobile', 'http://127.0.0.1:4173/', { width: 390, height: 920 }],
    ['ua-mobile', 'http://127.0.0.1:4173/ua/', { width: 390, height: 920 }]
  ]) {
    const page = await browser.newPage({ viewport });
    await mockGithub(page);
    console.log(`${name}: start`);
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(`${name}: ${msg.text()}`);
    });
    page.on('pageerror', (error) => errors.push(`${name}: ${error.message}`));
    page.on('response', (response) => {
      const requestUrl = response.url();
      const status = response.status();
      if (requestUrl.startsWith('http://127.0.0.1:4173') && status >= 400) {
        errors.push(`${name}: ${status} ${requestUrl}`);
      }
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    console.log(`${name}: domcontentloaded`);
    await assertVisible(page, 'main', `${name} main`);
    await assertVisible(page, '#timeline .timeline-item', `${name} timeline`);
    await assertVisible(page, '#websites button[data-preview-image]', `${name} website gallery`);
    await assertVisible(page, '#github [data-github-summary]', `${name} GitHub activity`);
    await assertVisible(page, '#contact .contact-icon-button', `${name} contact icon actions`);
    await assertVisible(page, '#contact', `${name} contact`);
    await page.waitForFunction(() => {
      const summary = document.querySelector('#github [data-github-summary]');
      return summary && /122/.test(summary.textContent);
    }, null, { timeout: 2500 });
    const contributionCellCount = await page.locator('#github .github-day').count();
    if (contributionCellCount !== 182) {
      throw new Error(`${name}: expected 182 contribution cells, got ${contributionCellCount}`);
    }
    await assertVisible(page, '#github [data-github-months] span', `${name} GitHub month labels`);
    const repoCardCount = await page.locator('#github .github-repo').count();
    if (repoCardCount !== 0) {
      throw new Error(`${name}: GitHub repo cards should not render`);
    }
    console.log(`${name}: assertions`);
    await waitForImages(page);
    await revealByScrolling(page);
    await waitForImages(page);
    await page.screenshot({ path: path.join(outDir, `${name}.png`), fullPage: false });
    console.log(`${name}: screenshot`);
    await page.close();
  }

  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await mockGithub(page);
  await mockLivePreviews(page);
  console.log('interactions: start');
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 12000 });
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.wheel(0, 760);
  await page.waitForTimeout(650);
  const scrollAfter = await page.evaluate(() => window.scrollY);
  if (scrollAfter <= scrollBefore) {
    throw new Error('Wheel scroll did not move the page');
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(220);
  await page.click('a[href="#websites"]');
  await page.waitForFunction(() => {
    const el = document.querySelector('#websites');
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.top < 130 && rect.bottom > 420;
  }, null, { timeout: 2500 });
  await page.waitForTimeout(220);
  await waitForImages(page);
  await page.screenshot({ path: path.join(outDir, 'anchor-websites.png'), fullPage: false });
  await page.click('#websites button[data-preview-image]');
  await page.waitForSelector('#site-preview[aria-hidden="false"]', { timeout: 1500 });
  await assertVisible(page, '#site-preview [data-preview-title]', 'preview modal title');
  await assertVisible(page, '#site-preview [data-preview-iframe]:not([hidden])', 'live iframe preview');
  await page.waitForFunction(() => {
    const frame = document.querySelector('#site-preview [data-preview-iframe]');
    return frame && frame.getAttribute('src') && frame.getAttribute('src') !== 'about:blank';
  }, null, { timeout: 1500 });
  await waitForImages(page);
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(outDir, 'preview-modal.png'), fullPage: false });
  await page.click('#site-preview .preview-close');
  await page.waitForSelector('#site-preview[aria-hidden="true"]', { timeout: 1500 });
  await page.waitForTimeout(260);

  await page.click('#websites button[data-preview-title="Majda Bekkali"]');
  await page.waitForSelector('#site-preview[aria-hidden="false"]', { timeout: 1500 });
  await assertVisible(page, '#site-preview [data-preview-snapshot]:not([hidden])', 'snapshot fallback preview');
  await assertVisible(page, '#site-preview [data-preview-note]', 'snapshot fallback note');
  await page.waitForTimeout(320);
  await page.screenshot({ path: path.join(outDir, 'preview-fallback.png'), fullPage: false });
  await page.click('#site-preview .preview-close');
  await page.waitForSelector('#site-preview[aria-hidden="true"]', { timeout: 1500 });

  await page.click('[data-case-open]');
  await page.waitForSelector('#ba-case-study[aria-hidden="false"]', { timeout: 1500 });
  await assertVisible(page, '#ba-case-study .case-study-flow', 'BA case study flow');
  await assertVisible(page, '#ba-case-study .case-study-outcome', 'BA case study outcome');
  await page.waitForTimeout(240);
  await page.screenshot({ path: path.join(outDir, 'case-study-modal.png'), fullPage: false });
  await page.click('#ba-case-study .preview-close');
  await page.waitForSelector('#ba-case-study[aria-hidden="true"]', { timeout: 1500 });

  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('#github')?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(240);
  await page.screenshot({ path: path.join(outDir, 'github-calendar.png'), fullPage: false });
  await page.locator('.site-footer a[href="#top"]').click();
  await page.waitForFunction(() => window.scrollY < 2, null, { timeout: 2500 });
  await page.close();

  const mobileCasePage = await browser.newPage({ viewport: { width: 390, height: 920 } });
  await mockGithub(mobileCasePage);
  await mobileCasePage.goto('http://127.0.0.1:4173/ua/', { waitUntil: 'domcontentloaded', timeout: 12000 });
  await mobileCasePage.click('[data-case-open]');
  await mobileCasePage.waitForSelector('#ba-case-study[aria-hidden="false"]', { timeout: 1500 });
  await mobileCasePage.waitForTimeout(240);
  await mobileCasePage.screenshot({ path: path.join(outDir, 'case-study-mobile.png'), fullPage: false });
  await mobileCasePage.click('#ba-case-study .preview-close');
  await mobileCasePage.waitForSelector('#ba-case-study[aria-hidden="true"]', { timeout: 1500 });
  await mobileCasePage.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('#github')?.scrollIntoView({ block: 'start' });
  });
  await mobileCasePage.waitForTimeout(240);
  await mobileCasePage.screenshot({ path: path.join(outDir, 'github-calendar-mobile.png'), fullPage: false });
  await mobileCasePage.close();

  const darkPage = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  await mockGithub(darkPage);
  await darkPage.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded', timeout: 12000 });
  await darkPage.click('[data-case-open]');
  await darkPage.waitForSelector('#ba-case-study[aria-hidden="false"]', { timeout: 1500 });
  await darkPage.waitForTimeout(240);
  await darkPage.screenshot({ path: path.join(outDir, 'case-study-dark.png'), fullPage: false });
  await darkPage.click('#ba-case-study .preview-close');
  await darkPage.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
    document.querySelector('#github')?.scrollIntoView({ block: 'center' });
  });
  await darkPage.waitForTimeout(240);
  await darkPage.screenshot({ path: path.join(outDir, 'github-calendar-dark.png'), fullPage: false });
  await darkPage.close();

  await browser.close();

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }

  console.log(`Browser QA passed. Screenshots: ${outDir}`);
})();
