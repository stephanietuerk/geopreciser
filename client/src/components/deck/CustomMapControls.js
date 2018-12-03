import { experimental } from 'react-map-gl';

export default class CustomMapControls extends experimental.MapControls {

  constructor({
    type,
    handlePanStart,
    handlePanMove,
    handlePanEnd,
  }) {
    super();
    this.mode = type;
    this.onPanStart = handlePanStart;
    this.onPanEnd = handlePanEnd;
    this.onPanMove = handlePanMove;
  }

  setInspectMode(mode) {
    this.mode = mode;
  }

  handleEvent(event) {
    if (this.mode === 'DRAWING') {
      if (event.type === 'panstart') {
        return this.onPanStart(event);
      }
      if (event.type === 'panend') {
        return this.onPanEnd(event);
      }
      if (event.type === 'panmove') {
        return this.onPanMove(event);
      }
      else {
        return super.handleEvent(event);
      }
    }
    return super.handleEvent(event);
  }
}
