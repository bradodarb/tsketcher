import Vector from './vector';
import { AXIS } from './l3space';

class Matrix3 {
  public mxx: number;
  public myx: number;
  public mzx: number;

  public mxy: number;
  public myy: number;
  public mzy: number;

  public mxz: number;
  public myz: number;
  public mzz: number;

  public tx: number;
  public ty: number;
  public tz: number;

  public static rotateMatrix(angle, axis, pivot) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    let axisX, axisY, axisZ;
    const m = new Matrix3();

    if (axis === AXIS.X || axis === AXIS.Y || axis === AXIS.Z) {
      axisX = axis.x;
      axisY = axis.y;
      axisZ = axis.z;
    } else {
      // normalize
      const mag = axis.length();

      if (mag === 0.0) {
        return m;
      } else {
        axisX = axis.x / mag;
        axisY = axis.y / mag;
        axisZ = axis.z / mag;
      }
    }

    const px = pivot.x;
    const py = pivot.y;
    const pz = pivot.z;

    m.mxx = cos + axisX * axisX * (1 - cos);
    m.mxy = axisX * axisY * (1 - cos) - axisZ * sin;
    m.mxz = axisX * axisZ * (1 - cos) + axisY * sin;

    m.tx = px * (1 - m.mxx) - py * m.mxy - pz * m.mxz;

    m.myx = axisY * axisX * (1 - cos) + axisZ * sin;
    m.myy = cos + axisY * axisY * (1 - cos);
    m.myz = axisY * axisZ * (1 - cos) - axisX * sin;
    m.ty = py * (1 - m.myy) - px * m.myx - pz * m.myz;

