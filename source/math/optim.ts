//declare const numeric: any;
import * as numeric from 'numeric';
import { _vec, _matrix } from './math';


//Added strong wolfe condition to numeric's uncmin
const bfgs_ = function (f, x0, tol = 1e-8, gradient, maxit = 1000, callback, options: any = {}) {
  const grad = numeric.gradient;

  if (typeof gradient === 'undefined') {
    gradient = function (x) { return grad(f, x); };
  }

  x0 = numeric.clone(x0);
  const n = x0.length;
  let f0 = f(x0), f1;
  if (isNaN(f0)) {
    throw new Error('uncmin: f(x0) is a NaN!');
  }
  const max = Math.max, norm2 = numeric.norm2;
  tol = max(tol, numeric.epsilon);
  let step, g0, nstep, df0, x1, t;
  let g1, H1 = options.Hinv || numeric.identity(n);
  let dot = numeric.dot, sub = numeric.sub,
    add = numeric.add, ten = numeric.tensor,
    div = numeric.div, mul = numeric.mul;
  let all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
  let it = 0, s, y, Hy, ys;
  let msg = '';
  g0 = gradient(x0);
  while (it < maxit) {
    if (typeof callback === 'function') {
      if (callback(it, x0, f0, g0, H1)) {
        msg = 'Callback returned true'; break;
      }
    }
    if (!all(isfinite(g0))) { msg = 'Gradient has Infinity or NaN'; break; }
    step = neg(dot(H1, g0));
    if (!all(isfinite(step))) { msg = 'Search direction has Infinity or NaN'; break; }
    nstep = norm2(step);
    if (nstep < tol) { msg = 'Newton step smaller than tol'; break; }
    t = 1;
    df0 = dot(g0, step);
    // line search
    x1 = x0;
    let tL = 0;
    let tR = 100;
    while (it < maxit) {
      if (t * nstep < tol) { break; }
      s = mul(step, t);
      x1 = add(x0, s);
      f1 = f(x1);
      //Nocadel, 3.7(a,b)
      if (f1 - f0 >= 0.1 * t * df0 || isNaN(f1)) {
        tR = t;
        t = (tL + tR) * 0.5;
        ++it;
      } else {
        const slope = dot(gradient(x1), step);
        if (slope <= 0.9 * Math.abs(df0)) {
          break;
        } else if (slope >= 0.9 * df0) {
          tR = t;
          t = (tL + tR) * 0.5;
        } else {
          tL = t;
          t = (tL + tR) * 0.5;
        }
      }
    }
    if (t * nstep < tol) { msg = 'Line search step size smaller than tol'; break; }
    if (it === maxit) { msg = 'maxit reached during line search'; break; }
    g1 = gradient(x1);
    y = sub(g1, g0);
    ys = dot(y, s);
    Hy = dot(H1, y);

    // BFGS update on H1
    H1 = sub(add(H1,
      mul(
        (ys + dot(y, Hy)) / (ys * ys),
        ten(s, s))),
      div(add(ten(Hy, s), ten(s, Hy)), ys));
    x0 = x1;
    f0 = f1;
    g0 = g1;
    ++it;
  }
  return { solution: x0, f: f0, gradient: g0, invHessian: H1, iterations: it, message: msg };
};

