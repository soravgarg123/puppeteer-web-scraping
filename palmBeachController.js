"use strict";

/*
 * Purpose : For Palm Beach County Search API's
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

let palmBeachController = {validate,sketch}

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
      For Palm Beach Sketch Search
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
        await page.goto(`https://www.pbcgov.org/papa/Asps/PropertyDetail/PropertyDetail.aspx?parcel=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('img#MainContent_imgDrawing', {timeout: 30000});

        var SketchImgUrl = await page.evaluate(() => {
            return document.querySelector('img#MainContent_imgDrawing').getAttribute('src');
        });
        SketchImgUrl = (SketchImgUrl) ? [`https://www.pbcgov.org/papa/Asps/PropertyDetail/${SketchImgUrl}`] : [];

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:SketchImgUrl, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = palmBeachController;
