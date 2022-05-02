"use strict";

/*
 * Purpose : For Alaska (AK) States API's Routing 
 * Package : Router
 * Developed By  : Sorav Garg (soravgarg123@gmail.com)
*/

const express   = require('express'),
      router    = express.Router(),
      kenaiPeninsula = require('../controllers/kenaiPeninsulaController');

      /* Kenai Peninsula Routings */
      router.get(['/alaska/kenai-peninsula/tax','/taxes/2122'],kenaiPeninsula.validate('tax'),kenaiPeninsula.tax); 
      router.get(['/alaska/kenai-peninsula/sketch','/sketches/2122'],kenaiPeninsula.validate('sketch'),kenaiPeninsula.sketch); 

module.exports = router;      