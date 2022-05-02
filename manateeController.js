"use strict";

/*
 * Purpose : For Manatee County Search API's
 * Package : Controller
 * Developed By  : Sorav Garg (soravgarg123@gmail.com)
*/

const {
      async,
      puppeteer,
      cheerio,
      check,
      fs,
      fsExtra,
      validationResult
    } = require("../../packages.js");

let manateeController = {validate,sketch}

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
      For delay time
  **/
  function delay(time) {
     return new Promise(function(resolve) { 
         setTimeout(resolve, time)
     });
  }

  /**
      For Manatee Sketch Search
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
      let Response = [];
      let ParcelID = req.query.ParcelID;
      try {

        /* Launch Browser */
        var browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        var page = await browser.newPage();
        await page.goto(`https://www.manateepao.com/parcel/?parid=${ParcelID}`, { waitUntil: 'networkidle0', timeout: 0 });
        await page.waitForSelector('a#buildingSketch-tab', {timeout: 30000});

        await page.click('a#buildingSketch-tab', {delay : 200});
        await page.waitForSelector('div#buildingSketch > div#buildingSketchViewer > div.sp-slides-container > div.sp-mask > div.sp-slides > div.sp-slide', {timeout: 30000});

        await delay(5000); // Delay 5 seconds

        /* Load Cheerio HTML */
        var $ = cheerio.load(await page.content());

        /* See Results */
        let TotalRecords = $('div#buildingSketch > div#buildingSketchViewer > div.sp-slides-container > div.sp-mask > div.sp-slides > div.sp-slide').length;
        if(TotalRecords > 0){

          /* Create Directory */
          let dir = `${process.cwd()}/media/manatee-sketches/${ParcelID}`;
          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
            fs.chmodSync(dir, '0777');
          }else{
            fsExtra.emptyDirSync(dir);
          }

          for (var i = 0; i < TotalRecords; i++) {

            /* Convert Base64 string to Image */
            let base64Str = $('div#buildingSketch > div#buildingSketchViewer > div.sp-slides-container > div.sp-mask > div.sp-slides > div.sp-slide[data-index="'+i+'"] > div.sp-image-container > img.sp-image').attr('src');
            base64Str = base64Str.replace(/^data:image\/png;base64,/, "");

            let imgPath = `/media/manatee-sketches/${ParcelID}/sketch-${i}.png`;
            fs.writeFileSync(`${process.cwd()}${imgPath}`, base64Str, 'base64');
            Response.push(`${req.protocol}://${req.headers.host}${imgPath}`);
          }
        }

        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: Response, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: Response, Message: "Some error occured Or data not found, please try again."});
      }
  }


module.exports = manateeController;
