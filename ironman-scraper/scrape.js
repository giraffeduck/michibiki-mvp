// /ironman-scraper/scrape.js

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  const baseUrl = 'https://www.sportsplits.com/races/ironman-japan-2024/events/1';

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('table tbody tr', { timeout: 10000 });

  // ページ数を取得（右下のページネーションから最大ページ数を推定）
  const totalPages = await page.$$eval('.pagination li a', links => {
    const numbers = links.map(el => parseInt(el.textContent)).filter(n => !isNaN(n));
    return Math.max(...numbers);
  });

  const allResults = [];

  for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
    const url = `${baseUrl}?page=${currentPage}`;
    console.log(`Scraping page ${currentPage} of ${totalPages}...`);

    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('table tbody tr', { timeout: 10000 });

    const rows = await page.$$eval('table tbody tr', rows =>
      rows.map(row => {
        const cols = row.querySelectorAll('td');
        const anchor = cols[1].querySelector('a');
        return {
          overall_rank: cols[0]?.innerText.trim(),
          name: anchor?.innerText.trim() || '',
          detail_url: anchor?.href || '',
          bib_number: cols[2]?.innerText.trim(),
          total_time: cols[6]?.innerText.trim(),
        };
      })
    );

    allResults.push(...rows);
  }

  // CSVとして保存
  const csvHeader = 'overall_rank,bib_number,name,total_time,detail_url\n';
  const csvBody = allResults.map(r =>
    [r.overall_rank, r.bib_number, `"${r.name}"`, r.total_time, r.detail_url].join(',')
  ).join('\n');

  fs.writeFileSync(path.join(__dirname, 'results_overview.csv'), csvHeader + csvBody);

  console.log(`✅ ${allResults.length} 件の選手データを results_overview.csv に保存しました`);
  await browser.close();
})();
