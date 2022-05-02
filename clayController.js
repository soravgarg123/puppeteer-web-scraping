"use strict";

/*
 * Purpose : For Clay County Search API's
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

let clayController = {validate,sketch}

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
      For Clay Sketch Search
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
        await page.goto(`https://qpublic.schneidercorp.com/Application.aspx?AppID=830&LayerID=15008&PageTypeID=2&PageID=6754`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.click('a.button-1');

        await page.waitForSelector('input.tt-upm-parcelid-search', {timeout: 10000});
        await page.focus('input.tt-upm-parcelid-search');
        await page.keyboard.type(req.query.ParcelID);
        await page.click('a.tt-upm-parcelid-search-btn');

        await page.waitForSelector('div.sketch-thumbnail', {timeout: 10000});

        /* Load Cheerio HTML */
        var $ = cheerio.load(await page.content());
        let ImgUrl = $('div.sketch-thumbnail').children('img').attr('src');
        let Response = (ImgUrl.startsWith('https') || ImgUrl.startsWith('http')) ? [ImgUrl] : [(`https://qpublic.schneidercorp.com${ImgUrl}`)];

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: Response, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = clayController;
