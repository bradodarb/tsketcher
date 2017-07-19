import { Subject } from 'rxjs/Rx';
import {
  Constraint,
  Coincident,
  Lock,
  Parallel,
  Perpendicular,
  P2LDistance,
  P2PDistance,
  Radius,
  RadiusEquality,
  LineEquality,
  Vertical,
  Horizontal,
  Tangent,
  PointOnLine,
  PointOnArc,
  PointOnEllipse,
  EllipseTangent,
  PointInMiddle,
  Symmetry,
  Angle,
  LockConvex, SubSystem,
} from '../';
import { ConstraintAction } from './constraint-action';
import { createByConstraintName } from '../utils';

import * as fetch from '../fetchers';
import { Param, prepare } from '../solver';
import { Viewport2d } from '../../viewport';
import Vector from '../../math/vector';
import * as utils from '../../util';


class Link {

  public a: any;
  public b: any;
  public constr: Constraint;
  public invalid: boolean;
  public processed: boolean;

  constructor(a, b, constr) {
    this.a = a;
    this.b = b;
    this.constr = constr;
    this.invalid = false;
    this.processed = false;
  }
}



class ParametricManager {

  public viewer: Viewport2d;
  public subSystems: Array<SubSystem> = new Array<SubSystem>();
  public constantTable = {};
  public constantResolver: any;
  public constraintStream = new Subject<ConstraintAction>();


  public static isAux(obj, disabledObjects?) {
    while (!!obj) {
      if (!!obj.aux || (disabledObjects !== undefined && disabledObjects.has(obj))) {
        return true;
      }
      obj = obj.parent;
    }
    return false;
  }

  public static fetchAuxParams(system, auxParams, auxDict, disabledObjects) {
    disabledObjects = disabledObjects !== undefined ? new Set(disabledObjects) : undefined;
    for (let i = 0; i < system.length; ++i) {
      for (let p = 0; p < system[i][1].length; ++p) {
        const parameter = system[i][1][p];
        if (parameter.obj !== undefined) {
          if (ParametricManager.isAux(parameter.obj, disabledObjects)) {
            if (auxDict[parameter.id] === undefined) {
              auxDict[parameter.id] = parameter;
              auxParams.push(parameter);
            }
          }
        }
      }
    }
  }

  public static __toId(v) {
    return v.id;
  }

