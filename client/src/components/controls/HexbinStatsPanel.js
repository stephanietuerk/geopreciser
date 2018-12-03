import React, {PureComponent} from 'react';
import AnimatedDots from './AnimatedDots';
import '../../App.css';


export default class HexbinStatsPanel extends PureComponent {


  render() {

    const hoveredObject = this.props.hoveredObject;
    const hexCalcStatus = this.props.hexCalcStatus;

    if (hexCalcStatus === 'WAITING') {
      return (
        <div>
          <hr />
          <div className="loading-text loading">calculating</div>
          <div className='loading'>
            <AnimatedDots />
          </div>
        </div>
      );
    }
    
    if (hexCalcStatus === 'LOADED' && hoveredObject) {
      return (
        <div>
          <hr />
          <div className="sample-text">For this random sample</div>
          <div className="describe-text">Events in this cell:</div> 
          <div className="event-figures">{hoveredObject.elevationValue}</div>
          <div className="describe-text">Average likelihood of events occuring in this cell:</div> 
          <div className="event-figures">{Math.round(hoveredObject.colorValue*1000)/1000}</div>
        </div>
      );
    }

    if (hexCalcStatus === 'LOADED' && !hoveredObject) {
      return (
        <div>
          <hr />
          <div className="describe-text">Hover to see count and likelihood information</div>
        </div>
      );
    }
   
  }
}