export default async function ImportBoundaryNames (countryList, adminLevel) {
  const adminNamesArrProm = countryList.map(async (iso3) => {
    const params = {
      iso3,
      admin: adminLevel,
      bound: 'na',
    };
    const esc = encodeURIComponent;
    const query = Object.keys(params)
      .map(k => esc(k) + '=' + esc(params[k]))
      .join('&');
    const result = await fetch(`/boundarynames?${query}`);
    const adminNames = await result.json();
    return adminNames;
  });
  const adminNamesArr = await Promise.all(adminNamesArrProm);
  const adminNamesFinal = adminNamesArr.flat();
  return adminNamesFinal;
}
