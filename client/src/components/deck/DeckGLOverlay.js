import { max, min } from 'lodash';
import React, { Component } from 'react';
import DeckGL, { ScatterplotLayer, PolygonLayer, GeoJsonLayer } from 'deck.gl';
import { scaleThreshold } from 'd3-scale';
import { point2Hexbin } from './CustomHexAggregator';
import CustomHexagonLayer from './CustomHexLayer';


const GEO1_COLOR = [215, 66, 244];
// const GEO2_COLOR = [66, 244, 173];
// const GEO3_COLOR = [215, 244, 66];


const LIGHT_SETTINGS = {
  lightsPosition: [-0.144528, 49.739968, 8000, -3.807751, 54.104682, 8000],
  ambientRatio: 0.4,
  diffuseRatio: 0.6,
  specularRatio: 0.2,
  lightsStrength: [0.8, 0.0, 0.8, 0.0],
  numberOfLights: 2,
};

// const HEATMAP_COLORS = [
//   [213, 62, 79],
//   [252, 141, 89],
//   [254, 224, 139],
//   [230, 245, 152],
//   [153, 213, 148],
//   [50, 136, 189]
// ].reverse();

// const REDBLUE_GRADIENT = [
//   [255,0,51],
//   [214,10,92],
//   [173, 20, 133],
//   [133, 31, 173],
//   [92, 41, 214],
//   [51, 51, 255]
// ].reverse(); 

const GREENBLUE_GRADIENT = [
  [0, 102, 153],
  [41, 133, 122],
  [82, 163, 92],
  [122, 194, 61],
  [163, 224, 31],
  [204, 255, 0],
];

const GREENBLUE_CHOROGRAD = [
  [173, 255, 47],
  [168, 244, 86],
  [158, 222, 98],
  [153, 211, 110],
  [146, 201, 121],
  [139, 191, 130],
  [131, 180, 140],
  [123, 169, 148],
  [113, 160, 156],
  [101, 149, 165],
  [87, 139, 172],
  [70, 130, 180],
].reverse();


//             [65, 182, 196],
//             [127, 205, 187],
//             [199, 233, 180],
//             [237, 248, 177],
//             // zero
//             [255, 255, 204],
//             [255, 237, 160],
//             [254, 217, 118],
//             [254, 178, 76],
//             [253, 141, 60],
//             [252, 78, 42],
//             [227, 26, 28],
//             [189, 0, 38],
//             [128, 0, 38]
//         ]);
function getHexElevation(hex) {
  const elev = hex.map(point => point.count).reduce((a, b) => a + b, 0);
  return elev;
}

function handleHexInitColorValue() {
  return 1;
}

export default class DeckGLOverlay extends Component {
  constructor(props) {
    super(props);
    this.handleHexUncColorValue = this.handleHexUncColorValue.bind(this);
  }

  getChoroColor(value) {
    const scaled = scaleThreshold()
      .domain(this.props.choroColorScale)
      .range(GREENBLUE_CHOROGRAD);
    
    return scaled(value);
  }

  // getChoroLayers() {
  //   const choroLayers = [...Array(this.props.chorodata.length)].map((_, i) => {
  //     const layer = new GeoJsonLayer({
  //       id: `chunk${i}`,
  //       data: this.props.chorodata[i],
  //       opacity: 0.6,
  //       stroked: true,
  //       filled: true,
  //       extruded: false,
  //       wireframe: false,
  //       pickable: true,
  //       getFillColor: f => this.getChoroColor(f.properties.eventsPerArea),
  //       getLineColor: 'white',
  //       getLineWidth: 3,
  //       onHover: this.props.onHover,
  //     });
  //     return layer;
  //   });
  //   return choroLayers;
  // }

  handleHexUncColorValue(points) {
    let eventCount = 0;
    let uncStat = 0;
    const centroid = [points.x, points.y];
    const currHexIndex = this.props.hexIndexObj[centroid];

    points.forEach((point) => {
      const pointBound = point.bound;
      const [boundObj] = this.props.hexProbsByBound.filter(obj => obj.bound === pointBound);
      const [hexObj] = (boundObj.hexesForBound).filter(cell => cell.cellIndex === currHexIndex);
      const probForBound = hexObj.prob;
      eventCount += point.count;
      uncStat += point.count * probForBound;
    });

    const uncForHex = uncStat / eventCount;

    return uncForHex;
  }
     
