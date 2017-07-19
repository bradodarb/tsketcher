import { Generator } from '../../util/id-generator';
import { Param as CachedParam } from '../solver';
export class Param {
  public id: number;
  public obj;
  public prop;
  public __cachedParam__: CachedParam;

  constructor(obj, prop) {
    this.id = Generator.genID();
    this.obj = obj;
    this.prop = prop;
  }
  public set(value) {
    this.obj[this.prop] = value;
  }

  public get() {
    return this.obj[this.prop];
  }
}
