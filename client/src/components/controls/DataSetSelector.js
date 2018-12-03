import React, { PureComponent } from 'react';
import ButtonSelector from './ButtonSelector';
import '../../App.css';

export default class DataSetSelector extends PureComponent {


  render() {
 
           //   dataSourceNames={DATA_SOURCE_NAMES}
          // dataSource={this.state.dataSource}
          // setDataSource={dataset => this.setDataSource(dataset)}

    const selectDatasetButton = () => (
      <div className='btn-group dataset dataset-selector'>
        <button 
          className={'btn btn-inactive dataset nochoice'}
          onClick={() => this.props.clearInspectionArea()}>
          select a dataset
        </button>
      </div>
    );

    const datasetButtons = () => {
      return (
        <div>
          <ButtonSelector
            buttonClass={'dataset'}
            buttonVals={this.props.dataSourceNames}
            setSelection={(dataset) => this.props.setDataSource(dataset)}
            selected={this.props.dataSource}
          />
        </div>
      );
    };

    return (
      <div className='btn-group data-sel'>
        {this.props.dataSource ? datasetButtons() : renderDataSelectionButton()}
        <button
          className={'btn btn-inactive data-sel acled'}
          onClick={}
        </button>
        <button
          className={'btn btn-inactive data-sel gdelt'}
          onClick={}
        </button>
      </div>
    );
  }
}