  public static reduceSystem(system, readOnlyParams) {

    const info = {
      idToParam: {},
      linkedParams: [],
      reducedConstraints: {},
      reducedParams: {},
    };

    const links = [];

    let c, pi, paramToConstraints = {};
    for (let i = 0; i < system.length; ++i) {
      c = system[i];
      if (c[3] !== true) {
        for (pi = 0; pi < c[1].length; pi++) {
          const param = c[1][pi];
          let paramConstrs = paramToConstraints[param.id];
          if (paramConstrs === undefined) {
            paramConstrs = [];
            paramToConstraints[param.id] = paramConstrs;
          }
          paramConstrs.push(i);
        }
      }
    }

    for (let i = 0; i < system.length; ++i) {
      c = system[i];
      if (c[3] === true) { //Reduce flag
        const cp1 = c[1][0];
        const cp2 = c[1][1];
        links.push(new Link(cp1, cp2, i));
      }
    }

    function intersect(array1, array2) {
      if (!array1 || !array2) {
        return false;
      }
      return array1.filter(function (n) {
        return array2.indexOf(n) !== -1;
      }).length !== 0;
    }

    function shared(param1, param2) {
      if (param1 === param2) {
        return false;
      }
      const assoc0 = paramToConstraints[param1];
      const assoc1 = paramToConstraints[param2];
      return intersect(assoc0, assoc1);
    }

    const linkTuples = [];

    function mergeLinks(startIndex, into) {
      const linkI = links[startIndex];
      if (linkI.processed) {
        return;
      }
      linkI.processed = true;
      into.push(linkI);
      for (let j = startIndex + 1; j < links.length; j++) {
        const linkJ = links[j];
        if (linkI.a.id === linkJ.a.id || linkI.a.id === linkJ.b.id || linkI.b.id === linkJ.a.id || linkI.b.id === linkJ.b.id) {
          mergeLinks(j, into);
        }
      }
    }
    for (let i = 0; i < links.length; i++) {
      if (links[i].processed) {
        continue;
      }
      const linkTuple = [];
      linkTuples.push(linkTuple);
      mergeLinks(i, linkTuple);
    }

    function resolveConflicts() {
      for (let i = 0; i < linkTuples.length; i++) {
        const tuple = linkTuples[i];

        for (let j = 0; j < tuple.length; j++) {
          const linkA = tuple[j];
          if (linkA.invalid) {
            continue;
          }
          if (shared(linkA.a.id, linkA.b.id)) {
            linkA.invalid = true;
            continue;
          }
          for (let k = j + 1; k < tuple.length; k++) {
            const linkB = tuple[k];
            if (shared(linkA.a.id, linkB.a.id) ||
              shared(linkA.a.id, linkB.b.id) ||
              shared(linkA.b.id, linkB.a.id) ||
              shared(linkA.b.id, linkB.b.id)) {
              linkB.invalid = true;
            }
          }
        }
      }
    }
    resolveConflicts();

    function _merge(arr1, arr2) {
      for (let i = 0; i < arr2.length; ++i) {
        if (arr1.indexOf(arr2[i]) < 0) {
          arr1.push(arr2[i]);
        }
      }
    }

    function linksToTuples(tuplesToLink) {
      const tuples = [];
      for (let i = 0; i < tuplesToLink.length; i++) {
        const linkTuple = tuplesToLink[i];
        const tuple = [];
        tuples.push(tuple);
        for (let j = 0; j < linkTuple.length; j++) {
          const link = linkTuple[j];
          if (!link.invalid) {
            _merge(tuple, [link.a.id, link.b.id]);
            info.reducedConstraints[link.constr] = true;
            info.idToParam[link.a.id] = link.a;
            info.idToParam[link.b.id] = link.b;
          }
        }
      }
      return tuples;
    }
    const tuples = linksToTuples(linkTuples);

    for (let i = 0; i < tuples.length; ++i) {
      const tuple = tuples[i];
      info.linkedParams.push(tuple);
      for (let mi = 0; mi < readOnlyParams.length; ++mi) {
        const masterParam = readOnlyParams[mi];
        const masterIdx = tuple.indexOf(masterParam.id);
        if (masterIdx >= 0) {
          const tmp = tuple[0];
          tuple[0] = tuple[masterIdx];
          tuple[masterIdx] = tmp;
          break;
        }
      }
    }

    for (let ei = 0; ei < info.linkedParams.length; ++ei) {
      const master = info.linkedParams[ei][0];
      for (let i = 1; i < info.linkedParams[ei].length; ++i) {
        info.reducedParams[info.linkedParams[ei][i]] = master;
      }
    }
    return info;
  }



  constructor(viewer) {
    this.constraintStream = new Subject<ConstraintAction>();
    this.viewer = viewer;
    this.subSystems = [];
    this.constantTable = {};
    this.constantResolver = this.createConstantResolver();
  }

  public createConstantResolver() {
    const pm = this;
    return function (value) {
      const _value = pm.constantTable[value];
      if (_value !== undefined) {
        value = _value;
      } else if (typeof (value) !== 'number') {
        console.error('unable to resolve constant ' + value);
      }
      return value;
    };
  }
  public notify(actionType: string, constraint: Constraint) {
    this.constraintStream.next(
      new ConstraintAction(actionType, constraint)
    );
  }

