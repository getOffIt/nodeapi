var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const hbrTipsURL = "http://feeds.harvardbusiness.org/managementtip";

router.get('/', function (req, res, next) {
    (async () => {
        /* Initiate the Puppeteer browser */
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto("http://feeds.harvardbusiness.org/managementtip", { waitUntil: 'networkidle0' });

        let data = await page.evaluate(() => {

            let title = document.querySelector('h4[class="itemtitle"]').textContent
            let content = document.querySelector('div[class="itemcontent"]').textContent

            return {
                title,
                content
            }
        });

        /* Outputting what we scraped */
        console.log(data);

        await browser.close();

        res.send(data);
    })();

});

module.exports = router;