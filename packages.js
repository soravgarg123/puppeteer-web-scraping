"use strict";

/*
 * Purpose : To load all Node.Js Packages
 * Package : NPM Packages
 * Developed By  : Sorav Garg (soravgarg123@gmail.com)
*/

const async = require("async"), 
      puppeteer = require('puppeteer-extra'),
      RecaptchaPlugin = require('puppeteer-extra-plugin-recaptcha'), 
      cheerio = require('cheerio'), 
      fs = require('fs'), 
      axios = require('axios'), 
      qs = require('qs'), 
      fsExtra = require('fs-extra'), 
      antiCaptcha = require('@antiadmin/anticaptchaofficial'),
      { check,validationResult } = require('express-validator'),
      StealthPlugin = require('puppeteer-extra-plugin-stealth');

/* Require Enviornment File  */
require('dotenv').config();

/* Puppeteer Recaptcha Plugin */
puppeteer.use(
  RecaptchaPlugin({
    provider: {
      id: '2captcha',
      token: process.env.TWO_CAPTCHA_API_KEY // REPLACE THIS WITH YOUR OWN 2CAPTCHA API KEY
    },
    visualFeedback: true // colorize reCAPTCHAs (violet = detected, green = solved)
  })
);

puppeteer.use(StealthPlugin())

/* Anitcaptcha Set API Key */
antiCaptcha.setAPIKey(process.env.ANTI_CAPTCHA_API_KEY);

module.exports = {
  async,
  puppeteer,
  RecaptchaPlugin,
  cheerio,
  fs,
  axios,
  qs,
  fsExtra,
  antiCaptcha,
  check,
  validationResult
}