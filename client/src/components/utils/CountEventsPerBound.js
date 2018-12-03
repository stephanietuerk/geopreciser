export default function CountEventsPerBound(adminLevels, points) {
  console.log(adminLevels);
  console.log(points);
  const boundsByAdminLevel = adminLevels.reduce((acc, level) => {
    const uniqueBounds = [...new Set(points.filter(d => d.adminLevel === level).map(d => d.bound))];
    const boundsInAdmin = uniqueBounds
      .map((b) => {
        const countForBound = points
          .filter(point => point.adminLevel === level && point.bound === b)
          .reduce((counter, point) => counter + point.count, 0);
        return {
          bound: b,
          count: countForBound,
        };
      })
      .filter(e => e !== undefined);
    acc[level] = boundsInAdmin;
    return acc;
  }, {});
  return boundsByAdminLevel;
}
