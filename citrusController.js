"use strict";

/*
 * Purpose : For Citrus Taxes Search API's 
 * Package : Controller
 * Developed By  : Sorav Garg (soravgarg123@gmail.com)
*/

const {
      async,
      puppeteer,
      cheerio,
      check,
      validationResult
    } = require("../../packages.js");

let citrusController = {validate,tax,sketch}

    /**
      * For Validation
    */
   function validate(method) {
      switch (method) {
        case 'tax': {
          return [ 
            check('ParcelID')
              .notEmpty().withMessage('Parcel ID field is required').trim()
          ]
        }
        break;
        case 'sketch': {
          return [ 
            check('ParcelID')
              .notEmpty().withMessage('Parcel ID field is required').trim()
          ]
        }
        break;
      }
    }

  /**
      For delay time
  **/
  function delay(time) {
     return new Promise(function(resolve) { 
         setTimeout(resolve, time)
     });
  }

  /**
      For Citrus Tax Data
  **/
  async function tax(req, res) {
    
     /* To Check Validation Results */
     let errors = validationResult(req);
     if (!errors.isEmpty()) {
         res.status(500).json({
                 ResponseCode: 500,
                 Data: [],
                 Message: errors.array()[0].msg
         });
         return;
      }

      /* Initialize Browser */
      var browser;
      try {

        /* Launch Browser */
        browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        const page = await browser.newPage();
        await page.goto(`https://citrus.county-taxes.com/public/search/property_tax?search_query=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('div.installment', {timeout: 10000});

        /* Load Cheerio HTML */
        var $ = cheerio.load(await page.content());

        /* Prepare Response */
        let BillPdfLink = $('div.print').parent().parent().find('a').attr('href');
        let Response = {};
            Response.Name = $('div.name').find('a').text().replace(/\n/g, " ").replace(/ +(?= )/g,'').trim() || "";
            Response.Address = $('div.address').text().replace(/\n/g, " ").replace(/ +(?= )/g,'').trim() || "";
            Response.PaidStatus = $('span.emphasized-status').text().replace(/\n/g, " ").trim() || "";
            Response.Receipt = $("span:contains('Receipt #')").next().text().replace(/\n/g, " ").trim() || "";
            Response.BillPdfLink = (BillPdfLink) ? (`https://citrus.county-taxes.com${BillPdfLink}`) : "";
        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: [Response], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Citrus Sketch Data
  **/
  async function sketch(req, res) {
    
     /* To Check Validation Results */
     let errors = validationResult(req);
     if (!errors.isEmpty()) {
         res.status(500).json({
                 ResponseCode: 500,
                 Data: [],
                 Message: errors.array()[0].msg
         });
         return;
      }

      /* Initialize Browser */
      try {

        /* Launch Browser */
        var browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        var page = await browser.newPage();
        await page.goto(`https://www.citruspa.org/_Web/search/commonsearch.aspx?mode=realprop`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector("button#btAgree", {timeout: 30000});
        await page.click('button#btAgree');

        await page.waitForSelector("input#inpParid", {timeout: 30000});
        await page.focus('input#inpParid');
        await page.keyboard.type(req.query.ParcelID);
        await page.click('button#btSearch');

        await page.waitForSelector("table#searchResults", {timeout: 30000});
        await page.click('table#searchResults > tbody > tr.SearchResults');

        await page.waitForSelector("ul.navigation", {timeout: 30000});
        await page.click('ul.navigation > li:nth-child(8) > a'); 

        await delay(5000); // Delay 5 seconds
        await page.waitForSelector('iframe');

        /* Read iframe Content */
        let elementHandle = await page.$('iframe');
        let frame = await elementHandle.contentFrame();
        let SketchImgUrl = await frame.evaluate(() => {
            return document.querySelector('img#BinImage').getAttribute('src');
        });
        SketchImgUrl = (SketchImgUrl) ? [`https://www.citruspa.org/_Web/${SketchImgUrl.replace("../","")}`] : [];

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:SketchImgUrl, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

module.exports = citrusController;
