import * as math from './math';

/**
 *  @constructor
 *  @deprecated use numeric library
 * */
export function Matrix(r, c) {
  this.data = [];
  this.rSize = r;
  this.cSize = c;
  for (let i = 0; i < r; i++) {
    this.data[i] = math._vec(c);
  }
}

Matrix.prototype.identity = function () {

  for (let i = 0; i < this.rSize; i++) {
    for (let j = 0; j < this.cSize; j++) {
      this.data[i][j] = i === j ? 1 : 0;
    }
  }
};

Matrix.prototype.subtract = function (m) {
  const out = new Matrix(this.rSize, this.cSize);
  for (let i = 0; i < this.rSize; i++) {
    for (let j = 0; j < this.cSize; j++) {
      out.data[i][j] = this.data[i][j] - m.data[i][j];
    }
  }
  return out;
};

Matrix.prototype.add = function (m) {
  const out = new Matrix(this.rSize, this.cSize);
  for (let i = 0; i < this.rSize; i++) {
    for (let j = 0; j < this.cSize; j++) {
      out.data[i][j] = this.data[i][j] + m.data[i][j];
    }
  }
  return out;
};

Matrix.prototype.multiply = function (m) {

  const nRows = this.rSize;
  const nCols = m.cSize;
  const nSum = this.cSize;

  const out = new Matrix(nRows, nCols);

  const outData = out.data;
  const mCol = math._vec(nSum);
  const mData = m.data;

  for (let col = 0; col < nCols; col++) {
    for (let mRow = 0; mRow < nSum; mRow++) {
      mCol[mRow] = mData[mRow][col];
    }

    for (let row = 0; row < nRows; row++) {
      const dataRow = this.data[row];
      let sum = 0;
      for (let i = 0; i < nSum; i++) {
        sum += dataRow[i] * mCol[i];
      }
      outData[row][col] = sum;
    }
  }

  return out;
};

Matrix.prototype.scalarMultiply = function (s) {
  const out = new Matrix(this.rSize, this.cSize);
  for (let i = 0; i < this.rSize; i++) {
    for (let j = 0; j < this.cSize; j++) {
      out.data[i][j] = this.data[i][j] * s;
    }
  }
  return out;
};

Matrix.prototype.transpose = function () {
  const out = new Matrix(this.cSize, this.rSize);
  for (let i = 0; i < this.rSize; i++) {
    for (let j = 0; j < this.cSize; j++) {
      out.data[j][i] = this.data[i][j];
    }
  }
  return out;
};

Matrix.prototype.copy = function () {
  const out = new Matrix(this.rSize, this.cSize);
  for (let i = 0; i < this.rSize; i++) {
    for (let j = 0; j < this.cSize; j++) {
      out.data[i][j] = this.data[i][j];
    }
  }
  return out;
};

Matrix.prototype.dot = function (v) {
  const vData = v.data;
  let dot = 0;
  for (let i = 0; i < this.rSize; i++) {
    dot += this.data[i][0] * vData[i][0];
  }
  return dot;
};

Matrix.prototype.norm = function (v) {
  let sum = 0;
  for (let i = 0; i < this.rSize; i++) {
    const a = this.data[i][0];
    sum += a * a;
  }
  return Math.sqrt(sum);
};
