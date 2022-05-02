"use strict";

/*
 * Purpose : For Seminole County Search API's
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

let seminoleController = {validate,tax,sketch}

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
      For Seminole Tax Search
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
      let Response = {};
      try {

        /* Launch Browser */
        var browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        var page = await browser.newPage();
        await page.goto(`https://payments.seminolecounty.tax/_asp/rcPropIDlist.asp?DataSearch=${(req.query.ParcelID).replace(/-/g,"")}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('table > tbody > tr:nth-child(2)', {timeout: 30000});

        /* Load Cheerio HTML */
        var $ = cheerio.load(await page.content());
        let PaidStatus = $('table > tbody > tr:nth-child(2) > td:nth-child(5) > h4').text().replace(/\n/g, "").trim() || "";

        await page.click('table > tbody > tr:nth-child(2) > td:nth-child(2) > a');
        await page.waitForSelector('div#PayLinks', {timeout: 30000});

        /* Load Cheerio HTML */
        var $ = cheerio.load(await page.content());
        Response.Year = $('tr#Year > td:nth-child(2) > p > strong').text().replace(/\n/g, "").trim() || "";
        Response.TaxBill = $('tr#Bill > td:nth-child(2) > p > strong').text().replace(/\n/g, "").trim() || "";
        Response.PaidStatus = PaidStatus;
        Response.PaidDate = $('table:nth-child(13) > tbody > tr:nth-child(2) > td:nth-child(1) > h3').text().replace(/\n/g, "").trim() || "";
        Response.Receipt = $('table:nth-child(13) > tbody > tr:nth-child(2) > td:nth-child(2) > p').text().replace(/\n/g, "").trim() || "";
        Response.PaidAmount = $('table:nth-child(13) > tbody > tr:nth-child(2) > td:nth-child(3) > h3').text().replace(/\n/g, "").trim() || "";
        Response.BillPdfLink = (Response.TaxBill && PaidStatus != 'NO TAX DUE') ? (`https://payments.seminolecounty.tax/taxpdfs/${Response.TaxBill}.pdf`) : "";

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: [Response], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Seminole Sketch Search
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
        await page.goto(`https://parceldetails.scpafl.org/ParcelDetailInfo.aspx?PID=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('div#mapTools', {timeout: 30000});
        await page.click('div#ctl00_Content_cmdFootprint', {dealy: 100});
        await page.waitForSelector('iframe#ctl00_Content_popupControl_CIF-1', {timeout: 30000});

        /* Read iframe Content */
        let elementHandle = await page.$('iframe#ctl00_Content_popupControl_CIF-1');
        let frame = await elementHandle.contentFrame();

        await frame.waitForSelector('img#frmFootPrint_imgFootprint', {timeout: 30000});
        var SketchImgUrl = await frame.evaluate(() => {
            return document.querySelector('img#frmFootPrint_imgFootprint').getAttribute('src');
        });
        SketchImgUrl = (SketchImgUrl) ? [`https://parceldetails.scpafl.org/${SketchImgUrl}`] : [];

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:SketchImgUrl, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = seminoleController;
