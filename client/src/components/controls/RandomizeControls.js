import React, { PureComponent } from 'react';
import AnimatedDots from './AnimatedDots';
import '../../App.css';

export default class RandomizeControls extends PureComponent {

  // constructor(props) {
  //   super(props);
  //   this.state = {
  //     randSelected: false
  //   }
  // }

  // toggleRandSelected() {
  //   this.setState(prevState => {
  //     randSelected: !prevState.randSelected
  //   });
  // }


  render() {
    
    const renderResetButton = () => {
      return (
        <button
          className={'btn btn-inactive reset'}
          onClick={() => {
            this.props.initializeData(); 
            this.props.toggleRandSelected(false);
          }}>
          reset data
        </button>
      );
    };

    const renderRandomizing = () => {
      return (
        <div>
          <div className="loading-text loading">randomizing</div>
          <div className='loading'>
            <AnimatedDots/>
          </div>
        </div>
      );
    };


    return (  
      <div>
        <div className='btn-group randomize'>
          <button
            className={this.props.dataRandomized ? 'btn btn-inactive randomized' : 'btn btn-inactive randomize'}
            onClick={() => {
              this.props.randomizePoints();
              this.props.toggleRandSelected(true);
            }}>
            {this.props.dataRandomized ? 'randomize again' : 'randomly distribute data'}
          </button>
          {this.props.dataRandomized && renderResetButton()}
        </div>
        {this.props.randSelected && !this.props.dataRandomized && renderRandomizing()}
      </div>
    );
  }
}