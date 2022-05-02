"use strict";

/*
 * Purpose : For Hillsborough County Search API's
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

let hillsboroughController = {validate,tax,sketch}

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
      For Hillsborough Tax Search
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
        await page.goto(`https://hillsborough.county-taxes.com/public/search/property_tax?search_query=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
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
            Response.BillPdfLink = (BillPdfLink) ? (`https://hillsborough.county-taxes.com${BillPdfLink}`) : "";
        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:[Response], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Hillsborough Sketch Search
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
        await page.goto(`https://gis.hcpafl.org/propertysearch/#/nav/Basic%20Search`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('input[name="basicPinGroup"]', {timeout: 30000});
        await page.click('input[name="basicPinGroup"][value="pin"]');

        await page.focus('#basic > label:nth-child(4) > input.pin-sized.ui-autocomplete-input');
        await page.keyboard.type(req.query.ParcelID);
        await page.click('#basic > button.btn.btn-primary');

        await page.waitForSelector('#table-basic-results > tbody > tr:nth-child(1)', {timeout: 30000});
        await page.click('#table-basic-results > tbody > tr:nth-child(1)');

        await page.waitForSelector('#details > div:nth-child(10) > div:nth-child(7) > a > img', {timeout: 30000});
        await page.click('#details > div:nth-child(10) > div:nth-child(7) > a');

        /* Load Cheerio HTML */
        var $ = cheerio.load(await page.content());

        /* Get Sketch Screenshot */
        await page.goto($('#details > div:nth-child(10) > div:nth-child(7) > a').attr('href'));
        await page.waitForSelector('#img', {timeout: 30000});
        let imgPath = `/media/hillsborough-sketches/sketch-${req.query.ParcelID}.jpeg`;
        await page.screenshot({path: `${process.cwd()}${imgPath}`});

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:[`${req.protocol}://${req.headers.host}${imgPath}`], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = hillsboroughController;