//https://en.wikipedia.org/wiki/Broyden%E2%80%93Fletcher%E2%80%93Goldfarb%E2%80%93Shanno_algorithm
const bfgs = function (f, x0, tol, gradient, maxit, callback, options) {
  const grad = numeric.gradient;
  if (typeof options === 'undefined') { options = {}; }
  if (typeof tol === 'undefined') { tol = 1e-8; }
  if (typeof gradient === 'undefined') { gradient = function (x) { return grad(f, x); }; }
  if (typeof maxit === 'undefined') maxit = 1000;
  x0 = numeric.clone(x0);
  const n = x0.length;
  const f0 = f(x0), f1, df0;
  if (isNaN(f0)) throw new Error('uncmin: f(x0) is a NaN!');
  const max = Math.max, norm2 = numeric.norm2;
  tol = max(tol, numeric.epsilon);
  const step, g0, g1, H1 = options.Hinv || numeric.identity(n);
  const dot = numeric.dot, inv = numeric.inv, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;
  const all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
  const it = 0, i, s, x1, y, Hy, Hs, ys, i0, t, nstep, t1, t2;
  const msg = '';
  g0 = gradient(x0);
  while (it < maxit) {
    if (typeof callback === 'function') { if (callback(it, x0, f0, g0, H1)) { msg = 'Callback returned true'; break; } }
    if (!all(isfinite(g0))) { msg = 'Gradient has Infinity or NaN'; break; }
    step = neg(dot(H1, g0));
    if (!all(isfinite(step))) { msg = 'Search direction has Infinity or NaN'; break; }
    nstep = norm2(step);
    if (nstep < tol) { msg = 'Newton step smaller than tol'; break; }

    df0 = dot(g0, step);
    // line search
    t1 = 0.0;
    f1 = f0;

    t2 = 1.0;
    s = mul(step, t2);
    x1 = add(x0, s);
    const f2 = f(x1);

    const t3 = 2.0;
    s = mul(step, t3);
    x1 = add(x0, s);
    const f3 = f(x1);
    const tMax = 1e23;

    while ((f2 > f1 || f2 > f3) && it < maxit) {
      if (t * nstep < tol) { break; }
      if (f2 > f1) {
        //If f2 is greater than f1 then we shorten alpha2 and alpha3 closer to f1
        //Effectively both are shortened by a factor of two.
        t3 = t2;
        f3 = f2;
        t2 = t2 / 2;

        s = mul(step, t2);
        x1 = add(x0, s);
        f2 = f(x1);
      }
      else if (f2 > f3) {
        if (t3 >= tMax)
          break;
        //If f2 is greater than f3 then we increase alpha2 and alpha3 away from f1
        //Effectively both are lengthened by a factor of two.
        t2 = t3;
        f2 = f3;
        t3 = t3 * 2;

        s = mul(step, t3);
        x1 = add(x0, s);
        f3 = f(x1);
      }
      it++;
    }

    //Get the alpha for the minimum f of the quadratic approximation
    const ts = t2 + ((t2 - t1) * (f1 - f3)) / (3 * (f1 - 2 * f2 + f3));

    //Guarantee that the new alphaStar is within the bracket
    if (ts >= t3 || ts <= t1)
      ts = t2;

    if (ts > tMax)
      ts = tMax;

    if (ts != ts)
      ts = 0.;

    //Take a final step to alphaStar
    s = mul(step, ts);
    x1 = add(x0, s);
    f1 = f(x1);


    if (t * nstep < tol) { msg = 'Line search step size smaller than tol'; break; }
    if (it === maxit) { msg = 'maxit reached during line search'; break; }
    g1 = gradient(x1);
    y = sub(g1, g0);
    ys = dot(y, s);
    Hy = dot(H1, y);

    // BFGS update on H1
    H1 = sub(add(H1,
      mul(
        (ys + dot(y, Hy)) / (ys * ys),
        ten(s, s))),
      div(add(ten(Hy, s), ten(s, Hy)), ys));
    x0 = x1;
    f0 = f1;
    g0 = g1;
    ++it;
  }
  return { solution: x0, f: f0, gradient: g0, invHessian: H1, iterations: it, message: msg };
};

const bfgs_updater = function (gradient, x0) {
  const n = x0.length;
  const max = Math.max, norm2 = numeric.norm2;
  const g0, g1, H1 = numeric.identity(n);
  const dot = numeric.dot, inv = numeric.inv, sub = numeric.sub, add = numeric.add, ten = numeric.tensor, div = numeric.div, mul = numeric.mul;
  const all = numeric.all, isfinite = numeric.isFinite, neg = numeric.neg;
  const y, Hy, Hs, ys;
  const msg = '';
  g0 = gradient(x0);

  function step() {
    return neg(dot(H1, g0));
  }

  function update(x, real_step) {
    const s = real_step;

    g1 = gradient(x);
    y = sub(g1, g0);
    ys = dot(y, s);
    Hy = dot(H1, y);

    // BFGS update on H1
    H1 = sub(add(H1,
      mul(
        (ys + dot(y, Hy)) / (ys * ys),
        ten(s, s))),
      div(add(ten(Hy, s), ten(s, Hy)), ys));
    g0 = g1;
  }
  return { step: step, update: update };
};

