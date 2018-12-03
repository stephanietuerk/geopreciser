const express = require('express');
const router = express.Router();
const fs = require('fs');


/* GET boundaries jsons. */
router.get('/', function(req, res, next) {

  console.log("exists", req.query);

  const iso3 = req.query.iso3;
  const admin = req.query.admin;
  console.log(iso3, admin);
  
  try {
    if (fs.existsSync(`../datafiles/boundaries/gadm36_${iso3}_${admin}.json`)) {
      res.send(200);
    }
  } catch (error) {
    res.send(500);
  }

});

module.exports = router;
