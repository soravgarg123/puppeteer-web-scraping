"use strict";

/*
 * Purpose : For MERS API's (https://www.mers-servicerid.org/sis/)
 * Package : Controller
 * Developed By  : Sorav Garg (soravgarg123@gmail.com)
*/

const {
      async,
      puppeteer,
      RecaptchaPlugin,
      check,
      validationResult
    } = require("../../packages.js");

let mersController = {validate,search}

  /**
     * For Validation
   */
  function validate(method) {
      switch (method) {
         case 'search': {
            return [ 
              check('SearchType')
                .notEmpty().withMessage('Search Type field is required').trim()
                .bail()

                .isIn(['MIN','PROPERTY_ADDRESS','BORROWER_NAME_AND_PROPERTY_ADDRESS','CORPORATION_BORROWER_AND_PROPERTY_ADDRESS','BORROWER_NAME_AND_SSN','CORPORATION_BORROWER_AND_TIN','FHA_VA']).withMessage('Require valid Search Type').trim()
                .bail()
            ]
         }
         break;
        }
  }

  /**
      For MERS Search
  **/
  async function search(req, res) {
    
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

        /* Manage All Search Option Validations */
        switch (req.query.SearchType) {
          case 'MIN':
            req.query.Min = req.query.min || req.query.Min;
            if(!req.query.Min){
              return res.status(500).json({status:500,message:'Missing 18 digit MIN !!'});
            }
            if((req.query.Min).length < 18 || (req.query.Min).length > 20){
              return res.status(500).json({status:500,message:'Please enter a valid 18 numeric digit MIN.'});
            }
            break;

          case 'PROPERTY_ADDRESS':
            if(!req.query.StreetNo){
              return res.status(500).json({status:500,message:'Missing Street Number !!'});
            }
            if(!req.query.Street){
              return res.status(500).json({status:500,message:'Missing Street !!'});
            }
            if(!req.query.ZipCode){
              return res.status(500).json({status:500,message:'Missing Zip Code !!'});
            }
            if(!req.query.ExpandStreetSearch){
              return res.status(500).json({status:500,message:'Missing Expanded Street Search !!'});
            }
            if(!["Yes","No"].includes(req.query.ExpandStreetSearch)){
              return res.status(500).json({status:500,message:'Expanded Street Search value should be Yes/No !!'});
            }
            break;

          case 'BORROWER_NAME_AND_PROPERTY_ADDRESS':
            if(!req.query.BorrowerFirstName){
              return res.status(500).json({status:500,message:'Missing Borrower First Name !!'});
            }
            if(!req.query.BorrowerLastName){
              return res.status(500).json({status:500,message:'Missing Borrower Last Name !!'});
            }
            if(!req.query.StreetNo){
              return res.status(500).json({status:500,message:'Missing Street Number !!'});
            }
            if(!req.query.Street){
              return res.status(500).json({status:500,message:'Missing Street !!'});
            }
            if(!req.query.ZipCode){
              return res.status(500).json({status:500,message:'Missing Zip Code !!'});
            }
            if(!req.query.ExpandStreetSearch){
              return res.status(500).json({status:500,message:'Missing Expanded Street Search !!'});
            }
            if(!["Yes","No"].includes(req.query.ExpandStreetSearch)){
              return res.status(500).json({status:500,message:'Expanded Street Search value should be Yes/No !!'});
            }
            break;

          case 'CORPORATION_BORROWER_AND_PROPERTY_ADDRESS':
            if(!req.query.BorrowerCorporationEntityName){
              return res.status(500).json({status:500,message:'Missing Borrower Corporation/Non-Person Entity Name !!'});
            }
            if(!req.query.StreetNo){
              return res.status(500).json({status:500,message:'Missing Street Number !!'});
            }
            if(!req.query.Street){
              return res.status(500).json({status:500,message:'Missing Street !!'});
            }
            if(!req.query.ZipCode){
              return res.status(500).json({status:500,message:'Missing Zip Code !!'});
            }
            if(!req.query.ExpandStreetSearch){
              return res.status(500).json({status:500,message:'Missing Expanded Street Search !!'});
            }
            if(!["Yes","No"].includes(req.query.ExpandStreetSearch)){
              return res.status(500).json({status:500,message:'Expanded Street Search value should be Yes/No !!'});
            }
            break;

          case 'BORROWER_NAME_AND_SSN':
            if(!req.query.BorrowerFirstName){
              return res.status(500).json({status:500,message:'Missing Borrower First Name !!'});
            }
            if(!req.query.BorrowerLastName){
              return res.status(500).json({status:500,message:'Missing Borrower Last Name !!'});
            }
            if(!req.query.ZipCode){
              return res.status(500).json({status:500,message:'Missing Zip Code !!'});
            }
            if(!req.query.SSN1){
              return res.status(500).json({status:500,message:'Missing SSN 1 !!'});
            }
            if(!req.query.SSN2){
              return res.status(500).json({status:500,message:'Missing SSN 2 !!'});
            }
            if(!req.query.SSN3){
              return res.status(500).json({status:500,message:'Missing SSN 3 !!'});
            }
            break;

          case 'CORPORATION_BORROWER_AND_TIN':
            if(!req.query.BorrowerCorporationEntityName){
              return res.status(500).json({status:500,message:'Missing Borrower Corporation/Non-Person Entity Name !!'});
            }
            if(!req.query.TaxpayerIdentificationNumber){
              return res.status(500).json({status:500,message:'Missing Taxpayer Identification Number !!'});
            }
            if(!req.query.ZipCode){
              return res.status(500).json({status:500,message:'Missing Zip Code !!'});
            }
            break;

          case 'FHA_VA':
            if(!req.query.CertificateNo){
              return res.status(500).json({status:500,message:'Please enter a valid FHA/VA/MI Certificate Number !!'});
            }
            break;
        }

        /* Launch Browser */
        browser = await puppeteer.launch({
                      headless: (process.env.IS_HEADLESS == 0) ? false : true,
                      args: ["--no-sandbox"],
                      defaultViewport: null
                    });
        const page = await browser.newPage();
        await page.goto('https://www.mers-servicerid.org/sis/', { waitUntil: 'networkidle0', timeout: 0 });

        /* Solve Google reCaptcha */
        await page.solveRecaptchas()
        await page.click('input#submit');

        /* Manage All Search Options */
        switch (req.query.SearchType) {
            case 'MIN':
              await page.waitForSelector('[id="optmin"]', {timeout: 10000});
              await page.click('input#optmin');
              await page.focus('#min');
              await page.keyboard.type(req.query.Min);
              await page.click('input#srchmin');
              break;

            case 'PROPERTY_ADDRESS':
              await page.waitForSelector('[id="optproperty"]', {timeout: 10000});
              await page.click('input#optproperty',{delay:1000});
              await page.waitForSelector('[id="optproponly"]', {timeout: 10000});
              await page.evaluate(()=>document.querySelector('#optproponly').click())

              await page.focus('#number_po');
              await page.keyboard.type(req.query.StreetNo);

              await page.focus('#street_po');
              await page.keyboard.type(req.query.Street);


              if(req.query.Unit){
                await page.focus('#unit_po');
                await page.keyboard.type(req.query.Unit);
              }

              if(req.query.City){
                await page.focus('#city_po');
                await page.keyboard.type(req.query.City);
              }

              if(req.query.State){
                await page.select("select#state_po", req.query.State);
              }

              await page.focus('#zip_po');
              await page.keyboard.type(req.query.ZipCode);

              if(req.query.ExpandStreetSearch == "Yes"){
                await page.$eval('input[name="expanded_po"]', check => check.checked = true);
              }
              await page.click('input#srchproponly');
              break;

            case 'BORROWER_NAME_AND_PROPERTY_ADDRESS':
              await page.waitForSelector('[id="optproperty"]', {timeout: 10000});
              await page.click('input#optproperty');
              await page.click('input#optpropnameaddress');
              await page.click('input#optindname');

              await page.focus('#firstname_in');
              await page.keyboard.type(req.query.BorrowerFirstName);

              await page.focus('#lastname_in');
              await page.keyboard.type(req.query.BorrowerLastName);

              await page.focus('#number_in');
              await page.keyboard.type(req.query.StreetNo);

              await page.focus('#street_in');
              await page.keyboard.type(req.query.Street);

              if(req.query.Unit){
                await page.focus('#unit_in');
                await page.keyboard.type(req.query.Unit);
              }

              if(req.query.City){
                await page.focus('#city_in');
                await page.keyboard.type(req.query.City);
              }

              if(req.query.State){
                await page.select("select#state_in", req.query.State);
              }

              await page.focus('#zip_in');
              await page.keyboard.type(req.query.ZipCode);

              if(req.query.ExpandStreetSearch == "Yes"){
                await page.$eval('input[name="expanded_in"]', check => check.checked = true);
              }
              await page.click('input#srchindname');
              break;

            case 'CORPORATION_BORROWER_AND_PROPERTY_ADDRESS':
              await page.waitForSelector('[id="optproperty"]', {timeout: 10000});
              await page.click('input#optproperty');
              await page.click('input#optpropnameaddress');
              await page.click('input#optcorpname');

              await page.focus('#corpname_cn');
              await page.keyboard.type(req.query.BorrowerCorporationEntityName);

              await page.focus('#number_cn');
              await page.keyboard.type(req.query.StreetNo);

              await page.focus('#street_cn');
              await page.keyboard.type(req.query.Street);

              if(req.query.Unit){
                await page.focus('#unit_cn');
                await page.keyboard.type(req.query.Unit);
              }

              if(req.query.City){
                await page.focus('#city_cn');
                await page.keyboard.type(req.query.City);
              }

              if(req.query.State){
                await page.select("select#state_cn", req.query.State);
              }

              await page.focus('#zip_cn');
              await page.keyboard.type(req.query.ZipCode);

              if(req.query.ExpandStreetSearch == "Yes"){
                await page.$eval('input[name="expanded_cn"]', check => check.checked = true);
              }
              await page.click('input#srchcorpname');
              break;

            case 'BORROWER_NAME_AND_SSN':
              await page.waitForSelector('[id="optproperty"]', {timeout: 10000});
              await page.click('input#optproperty');
              await page.click('input#optpropzip');
              await page.click('input#optindzip');

              await page.focus('#firstname_iz');
              await page.keyboard.type(req.query.BorrowerFirstName);

              await page.focus('#lastname_iz');
              await page.keyboard.type(req.query.BorrowerLastName);

              await page.focus('#zip_iz');
              await page.keyboard.type(req.query.ZipCode);

              await page.focus('#ssn1');
              await page.keyboard.type(req.query.SSN1);

              await page.focus('#ssn2');
              await page.keyboard.type(req.query.SSN2);

              await page.focus('#ssn3');
              await page.keyboard.type(req.query.SSN3);

              await page.click('input#srchindzip');
              break;

            case 'CORPORATION_BORROWER_AND_TIN':
              await page.waitForSelector('[id="optproperty"]', {timeout: 10000});
              await page.click('input#optproperty');
              await page.click('input#optpropzip'); 
              await page.click('input#optcorpzip');

              await page.focus('#corpname_cz');
              await page.keyboard.type(req.query.BorrowerCorporationEntityName);

              await page.focus('#tin');
              await page.keyboard.type(req.query.TaxpayerIdentificationNumber);

              await page.focus('#zip_cz');
              await page.keyboard.type(req.query.ZipCode);

              await page.click('input#srchcorpzip');
              break;

            case 'FHA_VA':
              await page.waitForSelector('[id="optcertificate"]', {timeout: 10000});
              await page.click('input#optcertificate');
              await page.focus('#certificate');
              await page.keyboard.type(req.query.CertificateNo);
              await page.click('input#srchcertificate');
              break;
        }
        await page.waitForSelector('[class="results"]', {timeout: 15000});
        
        /* See Results */
        let response = await page.evaluate(() => {
            return Array.from(
                document.querySelectorAll('div.results'),
            ).map(el => ({
                Min: el.querySelector('table:nth-child(1) tbody tr td:nth-child(1) span:nth-child(2)').textContent.trim(),
                NoteDate: el.querySelector('table:nth-child(1) tbody tr td:nth-child(2) span:nth-child(2)').textContent.trim(),
                MinStatus: el.querySelector('table:nth-child(1) tbody tr td:nth-child(3) span:nth-child(2)').textContent.trim(),
                Servicer: (el.querySelector('table:nth-child(2) tbody tr:nth-child(1) td:nth-child(1) span:nth-child(2)') || el.querySelector('table:nth-child(2) tbody tr:nth-child(1) td:nth-child(1) a')).textContent.trim() + " " + el.querySelector('table:nth-child(2) tbody tr:nth-child(2) td:nth-child(1) span:nth-child(1)').textContent.trim(),
                Phone: el.querySelector('table:nth-child(2) tbody tr:nth-child(1) td:nth-child(2) span:nth-child(2)').textContent.trim()
            }));
        });
        await browser.close();
        return res.status(200).json({ResponseCode: 200, Data: response, Message: "Success."});
      } catch (e) {
        console.log('err',e)
        browser.close();
        return res.status(500).json({ResponseCode: 500, Data: [], Message: "Some error occured Or MINs data not found, please try again."});
      }
  }

module.exports = mersController;
