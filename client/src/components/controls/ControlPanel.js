import React, { PureComponent } from 'react';
import { controlPanel } from '../style';
import PointStatsPanel from './PointStatsPanel';
import HexbinStatsPanel from './HexbinStatsPanel';
import RandomizeControls from './RandomizeControls';
import ButtonSelector from './ButtonSelector';
import ChoroLevelSelector from './ChoroLevelSelector';

import '../../App.css';

export default class ControlPanel extends PureComponent {

  render() {
    // console.log('rsl', this.props.repStyleList);
    // if (this.props.hoveredObject) {
    //   console.log("control panel hover");
    // }

    const repSelector = () => (
      <div>
        <p className='control-heading'>Representation Types</p>
        <ButtonSelector
          buttonClass={'rep'}
          buttonVals={this.props.repStylesList}
          setSelection={(style) => this.props.setRepStyle(style)}
          selected={this.props.repStyle}
        />
      </div>
    );

    const dataSelector = () => (
      <div>
        <p className='control-heading'>Data Source</p>
        <ButtonSelector
          buttonClass={'dataset'}
          buttonVals={this.props.dataSourceNames}
          setSelection={(dataset) => this.props.setDataSource(dataset)}
          selected={this.props.dataSource}
        />
        {this.props.dataSource && randFunctions()}
      </div>
    );

    const randFunctions = () => (
      <div>

        <RandomizeControls
          dataRandomized={this.props.dataRandomized}
          randomizePoints={() => this.props.randomizePoints()}
          initializeData={() => this.props.initializeData()}
          randSelected={this.props.randSelected}
          toggleRandSelected={(newRandSel) => this.props.toggleRandSelected(newRandSel)}
        />
      </div>
    );

    const infoPanels = {
      point: 
        <PointStatsPanel 
          boxCount={this.props.boxCount} 
          boxUncStat={this.props.boxUncStat} 
          inspectMode={this.props.inspectMode}
          setInspectMode={(inspectMode) => this.props.setInspectMode(inspectMode)}
          inspectionAreaStatus={this.props.inspectionAreaStatus}
          clearInspectionArea={this.props.clearInspectionArea}
          inspecting={this.props.inspecting}
        />,
      hexbin: 
        <HexbinStatsPanel
          hoveredObject={this.props.hoveredObject}
          hexCalcStatus={this.props.hexCalcStatus}
        />,
      choropleth: 
        <ChoroLevelSelector
          choroMapLevel={this.props.choroMapLevel}
          choroMapLevelsList={this.props.choroMapLevelsList}
          setChoroMapLevel={(level) => this.props.setChoroMapLevel(level)}
          hoveredObject={this.props.hoveredObject}
          choroDataLoaded={this.props.choroDataLoaded}
        />
    };


    return (
      <div className='layer-controls' style={controlPanel}>
        {dataSelector()}
        {this.props.dataSource && repSelector()}
        {infoPanels[this.props.repStyle]}
      </div>
    );
  }
}