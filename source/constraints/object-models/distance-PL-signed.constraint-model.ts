import { Constraint } from './base.constraint-model';
import { ParentsCollector } from '../utils';

export class P2LDistanceSigned extends Constraint {

  public static SettableFields = { 'd': 'Enter the distance' };
  public p;
  public a;
  public b;
  public d;



  constructor(p, a, b, d) {
    super('P2LDistanceSigned', 'Distance P & L');
    this.p = p;
    this.a = a;
    this.b = b;
    this.d = d;
  }
  public getSolveData(resolver) {
    let params = [];
    this.p.collectParams(params);
    this.a.collectParams(params);
    this.b.collectParams(params);
    return [[this.NAME, params, [resolver(this.d)]]];
  }

  public serialize() {
    return [this.NAME, [this.p.id, this.a.id, this.b.id, this.d]];
  }

  public getObjects() {
    const collector = new ParentsCollector();
    collector.check(this.a);
    collector.check(this.b);
    collector.parents.push(this.p);
    return collector.parents;
  }

}
