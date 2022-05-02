"use strict";

/*
 * Purpose : For Shawnee County Search API's
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

let shawneeController = {validate,sketch}

  /**
     * For Validation
  */
  function validate(method) {
      switch (method) {
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
      For Shawnee Sketch Search
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
        await page.goto(`https://ares.sncoapps.us`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('form#basic-search', {timeout: 10000});

        await page.click('input#grayCheckBox');
        await page.focus('input#SearchCriteria');
        await page.keyboard.type(req.query.ParcelID);
        await page.select("select[name='searchBy']", "parcel");
        await page.evaluate(()=>document.querySelector('button.search-button').click())
        
        await page.waitForSelector('table#basic-search-card-results > tbody > tr[tabindex="0"]', {timeout: 10000});
        let PropertyUrl = await page.evaluate(() => {
          return document.querySelector('table#basic-search-card-results > tbody > tr:nth-child(1)').getAttribute('data-url');
        });
        await page.goto(PropertyUrl, { waitUntil: 'networkidle0', timeout: 0 });

        await page.waitForSelector('div#propBldg', {timeout: 10000});
        await page.click('div#propBldg', {delay: 500});

        await page.waitForSelector('img#sketchSmall', {timeout: 10000});

        /* Load Cheerio HTML */
        var $ = cheerio.load(await page.content());
        let ImgUrl = $('a.sketch-frame').attr('href');
        let Response = (ImgUrl) ? [`https://ares.sncoapps.us/${ImgUrl}`] : [];

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:Response, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = shawneeController;