    m.mzx = axisZ * axisX * (1 - cos) - axisY * sin;
    m.mzy = axisZ * axisY * (1 - cos) + axisX * sin;
    m.mzz = cos + axisZ * axisZ * (1 - cos);
    m.tz = pz * (1 - m.mzz) - px * m.mzx - py * m.mzy;
    return m;
  }

  constructor() {
    this.reset();
  }

  public reset() {
    this.mxx = 1; this.mxy = 0; this.mxz = 0; this.tx = 0;
    this.myx = 0; this.myy = 1; this.myz = 0; this.ty = 0;
    this.mzx = 0; this.mzy = 0; this.mzz = 1; this.tz = 0;
    return this;
  }
  public setBasis(basis) {
    const b = basis;
    this.mxx = b[0].x; this.mxy = b[1].x; this.mxz = b[2].x; this.tx = 0;
    this.myx = b[0].y; this.myy = b[1].y; this.myz = b[2].y; this.ty = 0;
    this.mzx = b[0].z; this.mzy = b[1].z; this.mzz = b[2].z; this.tz = 0;
    return this;
  }



  public translate(dx, dy, dz) {
    this.tx += dx;
    this.ty += dy;
    this.tz += dz;
    return this;
  }

  public set3(
    mxx, mxy, mxz,
    myx, myy, myz,
    mzx, mzy, mzz
  ) {
    this.mxx = mxx; this.mxy = mxy; this.mxz = mxz;
    this.myx = myx; this.myy = myy; this.myz = myz;
    this.mzx = mzx; this.mzy = mzy; this.mzz = mzz;
    return this;
  }

  public set34(
    mxx, mxy, mxz, tx,
    myx, myy, myz, ty,
    mzx, mzy, mzz, tz
  ) {
    this.mxx = mxx; this.mxy = mxy; this.mxz = mxz; this.tx = tx;
    this.myx = myx; this.myy = myy; this.myz = myz; this.ty = ty;
    this.mzx = mzx; this.mzy = mzy; this.mzz = mzz; this.tz = tz;
    return this;
  }

  public setMatrix(m) {
    this.mxx = m.mxx; this.mxy = m.mxy; this.mxz = m.mxz; this.tx = m.tx;
    this.myx = m.myx; this.myy = m.myy; this.myz = m.myz; this.ty = m.ty;
    this.mzx = m.mzx; this.mzy = m.mzy; this.mzz = m.mzz; this.tz = m.tz;
    return this;
  }

  public invert() {

    const det =
      this.mxx * (this.myy * this.mzz - this.mzy * this.myz) +
      this.mxy * (this.myz * this.mzx - this.mzz * this.myx) +
      this.mxz * (this.myx * this.mzy - this.mzx * this.myy);

    if (det === 0.0) {
      return null;
    }

    const cxx = this.myy * this.mzz - this.myz * this.mzy;
    const cyx = - this.myx * this.mzz + this.myz * this.mzx;
    const czx = this.myx * this.mzy - this.myy * this.mzx;
    const cxt = - this.mxy * (this.myz * this.tz - this.mzz * this.ty)
      - this.mxz * (this.ty * this.mzy - this.tz * this.myy)
      - this.tx * (this.myy * this.mzz - this.mzy * this.myz);
    const cxy = - this.mxy * this.mzz + this.mxz * this.mzy;
    const cyy = this.mxx * this.mzz - this.mxz * this.mzx;
    const czy = - this.mxx * this.mzy + this.mxy * this.mzx;
    const cyt = this.mxx * (this.myz * this.tz - this.mzz * this.ty)
      + this.mxz * (this.ty * this.mzx - this.tz * this.myx)
      + this.tx * (this.myx * this.mzz - this.mzx * this.myz);
    const cxz = this.mxy * this.myz - this.mxz * this.myy;
    const cyz = - this.mxx * this.myz + this.mxz * this.myx;
    const czz = this.mxx * this.myy - this.mxy * this.myx;
    const czt = - this.mxx * (this.myy * this.tz - this.mzy * this.ty)
      - this.mxy * (this.ty * this.mzx - this.tz * this.myx)
      - this.tx * (this.myx * this.mzy - this.mzx * this.myy);

    const result = new Matrix3();
    result.mxx = cxx / det;
    result.mxy = cxy / det;
    result.mxz = cxz / det;
    result.tx = cxt / det;
    result.myx = cyx / det;
    result.myy = cyy / det;
    result.myz = cyz / det;
    result.ty = cyt / det;
    result.mzx = czx / det;
    result.mzy = czy / det;
    result.mzz = czz / det;
    result.tz = czt / det;
    return result;
  }

  public combine(transform) {
    const txx = transform.mxx;
    const txy = transform.mxy;
    const txz = transform.mxz;
    const ttx = transform.tx;
    const tyx = transform.myx;
    const tyy = transform.myy;
    const tyz = transform.myz;
    const tty = transform.ty;
    const tzx = transform.mzx;
    const tzy = transform.mzy;
    const tzz = transform.mzz;
    const ttz = transform.tz;

    const m = new Matrix3();
    m.mxx = (this.mxx * txx + this.mxy * tyx + this.mxz * tzx);
    m.mxy = (this.mxx * txy + this.mxy * tyy + this.mxz * tzy);
    m.mxz = (this.mxx * txz + this.mxy * tyz + this.mxz * tzz);
    m.tx = (this.mxx * ttx + this.mxy * tty + this.mxz * ttz + this.tx);
    m.myx = (this.myx * txx + this.myy * tyx + this.myz * tzx);
    m.myy = (this.myx * txy + this.myy * tyy + this.myz * tzy);
    m.myz = (this.myx * txz + this.myy * tyz + this.myz * tzz);
    m.ty = (this.myx * ttx + this.myy * tty + this.myz * ttz + this.ty);
    m.mzx = (this.mzx * txx + this.mzy * tyx + this.mzz * tzx);
    m.mzy = (this.mzx * txy + this.mzy * tyy + this.mzz * tzy);
    m.mzz = (this.mzx * txz + this.mzy * tyz + this.mzz * tzz);
    m.tz = (this.mzx * ttx + this.mzy * tty + this.mzz * ttz + this.tz);

    return m;
  }

  public apply(vector) {
    return this.__apply(vector, new Vector());
  }

  public _apply(vector) {
    return this.__apply(vector, vector);
  }

  public __apply(vector, out) {
    const x = vector.x;
    const y = vector.y;
    const z = vector.z;
    return out.set(
      this.mxx * x + this.mxy * y + this.mxz * z + this.tx,
      this.myx * x + this.myy * y + this.myz * z + this.ty,
      this.mzx * x + this.mzy * y + this.mzz * z + this.tz);
  }



}

