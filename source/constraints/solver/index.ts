import * as utils from '../../util';
import * as math from '../../math/math';
import QR from '../../math/qr';
import LMOptimizer from '../../math/lm';
import {
  ConstantWrapper,
  EqualsTo
} from '../utils';
import {
  dog_leg
} from '../../math/optim';


class Param {

  public j: number;
  public value: any;
  public aux: boolean;
  constructor(id, value, isAux = false) {
    this.reset(value);
  }

  public reset(value) {
    this.set(value);
    this.j = -1;
    this.aux = false;
  }

  public set(value) {
    if (this.aux) {
      return;
    }
    this.value = value;
  }

  public get() {
    return this.value;
  }

  public nop() {
    return undefined;
  }

}

/** @constructor */
function System(constraints) {
  this.constraints = constraints;
  this.params = [];
  for (let ci = 0; ci < constraints.length; ++ci) {
    const c = constraints[ci];
    for (let pi = 0; pi < c.params.length; ++pi) {
      const p = c.params[pi];
      if (p.j === -1) {
        p.j = this.params.length;
        this.params.push(p);
      }
    }
  }
}


System.prototype.makeJacobian = function () {
  const jacobi = [];

  for (let i = 0; i < this.constraints.length; i++) {
    jacobi[i] = [];
    for (let j = 0; j < this.params.length; j++) {
      jacobi[i][j] = 0;
    }
  }
  for (let i = 0; i < this.constraints.length; i++) {
    const c = this.constraints[i];

    const cParams = c.params;
    const grad = [];
    utils.fillArray(grad, 0, cParams.length, 0);
    c.gradient(grad);

    for (let p = 0; p < cParams.length; p++) {
      const param = cParams[p];
      let j = param.j;
      jacobi[i][j] = grad[p];
    }
  }
  return jacobi;
};

System.prototype.fillJacobian = function (jacobi) {
  for (let i = 0; i < this.constraints.length; i++) {
    const c = this.constraints[i];

    const cParams = c.params;
    const grad = [];
    utils.fillArray(grad, 0, cParams.length, 0);
    c.gradient(grad);

    for (let p = 0; p < cParams.length; p++) {
      const param = cParams[p];
      const j = param.j;
      jacobi[i][j] = grad[p];
    }
  }
  return jacobi;
};

System.prototype.calcResidual = function (r) {

  let err = 0.;

  for (let i = 0; i < this.constraints.length; i++) {
    const c = this.constraints[i];
    r[i] = c.error();
    err += r[i] * r[i];
  }

  err *= 0.5;
  return err;
};

System.prototype.calcGrad_ = function (out) {

  for (let i = 0; i < out.length || i < this.params.length; ++i) {
    out[i][0] = 0;
  }

  for (i = 0; i < this.constraints.length; i++) {
    const c = this.constraints[i];

    const cParams = c.params;
    const grad = [];
    utils.fillArray(grad, 0, cParams.length, 0);
    c.gradient(grad);

    for (let p = 0; p < cParams.length; p++) {
      const param = cParams[p];
      const j = param.j;
      out[j][0] += this.constraints[i].error() * grad[p]; // (10.4)
    }
  }
};

System.prototype.calcGrad = function (out) {
  const i;
  for (i = 0; i < out.length || i < this.params.length; ++i) {
    out[i] = 0;
  }

  for (i = 0; i < this.constraints.length; i++) {
    const c = this.constraints[i];

    const cParams = c.params;
    const grad = [];
    utils.fillArray(grad, 0, cParams.length, 0);
    for (let p = 0; p < cParams.length; p++) {
      const param = cParams[p];
      const j = param.j;
      out[j] += this.constraints[i].error() * grad[p]; // (10.4)
    }
  }
};

System.prototype.fillParams = function (out) {
  for (let p = 0; p < this.params.length; p++) {
    out[p] = this.params[p].get();
  }
};

System.prototype.getParams = function () {
  const out = [];
  this.fillParams(out);
  return out;
};

