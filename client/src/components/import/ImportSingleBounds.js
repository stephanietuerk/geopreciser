import GetAdminLevel from '../utils/GetAdminLevel';

export default async function ImportSingleBounds(boundList) {
  const geoProms = boundList.map(async (boundName) => {
    const iso3 = boundName.substr(0, 3);
    const adminLevel = GetAdminLevel(boundName);
    const params = {
      iso3,
      admin: adminLevel,
      bound: boundName,
      type: 'single',
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => `${esc(k)}=${esc(params[k])}`)
      .join('&');
    try {
      const result = await fetch(`/boundaries?${query}`);
      const boundGeo = await result.json();
      return boundGeo;
    }
    catch (e) {
      console.log('err w', query);
      console.log(e);
    }
  });
  const geometries = await Promise.all(geoProms);
  return geometries;
}
