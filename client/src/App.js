import React, { Component } from 'react';
import MapGL, { NavigationControl } from 'react-map-gl';
import { WebMercatorViewport } from 'deck.gl';
import { csv } from 'd3-fetch';
import { isEmpty, isNumber } from 'lodash';

import { tooltipStyle } from './components/style';
import ControlPanel from './components/controls/ControlPanel';
import CustomMapControls from './components/deck/CustomMapControls';
import DeckGLOverlay from './components/deck/DeckGLOverlay';
import GetChoroData from './components/representations/ChoroplethFunctions';
import CalculateHexagons from './components/representations/CalculateHexagons';
import GetStatForInspectBox from './components/representations/PointFunctions';
import MakePoly from './components/utils/MakePoly';
import GetAdminLevel from './components/utils/GetAdminLevel';
import RandomizeData from './components/utils/RandomizeData';

// import eventData from './data/all_acled_rand120181014_0310.csv';
// import eventData from './data/cleanedAugviolencerand120180922_0145.csv';
// import eventData from './data/cleanedAugviolenceasis20180920_1759.csv';
// import eventData from './data/all_acled_asis20180904_1515.csv';
// import eventData from './data/all_acled_rand120180927_1612_reduced.csv';
import acledData from './data/all_acled_asis20181203_1604.csv';
import gdeltData from './data/cleanedAugviolenceasis20181112_1550.csv';

const MAPBOX_STYLE = 'mapbox://styles/mapbox/dark-v9';
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic3RlcGhhbmlldCIsImEiOiJjamg2cjc4cnIwMDUyMndtamRuYXQ1MjgwIn0.iIEssd4_cYSEvep3qtpOCg'; // eslint-disable-line

const MAP_CUSTOM_STYLE = {
  margin: '0px',
  display: 'flex',
  width: '100%',
};

const CHORO_COLOR_STEPS = 13;
const HEX_RADIUS = 50000;

const DATA_SOURCE_LIST = [
  {
    text: 'acled sample dataset',
    code: 'acled',
  },
  {
    text: 'gdelt sample dataset',
    code: 'gdelt',
  },
];

const CHORO_MAP_LEVELS_LIST = [
  {
    text: 'countries',
    code: 0,
  },
  {
    text: 'lg regions',
    code: 1,
  },
  {
    text: 'sm regions',
    code: 2,
  },
];

const REP_STYLES_LIST = [
  {
    text: 'point',
    code: 'point',
  },
  {
    text: 'hexbin',
    code: 'hexbin',
  },
  {
    text: 'choropleth',
    code: 'choropleth',
  },
];

let coords = [0, 0, 0, 0];

function boxPoly(coordinates) {
  return { poly: coordinates };
}

function isPointInBox(point, bound) {
  const lon = point[0];
  const lat = point[1];

  const latMin = bound[1][1];
  const latMax = bound[0][1];
  const lonMin = bound[0][0];
  const lonMax = bound[1][0];
  return (lon < lonMax && lon > lonMin && lat < latMax && lat > latMin);
}

function sortCoords(x1, y1, x2, y2) {
  const lon1 = x2 > x1 ? x1 : x2;
  const lon2 = lon1 === x1 ? x2 : x1;
  const lat1 = y1 > y2 ? y1 : y2;
  const lat2 = lat1 === y1 ? y2 : y1;
  return {
    lon1,
    lat1,
    lon2,
    lat2,
  };
}

