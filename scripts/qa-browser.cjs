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
  await page.route(/https:\/\/api\.github\.com\/users\/maxim4iik\/repos.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          name: 'portfolio-mini-build',
          description: 'Small public build for portfolio experiments.',
          html_url: 'https://github.com/maxim4iik/portfolio-mini-build',
          language: 'JavaScript',
          updated_at: '2026-06-07T10:00:00Z',
          private: false
        },
        {
          name: 'requirements-toolkit',
          description: 'Notes and tools around requirements work.',
          html_url: 'https://github.com/maxim4iik/requirements-toolkit',
          language: 'HTML',
          updated_at: '2026-06-05T10:00:00Z',
          private: false
        }
      ])
    });
  });

  await page.route(/https:\/\/api\.github\.com\/users\/maxim4iik\/events\/public.*/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { created_at: '2026-06-07T12:00:00Z' },
        { created_at: '2026-06-07T13:00:00Z' },
        { created_at: '2026-06-05T12:00:00Z' }
      ])
    });
  });

  await page.route('https://api.github.com/users/maxim4iik', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ public_repos: 12 })
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
  const browser = await chromium.launch({ headless: true });
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
      return summary && /side-project|side-проєкт/.test(summary.textContent);
    }, null, { timeout: 2500 });
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
  await page.click('.preview-close');
  await page.waitForSelector('#site-preview[aria-hidden="true"]', { timeout: 1500 });
  await page.waitForTimeout(260);

  await page.click('#websites button[data-preview-title="Majda Bekkali"]');
  await page.waitForSelector('#site-preview[aria-hidden="false"]', { timeout: 1500 });
  await assertVisible(page, '#site-preview [data-preview-snapshot]:not([hidden])', 'snapshot fallback preview');
  await assertVisible(page, '#site-preview [data-preview-note]', 'snapshot fallback note');
  await page.waitForTimeout(320);
  await page.screenshot({ path: path.join(outDir, 'preview-fallback.png'), fullPage: false });
  await page.click('.preview-close');
  await page.waitForSelector('#site-preview[aria-hidden="true"]', { timeout: 1500 });
  await page.close();

  await browser.close();

  if (errors.length > 0) {
    console.error(errors.join('\n'));
    process.exit(1);
  }

  console.log(`Browser QA passed. Screenshots: ${outDir}`);
})();
