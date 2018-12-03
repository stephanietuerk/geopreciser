export default async function ImportBoundCollections(country, level) {
  const params = {
    iso3: country,
    admin: level,
    bound: '',
    type: 'coll',
  };
  const esc = encodeURIComponent;
  const query = Object.keys(params)
    .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
  try {
    const result = await fetch(`/boundaries?${query}`);
    const geoJson = await result.json();
    return geoJson;
  }
  catch (e) {
    console.log(e);
    console.log(params);
  }
}
