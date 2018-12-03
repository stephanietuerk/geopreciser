// Copyright (c) 2015 - 2017 Uber Technologies, Inc.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import { hexbin } from 'd3-hexbin';

/**
 * Use d3-hexbin to performs hexagonal binning from geo points to hexagons
 * @param {Iterable} data - array of points
 * @param {Number} radius - hexagon radius in meter
 * @param {function} getPosition - get points lon lat
 * @param {Object} viewport - current viewport object
 * @return {Object} - hexagons and countRange
 */
export function point2Hexbin ({data, radius, getPosition}, viewport) {
  // get hexagon radius in mercator world unit
  const radiusInPixel = getRadiusInPixel(radius, viewport);

  // add world space coordinates to points
  const screenPoints = [];
  for (const pt of data) {
    screenPoints.push(
      Object.assign(
        {
          screenCoord: viewport.projectFlat(getPosition(pt))
        },
        pt
      )
    );
  }

  const newHexbin = hexbin()
    .radius(radiusInPixel)
    .x(d => d.screenCoord[0])
    .y(d => d.screenCoord[1]);

  const hexagonBins = newHexbin(screenPoints);

  function makeHexagon(centerX, centerY, radius) {
        
    let coords = [];       
    for (let i = 0; i < 7; i++) {
      coords.push([centerX+radius*Math.sin(i*2*Math.PI/6), centerY+radius*Math.cos(i*2*Math.PI/6)]);
    }
    return coords;
  }
  

  console.log(hexagonBins);

  return {
    hexagons: hexagonBins.map((hex, index) => ({
      centroid: viewport.unprojectFlat([hex.x, hex.y]),
      points: hex,
      poly: makeHexagon(hex.x, hex.y, radiusInPixel).map(screenPoly => viewport.unprojectFlat(screenPoly)),
      cellIndex: index,
      index
    }))
  };
}


/**
 * Get radius in mercator world space coordinates from meter
 * @param {Number} radius - in meter
 * @param {Object} viewport - current viewport object
 * @return {Number} radius in mercator world spcae coordinates
 */
export function getRadiusInPixel(radius, viewport) {
  const { pixelsPerMeter } = viewport.getDistanceScales();

  // x, y distance should be the same
  return radius * pixelsPerMeter[0];
}