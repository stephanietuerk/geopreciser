import React, { PureComponent } from 'react';
import AnimatedDots from './AnimatedDots';
import '../../App.css';


export default class ChoroStatsPanel extends PureComponent {

  render() {

    if (!this.props.choroDataLoaded) {
      return (
        <div>
          <hr />
          <div className="loading-text loading">calculating</div>
          <div className='loading'>
            <AnimatedDots/>
          </div>
        </div>
      );
    }

    if (this.props.choroDataLoaded && this.props.hoveredObject) {
      return (
        <div>
          <hr />
          <div className="describe-text">Events in this administrative boundary:</div>
          <div className="event-figures">{this.props.hoveredObject.properties.count}</div>
          <div className="describe-text">Events per 10 km<sup>2</sup>:</div> 
          <div className="event-figures">{(!this.props.hoveredObject) ? ' ' : Math.round(this.props.hoveredObject.properties.eventsPerArea*10*10*1000)/1000}</div>
        </div>
      );
    }

    if (this.props.choroDataLoaded && !this.props.hoveredObject) {
      return (
        <div>
          <hr />
          <div className="describe-text">Hover to see event rates</div>
        </div>
      );
    }  
  }
}