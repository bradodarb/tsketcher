import { Constraint } from './base.constraint-model';
import { EndPoint } from '../../geometry/render-models';
import { ParentsCollector } from '../utils';
import { Ref } from '../reference';


export class Angle extends Constraint {

  public static SettableFields = { 'angle': 'Enter the angle value' };

  public p1: EndPoint;
  public p2: EndPoint;
  public p3: EndPoint;
  public p4: EndPoint;
  public angle: number;
  protected _angle: Ref;


  constructor(p1, p2, p3, p4, angle) {
    super('Angle', 'Lines Angle');
    this.p1 = p1;
    this.p2 = p2;
    this.p3 = p3;
    this.p4 = p4;
    this._angle = new Ref(0);
    this.angle = angle;
  }
  public getSolveData(resolver) {
    this._angle.set(resolver(this.angle) / 180 * Math.PI);
    const params = [];
    this.p1.collectParams(params);
    this.p2.collectParams(params);
    this.p3.collectParams(params);
    this.p4.collectParams(params);
    params.push(this._angle);
    return [['angleConst', params, []]];
  }

  public serialize() {
    return [this.NAME, [this.p1.id, this.p2.id, this.p3.id, this.p4.id, this.angle]];
  }

  public getObjects() {
    const collector = new ParentsCollector();
    collector.check(this.p1);
    collector.check(this.p2);
    collector.check(this.p3);
    collector.check(this.p4);
    return collector.parents;
  }

}
