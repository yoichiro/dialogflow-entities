"use strict";

const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  let tagNames = [];
  for (let i = 1; i <= 13; i++) {
    await page.goto(`https://qiita.com/tags?page=${i}`);
    const tags = await page.$$eval('a.TagList__label', selector => {
      return selector.map(tag => {
        return tag.textContent;
      });
    });
    tagNames = tagNames.concat(tags);
  }
  const entities = tagNames.map(tagName => {
    return {
      value: tagName,
      synonyms: [
        tagName
      ]
    };
  });
  console.log(JSON.stringify(entities));
  await browser.close();
})();