System.prototype.setParams = function (point) {
  for (let p = 0; p < this.params.length; p++) {
    this.params[p].set(point[p]);
  }
};

System.prototype.error = function () {
  const error = 0;
  for (let i = 0; i < this.constraints.length; i++) {
    error += Math.abs(this.constraints[i].error());
  }
  return error;
};

System.prototype.errorSquare = function () {
  const error = 0;
  for (let i = 0; i < this.constraints.length; i++) {
    const t = this.constraints[i].error();
    error += t * t;
  }
  return error * 0.5;
};

System.prototype.getValues = function () {
  const values = [];
  for (let i = 0; i < this.constraints.length; i++) {
    values[i] = this.constraints[i].error();
  }
  return values;
};

function wrapAux(constrs) {
  for (let i = 0; i < constrs.length; i++) {
    const c = constrs[i];
    const mask = [];
    let needWrap = false;
    for (let j = 0; j < c.params.length; j++) {
      const param = c.params[j];
      mask[j] = param.aux === true;
      needWrap = needWrap || mask[j];
    }
    if (needWrap) {
      constrs[i] = new ConstantWrapper(c, mask);
    }
  }
  for (let constr of constrs) {
    if (constr.params.length == 0) {
      return constrs.filter(c => c.params.length != 0);
    }
  }
  return constrs;
}

const lock2Equals2 = function (constrs, locked) {
  const _locked = [];
  for (let i = 0; i < locked.length; ++i) {
    _locked.push(new EqualsTo([locked[i]], locked[i].get()));
  }
  return _locked;
};

const diagnose = function (sys) {
  if (sys.constraints.length == 0 || sys.params.length == 0) {
    return {
      conflict: false,
      dof: 0
    }
  }
  const jacobian = sys.makeJacobian();
  const qr = new QR(jacobian);
  return {
    conflict: sys.constraints.length > qr.rank,
    dof: sys.params.length - qr.rank
  }
};

const prepare = function (constrs, locked) {

  const simpleMode = true;
  if (!simpleMode) {
    const lockingConstrs = lock2Equals2(constrs, locked);
    Array.prototype.push.apply(constrs, lockingConstrs);
  }

  constrs = wrapAux(constrs);
  const sys = new System(constrs);

  const model = function (point) {
    sys.setParams(point);
    return sys.getValues();
  };

  const jacobian = function (point) {
    sys.setParams(point);
    return sys.makeJacobian();
  };
  const nullResult = {
    evalCount: 0,
    error: 0,
    returnCode: 1
  };

  function solve(rough, alg) {
    //if (simpleMode) return nullResult;
    if (constrs.length == 0) return nullResult;
    if (sys.params.length == 0) return nullResult;
    switch (alg) {
      case 2:
        return solve_lm(sys, model, jacobian, rough);
      case 1:
      default:
        return dog_leg(sys, rough);
    }
  }
  const systemSolver = {
    diagnose: function () {
      return diagnose(sys)
    },
    error: function () {
      return sys.error()
    },
    solveSystem: solve,
    system: sys,
    updateLock: function (values) {
      for (let i = 0; i < values.length; ++i) {
        if (simpleMode) {
          locked[i].set(values[i]);
        } else {
          lockingConstrs[i].value = values[i];
        }
      }
    }
  };
  return systemSolver;
};

const solve_lm = function (sys, model, jacobian, rough) {
  const opt = new LMOptimizer(sys.getParams(), math._vec(sys.constraints.length), model, jacobian);
  opt.evalMaximalCount = 100 * sys.params.length;
  const eps = rough ? 0.001 : 0.00000001;
  opt.init0(eps, eps, eps);
  const returnCode = 1;
  try {
    const res = opt.doOptimize();
  } catch (e) {
    returnCode = 2;
  }
  sys.setParams(res[0]);
  return {
    evalCount: opt.evalCount,
    error: sys.error(),
    returnCode: returnCode
  };
};

export {
  Param,
  prepare,
  System
};
