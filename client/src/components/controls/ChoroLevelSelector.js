import React, { PureComponent } from 'react';
import ChoroStatsPanel from './ChoroStatsPanel';
import ButtonSelector from './ButtonSelector';
import '../../App.css';

export default class ChoroLevelSelector extends PureComponent {

  render() {
    const renderChoroPanel = () => (
      <ChoroStatsPanel
        hoveredObject={this.props.hoveredObject}
        choroDataLoaded={this.props.choroDataLoaded}
      />
    );

    return (
      <div>
        <div>
          <p className='describe-text'>Select a map resolution</p>
        </div>
        <ButtonSelector
          buttonClass={'choro-select'}
          buttonVals={this.props.choroMapLevelsList}
          setSelection={(level) => this.props.setChoroMapLevel(level)}
          selected={this.props.choroMapLevel}
        />
        {(this.props.choroMapLevel !== 'init') && renderChoroPanel()}
      </div>
    );
  }
}


