import { HexagonLayer } from 'deck.gl';

export default class CustomHexagonLayer extends HexagonLayer {
  getHexagons() {
	  const sendHexes = hexes => this.props.getHexes(hexes);
	  const { viewport } = this.context;
    if (viewport.isGeospatial) {
      const { hexagonAggregator } = this.props;
      const { hexagons, hexagonVertices } = hexagonAggregator(this.props, viewport);
      this.setState({ hexagons, hexagonVertices });

      this.getSortedBins();

      sendHexes(this.state.hexagons);
    }
  }
}
