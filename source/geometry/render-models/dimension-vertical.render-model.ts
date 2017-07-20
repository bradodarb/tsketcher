import { LinearDimension } from './dimension-linear.render-model';


export class VerticalDimension extends LinearDimension {

  constructor(a, b) {
    super(a, b, 'M4CAD.TWO.VDimension');
  }

  public getA() {
    return this.a;
  }

  public getB() {
    return { x: this.a.x, y: this.b.y };
  }
}

