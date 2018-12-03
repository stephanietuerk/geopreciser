import React, { PureComponent } from 'react';
import AnimatedDots from './AnimatedDots';
import '../../App.css';

export default class PointStatsPanel extends PureComponent {

  render() {

    const { inspectMode, boxCount, boxUncStat } = this.props;

    let newInspectMode = (inspectMode === 'DRAWING') ? 'OFF' : 'DRAWING';

    const renderStat = () => (
      <div className='event-figures'>{(Math.round(boxUncStat * 1000))/1000}</div>
    );

    const renderText = () => (
      <div>
        <div className='loading-text loading'>calculating</div>
        <div className='loading'>
          <AnimatedDots />
        </div>
      </div>
    );

    const renderActivateButton = () => (
      <div className='btn-group inspect'>
      <button 
        className={inspectMode === "DRAWING" ? 'btn btn-active inspect activate' : 'btn btn-inactive inspect activate'}
        onClick={() => this.props.setInspectMode(newInspectMode)}>
        {inspectMode === 'DRAWING' ? 'inspection mode' : 'activate inspection tool'}
      </button>
      </div>
    );

    const renderClearButton = () => (
      <div className='btn-group inspect'>
        <button 
          // className={inspectMode === "OFF" ? 'btn btn-active inspect clear' : 'btn btn-inactive inspect clear'}
          className={'btn btn-inactive inspect clear'}
          onClick={() => this.props.clearInspectionArea()}>
          clear inspection area
        </button>
      </div>
    );

    const renderStats = () => (
      <div>
        <div className="sample-text">For this random sample</div>
        <div className="describe-text">Events in inspected area:</div> 
        <div className="event-figures">{boxCount}</div>
        <div className="describe-text">Average likelihood of events occuring in inspected area:</div> 
        <div>
        {isNaN(boxUncStat) ? renderText() : renderStat()}
        </div>
      </div>
    );

    return (
      <div>
        <hr />
        <div className="input">
          {(!this.props.inspectionAreaStatus) && renderActivateButton()}
          {(this.props.inspectionAreaStatus) && renderClearButton()}
        </div>     
        {this.props.inspecting && renderStats()}
      </div>
    );
  }
}