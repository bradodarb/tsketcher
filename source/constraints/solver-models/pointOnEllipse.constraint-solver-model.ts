import { ConstraintResolver } from './base.constraint-solver-model';

const PX = 0;
const PY = 1;
const EP1X = 2;
const EP1Y = 3;
const EP2X = 4;
const EP2Y = 5;
const R = 6;


export class Equal extends ConstraintResolver {

  constructor(params) {
    super(params);

  }

  public error(): number {
    const px = this.params[PX].get();
    const py = this.params[PY].get();
    const ep1x = this.params[EP1X].get();
    const ep1y = this.params[EP1Y].get();
    const ep2x = this.params[EP2X].get();
    const ep2y = this.params[EP2Y].get();
    const radiusY = this.params[R].get();

    const centerX = ep1x + (ep2x - ep1x) * 0.5;
    const centerY = ep1y + (ep2y - ep1y) * 0.5;
    const rotation = Math.atan2(ep2y - ep1y, ep2x - ep1x);

    let x = px - centerX;
    let y = py - centerY;

    const polarAngle = Math.atan2(y, x) - rotation;
    const polarRadius = Math.sqrt(x * x + y * y);
    const radiusX = Math.sqrt(Math.pow(ep1x - ep2x, 2) + Math.pow(ep1y - ep2y, 2)) * 0.5;

    const L = Math.sqrt(1 / (Math.pow(Math.cos(polarAngle) / radiusX, 2) + Math.pow(Math.sin(polarAngle) / radiusY, 2)));
    return L - polarRadius;
  }

  public gradient(out: Array<number>): void {
    this.numericGradient(out);
  }

}
