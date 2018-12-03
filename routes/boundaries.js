const express = require('express');
const router = express.Router();


/* GET boundaries jsons. */
router.get('/', function(req, res, next) {

	console.log("bounds", req.query);

	const iso3 = req.query.iso3;
	const admin = req.query.admin;
	const bound = req.query.bound;
	const type = req.query.type;

	console.log(iso3, admin, bound, type);


	const boundJSON = require(`../datafiles/boundaries/gadm36_${iso3}_${admin}.json`);

	let toReturn;
	// console.log('hi', boundJSON);
	if (type === 'single') {
		const boundGeo = boundJSON.features.filter((feature) => feature.properties.GID === bound);
		toReturn = boundGeo[0];
	}
	if (type === 'coll') {
		toReturn = boundJSON;
	}
	// console.log(boundGeo);

	res.json(toReturn);

});

module.exports = router;
