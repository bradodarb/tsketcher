import { ConstraintResolver } from './base.constraint-solver-model';


const TX = 0;
const TY = 1;
const LP1X = 2;
const LP1Y = 3;
const LP2X = 4;
const LP2Y = 5;

export class P2LDistance extends ConstraintResolver {

  public distance;
  constructor(params, distance) {
    super(params);
    this.distance = distance;
  }

  public error(): number {
    const x0 = this.params[TX].get(),
      x1 = this.params[LP1X].get(),
      x2 = this.params[LP2X].get();
    const y0 = this.params[TY].get(),
      y1 = this.params[LP1Y].get(),
      y2 = this.params[LP2Y].get();
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d === 0) {
      return 0;
    }
    const A = -x0 * dy + y0 * dx + x1 * y2 - x2 * y1;
    return Math.abs(A) / d - this.distance;
  }

  public gradient(out: Array<number>): void {
    const x0 = this.params[TX].get(),
      x1 = this.params[LP1X].get(),
      x2 = this.params[LP2X].get();
    const y0 = this.params[TY].get(),
      y1 = this.params[LP1Y].get(),
      y2 = this.params[LP2Y].get();
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d2 = dx * dx + dy * dy;
    const d = Math.sqrt(d2);
    const d3 = d * d2;
    //    const AA = -x0 * (y2 - y1) + y0 * (x2 - x1) + x1 * y2 - x2 * y1;
    const A = -x0 * dy + y0 * dx + x1 * y2 - x2 * y1;
    const AM = Math.abs(A);
    const j = A < 0 ? -1 : 1;

    out[TX] = j * (y1 - y2) / d;
    out[TY] = j * (x2 - x1) / d;

    out[LP1X] = j * (y2 - y0) / d + AM * dx / d3;
    out[LP1Y] = j * (x0 - x2) / d + AM * dy / d3;
    out[LP2X] = j * (y0 - y1) / d - AM * dx / d3;
    out[LP2Y] = j * (x1 - x0) / d - AM * dy / d3;

    ConstraintResolver.fixNaN(out);
  }

}
