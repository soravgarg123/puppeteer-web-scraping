"use strict";

/*
 * Purpose : For Sarasota County Search API's
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

let sarasotaController = {validate,tax,sketch}

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
      For Sarasota Tax Search
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
      try {

        /* Launch Browser */
        var browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        var page = await browser.newPage();
        await page.goto(`http://sarasotataxcollector.governmax.com/collectmax/search_collect.asp?wait=done&l_nm=account&form=searchform&formelement=0&sid=16262DDE84E64F038D3E52463772D32B`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('input[name="account"]', {timeout: 30000});

        await page.focus('input[name="account"]');
        await page.keyboard.type(req.query.ParcelID);
        await page.click('input[name="go"]');

        await page.waitForSelector('body > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(3) > tbody > tr:nth-child(8) > td > table:nth-child(1) > tbody', {timeout: 30000});

        /* See Results */
        let Response = await page.evaluate(() => {
            return Array.from(
                document.querySelectorAll('body > table:nth-child(2) > tbody > tr:nth-child(2) > td:nth-child(2) > table > tbody > tr > td > table:nth-child(3) > tbody > tr:nth-child(8) > td > table:nth-child(1) > tbody > tr'),
            ).slice(1).map(el => ({
                TaxingAuthority: el.querySelector('td:nth-child(1) font').innerText.replace(/\n/g, " ").trim() || "",
                Rate: el.querySelector('td:nth-child(2) font').innerText.replace(/\n/g, "").trim() || "",
                AssessedValue: el.querySelector('td:nth-child(3) font').innerText.replace(/\n/g, "").trim() || "",
                ExemptionAmount: el.querySelector('td:nth-child(4) font').innerText.replace(/\n/g, "").trim() || "",
                TaxableValue: el.querySelector('td:nth-child(5) font').innerText.replace(/\n/g, "").trim() || "",
                TaxesLevied: el.querySelector('td:nth-child(6) font').innerText.replace(/\n/g, "").trim() || ""
            }));
        });

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: Response, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Sarasota Sketch Search
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
        await page.goto(`https://www.sc-pa.com/propertysearch/parcel/details/${req.query.ParcelID}`);
        await page.waitForSelector('#Buildings > tbody > tr > td:nth-child(1) > a', {timeout: 30000});
        await page.click('#Buildings > tbody > tr > td:nth-child(1) > a', {dealy: 100});

        await page.waitForSelector('img#sketch_1', {timeout: 30000});
        var SketchImgUrl = await page.evaluate(() => {
            return document.querySelector('img#sketch_1').getAttribute('src');
        });
        SketchImgUrl = (SketchImgUrl) ? [`https://www.sc-pa.com${SketchImgUrl}`] : [];

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:SketchImgUrl, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = sarasotaController;
