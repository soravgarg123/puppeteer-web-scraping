"use strict";

/*
 * Purpose : For Lake County Search API's
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

var page;

let lakeController = {validate,tax,sketch}

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
      For delay time
  **/
  function delay(time) {
     return new Promise(function(resolve) { 
         setTimeout(resolve, time)
     });
  }

  /**
    To Take Partial (DOM Element) Screenshot
  **/
  async function screenshotDOMElement(selector, padding = 0, filepath) {
    const rect = await page.evaluate(selector => {
      const element = document.querySelector(selector);
      const {x, y, width, height} = element.getBoundingClientRect();
      return {left: x, top: y, width, height, id: element.id};
    }, selector);

    return await page.screenshot({
      path: `${process.cwd()}${filepath}`,
      clip: {
        x: rect.left - padding,
        y: rect.top - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2
      }
    });
  }

  /**
      For Lake Tax Data
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
        await page.goto(`https://lake.county-taxes.com/public/search/property_tax?search_query=${req.query.ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
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
            Response.BillPdfLink = (BillPdfLink) ? (`https://lake.county-taxes.com${BillPdfLink}`) : "";
        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:[Response], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }

  /**
      For Lake Sketch Search
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

        let ParcelID = req.query.ParcelID;
        if(ParcelID.includes("-")){
          var [Section, Township, Range, Subdivision, Block, Lot] = ParcelID.split("-");
        }else{
          var Section = ParcelID.substr(0, 2);
          var Township = ParcelID.substr(2, 2);
          var Range = ParcelID.substr(4, 2);
          var Subdivision = ParcelID.substr(6, 4);
          var Block = ParcelID.substr(10, 3);
          var Lot = ParcelID.substr(13, 5);
        }

        /* Launch Browser */
        var browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        page = await browser.newPage();
        await page.goto(`https://lakecopropappr.com/property-search.aspx`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('input#ctl00_cphMain_imgBtnSubmit', {timeout: 30000});
        await page.click('input#ctl00_cphMain_imgBtnSubmit');

        await page.waitForSelector('div#property_search', {timeout: 30000});

        await page.focus('input#ctl00_cphMain_txtSection');
        await page.keyboard.type(Section);

        await page.focus('input#ctl00_cphMain_txtTownship');
        await page.keyboard.type(Township);

        await page.focus('input#ctl00_cphMain_txtRange');
        await page.keyboard.type(Range);

        await page.focus('input#ctl00_cphMain_txtSubdivisionNum');
        await page.keyboard.type(Subdivision);

        await page.focus('input#ctl00_cphMain_txtBlock');
        await page.keyboard.type(Block);

        await page.focus('input#ctl00_cphMain_txtLot');
        await page.keyboard.type(Lot);

        await page.click('input#ctl00_cphMain_btnSearch');

        await page.waitForSelector('table#ctl00_cphMain_gvParcels > tbody > tr.gv_row', {timeout: 30000});
        await page.click('a#ctl00_cphMain_gvParcels_ctl02_lView');

        await page.waitForSelector('div#svgGroup-1', {timeout: 30000});
        await delay(4000); // delay 4 seconds

        /* Take Sketch Screeenshot */
        let imgPath = `/media/lake-sketches/sketch-${ParcelID}.png`
        await screenshotDOMElement('div#svgGroup-1',6, imgPath);

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data:[`${req.protocol}://${req.headers.host}${imgPath}`], Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data:[], Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = lakeController;
