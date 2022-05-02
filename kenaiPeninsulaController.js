"use strict";

/*
 * Purpose : For Kenai Peninsula Taxes Search API's
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

let kenaiPeninsulaController = {validate,tax,sketch}

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
      For Kenai Peninsula Tax Data
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
      let ParcelID = (req.query.ParcelID).replace("-","");
      let Response = [];
      try {

        /* Launch Browser */
        var browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        var page = await browser.newPage();
        await page.goto(`https://ak-kenai.manatron.com/Tabs/ViewPayYourTaxes/AccountDetail.aspx?p=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector("div#lxT529 > div > table > tbody > tr", {timeout: 30000});

        var $ = cheerio.load(await page.content());

        /* Prepare Response */
        let TotalRecords = $('div#lxT529 > div > table > tbody > tr').length;
        if(TotalRecords > 0){
            let lastFiveYearValue = new Date().getFullYear() - 5; // Get Last 5 Years data only
            for (var i = 1; i <= TotalRecords; i++) {
                let Year = $('div#lxT529 > div > table > tbody > tr:nth-child('+i+') td:nth-child(1) > a > span').text().replace(/\n/g, "").trim() || "";
                if(!Year || parseInt(Year) < lastFiveYearValue){
                  continue;
                } 
                let Row = {};
                Row.Year = Year;
                Row.NetTax  = $('div#lxT529 > div > table > tbody > tr:nth-child('+i+') td:nth-child(2)').text().replace(/\n/g, "").trim() || "";
                Row.TotalPaid = $('div#lxT529 > div > table > tbody > tr:nth-child('+i+') td:nth-child(3)').text().replace(/\n/g, "").trim() || "";
                Row.Penalty = $('div#lxT529 > div > table > tbody > tr:nth-child('+i+') td:nth-child(4)').text().replace(/\n/g, "").trim() || "";
                Row.Interest = $('div#lxT529 > div > table > tbody > tr:nth-child('+i+') td:nth-child(4)').text().replace(/\n/g, "").trim() || "";
                Row.AmountDue = $('div#lxT529 > div > table > tbody > tr:nth-child('+i+') td:nth-child(4)').text().replace(/\n/g, "").trim() || "";
                Response.push(Row);
            }
        }

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:Response, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:Response, Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Kenai Peninsula Sketch Data
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
        await page.goto(`http://ak-kenai-assessment.publicaccessnow.com/PropertySearch/PropertyDetails.aspx?p=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector("img#sketch", {timeout: 30000});

        let SketchImgUrl = await page.evaluate(() => {
            return document.querySelector('img#sketch').getAttribute('src');
        });
        SketchImgUrl = (SketchImgUrl) ? [SketchImgUrl] : [];

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:SketchImgUrl, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

module.exports = kenaiPeninsulaController;
