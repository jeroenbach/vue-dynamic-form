#!/usr/bin/env node
// Smoke-tests the dogfooded docs pages' actual computed styles against a running dev server,
// in both color modes. Unlike verifyDogfood.mjs (source-scan only), this catches a cascade
// problem like the starter stylesheet being discarded by the docs theme's own CSS: a broken
// import or layer order still leaves the right class names and imports in the source, but the
// browser renders unstyled controls.
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { createServer } from 'vitepress';

const docsRoot = fileURLToPath(new URL('..', import.meta.url));
const port = 5195;

const checks = [
  {
    route: '/examples/wizard',
    assertions: [
      { selector: '.sft-btn-primary', property: 'border-width', expect: width => width !== '0px' },
      { selector: '.sft-input', property: 'border-width', expect: width => width !== '0px' },
      { selector: '.sft-stepper ol', property: 'display', expect: display => display === 'flex' },
    ],
  },
  {
    route: '/examples/advanced',
    assertions: [
      { selector: '.sft-input', property: 'border-width', expect: width => width !== '0px' },
      { selector: '.sft-btn-primary', property: 'background-color', expect: color => color !== 'rgba(0, 0, 0, 0)' },
    ],
  },
];

async function run() {
  let server;
  let browser;
  const failures = [];

  try {
    server = await createServer(docsRoot, { port });
    await server.listen(port);

    browser = await chromium.launch({
      args: ['--no-proxy-server'],
      // Lets a sandboxed/CI environment point at a pre-installed Chromium build instead of the one
      // this Playwright version would otherwise try to download.
      executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
    });

    for (const darkMode of [false, true]) {
      const page = await browser.newPage();
      for (const { route, assertions } of checks) {
        // VitePress dev keeps an HMR websocket open, so 'networkidle' never resolves; 'load' plus
        // waiting for the first assertion's own selector is enough to know the page has rendered.
        await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'load' });
        await page.waitForSelector(assertions[0].selector, { timeout: 15000 });
        if (darkMode)
          await page.evaluate(() => document.documentElement.classList.add('dark'));

        for (const { selector, property, expect: expectation } of assertions) {
          const value = await page.$eval(selector, (el, prop) => getComputedStyle(el).getPropertyValue(prop), property);
          const label = `${route} (${darkMode ? 'dark' : 'light'}) ${selector} ${property}="${value}"`;
          if (!expectation(value))
            failures.push(label);
          else
            console.log(`ok   ${label}`);
        }
      }
      await page.close();
    }
  }
  finally {
    // Launch or navigation can throw before either resource exists, so close only what started.
    await browser?.close();
    await server?.close();
  }

  if (failures.length > 0) {
    console.error('\nfailed:');
    for (const failure of failures)
      console.error(`  ${failure}`);
    process.exitCode = 1;
    return;
  }

  console.log('\nverify:dogfood:render passed');
}

run().catch((error) => {
  console.error(error);
  if (/executable doesn't exist/i.test(String(error?.message))) {
    console.error(
      '\nPlaywright\'s pinned Chromium build is not installed. Point PLAYWRIGHT_EXECUTABLE_PATH at an '
      + 'installed build (e.g. /opt/pw-browsers/chromium), or run `npx playwright install chromium`.',
    );
  }
  process.exitCode = 1;
});
