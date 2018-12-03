import { uniqWith, isEqual } from 'lodash';
import ImportBoundCollections from '../import/ImportBoundCollections';
import ProbForPoly from '../utils/ProbForPoly';
import GetAdminLevel from '../utils/GetAdminLevel';

function getBoundCollectionsArr(bounds) {
  const adminObjs = bounds.map((bound) => {
    const iso3 = bound.substring(0, 3);
    const adminLevel = GetAdminLevel(bound);
    const adminObj = {
      iso3,
      adminLevel,
    };
    return adminObj;
  });
  const uniqueAdminObjs = uniqWith(adminObjs, isEqual);
  return uniqueAdminObjs;
}

function getBoundsByHexCells(hexagonMesh) {
  const toReturn = hexagonMesh.map((hex) => {
    const boundsInHex = hex.points.map(point => point.bound);
    const uniqueBoundsInHex = [...new Set(boundsInHex)];
    const boundCollections = getBoundCollectionsArr(uniqueBoundsInHex);
    return {
      boundCollections,
      cellIndex: hex.cellIndex,
      boundsInCell: uniqueBoundsInHex,
      poly: hex.poly,
    };
  });
  return toReturn;
}

function getBoundCollsToImport(boundsByHexCells) {
  const countryNamesArr = boundsByHexCells.map(obj => obj.boundCollections);
  const countryNames = [].concat(...countryNamesArr);
  const boundsToImport = uniqWith(countryNames, isEqual);
  console.log(boundsToImport);
  return boundsToImport;
}

async function getHexesForRelevantBounds(relevantBounds, geojsonColl, boundsByHexCells) {
  const hexesForBoundCollProm = relevantBounds.map(async (bound) => {
    const [geoPoly] = geojsonColl.filter(poly => poly.properties.GID === bound);
    const cellArrProm = boundsByHexCells
      .filter(hexCell => hexCell.boundsInCell.includes(bound))
      .map((hexCell) => {
        return {
          cellIndex: hexCell.cellIndex,
          prob: ProbForPoly(hexCell.poly, geoPoly),
        };
      });
    return {
      bound,
      hexesForBound: await Promise.all(cellArrProm),
    };
  });
  return Promise.all(hexesForBoundCollProm);
}

async function getHexesByBoundProbs(bounds, boundsByHexCells) {
  const boundsToImport = getBoundCollsToImport(boundsByHexCells);
  const hexesByBoundProbsProm = boundsToImport.map(async (boundObj) => {
    const [iso3, adminLevel] = Object.values(boundObj);
    const hexesByBoundObj = ImportBoundCollections(iso3, adminLevel).then(async (boundColl) => {
      const geojsonColl = boundColl.features;
      const relevantBounds = bounds
        .filter(bound => ((bound.substring(0, 3) === iso3) && GetAdminLevel(bound) === adminLevel));
      const hexesForRelevantBounds = await getHexesForRelevantBounds(relevantBounds, geojsonColl, boundsByHexCells);
      return hexesForRelevantBounds;
    });
    return hexesByBoundObj;
  });
  const hexesByBoundProbs = (await Promise.all(hexesByBoundProbsProm)).flat();
  return hexesByBoundProbs;
}

export default async function CalculateHexagons(hexagonMesh) {
  const boundsByHexCells = getBoundsByHexCells(hexagonMesh);
  const allBounds = [...new Set(boundsByHexCells.map(hex => hex.boundsInCell).flat())];
  const hexesByBoundProbs = getHexesByBoundProbs(allBounds, boundsByHexCells);
  console.log(await hexesByBoundProbs);
  return hexesByBoundProbs;
}
