import { LinearDimension } from './dimension-linear.render-model';



export class HorizontalDimension extends LinearDimension {
  constructor(a, b) {
    super(a, b, 'M4CAD.TWO.HDimension');
  }

  public getA() {
    return this.a;
  }

  public getB() {
    return { x: this.b.x, y: this.a.y };
  }
}
