export default class LayerStyle {

  public lineWidth = 1;
  public strokeStyle = '#ffffff';
  public fillStyle = '#ffffff';


  constructor(width: number, stroke: string, fill: string) {
    this.lineWidth = width;
    this.strokeStyle = stroke;
    this.fillStyle = fill;
  }

}
