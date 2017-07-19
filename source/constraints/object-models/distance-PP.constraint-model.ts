import { Constraint } from './base.constraint-model';
import { EndPoint } from '../../geometry/render-models';

export class P2PDistance extends Constraint {

  public static SettableFields = { 'd': 'Enter the distance' };

  public p1: EndPoint;
  public p2: EndPoint;
  public d;



  constructor(p1, p2, d) {
    super('P2PDistance', 'Distance Points');
    this.p1 = p1;
    this.p2 = p2;
    this.d = d;
  }
  public getSolveData(resolver) {
    let params = [];
    this.p1.collectParams(params);
    this.p2.collectParams(params);
    return [[this.NAME, params, [resolver(this.d)]]];
  }

  public serialize() {
    return [this.NAME, [this.p1.id, this.p2.id, this.d]];
  }

  public getObjects() {
    return [this.p1, this.p2];
  }

}
