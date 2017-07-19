import { Constraint } from './base.constraint-model';
import { EndPoint, Segment } from '../../geometry/render-models';

export class P2LDistance extends Constraint {

  public static SettableFields = { 'd': 'Enter the distance' };

  public p: EndPoint;
  public l: Segment;
  public d;



  constructor(p, l, d) {
    super('P2LDistance', 'Distance P & L');
    this.p = p;
    this.l = l;
    this.d = d;
  }
  public getSolveData(resolver) {
    let params = [];
    this.p.collectParams(params);
    this.l.collectParams(params);
    return [[this.NAME, params, [resolver(this.d)]]];
  }

  public serialize() {
    return [this.NAME, [this.p.id, this.l.id, this.d]];
  }

  public getObjects() {
    return [this.p, this.l];
  }

}
