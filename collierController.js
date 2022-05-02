"use strict";

/*
 * Purpose : For Collier County Search API's
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

let collierController = {validate,tax,sketch}

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
      For Collier Tax Data
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
        await page.goto(`https://collier.county-taxes.com/public/search/property_tax?search_query=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
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
            Response.BillPdfLink = (BillPdfLink) ? (`https://collier.county-taxes.com${BillPdfLink}`) : "";
        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:[Response], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Collier Sketch Search
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
        await page.goto(`https://www.collierappraiser.com/`, { waitUntil: 'networkidle0', timeout: 0 });

        /* Read Parent frame Content */
        let elementHandlev1 = await page.$('html > frameset > frame:nth-child(1)');
        let framev1 = await elementHandlev1.contentFrame();

        /* Read Sidebar Menu frame Content */
        let elementHandlev2 = await framev1.$('html > frameset > frame[name="main"]');
        let framev2 = await elementHandlev2.contentFrame();
        await framev2.waitForSelector("#AutoNumber3 > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(4) > td > a", {timeout: 30000});
        await framev2.click('#AutoNumber3 > tbody > tr > td:nth-child(3) > table > tbody > tr:nth-child(4) > td > a');

        /* Read Agree/DisAgree frame Content */
        let elementHandlev3 = await page.$('frame#rbottom');
        let framev3 = await elementHandlev3.contentFrame();
        await framev3.waitForSelector("#a_searchlink", {timeout: 30000});
        await framev3.click('#a_searchlink');

        /* Read Search Form frame Content */
        let elementHandlev4 = await page.$('frame#rbottom');
        let framev4 = await elementHandlev4.contentFrame();
        await framev4.waitForSelector('a[href="#TabParcel"]', {timeout: 30000});
        await framev4.click('a[href="#TabParcel"]');
        await framev4.type('input#ParcelID', req.query.ParcelID, { delay: 100 });
        await framev4.click('a#SearchParcelID');

        /* Read Data frame Content */
        let elementHandlev5 = await page.$('frame#rbottom');
        let framev5 = await elementHandlev5.contentFrame();
        await framev5.waitForSelector('a[href="#tab4"]', {timeout: 30000});
        await framev5.click('a[href="#tab4"]');

        /* Read Sketch Parent frame Content */
        let elementHandlev6 = await page.$('frame#rbottom');
        let framev6 = await elementHandlev6.contentFrame();

        /* Read Sketch Child frame Content */
        let elementHandlev7 = await framev6.$('iframe#frtab');
        let framev7 = await elementHandlev7.contentFrame();
        await framev7.waitForSelector('img#aitImg', {timeout: 30000});

        /* Load Cheerio HTML */
        var $ = cheerio.load(await framev7.content());

        /* Get Sketch Screenshot */
        await page.goto(`https://www.collierappraiser.com/main_search/${$('img#aitImg').attr('src')}`);
        let imgPath = `/media/collier-sketches/sketch-${req.query.ParcelID}.jpeg`;
        await page.screenshot({path: `${process.cwd()}${imgPath}`});

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:[`${req.protocol}://${req.headers.host}${imgPath}`], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = collierController;