  public rebuildConstantTable(constantDefinition) {
    this.constantTable = {};
    if (constantDefinition === null) {
      return;
    }
    const lines = constantDefinition.split('\n');
    let prefix = '(function() { \n';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const m = line.match(/^\s*([^\s]+)\s*=(.+)$/);
      if (m !== null && m.length === 3) {

        const constant = m[1];
        try {
          const value = eval(prefix + 'return ' + m[2] + '; \n})()');
          this.constantTable[constant] = value;
          prefix += 'const ' + constant + ' = ' + value + ';\n';
        } catch (e) {
          console.log(e);
        }
      }
    }
  }

  public onConstantsExternalChange(constantDefinition) {
    this.rebuildConstantTable(constantDefinition);
    this.refresh();
  }

  public defineNewConstant(name, value) {
    // let constantDefinition = this.viewer.params.constantDefinition;
    // let constantText = name + ' = ' + value;
    // if (constantDefinition) {
    //   constantDefinition += '\n' + constantText;
    // } else {
    //   constantDefinition = constantText;
    // }
    // this.rebuildConstantTable(constantDefinition);
    //disabling onConstantsExternalChange since we don't need re-solve
    // this.viewer.params.set('constantDefinition', constantDefinition, 'parametricManager');
  }

  public findComponents(constr) {
    if (this.subSystems.length === 0) {
      this.subSystems.push(new SubSystem());
    }
    return [0];
  }


  protected _add(constr) {
    const subSystemIds = this.findComponents(constr);
    let subSystem = null;
    switch (subSystemIds.length) {
      case 0:
        subSystem = new SubSystem();
        this.subSystems.push(subSystem);
        break;
      case 1:
        subSystem = this.subSystems[subSystemIds[0]];
        break;
      default:
        subSystem = this.subSystems[subSystemIds[0]];
        for (let i = 1; i < subSystemIds.length; i++) {
          // const toMerge = subSystemIds[i];
          // for (let j = 0; j < toMerge.constraints.length; j++) {
          //   subSystem.push(toMerge.constraints[j]);
          // }
        }
        break;
    }
    subSystem.constraints.push(constr);
    this.notify('add', constr);
    return subSystem;
  }

  public checkRedundancy(subSystem, constr) {
    const solver = this.prepareForSubSystem([], subSystem.constraints);
    if (solver.diagnose().conflict) {
      alert('Most likely this ' + constr.NAME + ' constraint is CONFLICTING!');
    }
  }

  public refresh() {
    this.solve();

    this.viewer.refresh();
  }

  public add(constr) {
    // this.viewer.historyManager.checkpoint();
    const subSystem = this._add(constr);
    this.checkRedundancy(subSystem, constr);
    this.refresh();
  }

  public addAll(constrs) {
    for (let i = 0; i < constrs.length; i++) {
      const subSystem = this._add(constrs[i]);
      this.checkRedundancy(subSystem, constrs[i]);
    }
    this.refresh();
  }

  public remove(constr) {
    // this.viewer.historyManager.checkpoint();
    for (let j = 0; j < this.subSystems.length; j++) {
      const sub = this.subSystems[j];
      for (let i = 0; i < sub.constraints.length; ++i) {
        const p = sub.constraints[i];
        if (p === constr) {
          sub.constraints.splice(i, 1);
          if (p.NAME === 'coi') {
            const point = p as Coincident;
            this.unlinkObjects(point.a, point.b);
          }
          break;
        }
      }
    }
    this.notify('remove', constr);
    this.refresh();
  }

  public removeConstraintsByObj(obj) {
    const ownedParams = [];
    obj.collectParams(ownedParams);
    this.removeConstraintsByParams(ownedParams);
  }

  public removeConstraintsByParams(ownedParams) {
    for (let s = 0; s < this.subSystems.length; s++) {
      const toRemove = [];
      const sub = this.subSystems[s];
      for (let i = 0; i < sub.constraints.length; ++i) {
        const sdataArr = sub.constraints[i].getSolveData(this.constantResolver);
        MAIN:
        for (let j = 0; j < sdataArr.length; j++) {
          const sdata = sdataArr[j];
          const params = sdata[1];
          for (let oi = 0; oi < ownedParams.length; ++oi) {
            for (let k = 0; k < params.length; ++k) {
              if (ownedParams[oi].id === params[k].id) {
                toRemove.push(i);
                break MAIN;
              }
            }
          }
        }
      }
      toRemove.sort();

      for (let i = toRemove.length - 1; i >= 0; --i) {
        this.notify('remove', toRemove[i]);
        sub.constraints.splice(toRemove[i], 1);
      }
    }


  }

  public lock(objs) {
    const p = fetch.points(objs);
    for (let i = 0; i < p.length; ++i) {
      this._add(new Lock(p[i], { x: p[i].x, y: p[i].y }));
    }
    this.refresh();
  }

  public vertical(objs) {
    this.addAll(fetch.lines(objs).map(line => new Vertical(line)));
  }

  public horizontal(objs) {
    this.addAll(fetch.lines(objs).map(line => new Horizontal(line)));
  }

  public parallel(objs) {
    const lines = fetch.lines(objs);
    const constraints = [];
    for (let i = 1; i < lines.length; i++) {
      constraints.push(new Parallel(lines[i - 1], lines[i]));
    }
    this.addAll(constraints);
  }

  public perpendicular(objs) {
    const lines = fetch.twoLines(objs);
    this.add(new Perpendicular(lines[0], lines[1]));
  }

  public lockConvex(objs, warnCallback) {
    const lines = fetch.twoLines(objs);
    const l1 = lines[0];
    const l2 = lines[1];
    const pts = [l1.a, l1.b, l2.a, l2.b];

    function isLinked(p1, p2) {
      for (let i = 0; i < p1.linked.length; ++i) {
        if (p1.linked[i].id === p2.id) {
          return true;
        }
      }
      return false;
    }

    function swap(arr, i1, i2) {
      const _ = arr[i1];
      arr[i1] = arr[i2];
      arr[i2] = _;
    }

    if (isLinked(pts[0], pts[2])) {
      swap(pts, 0, 1);
    } else if (isLinked(pts[0], pts[3])) {
      swap(pts, 0, 1);
      swap(pts, 2, 3);
    } else if (isLinked(pts[1], pts[3])) {
      swap(pts, 2, 3);
    } else if (isLinked(pts[1], pts[2])) {
      //we are good
    } else {
      warnCallback('Lines must be connected');
      return;
    }

    let c = pts[0];
    const a = pts[1];
    let t = pts[3];

    // ||ac x at|| > 0
    const crossNorma = (c.x - a.x) * (t.y - a.y) - (c.y - a.y) * (t.x - a.x);

    if (crossNorma < 0) {
      const _ = c;
      c = t;
      t = _;
    }

    this.add(new LockConvex(c, a, t));
  }


  public tangent(objs) {
    const ellipses = fetch.generic(objs, ['M4CAD.TWO.Ellipse', 'M4CAD.TWO.EllipticalArc'], 0);
    const lines = fetch.generic(objs, ['M4CAD.TWO.Segment'], 1);
    if (ellipses.length > 0) {
      this.add(new EllipseTangent(lines[0], ellipses[0]));
    } else {
      const arcs = fetch.generic(objs, ['M4CAD.TWO.Arc', 'M4CAD.TWO.Circle'], 1);
      this.add(new Tangent(arcs[0], lines[0]));
    }
  }

  public rr(arcs) {
    let prev = arcs[0];
    for (let i = 1; i < arcs.length; ++i) {
      this._add(new RadiusEquality(prev, arcs[i]));
      prev = arcs[i];
    }
    this.refresh();
  }

  public ll(lines) {
    let prev = lines[0];
    for (let i = 1; i < lines.length; ++i) {
      this._add(new LineEquality(prev, lines[i]));
      prev = lines[i];
    }
    this.refresh();

  }

  public entityEquality(objs) {
    const arcs = fetch.generic(objs, ['M4CAD.TWO.Arc', 'M4CAD.TWO.Circle'], 0);
    const lines = fetch.generic(objs, ['M4CAD.TWO.Segment'], 0);
    if (arcs.length > 0) {
      this.rr(arcs);
    }
    if (lines.length > 0) {
      this.ll(lines);
    }
  }

  public p2lDistance(objs, promptCallback) {
    const pl = fetch.pointAndLine(objs);

    const target = pl[0];
    const segment = pl[1];

    const ex = new Vector(-(segment.b.y - segment.a.y), segment.b.x - segment.a.x).normalize();
    const distance = Math.abs(ex.dot(new Vector(segment.a.x - target.x, segment.a.y - target.y)));

    const promptDistance = utils.askNumber(P2LDistance.SettableFields.d, distance.toFixed(2), promptCallback, this.constantResolver);

    if (promptDistance !== null) {
      this.add(new P2LDistance(target, segment, promptDistance));
    }
  }

  public pointInMiddle(objs) {
    const pl = fetch.pointAndLine(objs);
    this.add(new PointInMiddle(pl[0], pl[1]));
  }


  public symmetry(objs) {
    const pl = fetch.pointAndLine(objs);
    this.add(new Symmetry(pl[0], pl[1]));
  }

  public pointOnArc(objs) {
    const points = fetch.generic(objs, ['M4CAD.TWO.EndPoint'], 1);
    const arcs = fetch.generic(objs, ['M4CAD.TWO.Arc', 'M4CAD.TWO.Circle', 'M4CAD.TWO.Ellipse', 'M4CAD.TWO.EllipticalArc'], 1);
    const arc = arcs[0];
    if (arc._class === 'M4CAD.TWO.Ellipse' || arc._class === 'M4CAD.TWO.EllipticalArc') {
      this.add(new PointOnEllipse(points[0], arc));
    } else {
      this.add(new PointOnArc(points[0], arc));
    }
  }

  public pointOnLine(objs) {
    const pl = fetch.pointAndLine(objs);
    const target = pl[0];
    const segment = pl[1];
    this.add(new PointOnLine(target, segment));
  }

  public llAngle(objs, promptCallback) {
    const lines = fetch.generic(objs, 'M4CAD.TWO.Segment', 2);
    const l1 = lines[0];
    const l2 = lines[1];

    const points = [l1.a, l1.b, l2.a, l2.b];

    if (l1.b.x < l1.a.x) {
      points[0] = l1.b;
      points[1] = l1.a;
    }

    if (l2.b.x < l2.a.x) {
      points[2] = l2.b;
      points[3] = l2.a;
    }

    const dx1 = points[1].x - points[0].x;
    const dy1 = points[1].y - points[0].y;
    const dx2 = points[3].x - points[2].x;
    const dy2 = points[3].y - points[2].y;

    let angle = Math.atan2(dy2, dx2) - Math.atan2(dy1, dx1);
    angle *= 1 / Math.PI * 180;
    angle = utils.askNumber(Angle.prototype.angle, angle.toFixed(2), promptCallback, this.constantResolver);
    if (angle === null) {
      return;
    }
    this.add(new Angle(points[0], points[1], points[2], points[3], angle));
  }

  public p2pDistance(objs, promptCallback) {
    const p = fetch.twoPoints(objs);
    const distance = new Vector(p[1].x - p[0].x, p[1].y - p[0].y).length();
    const promptDistance = utils.askNumber(P2PDistance.SettableFields.d, distance.toFixed(2), promptCallback, this.constantResolver);

    if (promptDistance !== null) {
      this.add(new P2PDistance(p[0], p[1], promptDistance));
    }
  }

  public radius(objs, promptCallback) {
    const arcs = fetch.arkCirc(objs, 1);
    const radius = arcs[0].r.get();
    const promptDistance = utils.askNumber(Radius.SettableFields.d, radius.toFixed(2), promptCallback, this.constantResolver);
    if (promptDistance !== null) {
      for (let i = 0; i < arcs.length; ++i) {
        this._add(new Radius(arcs[i], promptDistance));
      }
      this.refresh();
    }
  }

  public linkObjects(objs) {
    let masterIdx = -1;
    for (let i = 0; i < objs.length; ++i) {
      if (ParametricManager.isAux(objs[i])) {
        if (masterIdx !== -1) {
          throw 'not allowed to have a coincident constraint between two or more auxiliary objects';
        }
        masterIdx = i;
      }
    }
    if (masterIdx === -1) {
      masterIdx = objs.length - 1;
    }


    for (let i = 0; i < objs.length; ++i) {
      if (i === masterIdx) {
        continue;
      }
      objs[i].x = objs[masterIdx].x;
      objs[i].y = objs[masterIdx].y;
      const c = new Coincident(objs[i], objs[masterIdx]);
      this._add(c);
    }
  }

  public unlinkObjects(a, b) {

    function _unlink(_a, _b) {
      for (let i = 0; i < _a.linked.length; ++i) {
        const obj = _a.linked[i];
        if (obj.id === _b.id) {
          _a.linked.splice(i, 1);
          break;
        }
      }
    }
    _unlink(a, b);
    _unlink(b, a);
  }

  public findCoincidentConstraint(point1, point2) {
    for (let subSys of this.subSystems) {
      for (let c of subSys.constraints) {
        if (c.NAME === 'coi') {
          const coi = c as Coincident;
          if ((coi.a.id === point1.id && coi.b.id === point2.id) ||
            (coi.b.id === point1.id && coi.a.id === point2.id)) {
            return c;
          }
        }

      }
    }
    return null;
  }

  public coincident(objs) {
    if (objs.length === 0) {
      return;
    }
    this.linkObjects(objs);
    this.solve();
    this.viewer.refresh();
  }

  public getSolveData() {
    const sdata = [];
    for (let i = 0; i < this.subSystems.length; i++) {
      this.__getSolveData(this.subSystems[i].constraints, sdata);
    }
    return sdata;
  }



  public solve(lock?, extraConstraints?, disabledObjects?) {
    const solver = this.prepare(lock, extraConstraints, disabledObjects);
    solver.solve(false);
    solver.sync();
  }

  public prepare(locked, extraConstraints?, disabledObjects?) {
    const subSystems = this.subSystems;
    const solvers = [];
    for (let i = 0; i < subSystems.length; i++) {
      solvers.push(this.prepareForSubSystem(locked, subSystems[i].constraints, extraConstraints, disabledObjects));
    }
    if (subSystems.length === 0 && locked && locked.length !== 0) {
      solvers.push(this.prepareForSubSystem(locked, [], extraConstraints, disabledObjects));
    }
    return {

      solve: function (rough) {
        for (let i = 0; i < solvers.length; i++) {
          let alg = i < subSystems.length ? subSystems[i].alg : 1;
          const res = solvers[i].solve(rough, alg);
          if (res.returnCode !== 1) {
            alg = alg === 1 ? 2 : 1;
            //if (solvers[i].solve(rough, alg).returnCode === 1) {
            //subSystems[i].alg = alg;
            //}
          }
        }
      },
      solvers: solvers,
      sync: function () {
        for (let i = 0; i < solvers.length; i++) {
          solvers[i].sync();
        }
      },

      updateLock: function (values) {
        for (let i = 0; i < solvers.length; i++) {
          solvers[i].updateLock(values);
        }
      },

      updateParameter: function (p) {
        for (let i = 0; i < solvers.length; i++) {
          solvers[i].updateParameter(p);
        }
      }
    };
  }
  public prepareForSubSystem(locked, subSystemConstraints, extraConstraints?, disabledObjects?) {

    locked = locked || [];

    const constrs = [];
    const solverParamsDict = {};
    const system = [];
    const auxParams = [];
    const auxDict = {};

    this.__getSolveData(subSystemConstraints, system);
    if (!!extraConstraints) {
      this.__getSolveData(extraConstraints, system);
    }

    ParametricManager.fetchAuxParams(system, auxParams, auxDict, disabledObjects);
    const readOnlyParams = auxParams.concat(locked);
    const reduceInfo = ParametricManager.reduceSystem(system, readOnlyParams);

    function getSolverParam(p) {
      const master = reduceInfo.reducedParams[p.id];
      if (master !== undefined) {
        p = reduceInfo.idToParam[master];
      }
      let _p = solverParamsDict[p.id];
      if (_p === undefined) {
        if (p.__cachedParam__ === undefined) {
          _p = new Param(p.id, p.get());
          p.__cachedParam__ = _p;
        } else {
          _p = p.__cachedParam__;
          _p.reset(p.get());
        }

        _p._backingParam = p;
        solverParamsDict[p.id] = _p;
      }
      return _p;
    }

    (function pickupAuxiliaryInfoFromSlaves() {
      for (let i = 0; i < reduceInfo.linkedParams.length; ++i) {
        const linkedParams = reduceInfo.linkedParams[i];
        const master = linkedParams[0];
        if (auxDict[master] !== undefined) {
          continue;
        }
        for (let j = 1; j < linkedParams.length; j++) {
          const slave = linkedParams[j];
          if (auxDict[slave] !== undefined) {
            auxDict[master] = true;
            break;
          }
        }
      }
    })();

    for (let i = 0; i < system.length; ++i) {

      const sdata = system[i];
      const params = [];

      for (let p = 0; p < sdata[1].length; ++p) {
        const param = sdata[1][p];
        const solverParam = getSolverParam(param);
        solverParam.aux = auxDict[param.id] !== undefined;
        params.push(solverParam);
      }
      if (reduceInfo.reducedConstraints[i] === true) {
        continue;
      }


      const _constr = createByConstraintName(sdata[0], params, sdata[2]);
      constrs.push(_constr);
    }

    const lockedSolverParams = [];
    for (let p = 0; p < locked.length; ++p) {
      lockedSolverParams[p] = getSolverParam(locked[p]);
    }

    const solver: any = prepare(constrs, lockedSolverParams);

    function solve(rough, alg) {
      return solver.solveSystem(rough, alg);
    }

    const viewer = this.viewer;

    function sync() {
      for (let paramId in solverParamsDict) {
        const solverParam = solverParamsDict[paramId];
        if (!!solverParam._backingParam.aux) {
          continue;
        }
        solverParam._backingParam.set(solverParam.get());
      }

      //Make sure all coincident constraints are equal
      for (let ei = 0; ei < reduceInfo.linkedParams.length; ++ei) {
        const master = reduceInfo.idToParam[reduceInfo.linkedParams[ei][0]];
        for (let i = 1; i < reduceInfo.linkedParams[ei].length; ++i) {
          const slave = reduceInfo.idToParam[reduceInfo.linkedParams[ei][i]];
          slave.set(master.get());
        }
      }
      viewer.equalizeLinkedEndpoints();
    }

    function updateParameter(p) {
      getSolverParam(p).set(p.get());
    }

    solver.solve = solve;
    solver.sync = sync;
    solver.updateParameter = updateParameter;
    return solver;
  }


  private __getSolveData(constraints, out) {
    for (let i = 0; i < constraints.length; ++i) {
      const constraint = constraints[i];
      const data = constraint.getSolveData(this.constantResolver);
      for (let j = 0; j < data.length; ++j) {
        data[j].push(constraint.reducible !== true);
        out.push(data[j]);
      }
    }
    return out;
  }
}





export { ParametricManager };