export default class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      viewState: {
        width: window.innerWidth,
        height: window.innerHeight,
        longitude: 67.0822,
        latitude: 24.90533,
        minZoom: 1,
        maxZoom: 17.256,
        zoom: 3,
      },
      x: 0,
      y: 0,
      hoveredObject: null,
      status: 'LOADING',
      inspectMode: 'OFF',
      points: [],
      startx: -1,
      starty: -1,
      endx: -1,
      endy: -1,
      repStyle: null,
      choroMapLevel: 'init',
      boxStatus: false,
      boxCount: 0,
      boxUncStat: 0,
      hexbinCount: 0,
      hexbinUncStat: 0,
      choroData: {
        init: {
          data: [],
          colorScale: [],
        },
      },
      chorodataLoaded: 'WAITING',
      hexagons: [],
      hexProbsByBound: {},
      hexCalcStatus: 'WAITING',
      hexIndexObj: {},
      dataRandomized: false,
      randSelected: false,
      dataSource: null,
    };

    this.resize = this.resize.bind(this);
    this.onHover = this.onHover.bind(this);
    this.onPanStart = this.onPanStart.bind(this);
    this.onPanMove = this.onPanMove.bind(this);
    this.onPanEnd = this.onPanEnd.bind(this);
    this.renderTooltip = this.renderTooltip.bind(this);

    this.mapcontrols = new CustomMapControls({
      inspectMode: 'OFF',
      handlePanStart: this.onPanStart,
      handlePanEnd: this.onPanEnd,
      handlePanMove: this.onPanMove,
    });
  }

  componentDidMount() {
    window.addEventListener('resize', this.resize);
    this.resize();
  }

  componentDidUpdate() {
    const { repStyle, choroMapLevel, choroData } = this.state;
    if (repStyle === 'choropleth'
      && isNumber(choroMapLevel)
      && isEmpty(choroData[choroMapLevel].data)) {
      this.setChoroData();
    }
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.resize);
  }

  onHover({ x, y, object }) {
    this.setState({ x, y, hoveredObject: object });
  }

  onPanStart(event) {
    this.setState({
      startx: event.offsetCenter.x,
      starty: event.offsetCenter.y,
    });
    this.setState({
      box: [boxPoly(MakePoly(coords))],
      boxUncStat: 'WAITING',
    });
  }

  onPanMove(event) {
    this.setState({
      endx: event.offsetCenter.x,
      endy: event.offsetCenter.y,
    });
    this.setState({
      box: [boxPoly(MakePoly(coords))],
    });
  }

  onPanEnd(event) {
    this.setState({
      box: [boxPoly(MakePoly(coords))],
      boxStatus: true,
      inspectMode: 'OFF',
    });
    this.setInspectStats();
  }

  setRepStyle(repStyle) {
    const { viewState } = this.state;
    this.setState({
      repStyle,
    });
    if (repStyle === 'hexbin') {
      this.setState({
        viewState: {
          ...viewState,
          pitch: 45,
          bearing: 0,
          transitionDuration: 2000,
        },
      });
    }
  }

  setChoroMapLevel(level) {
    const { choroMapLevel } = this.state;
    this.setState({
      choroMapLevel: level,
    });
    console.log('cml', choroMapLevel);
    console.log('level', level);
  }

  setInspectMode(inspectMode) {
    this.setState({
      inspectMode,
      inspecting: true,
    });
  }

  async setInspectStats() {
    console.log('inpectstats');
    const { points } = this.state;
    const bound = [[coords[0], coords[1]], [coords[2], coords[3]]];
    const eventsInInspectBox = points.filter(event => isPointInBox(event.position, bound));
    const boxCount = eventsInInspectBox.map(d => d.count).reduce((a, b) => a + b, 0);
    const boundsSet = [...new Set(eventsInInspectBox.map(d => d.bound))].filter(e => e !== '');
    this.setState({
      boxCount,
    });
    this.setState({
      boxUncStat: await GetStatForInspectBox(coords, boundsSet, eventsInInspectBox),
    });
  }
 
  async setHexes(hexagons) {
    const hexCentroidByIndex = hexagons.reduce((acc, hex) => {
      const hexIndex = Number(hex.cellIndex);
      const hexCentroid = [hex.points.x, hex.points.y];
      acc[hexCentroid] = hexIndex;
      return acc;
    }, {});
    this.setState({
      hexProbsByBound: await CalculateHexagons(hexagons),
      hexIndexObj: hexCentroidByIndex,
      hexCalcStatus: 'LOADED',
    });
  }

  async setChoroData() {
    const { points, choroMapLevel, choroData } = this.state;
    const { choroChunks, colorScale } = await GetChoroData(points, CHORO_COLOR_STEPS, choroMapLevel);
    this.setState({
      choroData: {
        ...choroData,
        [choroMapLevel]: {
          data: choroChunks,
          colorScale,
        },
      },
    });
  }

  clearInspectionArea() {
    this.setState({
      box: [],
      boxStatus: false,
      inspecting: false,
      boxCount: 0,
      boxUncStat: 0,
    });
  }

  updateViewState(viewState) {
    this.setState({
      ...this.state,
      ...viewState,
    });
  }

  resize() {
    this.updateViewState({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }

  async initializeData(dataSource) {
    const { boxStatus, repStyle } = this.state;
    this.setState({
      dataSource,
    });
    this.initializeChorodata();
    this.setRepStyle(repStyle);
    if (dataSource) {
      this.setState({ status: 'LOADED' });
      const eventData = dataSource === 'acled' ? acledData : gdeltData;
      const data = await csv(eventData, (d) => {
        return {
          position: [+d.lon, +d.lat],
          geoPrecision: +d.geo_precision,
          count: +d.count,
          bound: d.boundary,
        };
      });
      console.log(await data);
      this.setState({
        points: await data,
        status: 'READY',
        dataRandomized: false,
      });
      if (boxStatus) {
        this.setInspectStats();
      }
    }
  }

  initializeChorodata() {
    const { choroData } = this.state;
    const choroDataObj = CHORO_MAP_LEVELS_LIST.reduce((acc, curr) => {
      acc[curr.code] = {
        data: [],
        colorScale: [],
      };
      return acc;
    }, choroData);
    this.setState({
      choroData: choroDataObj,
    });
  }

  async randomizePoints() {
    const { points, boxStatus } = this.state;
    const oldData = [...points];
    const randData = await RandomizeData(oldData);
    console.log(randData);
    this.setState({
      points: await randData,
      dataRandomized: true,
    });
    this.initializeChorodata()
    if (boxStatus) {
      this.setInspectStats();
    }
  }

  toggleRandSelected(newRandSel) {
    this.setState({
      randSelected: newRandSel,
    });
  }

  renderTooltip() {
    const { hoveredObject, repStyle, x, y } = this.state;
    return (
      hoveredObject && repStyle === 'point' && (
        <div
          className="tooltip"
          style={{
            ...tooltipStyle,
            transform: `translate(${x}px, ${y}px)`
          }}
        >
          <div>
            <b>Count of Events: </b>
            {hoveredObject.count}
            <p />
          </div>
          <div>
            <b>Location Precision: </b>
            <div>
              {hoveredObject.geoPrecision === 1 ? 'precise location'
                : hoveredObject.geoPrecision === 2 ? 'in Admin2 boundary'
                : hoveredObject.geoPrecision === 3 ? 'in Admin1 boundary'
                : hoveredObject.geoPrecision === 4 ? 'in country boundary'
                : 'ERROR'
              }
            </div>
          </div>
        </div>
      )
    );
  }

  render() {
    const {
      repStyle,
      inspectMode,
      viewState,
      startx,
      starty,
      endx,
      endy,
    } = this.state;
    console.log('new App render', repStyle);
    this.mapcontrols.setInspectMode(inspectMode);

    if (inspectMode === 'DRAWING') {
      const wmv = new WebMercatorViewport(viewState);
      const lng1 = wmv.unproject([startx, starty])[0];
      const lat1 = wmv.unproject([startx, starty])[1];
      const lng2 = wmv.unproject([endx, endy])[0];
      const lat2 = wmv.unproject([endx, endy])[1];
      const sortedCoords = sortCoords(lng1, lat1, lng2, lat2);
      coords = [sortedCoords.lon1, sortedCoords.lat1, sortedCoords.lon2, sortedCoords.lat2];
    }

    return (
      <div style={MAP_CUSTOM_STYLE}>
        <ControlPanel
          boxCount={this.state.boxCount}
          boxUncStat={this.state.boxUncStat}
          hoveredObject={this.state.hoveredObject}
          choroDataLoaded={!isEmpty(this.state.choroData[this.state.choroMapLevel].data)}
          hexCalcStatus={this.state.hexCalcStatus}
          inspectMode={this.state.inspectMode}
          inspectionAreaStatus={this.state.boxStatus}
          clearInspectionArea={() => this.clearInspectionArea()}
          repStylesList={REP_STYLES_LIST}
          repStyle={this.state.repStyle}
          setRepStyle={style => this.setRepStyle(style)}
          setInspectMode={inspectMode => this.setInspectMode(inspectMode)}
          inspecting={this.state.inspecting}
          choroMapLevelsList={CHORO_MAP_LEVELS_LIST}
          choroMapLevel={this.state.choroMapLevel}
          setChoroMapLevel={levelSelection => this.setChoroMapLevel(levelSelection)}
          randomizePoints={() => this.randomizePoints()}
          dataRandomized={this.state.dataRandomized}
          initializeData={() => this.initializeData()}
          randSelected={this.state.randSelected}
          toggleRandSelected={(newRandSel) => this.toggleRandSelected(newRandSel)}
          dataSourceNames={DATA_SOURCE_LIST}
          dataSource={this.state.dataSource}
          setDataSource={dataset => this.initializeData(dataset)}
        />

        <MapGL
          {...this.state.viewState}
          width={window.innerWidth}
          mapStyle={MAPBOX_STYLE}
          mapControls={this.mapcontrols}
          mapboxApiAccessToken={MAPBOX_TOKEN}
          onViewStateChange={viewState => this.updateViewState(viewState)}
        >
          <DeckGLOverlay
            viewState={this.state.viewState}
            repStyle={this.state.repStyle}
            events={this.state.points}
            box={this.state.box}
            chorodata={this.state.choroData[this.state.choroMapLevel].data}
            choroColorScale={this.state.choroData[this.state.choroMapLevel].colorScale}
            hexRadius={HEX_RADIUS}
            hexProbsByBound={this.state.hexProbsByBound}
            hexIndexObj={this.state.hexIndexObj}
            hexCalcStatus={this.state.hexCalcStatus}
            getHexes={hexagons => this.setHexes(hexagons)}
            onHover={this.onHover}
          />
        </MapGL>
        {this.renderTooltip()}
      </div>
    );
  }
}
