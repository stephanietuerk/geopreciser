import { isEmpty, countBy } from 'lodash';
import { points as TurfPoints, multiPolygon as TurfMP, polygon as TurfPolygon } from '@turf/helpers';
import pointsWithinPolygon from '@turf/points-within-polygon';
import TurfArea from '@turf/area';
import TurfBbox from '@turf/bbox';
import GetAdminLevel from './GetAdminLevel';
import CountEventsPerBound from './CountEventsPerBound';
import ImportBoundCollections from '../import/ImportBoundCollections';

const adminToGeoPMap = {
  0: 4,
  1: 3,
  2: 2,
};

function makeRandPtInBox(bbox) {
  const [minX, minY, maxX, maxY] = bbox;
  const randX = minX + (Math.random() * (maxX - minX));
  const randY = minY + (Math.random() * (maxY - minY));
  return [randX, randY];
}

function isRandInPoly(position, poly) {
  const point = TurfPoints([position]);
  const pointInPoly = pointsWithinPolygon(point, poly);
  const ppExists = !isEmpty(pointInPoly.features);
  return !isEmpty(pointInPoly.features);
}

function randomChoice(p) {
  let rand = Math.random();
  return p.findIndex(a => (rand -= a) < 0);
}

function randomChoices(p, count) {
  return Array.from(Array(count), randomChoice.bind(null, p));
}

function makeRandPtsInPoly(eventsCount, geoPoly) {
  const bound = TurfPolygon(geoPoly.geometry.coordinates);
  const bbox = TurfBbox(bound);
  const randPts = [...Array(eventsCount)].map((_, i) => {
    let isValid = false;
    let position;
    while (!isValid) {
      position = makeRandPtInBox(bbox);
      // console.log(position);
      // console.log('i', i);
      // console.log('is this point valid?', isRandInPoly(position, bound));
      // console.log('isValid', isValid);
      isValid = isRandInPoly(position, bound);
    }
    // console.log('isValid outside of loop', i, isValid);
    return {
      position,
      count: 1,
      bound: geoPoly.properties.GID,
    };
  });
  return randPts;
}

function makeRandPtsInMP(eventsCount, geoPoly) {

  const bound = TurfMP(geoPoly.geometry.coordinates);

  const mpArea = TurfArea(bound);
  const polyProbs = bound.geometry.coordinates.map((singlePoly) => {
    const polyArea = TurfArea(TurfPolygon(singlePoly));
    return polyArea / mpArea;
  });
  const polyChoices = countBy(randomChoices(polyProbs, eventsCount));
  const randsForPolys = Object.entries(polyChoices).map(([idx, count]) => {
    if (count > 0) {
      const newSinglePoly = {
        ...geoPoly,
        geometry: {
          ...geoPoly.geometry,
          coordinates: geoPoly.geometry.coordinates[idx],
          type: 'Polygon',
        },
        properties: {
          ...geoPoly.properties,
        },
      };
      const toReturn = makeRandPtsInPoly(count, newSinglePoly);
      return toReturn;
    }
  });
  return randsForPolys.flat();
}

function getRandPtsforBoundColl(bounds, boundCollection) {
  // console.log('rand for boundcoll');
  const randPtsForCountry = bounds.map((obj) => {
    const [geoPoly] = boundCollection.features.filter(poly => poly.properties.GID === obj.bound);
    const randPtsForBound = geoPoly.geometry.type === 'MultiPolygon' ? makeRandPtsInMP(obj.count, geoPoly) : makeRandPtsInPoly(obj.count, geoPoly);
    return randPtsForBound;
  });
  const toReturn = randPtsForCountry.flat();
  // console.log(toReturn);
  return toReturn;
}

export default async function RandomizeData(data) {
  console.log(data);
  const precPts = data.filter(d => d.geoPrecision === 1);
  console.log(precPts);
  const imprecPtsRaw = data.filter(d => d.geoPrecision !== 1);
  const imprecPts = imprecPtsRaw.map(obj => ({ ...obj, adminLevel: GetAdminLevel(obj.bound)}));
  console.log(imprecPts);
  const adminList = [...new Set(imprecPts.map(d => GetAdminLevel(d.bound)))];
  const geoPrecList = [...new Set(imprecPts.map(d => d.geoPrecision))];
  const countsPerBound = CountEventsPerBound(adminList, imprecPts);
  console.log(countsPerBound);
  const randomizedPointsProm = Object.entries(countsPerBound).map(async ([adminLevel, boundsArr]) => {
    const countries = [...new Set(boundsArr.map(obj => obj.bound.substring(0, 3)))];
    const geoP = adminToGeoPMap[adminLevel];
    const randPtsForLevelProm = countries.map(async (iso3) => {
      const boundsInIso3 = boundsArr.filter(obj => obj.bound.substring(0, 3) === iso3);
      const boundCollection = await ImportBoundCollections(iso3, adminLevel);
      // console.log(await boundCollection);
      const randPtsForCountry = getRandPtsforBoundColl(boundsInIso3, await boundCollection);
      return randPtsForCountry;
    });
    const randPtsForLevel = await Promise.all(randPtsForLevelProm);
    // console.log(await randPtsForLevel);
    const randPtsForLevelFlat = await randPtsForLevel.flat();
    const randPtsForLevelFinal = await randPtsForLevelFlat.map(obj => ({ ...obj, geoPrecision: geoP }));
    const toReturn = await randPtsForLevelFinal.flat();
    // console.log(await toReturn);
    return toReturn;
  });
  const randomizedPoints = await Promise.all(randomizedPointsProm);
  console.log(randomizedPoints);
  const randomizedPointsFinal = [].concat(...randomizedPoints).filter(e => e);
  console.log(randomizedPointsFinal);
  console.log([...precPts, ...randomizedPointsFinal]);
  return [...precPts, ...randomizedPointsFinal];
}
