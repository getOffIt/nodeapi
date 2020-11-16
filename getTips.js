require('dotenv').config()
const puppeteer = require('puppeteer');
const hbrTipsURL = "http://feeds.harvardbusiness.org/managementtip";
var AWS = require('aws-sdk');

var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

function getFromHBR() {
    console.log('Starting');

    (async () => {
        /* Initiate the Puppeteer browser */
        const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
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
        console.log('\n-------\n' + 'scrapped HTML data to JSON:\n' + JSON.stringify(data) + '\n-------\n');

        await browser.close();
        await uploadToS3('hbrtips.com', 'data/latesttipPROD' + process.env.ENV + '.json', data).then(function(result) {
            console.info('\n-------\n' + 'Success! Uploaded to S3\n' + JSON.stringify(data) + ' to ' + result.Location + '\n-------\n');
        });
    })();

}

var fs = require('fs');
var path = require('path');

function uploadToS3(bucketName, keyPrefix, data) {

    // If you want to save to "my-bucket/{prefix}/{filename}"
    //                    ex: "my-bucket/my-pictures-folder/my-picture.png"
    // var fileStream = fs.createReadStream(data);
    // fileStream.once('error', reject);
    var buffer = new Buffer(JSON.stringify(data))

    return new Promise(function(resolve, reject) {
        // fileStream.once('error', reject);
        s3.upload({
            Bucket: bucketName,
            Key: keyPrefix,
            Body: buffer
        })
            .promise()
            .then(resolve, reject);
    });
}
getFromHBR();