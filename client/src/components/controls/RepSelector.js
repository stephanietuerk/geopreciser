import React, { Component} from 'react';
import '../../App.css';

export default class RepSelector extends Component {

    render() {

      const selected = this.props.repStyle;

      return (
        <div className='btn-group rep'>
          <button 
            className={selected === "point" ? 'btn btn-active rep' : 'btn btn-inactive rep'}
            onClick={() => this.props.setRepStyle("point")}>
            point
            </button>
          <button 
            className={selected === "hexbin" ? 'btn btn-active rep' : 'btn btn-inactive rep'}
            onClick={() => this.props.setRepStyle("hexbin")}> 
            hexbin
          </button>
          <button 
            className={selected === "choropleth" ? 'btn btn-active rep' : 'btn btn-inactive rep'}
            onClick={() => this.props.setRepStyle("choropleth")}> 
            choropleth
          </button>
        </div>
      );
    }
}

  