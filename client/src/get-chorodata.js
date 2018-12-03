export async function getChoroData(inputPoints) {
  console.log("choropleth things");
  //make dict of boundaries and counts
  let polyList = inputPoints.map(d => {
      let boundName = d.bound
      // console.log(boundName);
      if ((boundName.split(".").length - 1) > 1) {
          let frags = boundName.split('.');
          boundName = frags[0]+'.'+frags[1]+'_1';
          // console.log(boundName);
      }
      return boundName;
  });
  console.log("polys to get", polyList);
  let polySet = [...new Set(polyList)];
  let uniquePolys = polySet.filter(e => e !== "");
  // console.log(uniquePolys);
  let eventsPerBound = {};
  let eventsPerCountry = {};
  //get only Admin1 boundaries in uniquePolys
  uniquePolys.forEach(bound => {

      eventsPerBound[bound] = 0;
      if (!bound.includes('.')) {
          eventsPerCountry[bound] = 0;
      }
  });

  inputPoints.forEach(event => {
      //if event.bound has _, use non-underscore bound name
      let boundName = event.bound;
      if ((boundName.split(".").length - 1) > 1) {
          let frags = boundName.split('.');
          boundName = frags[0]+'.'+frags[1]+'_1';
          // console.log(boundName);
      }
      eventsPerBound[boundName] += event.count;
  });
  // console.log(eventsPerBound);

  // import boundaries and calculate rate per boundary
  const jsonToReturn = importBounds(uniquePolys)
  .then(geoPolys => {
      // console.log("ok");
      // console.log(geoPolys);
      let bound;
      let boundArea = 0;
      let listOfPolys = [];
      geoPolys.forEach(geoPoly => {
          // console.log('233 geoPoly', geoPoly);
          if (geoPoly.geometry.type === "MultiPolygon") {
              bound = TurfMP(geoPoly.geometry.coordinates);
              // console.log('236 bound', bound);
              boundArea = TurfArea(bound);
          }
          if (geoPoly.geometry.type === "Polygon") {
              bound = TurfPolygon(geoPoly.geometry.coordinates);
              // console.log('241 bound', bound);
              boundArea = TurfArea(bound);
          }
          let numEvents = eventsPerBound[geoPoly.properties.GID];
          geoPoly.properties.eventsPerArea = numEvents*(1000*1000)/boundArea;
          listOfPolys.push(geoPoly);
          if (!((geoPoly.properties.GID).includes('.'))) {
              console.log(geoPoly.properties.GID);
              eventsPerCountry[geoPoly.properties.GID] = geoPoly.properties.eventsPerArea;
          }
      });
      console.log(listOfPolys);
      console.log("yooooo");

      return listOfPolys;
  })
  .then(polys => {
      console.log(polys);
      console.log(eventsPerCountry);
      let polysWithArea = [];
      //deal with country level bounds
      polys.forEach(bound => {
          if ((bound.properties.GID).includes('.')) {
              let isoCode = (bound.properties.GID).substring(0,3);
              if (eventsPerCountry[isoCode]) {
                  console.log(isoCode);
                  let newVal = eventsPerCountry[isoCode] + bound.properties.eventsPerArea;
                  bound.properties.eventsPerArea = newVal;
              }
          }
          polysWithArea.push(bound);
      });
      console.log("basically done with returning polys");
      // let maxRate = Math.max.apply(Math, polysWithArea.map(poly => poly.properties.eventsPerArea));
      // let minRate = Math.min.apply(Math, polysWithArea.map(poly => poly.properties.eventsPerArea));
      let colorScale = getColorScaleDomain(polysWithArea.map(poly => poly.properties.eventsPerArea).sort((a, b) => a - b));
      return [polysWithArea, colorScale];
  })
  .then(polyList => {
      let jsonData = breakAllPolysIntoChunks(polyList[0]);
      console.log('jsondata', jsonData);
      return [jsonData, polyList[1]];
  });
  
  return jsonToReturn;
  // return polygonList;
  
}