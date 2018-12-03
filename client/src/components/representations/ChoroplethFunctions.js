import { isEmpty } from 'lodash';
import { multiPolygon as TurfMP, polygon as TurfPolygon } from '@turf/helpers';
import TurfArea from '@turf/area';
import ImportBoundCollections from '../import/ImportBoundCollections';
import ImportBoundaryNames from '../import/ImportBoundaryNames';
import GetAdminLevel from '../utils/GetAdminLevel';
import CountEventsPerBound from '../utils/CountEventsPerBound';

function getModifiedBoundName(name, choroMapLevel) {
  if (name.split('.').length > choroMapLevel + 1) {
    const frags = name.split('.');
    const toKeep = frags.slice(0, choroMapLevel + 1);
    const newName = toKeep.length > 1 ? toKeep.join('.').concat('_1') : toKeep[0];
    return newName;
  }
  return name;
}

function getBoundArea(bound) {
  const area = bound.geometry.type === 'MultiPolygon'
    ? TurfArea(TurfMP(bound.geometry.coordinates))
    : TurfArea(TurfPolygon(bound.geometry.coordinates));
  return area;
}

function modifyPointsByChoroMapLevel(inputPoints, choroMapLevel) {
  const newPoints = inputPoints.map((point) => {
    if (GetAdminLevel(point.bound) > choroMapLevel) {
      const modBound = getModifiedBoundName(point.bound, choroMapLevel);
      const modPoint = {
        ...point,
        bound: modBound,
        adminLevel: choroMapLevel,
      };
      return modPoint;
    }
    return {
      ...point,
      adminLevel: GetAdminLevel(point.bound),
    };
  });
  return newPoints;
}


function getSinglePolyWithRate(poly, boundObjArr) {
  const area = getBoundArea(poly);
  const eventCount = boundObjArr.find(e => e.bound === poly.properties.GID).count;
  const modPoly = {
    ...poly,
    properties: {
      ...poly.properties,
      area,
      count: eventCount,
      eventsPerArea: (eventCount * (10000 * 10000)) / area,
    },
  };
  return modPoly;
}

async function getPolysWithRates(uniqueBounds) {
  console.log(uniqueBounds);
  const polysWithRatesProm = Object.entries(uniqueBounds).map(async (curr) => {
    const [level, boundObjArr] = curr;
    const countryList = [...new Set(boundObjArr.map(obj => obj.bound.substring(0, 3)))];
    const levelPolysProm = countryList.map(async (iso3) => {
      console.log(iso3, level);
      const boundsInCountry = boundObjArr.map(obj => obj.bound)
        .filter(bound => bound.substring(0, 3) === iso3);
      const countryJson = await ImportBoundCollections(iso3, level);
      console.log(await countryJson);
      const adminPolys = countryJson.features
        .filter(feature => boundsInCountry.includes(feature.properties.GID));
      const adminPolysWithRates = adminPolys
        .map(poly => getSinglePolyWithRate(poly, boundObjArr))
        .flat();
      return adminPolysWithRates;
    });
    const levelPolysUnflat = await Promise.all(levelPolysProm);
    const levelPolys = levelPolysUnflat.flat().filter(e => e != null);
    return {
      level,
      levelPolys,
    };
  });
  const polysWithRatesObj = await Promise.all(polysWithRatesProm);
  const polysWithRates = polysWithRatesObj.reduce((acc, obj) => {
    acc[obj.level] = obj.levelPolys;
    return acc;
  }, {});

  return polysWithRates;
}

async function getAdditionalPolys(polysToFetch, rate, modLookLevelPolys, level) {
  if (!isEmpty(polysToFetch)) {
    const iso3 = [...new Set(polysToFetch.map(name => name.substring(0, 3)))];
    const newBounds = ImportBoundCollections(iso3, level).then((boundColl) => {
      const geoJsonColl = boundColl.features;
      const additionalPolys = geoJsonColl.filter(poly => polysToFetch.includes(poly.properties.GID));
      const addLookLevelPolys = additionalPolys.map(poly => (
        {
          ...poly,
          properties: {
            ...poly.properties,
            eventsPerArea: rate,
          },
        }
      ));
      return [...modLookLevelPolys, ...addLookLevelPolys];
    });
    return newBounds;
  }
  return modLookLevelPolys;
}

async function processThisLookDownLevel(level, lookLevel, thisLevelPolys, lookLevelPolys) {
  const noUnderscore = (name) => {
    return name.split('_')[0];
  };

  const isInLookLevel = (poly) => {
    const lookLevelPolyNames = lookLevelPolys
      .map(llPoly => noUnderscore(llPoly.properties.GID));
    return lookLevelPolyNames.some(llName => llName.includes(noUnderscore(poly.properties.GID)));
  };

  const newPolysArrProm = thisLevelPolys.map(async (tlPoly) => {
    if (isInLookLevel(tlPoly)) {
      const rate = tlPoly.properties.eventsPerArea;
      const modLookLevelPolys = lookLevelPolys
        .filter(llPoly => noUnderscore(llPoly.properties.GID).includes(noUnderscore(tlPoly.properties.GID)))
        .map((llPoly) => {
          const newRate = llPoly.properties.eventsPerArea + rate;
          const newPoly = {
            ...llPoly,
            properties: {
              ...llPoly.properties,
              eventsPerArea: newRate,
            },
          };
          return newPoly;
        });
      const polyNamesLookLevel = await ImportBoundaryNames([(tlPoly.properties.GID).substring(0, 3)], lookLevel);
      const polyNamesLLReduced = polyNamesLookLevel
        .filter(name => noUnderscore(name).includes(noUnderscore(tlPoly.properties.GID)));
      const polysToFetch = polyNamesLLReduced
        .filter(name => !lookLevelPolys.map(obj => obj.properties.GID).includes(name));
      const polysToReturn = await getAdditionalPolys(polysToFetch, rate, modLookLevelPolys, lookLevel);
      return [...polysToReturn];
    }
  });

  const modThisLevelPolys = thisLevelPolys.filter(tlPoly => !isInLookLevel(tlPoly));
  const newPolysArr = await Promise.all(newPolysArrProm);
  const expandedPolysArr = [].concat(...newPolysArr).filter(e => e);
  const tlReturnObj = { [level]: modThisLevelPolys };
  const llReturnObj = { [lookLevel]: expandedPolysArr };
  const toReturn = [tlReturnObj, llReturnObj];
  return toReturn;
}


