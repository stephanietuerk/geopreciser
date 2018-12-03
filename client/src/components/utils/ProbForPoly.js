import { multiPolygon as TurfMP, polygon as TurfPolygon } from '@turf/helpers';
import TurfArea from '@turf/area';
import TurfIntersect from '@turf/intersect';
import TurfBbox from '@turf/bbox';

function isBiggerPoly1Poly2(poly1, poly2) {
  const aOutsideB = (a, b) => a[0] < b[0] && a[2] > b[2] && a[1] < b[1] && a[3] > b[3];
  const result = (aOutsideB(TurfBbox(poly1), TurfBbox(poly2))) ? 1 :
    (aOutsideB(TurfBbox(poly2), TurfBbox(poly1))) ? 2 : null;
  return result;
}

function getProbIfMP(queryPoly, geoPoly) {
  const bound = TurfMP(geoPoly.geometry.coordinates);
  const boundArea = TurfArea(bound);
  const interArea = bound.geometry.coordinates.reduce((acc, cur) => {
    const interSingle = TurfIntersect(TurfPolygon(cur), queryPoly);
    const interAreaSingle = interSingle != null ? TurfArea(interSingle) :
      isBiggerPoly1Poly2(TurfPolygon(cur), queryPoly) === 1 ? TurfArea(queryPoly) :
      isBiggerPoly1Poly2(TurfPolygon(cur), queryPoly) === 2 ? TurfArea(TurfPolygon(cur)) : 0; 
    return acc + interAreaSingle;
  }, 0);
  return interArea / boundArea;
}

function getProbIfPoly(queryPoly, geoPoly) {
  const bound = TurfPolygon(geoPoly.geometry.coordinates);
  const boundArea = TurfArea(bound);
  const interPoly = TurfIntersect(bound, queryPoly);
  const interArea = interPoly !== null ? TurfArea(interPoly) :
    isBiggerPoly1Poly2(bound, queryPoly) === 1 ? TurfArea(queryPoly) :
    isBiggerPoly1Poly2(bound, queryPoly) === 2 ? TurfArea(bound) : 0;
  return interArea / boundArea;
}

export default function ProbForPoly(poly, geoPoly) {
  const queryPoly = TurfPolygon([poly]);
  try {
    const probForPoly = geoPoly.geometry.type === 'MultiPolygon' ? getProbIfMP(queryPoly, geoPoly) : getProbIfPoly(queryPoly, geoPoly);
    return probForPoly;
  }
  catch (e) {
    console.log('null', geoPoly.properties.GID);
    console.log(e);
    return 0;
  }
}
