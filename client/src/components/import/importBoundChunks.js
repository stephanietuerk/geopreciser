export default async function importBoundChunks (boundChunkList) {

  let geometries = [];
  // console.log(boundList);
  const getAdminLevel = (bound) => {
    return (bound.match(RegExp('\\.','g')) || [] ).length;
  }
  
  await Promise.all(boundList.map(async (boundName) => {
    let iso3 = boundName.substr(0,3);
    // console.log(boundName);
    const adminLevel = getAdminLevel(boundName);

    let params = {iso3: iso3, admin: adminLevel, bound: boundName};

    const esc = encodeURIComponent;
    let query = Object.keys(params)
        .map(k => esc(k) + '=' + esc(params[k]))
        .join('&');
    
    // console.log(query);

    let result = await fetch(`/boundaries?${query}`)
    let boundGeo = await result.json()
    geometries.push(boundGeo);
    // console.log("pushed", boundGeo);
  }));

  // console.log("returned geos", geometries);
  return geometries;

}