async function processUpdatedPolys(newLookLevelArr, polysWithRates, level) {
  const updatedPolys = newLookLevelArr.reduce((acc, curr) => {
    curr.forEach((obj) => {
      const [[lvlString, polys]] = Object.entries(obj);
      const lvl = Number(lvlString);
      if (lvl === level) {
        acc[lvl] = polys;
        return acc;
      }
      const polysToUpdate = acc[lvl];
      const polysNames = polys.map(polyObj => polyObj.properties.GID);
      const polysToAdd = polysToUpdate
        .filter(polyObj => !polysNames.includes(polyObj.properties.GID));
      const newLvlPolys = polys.concat(polysToAdd);
      acc[lvl] = newLvlPolys;
      return acc;
    });
    return acc;
  }, polysWithRates);
  return updatedPolys;
}

async function getUpdatedPolys(lookDownArr, level, polysWithRates) {
  const thisLevelPolys = [...polysWithRates[level]];
  const modThisLevelPolys = [...thisLevelPolys];
  const modPolysWithRates = { ...polysWithRates };
  const newLookLevelPolysProm = lookDownArr.map(async (lookDownLevel) => {
    const lookLevel = level + lookDownLevel;
    const lookLevelPolys = [...polysWithRates[lookLevel]];
    const newPolysArr = await processThisLookDownLevel(level, lookLevel, modThisLevelPolys, lookLevelPolys);
    return newPolysArr;
  });

  const newLookLevelArr = await Promise.all(newLookLevelPolysProm);
  const updatedPolys = await processUpdatedPolys(newLookLevelArr, modPolysWithRates, level);
  return updatedPolys;
}

async function resolveHigherAdminLevels(polysWithRates, choroMapLevel) {
  if (Object.keys(polysWithRates).length > 1) {
    const levelsList = Object.keys(polysWithRates)
      .map(Number)
      .filter(key => key !== choroMapLevel)
      .sort((a, b) => a - b);
    let modPolysWithRates = { ...polysWithRates };
    const processedPolysProm = levelsList.map(async (level) => {
      const lookDownArr = Array.from(Array(choroMapLevel - level), (x, index) => index + 1)
        .sort((a, b) => b - a);
      const updatedPolys = await getUpdatedPolys(lookDownArr, level, modPolysWithRates);
      modPolysWithRates = await updatedPolys;
      return updatedPolys;
    });
    const processedPolysArr = await Promise.all(processedPolysProm);
    const last = processedPolysArr.length - 1;
    const toReturn = processedPolysArr[last];
    return toReturn;
  }
  return polysWithRates;
}

async function getColorScaleDomain(polys, choroColorSteps) {
  const valueRange = polys.map(obj => obj.properties.eventsPerArea).sort((a, b) => a - b);
  const divIndex = Math.ceil(valueRange.length / choroColorSteps);
  const scaleDomain = [...Array(choroColorSteps)].map((_, i) => valueRange[i * divIndex]);
  return scaleDomain;
}

async function breakAllPolysIntoChunks(polyList) {
  const chorolayers = Object.values(polyList);
  const chunkSize = 10;
  const arrayChunks = Array(Math.ceil(chorolayers.length / chunkSize))
    .fill()
    .map((_, i) => i * chunkSize)
    .map(begin => chorolayers.slice(begin, begin + chunkSize));
  const jsonChunks = arrayChunks.map(arrChunk => ({ type: 'FeatureCollection', features: arrChunk }));
  return jsonChunks;
}

export default async function GetChoroData(inputPoints, choroColorSteps, choroMapLevel) {
  const modifiedPoints = modifyPointsByChoroMapLevel(inputPoints, choroMapLevel);
  const adminLevels = [...new Set(modifiedPoints.map(d => d.adminLevel))];
  const uniqueBoundsWithCounts = CountEventsPerBound(adminLevels, modifiedPoints);
  const polysWithRates = await getPolysWithRates(uniqueBoundsWithCounts);
  const finalPolysObj = await resolveHigherAdminLevels(polysWithRates, choroMapLevel);
  const finalPolysVals = await Object.values(finalPolysObj);
  const finalPolys = await [].concat(...finalPolysVals).filter(e => e);
  const colorScale = await getColorScaleDomain(finalPolys, choroColorSteps);
  const choroChunks = await breakAllPolysIntoChunks(finalPolys);
  return { choroChunks, colorScale };
}