  render() {

    console.log('tpc', this.props.chorodata);

    if (!this.props.events) {
      return null;
    }

    //
    //
    //zoom function parameters
    ///////////////////////////////////////////////////

    const minSetRadius =.5;
    
    const earthCirc = 40075016.686;
    const currLatInRad = this.props.viewState.latitude*Math.PI/180;
    
    // const eventVals = this.props.events;
    // const maxCount = Math.max.apply(Math, this.props.events.map(val => Number(val.count)));
    // const minCount = Math.min.apply(Math, this.props.events.map(val => Number(val.count)));
    const eventVals = this.props.events.map(event => event.count);
    console.log(eventVals);

    const maxCount = max(eventVals);
    const minCount = min(eventVals);
    console.log(maxCount, minCount);
    console.log(this.props.events);

    // const eventsShort = this.props.events.slice(0, 100);
    this.props.events.forEach((event, i) => {
      // const countType = typeof event.count;
      if (event.bound === undefined) {
        console.log(i, event);
      }
    });

    const zoomLevel = this.props.viewState.zoom;
    const zoomScale = Math.pow(2, Math.max(Math.log2(earthCirc*Math.cos(currLatInRad)) - 8 - zoomLevel, 0));
    const minMaxSetRadius = 5;
    const maxSetRadius = 40;
    const reducer = (minMaxSetRadius / maxSetRadius) + (((maxSetRadius - minMaxSetRadius) / maxSetRadius) * ((zoomLevel - 1) / 16.256));

    const markerValueToPixels = markerValue => Math.sqrt(markerValue / Math.PI) * zoomScale * Math.pow(2, (zoomLevel+8))/(earthCirc*Math.cos(currLatInRad));
    const markerValueFromPixels = markerRadius => Math.pow(markerRadius*earthCirc*Math.cos(currLatInRad)/(zoomScale*Math.pow(2, (zoomLevel+8))), 2)*Math.PI;

    const scaleValue = (numIn, scale1Min, scale1Max, scale2Min, scale2Max) => {
      return (((numIn - scale1Min) * (scale2Max - scale2Min)) / (scale1Max - scale1Min)) + scale2Min;
    };

    const maxCountPx = markerValueToPixels(maxCount);
    const minCountPx = markerValueToPixels(minCount);

    const maxSetRadiusValue = markerValueFromPixels(maxSetRadius);
    const minSetRadiusValue = markerValueFromPixels(minSetRadius);

    const radToArea = (radiusVal) => {
      return (radiusVal * radiusVal * Math.PI);
    };

    const scatterLayer = new ScatterplotLayer({
      id: 'conflict-events',
      data: this.props.events,
      getPosition: d => d.position,
      getColor: d => d.geoPrecision === 1 ? GEO1_COLOR : d.geoPrecision === 2 ? GEO1_COLOR : GEO1_COLOR,
      getRadius: (d) => {
        const area = d.count;
        const scaledArea = scaleValue(area, minCount, maxCount, markerValueFromPixels(minSetRadius), markerValueFromPixels(maxSetRadius));
        return Math.sqrt(scaledArea / Math.PI);
      },
      radiusScale: zoomScale * reducer,
      opacity: 0.2,
      pickable: true,
      radiusMinPixels: 1,
      radiusMaxPixels: 200,
      onHover: this.props.onHover,
      ...this.props,
    });
 
    const hexLayer = new CustomHexagonLayer({
      id: 'hexagon-layer',
      data: this.props.events,
      pickable: true,
      extruded: true,
      radius: this.props.hexRadius,
      opacity: 0.5,
      elevationScale: 4000,
      getPosition: d => d.position,
      getElevationValue: getHexElevation,
      getColorValue: (this.props.hexCalcStatus === 'WAITING') ? handleHexInitColorValue : this.handleHexUncColorValue,
      hexagonAggregator: point2Hexbin,
      lightSettings: LIGHT_SETTINGS,
      colorDomain: [0, 1],
      colorRange: GREENBLUE_GRADIENT,
      getHexes: (hexagons) => {
        if (this.props.hexCalcStatus === 'WAITING') {
          this.props.getHexes(hexagons);
        }
      },
      onHover: this.props.onHover,
    });

    const drawnBoxLayer = new PolygonLayer({
      id: 'box-layer',
      data: this.props.box,
      pickable: false,
      stroked: true,
      filled: true,
      lineWidthMinPixels: 1,
      getPolygon: d => d.poly,
      getFillColor: [160, 160, 180, 150],
      getLineColor: [255, 255, 255, 255],
      getLineWidth: 5,
    });
    
    const choroLayer = this.props.chorodata.reduce((acc, curr, i) => {
      const chunk = new GeoJsonLayer({
        id: `chunk${i}`,
        data: this.props.chorodata[i],
        opacity: 0.6,
        stroked: true,
        filled: true,
        extruded: false,
        wireframe: false,
        pickable: true,
        getFillColor: f => this.getChoroColor(f.properties.eventsPerArea),
        getLineColor: 'white',
        getLineWidth: 1,
        onHover: this.props.onHover,
      });
      acc.push(chunk);
      return acc;
    }, []);

    let layers = [];

    switch (this.props.repStyle) {
      case 'point': {
        layers = [scatterLayer, drawnBoxLayer];
        console.log(layers);
        break;
      }
      case 'hexbin': {
        // layers = (this.props.hexCalcStatus === 'WAITING') ? [hexLayerInit] : [hexLayerUncColor];
        layers = [hexLayer];
        break;
      }
      case 'choropleth': {
        layers = [choroLayer];
        break;
      }
      default: {
        layers = [];
      }
    }

    // if (this.props.repStyle === 'point') {
    //   // console.log("box is", this.props.box);
    //   layers = [scatterPlotEvents, drawnBox];
    // }

    // if (this.props.repStyle === 'hexbin') {
    //   if (this.props.hexCalcStatus === 'WAITING') {
    //     console.log("geting hexes wo unccolors");
    //     layers = [hexBinInit];
    //   }
    //   else if (this.props.hexCalcStatus === 'LOADED') {
    //     console.log('changing to unccolors');
    //     layers = [hexBinUncColor];
    //   }
    // }

    // if (this.props.repStyle === 'choropleth') {
    //   let choroLayers = [];
    //   for (let i=0; i < this.props.chorodata.length; i++) {
    //     let new_layer = new GeoJsonLayer({
    //       id: 'chunk' + i,
    //       data: this.props.chorodata[i],
    //       opacity: 0.6,
    //       stroked: true,
    //       filled: true,
    //       extruded: false,
    //       wireframe: false,
    //       pickable: true,
    //       getFillColor: f => this.getChoroColor(f.properties.eventsPerArea),
    //       // getLineColor: [125, 52, 255],
    //       getLineColor: 'white',
    //       getLineWidth: 3,
    //       onHover: this.props.onHover,
    //     });
    //     choroLayers.push(new_layer);
    //   }

    //   layers = [choroLayers];
    // }


   
    return (
      <DeckGL 
        {...this.props.viewState} 
        layers={layers}
        controller={true}
        />

    );

  }

}