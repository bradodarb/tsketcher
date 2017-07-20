import { ConstraintResolver } from './base.constraint-solver-model';

const P1X = 0;
const P1Y = 1;
const P2X = 2;
const P2Y = 3;
const EP1X = 4;
const EP1Y = 5;
const EP2X = 6;
const EP2Y = 7;
const R = 8;

export class EllipseTangent extends ConstraintResolver {

  constructor(params) {
    super(params);

  }

  public error() {

    let p1x = this.params[P1X].get();
    let p1y = this.params[P1Y].get();
    let p2x = this.params[P2X].get();
    let p2y = this.params[P2Y].get();

    let ep1x = this.params[EP1X].get();
    let ep1y = this.params[EP1Y].get();
    let ep2x = this.params[EP2X].get();
    let ep2y = this.params[EP2Y].get();

    const radiusY = this.params[R].get();

    let axisX = ep2x - ep1x;
    let axisY = ep2y - ep1y;
    const radiusX = Math.sqrt(Math.pow(axisX, 2) + Math.pow(axisY, 2)) * 0.5;
    const scaleToCircleSpace = radiusY / radiusX;
    const rotation = -Math.atan2(axisY, axisX);

    function tr(x, y) {
      let xx = x * Math.cos(rotation) - y * Math.sin(rotation);
      let yy = x * Math.sin(rotation) + y * Math.cos(rotation);
      xx *= scaleToCircleSpace;
      return {
        x: xx,
        y: yy
      };
    }


    const axis = tr(axisX, axisY);
    const p1 = tr(p1x, p1y);
    const p2 = tr(p2x, p2y);
    const ep1 = tr(ep1x, ep1y);

    const centerX = ep1.x + axis.x * 0.5;
    const centerY = ep1.y + axis.y * 0.5;


    let normalX = -(p2.y - p1.y);
    let normalY = p2.x - p1.x;

    const normalD = Math.sqrt(Math.pow(normalX, 2) + Math.pow(normalY, 2));
    normalX /= normalD;
    normalY /= normalD;

    //this length of normal of line to center
    let perpendicularLength = (centerX - p1.x) * normalX + (centerY - p1.y) * normalY;

    if (perpendicularLength < 0) {
      perpendicularLength *= -1;
    }
    return (radiusY - perpendicularLength); //*1000;
  }

  public gradient(out: Array<number>): void {
    this.numericGradient(out);
  }

}
