class HashTable {

  public hashCodeF;
  public equalsF;
  public size = 0;

  constructor(hashCodeF, equalsF) {
    this.hashCodeF = hashCodeF;
    this.equalsF = equalsF;
    this.setTableSize(8);
  }

  public hash = function (key) {
    return Math.abs(this.hashCodeF(key) % this.table.length);
  }

  public get = function (key) {
    var entry = this._findEntry(key, this._findBucket(key));
    if (entry == null) return null;
    return entry[1];
  }
  public put = function (key, value) {
    if (this.size >= 0.75 * this.table.length) {
      this.rebuild();
    }
    this._put(key, value);
  }

  private _findBucket = function (key) {
    var hash = this.hash(key);
    var bucket = this.table[hash];
    if (bucket === null) {
      bucket = [];
      this.table[hash] = bucket;
    }
    return bucket;
  }

  private _findEntry = function (key, bucket) {
    for (var i = 0; i < bucket.length; i++) {
      if (this.equalsF(bucket[i][0], key)) {
        return bucket[i];
      }
    }
    return null;
  }


  private _put = function (key, value) {
    var bucket = this._findBucket(key);
    var entry = this._findEntry(key, bucket);
    if (entry == null) {
      bucket.push([key, value]);
    } else {
      entry[1] = value;
    }
    this.size++;
  }

  public rebuild = function () {
    this.size = 0;
    var oldTable = this.table;
    this.setTableSize(this.table.length * 2);
    for (var i = 0; i < oldTable.length; i++) {
      var e = oldTable[i];
      if (e != null) {
        for (var j = 0; j < e.length; j++) {
          var bucket = e[j];
          this._put(bucket[0], bucket[1]);
        }
      }
    }
  }
  public getKeys = function () {
    var keys = [];
    this.entries(function (k) {
      keys.push(k)
    });
    return keys;
  }

  public entries = function (callback) {
    for (var i = 0; i < this.table.length; i++) {
      var e = this.table[i];
      if (e != null) {
        for (var j = 0; j < e.length; j++) {
          var bucket = e[j];
          callback(bucket[0], bucket[1]);
        }
      }
    }
  }

  public setTableSize = function (newSize) {
    this.table = [];
    for (var i = 0; i < newSize; i++) {
      this.table[i] = null;
    }
  }

  static forVector3d = function () {
    var doubleHelper = new DoubleHelper();
    function hash(v) {
      return doubleHelper.hash(v.x) ^ doubleHelper.hash(v.y) ^ doubleHelper.hash(v.z);
    }
    function eq(a, b) {
      return a.x === b.x && a.y === b.y && a.z === b.z;
    }
    return new HashTable(hash, eq);
  }

  static forEdge = function () {
    var doubleHelper = new DoubleHelper();
    function hash(v) {
      return doubleHelper.hash(v[0].x) ^ doubleHelper.hash(v[0].y) ^ doubleHelper.hash(v[0].z)
        ^ doubleHelper.hash(v[1].x) ^ doubleHelper.hash(v[1].y) ^ doubleHelper.hash(v[1].z);
    }
    function veq(a, b) {
      return a.x === b.x && a.y === b.y && a.z === b.z;
    }
    function eq(e1, e2) {
      var a1 = e1[0];
      var b1 = e1[1];
      var a2 = e2[0];
      var b2 = e2[1];
      return (veq(a1, a2) && veq(b1, b2)) || (veq(a1, b2) && veq(b1, a2));
    }
    return new HashTable(hash, eq);
  }

  static forVector2d = function () {
    var doubleHelper = new DoubleHelper();
    function hash(v) {
      return doubleHelper.hash(v.x) ^ doubleHelper.hash(v.y);
    }
    function eq(a, b) {
      return a.x === b.x && a.y === b.y;
    }
    return new HashTable(hash, eq);
  }

  static forDoubleArray = function () {
    var doubleHelper = new DoubleHelper();
    function hash(v) {
      var hash = 0;
      for (var i = 0; i < v.length; i++) {
        hash ^= v[i];
      }
      return hash;
    }
    function eq(a, b) {
      for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
      }
      return true;
    }
    return new HashTable(hash, eq);
  }

}


class DoubleHelper {
  public dv;
  constructor() {
    this.dv = new DataView(new ArrayBuffer(8));
  }

  public hash = function (v) {
    this.dv.setFloat64(0, v);
    return this.dv.getInt32(0) ^ this.dv.getInt32(4);
  }
}


export { HashTable, DoubleHelper }