const inv = function inv(A) {
  A = numeric.clone(A);
  const s = numeric.dim(A), abs = Math.abs, m = s[0], n = s[1];
  const Ai, Aj;
  const I = numeric.identity(m), Ii, Ij;
  const i, j, k, x;
  for (j = 0; j < n; ++j) {
    const i0 = -1;
    const v0 = -1;
    for (i = j; i !== m; ++i) { k = abs(A[i][j]); if (k > v0) { i0 = i; v0 = k; } }
    Aj = A[i0]; A[i0] = A[j]; A[j] = Aj;
    Ij = I[i0]; I[i0] = I[j]; I[j] = Ij;
    x = Aj[j];
    if (x === 0) {
      console.log('CAN' INVERSE MATRIX');
      x = 1e-32
    }
    for (k = j; k !== n; ++k)    Aj[k] /= x;
    for (k = n - 1; k !== -1; --k) Ij[k] /= x;
    for (i = m - 1; i !== -1; --i) {
      if (i !== j) {
        Ai = A[i];
        Ii = I[i];
        x = Ai[j];
        for (k = j + 1; k !== n; ++k)  Ai[k] -= Aj[k] * x;
        for (k = n - 1; k > 0; --k) { Ii[k] -= Ij[k] * x; --k; Ii[k] -= Ij[k] * x; }
        if (k === 0) Ii[0] -= Ij[0] * x;
      }
    }
  }
  return I;
};

const _result = function (evalCount, error, returnCode) {
  this.evalCount = evalCount;
  this.error = error;
  this.returnCode = returnCode;
};

const dog_leg = function (subsys, rough) {
  //rough = true
  //const tolg = rough ? 1e-3 : 1e-4;
  const tolg, tolf;
  if (rough) {
    tolg = 1e-3;
    tolf = 1e-3;
  } else {
    tolg = 1e-6;
    tolf = 1e-6;
  }

  const tolx = 1e-80;

  const xsize = subsys.params.length;
  const csize = subsys.constraints.length;

  if (xsize == 0) {
    return new _result(0, 0, 1);
  }

  const vec = _vec;
  const mx = _matrix;

  const n = numeric;

  const x = vec(xsize);
  const x_new = vec(xsize);

  const fx = vec(csize);
  const fx_new = vec(csize);

  const J = mx(csize, xsize);
  const J_new = mx(csize, xsize);
  const gn_step = vec(xsize);
  const dl_step = vec(xsize);

  subsys.fillParams(x);
  const err = subsys.calcResidual(fx);
  subsys.fillJacobian(J);

  function lsolve_slow(A, b) {
    const At = n.transpose(A);
    const res = n.dot(n.dot(At, inv(n.dot(A, At))), b);
    return res;
  }

  function lsolve(A, b) {
    if (csize < xsize) {
      const At = n.transpose(A);
      const sol = n.solve(n.dot(A, At), b, true);
      return n.dot(At, sol);
    } else {
      return n.solve(A, b, false);
    }
  }

  const g = n.dot(n.transpose(J), fx);
  const g_inf = n.norminf(g);
  const fx_inf = n.norminf(fx);

  const iterLimit = 100;
  const divergenceLimit = 1e6 * (err + 1e6);

  const delta = 10;
  const alpha = 0.;
  const iter = 0, returnCode = 0;
  //const log = [];

  const SUCCESS = 1, ITER_LIMIT = 2, SMALL_DELTA = 3, SMALL_STEP = 4, DIVERGENCE = 5, INVALID_STATE = 6;

  while (returnCode === 0) {
    optim.DEBUG_HANDLER(iter, err);

    if (fx_inf <= tolf) {
      returnCode = SUCCESS;
    } else if (g_inf <= tolg) {
      returnCode = SUCCESS;
    } else if (iter >= iterLimit) {
      returnCode = ITER_LIMIT;
    } else if (delta <= tolx * (tolx + n.norm2(x))) {
      returnCode = SMALL_DELTA;
    } else if (err > divergenceLimit) {
      returnCode = DIVERGENCE;
    } else if (isNaN(err)) {
      returnCode = INVALID_STATE;
    }

    if (returnCode != 0) {
      break;
    }

    // get the gauss-newton step
    //gn_step = n.solve(J, n.mul(fx, -1));
    gn_step = lsolve(J, n.mul(fx, -1));

    //LU-Decomposition
    //gn_step = lusolve(J, n.mul(fx, -1));

    //Conjugate gradient method
    //gn_step = cg(J, gn_step, n.mul(fx, -1), 1e-8, iterLimit);

    //solve linear problem using svd formula to get the gauss-newton step
    //gn_step = lls(J, n.mul(fx, -1));

    const hitBoundary = false;

    const gnorm = n.norm2(g);
    const gnNorm = n.norm2(gn_step);
    if (gnNorm < delta) {
      dl_step = gn_step;
    } else {
      const Jt = n.transpose(J);
      const B = n.dot(Jt, J);
      const gBg = n.dot(g, n.dot(B, g));
      alpha = n.norm2Squared(g) / gBg;
      if (alpha * gnorm >= delta) {
        dl_step = n.mul(g, - delta / gnorm);
        hitBoundary = true;
      } else {
        const sd_step = n.mul(g, - alpha);
        if (isNaN(gnNorm)) {
          dl_step = sd_step;
        } else {

          const d = n.sub(gn_step, sd_step);

          const a = n.dot(d, d);
          const b = 2 * n.dot(sd_step, d);
          const c = n.dot(sd_step, sd_step) - delta * delta;

          const sqrt_discriminant = Math.sqrt(b * b - 4 * a * c);

          const beta = (-b + sqrt_discriminant) / (2 * a);

          dl_step = n.add(sd_step, n.mul(beta, d));
          hitBoundary = true;
        }
      }
    }

    const dl_norm = n.norm2(dl_step);

    //    if (dl_norm <= tolx) {
    //      returnCode = SMALL_STEP;
    //      break;
    //    }

    x_new = n.add(x, dl_step);
    subsys.setParams(x_new);
    const err_new = subsys.calcResidual(fx_new);
    subsys.fillJacobian(J_new);

    const fxNormSq = n.norm2Squared(fx);
    const dF = fxNormSq - n.norm2Squared(fx_new);
    const dL = fxNormSq - n.norm2Squared(n.add(fx, n.dot(J, dl_step)));

    const acceptCandidate;

    if (dF == 0 || dL == 0) {
      acceptCandidate = true;
    } else {
      const rho = dF / dL;
      if (rho < 0.25) {
        // if the model is a poor predictor reduce the size of the trust region
        delta = 0.25 * dl_norm;
        //delta *= 0.5;
      } else {
        // only increase the size of the trust region if it is taking a step of maximum size
        // otherwise just assume it's doing good enough job
        if (rho > 0.75 && hitBoundary) {
          //delta = Math.max(delta,3*dl_norm);
          delta *= 2;
        }
      }
      acceptCandidate = rho > 0; // could be 0 .. 0.25
    }
    //log.push([stepKind,err,  delta,rho]);

    if (acceptCandidate) {
      x = n.clone(x_new);
      J = n.clone(J_new);
      fx = n.clone(fx_new);
      err = err_new;

      g = n.dot(n.transpose(J), fx);

      // get infinity norms
      g_inf = n.norminf(g);
      fx_inf = n.norminf(fx);
    }

    iter++;
  }
  //log.push(returnCode);
  //window.___log(log);
  return new _result(iter, err, returnCode);
};

const cg = function (A, x, b, tol, maxIt) {

  const _ = numeric;

  const tr = _.transpose;
  const At = tr(A);
  if (A.length != A[0].length) {
    A = _.dot(At, A);
    b = _.dot(At, b);
  }

  const r = _.sub(_.dot(A, x), b);
  const p = _.mul(r, -1);
  const rr = _.dotVV(r, r);

  const a;
  const _rr;
  const beta;

  for (const i = 0; i < maxIt; ++i) {
    if (_.norm2(r) <= tol) break;
    const Axp = _.dot(A, p);
    a = rr / _.dotVV(Axp, p);
    x = _.add(x, _.mul(p, a));
    r = _.add(r, _.mul(Axp, a));
    _rr = rr;
    rr = _.dotVV(r, r);
    beta = rr / _rr;
    p = _.add(_.mul(r, -1), _.mul(p, beta));
  }
  //  console.log('liner problem solved in ' + i);
  return x;
};

const optim = { DEBUG_HANDLER: function (index: any, child: any) { } }; //backward compatibility

export { dog_leg, optim }
