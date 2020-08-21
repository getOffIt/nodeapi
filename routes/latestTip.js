require('dotenv').config()
var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer');
const hbrTipsURL = "http://feeds.harvardbusiness.org/managementtip";
var AWS = require('aws-sdk');

var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
var s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
});

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
       await uploadToS3('dailytipbucket', 'latestTip.json', data).then(function(result) {
            console.info('Success! Uploaded ' + data + ' to ' + result.Location);
        });
        
        res.send(data);
    })();

});

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

module.exports = router;