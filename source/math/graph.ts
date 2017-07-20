import { HashTable } from '../util/hash-map';

class Graph {

  private readonly data: any;
  public static findAllLoops(graph, hashCode, equals) {

    let loops = [];
    const visited = new HashTable(hashCode, equals);

    function step(vertex, comesFrom, path) {
      visited.put(vertex, true);
      for (let i = path.length - 1; i >= 0; --i) {
        if (equals(vertex, path[i])) {
          loops.push(path.slice(i));
          return;
        }
      }

      const next = graph.connections(vertex);

      path.push(vertex);
      let needClone = false;

      for (let i = 0; i < next.length; i++) {
        const v = next[i];
        if (equals(v, comesFrom)) {
          continue;
        }

        const p = needClone ? path.slice(0) : path;
        needClone = true;
        step(v, vertex, p);
      }
      path.pop();
    }

    for (let i = 0; i < graph.size(); i++) {
      const vertex = graph.at(i);
      if (visited.get(vertex) !== true) {
        step(vertex, -1, []);
      }
    }

    //filter duplicates

    function sameLoop(a, b) {
      const first = a[0];
      let bShift = 0;
      for (bShift = 0; bShift < a.length; bShift++) {
        if (equals(b[bShift], first)) {
          break;
        }
      }
      if (bShift === a.length) {
        return false;
      }
      for (let i = 0; i < a.length; i++) {
        const bUp = (bShift + i) % a.length;
        let bDown = bShift - i;
        if (bDown < 0) {
          bDown = a.length + bDown;
        }
        //      console.log("up: " + bUp + "; down: " + bDown);
        const curr = a[i];
        if (!equals(curr, b[bUp]) && !equals(curr, b[bDown])) {
          return false;
        }
      }
      return true;
    }

    let duplicates = 0;
    for (let i = 0; i < loops.length; i++) {
      const a = loops[i];
      if (a == null) {
        continue;
      }
      for (let j = i + 1; j < loops.length; j++) {
        const b = loops[j];
        if (b == null || a.length !== b.length) {
          continue;
        }
        if (sameLoop(a, b)) {
          loops[j] = null;
          ++duplicates;
        }
      }
    }
    if (duplicates !== 0) {
      const filtered = [];
      for (let i = 0; i < loops.length; i++) {
        if (loops[i] != null) {
          filtered.push(loops[i]);
        }
      }
      loops = filtered;
    }

    return loops;
  }

  constructor(data) {

    this.data = data;
  }

  public connections(e) {
    return this.data[e];
  }
  public at(index) {
    return index;
  }
  public size(e) {
    return this.data.length;
  }




}

export { Graph };
