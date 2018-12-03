export default async function boundaryExists (country, adminLevel) {

    const params = {iso3: country, admin: adminLevel, bound: 'na'};

    // console.log(params);
    const esc = encodeURIComponent;
    const query = Object.keys(params)
        .map(k => esc(k) + '=' + esc(params[k]))
        .join('&');
    
    // console.log(query);


    const result = await fetch(`/boundaryexists?${query}`);
    console.log(result);
    
    if (result === 200) {
      return true;
    } 
    else if (result === 500) {
      return false;
    }
  

}