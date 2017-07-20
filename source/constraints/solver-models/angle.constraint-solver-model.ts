import { ConstraintResolver } from './base.constraint-solver-model';

const l1p1x = 0;
const l1p1y = 1;
const l1p2x = 2;
const l1p2y = 3;
const l2p1x = 4;
const l2p1y = 5;
const l2p2x = 6;
const l2p2y = 7;
const angle = 8;
const scale = 1000; // we need scale to get same order of measure units(radians are to small)


export class Angle extends ConstraintResolver {

  constructor(params) {
    super(params);

  }

  public error(): number {
    const dx1 = (this.p(l1p2x) - this.p(l1p1x));
    const dy1 = (this.p(l1p2y) - this.p(l1p1y));
    const dx2 = (this.p(l2p2x) - this.p(l2p1x));
    const dy2 = (this.p(l2p2y) - this.p(l2p1y));
    const a = Math.atan2(dy1, dx1) + this.p(angle);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x2 = dx2 * ca + dy2 * sa;
    const y2 = -dx2 * sa + dy2 * ca;
    return Math.atan2(y2, x2) * scale;
  }

  public gradient(out: Array<number>): void {
    let dx1 = (this.p(l1p2x) - this.p(l1p1x));
    let dy1 = (this.p(l1p2y) - this.p(l1p1y));
    let r2 = dx1 * dx1 + dy1 * dy1;
    out[l1p1x] = -dy1 / r2;
    out[l1p1y] = dx1 / r2;
    out[l1p2x] = dy1 / r2;
    out[l1p2y] = -dx1 / r2;
    dx1 = (this.p(l1p2x) - this.p(l1p1x));
    dy1 = (this.p(l1p2y) - this.p(l1p1y));
    let dx2 = (this.p(l2p2x) - this.p(l2p1x));
    let dy2 = (this.p(l2p2y) - this.p(l2p1y));
    const a = Math.atan2(dy1, dx1) + this.p(angle);
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const x2 = dx2 * ca + dy2 * sa;
    const y2 = -dx2 * sa + dy2 * ca;
    r2 = dx2 * dx2 + dy2 * dy2;
    dx2 = -y2 / r2;
    dy2 = x2 / r2;
    out[l2p1x] = (-ca * dx2 + sa * dy2);
    out[l2p1y] = (-sa * dx2 - ca * dy2);
    out[l2p2x] = (ca * dx2 - sa * dy2);
    out[l2p2y] = (sa * dx2 + ca * dy2);
    out[angle] = -1;
    ConstraintResolver.rescale(out, scale);
  }

  private p(ref) {
    return this.params[ref].get();
  }
}
