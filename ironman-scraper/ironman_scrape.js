const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.setUserAgent(
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
  );

  const url = 'https://www.ironman.com/races/im-south-hokkaido/results';
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // 人間がCookies承認・ページ準備したあとにEnterキーでスタート
  console.log('✅ ページを準備してください（Accept All Cookies、Rows per pageを100に）');
  console.log('👉 準備ができたらEnterを押してください');

  await waitForEnterKey();

  const allResults = [];
  let currentPage = 1;

  while (true) {
    console.log(`📄 ページ ${currentPage} を処理中...`);

    const rows = await page.$$eval('table tbody tr', trs =>
      trs.map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        return {
          athlete: cells[1] || '',
          swim: cells[2] || '',
          t1: cells[3] || '',
          bike: cells[4] || '',
          t2: cells[5] || '',
          run: cells[6] || '',
          finish: cells[7] || '',
        };
      })
    );

    allResults.push(...rows);

    const nextButton = await page.$('button[aria-label="Go to next page"]');
    if (!nextButton) break;

    const isDisabled = await page.$eval(
      'button[aria-label="Go to next page"]',
      btn => btn.disabled
    );
    if (isDisabled) break;

    await nextButton.click();
    await page.waitForTimeout(3000);
    currentPage++;
  }

  const csvHeader = 'athlete,swim,t1,bike,t2,run,finish\n';
  const csvBody = allResults.map(r =>
    [r.athlete, r.swim, r.t1, r.bike, r.t2, r.run, r.finish].map(s => `"${s}"`).join(',')
  ).join('\n');

  fs.writeFileSync(path.join(__dirname, 'ironman_results.csv'), csvHeader + csvBody);

  console.log(`✅ 完了：${allResults.length} 件のデータを ironman_results.csv に保存しました`);
  await browser.close();
})();

// ユーザーのEnterキー入力待ち
function waitForEnterKey() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question('', () => {
    rl.close();
    resolve();
  }));
}
