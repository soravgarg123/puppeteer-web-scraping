"use strict";

/*
 * Purpose : For Pinellas County Search API's
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

let pinellasController = {validate,tax,sketch}

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
      For Pinellas Tax Data
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
        await page.goto(`https://pinellas.county-taxes.com/public/search/property_tax?search_query=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
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
            Response.BillPdfLink = (BillPdfLink) ? (`https://pinellas.county-taxes.com${BillPdfLink}`) : "";
        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: [Response], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Pinellas Sketch Search
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
        await page.goto(`https://www.pcpao.org/?pg=https://www.pcpao.org/general.php?strap=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });

        /* Read Parent frame Content */
        let elementHandlev1 = await page.$('html > frameset > frame:nth-child(2)');
        let framev1 = await elementHandlev1.contentFrame();
        await framev1.waitForSelector('button[name="buttonName"]', {timeout: 30000}); 
        await framev1.click('button[name="buttonName"]', {timeout: 30000});

        let elementHandlev2 = await page.$('html > frameset > frame:nth-child(2)');
        let framev2 = await elementHandlev2.contentFrame();
        await framev2.waitForSelector('#bb1 > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > a', {timeout: 30000});
        var SketchImgUrl = await framev2.evaluate(() => {
            return `https://www.pcpao.org${document.querySelector('#bb1 > table:nth-child(1) > tbody > tr:nth-child(1) > td:nth-child(2) > table > tbody > tr:nth-child(2) > td > a').getAttribute('href')}`;
        });

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:[SketchImgUrl], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = pinellasController;
