import React, { PureComponent } from 'react';
import '../../App.css';

export default class ButtonSelector extends PureComponent {
  render() {
    const selected = this.props.selected;
    const buttonGroup = (this.props.buttonVals).map(val => (
      <button
        key={val.text}
        className={selected === val.code ? `btn btn-active ${ this.props.buttonClass }` : `btn btn-inactive ${ this.props.buttonClass }`}
        onClick={() => this.props.setSelection(val.code)}
        >
        {val.text}
      </button>
    ));

    return (
      <div className={`btn-group ${ this.props.buttonClass }`}>
        {buttonGroup}
      </div>
    );
  }
}
