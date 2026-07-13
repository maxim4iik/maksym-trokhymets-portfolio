import { existsSync, readFileSync } from 'node:fs';

const required = [
  'index.html',
  'ua/index.html',
  'assets/styles.css',
  'assets/main.js',
  'assets/favicon.svg',
  'images/maksym-trokhymets-portrait.webp',
  'files/cv-maksym-trokhymets.pdf',
  'robots.txt',
  'sitemap.xml',
  'vercel.json'
];

const missing = required.filter((file) => !existsSync(file));

if (missing.length > 0) {
  console.error(`Missing required files:\n${missing.join('\n')}`);
  process.exit(1);
}

const pages = ['index.html', 'ua/index.html'];

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const checks = [
    ['viewport meta', /name="viewport"/],
    ['language alternate links', /rel="alternate"/],
    ['main landmark', /<main/],
    ['timeline section', /id="timeline"/],
    ['BA case study', /id="ba-case-study"/],
    ['website gallery', /id="websites"/],
    ['26-week GitHub calendar', /data-github-months/],
    ['contact section', /id="contact"/]
  ];

  for (const [label, pattern] of checks) {
    if (!pattern.test(html)) {
      console.error(`${page}: missing ${label}`);
      process.exit(1);
    }
  }
}

console.log('Static validation passed.');
