import ImportSingleBounds from '../import/ImportSingleBounds';
import ProbForPoly from '../utils/ProbForPoly';
import MakePoly from '../utils/MakePoly';

export default async function GetStatForInspectBox(boxCoords, boundNames, events) {
  const geoBounds = await ImportSingleBounds(boundNames);
  const inspectBox = MakePoly(boxCoords);
  const probPtByBound = geoBounds.reduce((acc, boundObj) => {
    acc[boundObj.properties.GID] = ProbForPoly(inspectBox, boundObj);
    return acc;
  }, {});
  const initProbObj = {
    prob: 0,
    count: 0,
  };
  const statForBound = events.reduce((acc, event) => {
    const probPtInPoly = (event.geoPrecision === 1) ? 1 : probPtByBound[event.bound];
    acc.prob += probPtInPoly * event.count;
    acc.count += event.count;
    return acc;
  }, initProbObj);
  return statForBound.prob / statForBound.count;
}
