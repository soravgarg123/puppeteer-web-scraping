"use strict";

/*
 * Purpose : For Miami Dade County Search API's
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

let miamiDadeController = {validate,tax,sketch}

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
      For Miami Dade Tax Data
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
        await page.goto(`https://miamidade.county-taxes.com/public/search/property_tax?search_query=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
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
            Response.BillPdfLink = (BillPdfLink) ? (`https://miamidade.county-taxes.com${BillPdfLink}`) : "";
        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: [Response], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Miami Dade Sketch Search
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
        await page.goto(`https://www.miamidade.gov/Apps/PA/propertysearch/#/?folio=${(req.query.ParcelID).replace(/-/g,"")}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('div.sketch-message:nth-child(1) > a', {timeout: 30000});

        /* Get Sketch Page Url */
        var SketchPageUrl = await page.evaluate(() => {
            return `https://www.miamidade.gov${document.querySelector('div.sketch-message:nth-child(1) > a').getAttribute('href')}`;
        });
        await page.goto(SketchPageUrl);
        
        /* Get Sketch Image Url */
        await page.waitForSelector('img#ctl00_ContentPlaceHolder1_imgTraverse', {timeout: 30000});

        var SketchImgUrl = await page.evaluate(() => {
            return document.querySelector('img#ctl00_ContentPlaceHolder1_imgTraverse').getAttribute('src');
        });

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:((SketchImgUrl) ? [SketchImgUrl] : []), Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = miamiDadeController;
