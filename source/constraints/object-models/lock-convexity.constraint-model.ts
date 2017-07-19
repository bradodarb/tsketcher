import { Constraint } from './base.constraint-model';
import { ParentsCollector } from '../utils';

export class LockConvex extends Constraint {

  public c;
  public a;
  public t;

  constructor(c, a, t) {
    super('LockConvex', 'Lock Convexity');
    this.c = c;
    this.a = a;
    this.t = t;
  }

  public getSolveData() {
    let params = [];
    this.c.collectParams(params);
    this.a.collectParams(params);
    this.t.collectParams(params);
    return [['LockConvex', params, []]];
  }
  public serialize() {
    return [this.NAME, [this.c.id, this.a.id, this.t.id]];
  }
  public getObjects() {
    let collector = new ParentsCollector();
    collector.check(this.c);
    collector.check(this.a);
    collector.check(this.t);
    return collector.parents;
  }
}

