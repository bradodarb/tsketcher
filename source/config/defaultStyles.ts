import LayerStyle from '../layers/layer-style';

const DefaultStyles = {
  BOUNDS: new LayerStyle(2, '#fff5c3', '#000000'),
  CONSTRUCTION: new LayerStyle(2, '#aaaaaa', '#000000'),
  CONSTRUCTION_OF_OBJECT: new LayerStyle(2, '#888888', '#000000'),
  DEFAULT: new LayerStyle(2, '#ffffff', '#000000'),
  DIM: new LayerStyle(2, '#bcffc1', '#00FF00'),
  MARK: new LayerStyle(2, '#ff0000', '#FF0000'),
  SERVICE: new LayerStyle(0.3, '#ff0000', '#FF0000'),
  SNAP: new LayerStyle(2, '#00FF00', '#00FF00')
};

export default DefaultStyles;
