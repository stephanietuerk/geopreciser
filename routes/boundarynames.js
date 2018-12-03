const express = require('express');
const router = express.Router();

/* GET boundaries jsons. */
router.get('/', function(req, res, next) {

  console.log("names", req.query);

  const iso3 = req.query.iso3;
  const admin = req.query.admin;
  console.log("please");
  console.log(iso3, admin);
  
  const boundJSON = require(`../datafiles/boundaries/gadm36_${iso3}_${admin}.json`);
  


  // console.log('hi', boundJSON);
  const boundNames = boundJSON.features.map((feature) => feature.properties.GID);
  console.log(boundNames); 

  res.send(boundNames);

});

module.exports = router;
