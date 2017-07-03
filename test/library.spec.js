/* global describe, it, before */

import chai from 'chai';
import loq from '../lib/loq.js';


const assert = chai.assert;

const expect = chai.expect;

describe("library function", () => {
  it("should have read-only methods", done => {
    assert.throws(() => loq.range = null);
    done();
  });
  it("should have read-only props", done => {
    var oldProp = loq.empty;
    var err;
    try {
      loq.empty = null;
    }
    catch (e) {
      err = e;
    }
    assert(loq.empty === oldProp && err);
    done();
  });
  it("should have enumerable methods", done => {
    assert(Object.keys(loq).indexOf("range") >= 0);
    done();
  });
});


describe("static methods", () => {
  it("can generate a range", done => {
    assert(loq.range(0, 3).sequenceEqual([0, 1, 2]));
    done();
  });
  it("can generate from generator functions", done => {
    var generator = loq.fromGenerator(function* () {
      for (var i = 0; i < 3; ++i) {
        yield i;
      }
    });
    assert(generator.sequenceEqual([0, 1, 2]));
    done();
  });
  it("can repeat a single item", done => {
    var seq = loq.repeat(1, 2);
    assert(seq.sequenceEqual([1, 1]));
    done();
  });
  it("can repeat return value of a generator", done => {
    var seq = loq.repeatGenerate(() => 1, 2);
    assert(seq.sequenceEqual([1, 1]));
    done();
  });
  it("can create a sequence from a single value", done => {
    var seq = loq.fromSingleValue(1);
    assert(seq.sequenceEqual([1]));
    done();
  });
  it("has an empty sequence", done => {
    var seq = loq.empty;
    assert(seq.sequenceEqual([]));
    done();
  });
});


describe("instance methods", () => {
  it("can compare sequences", done => {
    assert(loq([1, 2, 3]).sequenceEqual([1, 2, 3]));
    assert(!loq([1, 2, 3]).sequenceEqual([1, 2, 4]));
    done();
  });
  it("can create arrays", done => {
    var data = loq([1, 2, 3]);
    var arr1 = [];
    for (var i of data) {
      arr1.push(i);
    }
    var arr2 = data.toArray();
    assert(loq(arr1).sequenceEqual(arr2));
    done();
  });
  it("can create maps", done => {
    var data = loq([[1, "chris"], [2, "aimee"], [5, "tilly"]]);
    var map = data.toMap(([key, _]) => key, ([_, value]) => value);
    assert(map.get(1) === "chris");
    assert(map.get(2) === "aimee");
    assert(map.get(5) === "tilly");
    assert(map.get(3) === undefined);
    done();
  });
  it("can select sequences", done => {
    assert(loq([1, 2, 3]).select(i => i * 2).sequenceEqual([2, 4, 6]));
    done();
  });
  it("can flatten sequences of sequences", done => {
    var data = [[1, 2], [3, 4]];
    assert(loq(data).selectMany(d => d).sequenceEqual([1, 2, 3, 4]));
    done();
  });
  it("can aggregate", done => {
    assert(loq([1, 2, 3]).aggregate(0, (acc, curr) => acc + curr) === 6);
    done();
  });
  it("has working all", done => {
    var data = loq([1, 2, 3]);
    assert(data.all());
    assert(data.all(d => d < 4));
    assert(!data.all(d => d < 3));
    done();
  });
  it("has working any", done => {
    var data = loq([1, 2, 3]);
    assert(data.any());
    assert(data.any(d => d > 2));
    assert(!data.any(d => d > 3));
    done();
  });
  it("can calculate averages", done => {
    var data = loq([1, 2, 3]);
    assert(data.average() === 2);
    done();
  });
  it("can concatenate sequences", done => {
    var data = loq([0, 1, 2, 3]);
    data = data.concat([4, 5, 6], [7, 8, 9]);
    assert(data.sequenceEqual(loq.range(0, 10)));
    done();
  });
  it("can count sequences", done => {
    var data = loq.fromGenerator(function* () {
      for (var i = 0; i < 100; ++i) {
        yield i;
      }
    });
    assert(data.count() === 100);
    assert(data.count(i => i < 50) === 50);
    done();
  });
  it("can make sequences distinct", done => {
    assert(loq([3, 3, 2, 2, 1, 1]).distinct().sequenceEqual([3, 2, 1]));
    done();
  });
  it("can make sequences distinct using a selector", done => {
    var data = loq([[1, "chris"], [1, "dog"], [2, "aimee"], [5, "tilly"], [2, "cat"]]);
    var distinctSequence = data.distinctBy(([v, k]) => v);
    assert(!data.all(([v, k]) => k !== "dog"));
    assert(distinctSequence.any(([v, k]) => k === "chris"));
    assert(distinctSequence.all(([v, k]) => k !== "dog"));
    done();
  });
  it("can find all items in a sequence except those in another sequence", done => {
    var data = loq([6, 3, 2, 1, 2, 3]);
    var otherSeq = [2, 3];
    assert(data.except(otherSeq).sequenceEqual([6, 1]));
    done();
  });
  it("can get the first item of a sequence", done => {
    var data = loq([7, 8, 9]);
    assert(data.first() === 7);
    assert(data.first(x => x > 8) === 9);
    assert.throws(() => data.first(x => x > 9));
    done();
  });
  it("can get the first item of a sequence or null", done => {
    var data = loq([7, 8, 9]);
    assert(data.firstOrDefault() === 7);
    assert(data.firstOrDefault(x => x > 8) === 9);
    assert(data.firstOrDefault(x => x > 9) === undefined);
    done();
  });
  it("can iterate a sequence", done => {
    var data = loq([1, 2, 3]);
    var sum = 0;
    data.forEach(v => sum += v);
    assert(sum === 6);
    done();
  });
  it("can group a sequence", done => {
    var data = loq([1, 2, 3]);
    var groups = data.groupBy(x => (x / 2) >> 0).toArray();
    assert(groups.length === 2);
    assert(loq(groups[0]).sequenceEqual([1]));
    assert(loq(groups[1]).sequenceEqual([2, 3]));
    done();
  });
  it("can intersect a sequence with another", done => {
    var data = loq([1, 2, 3, 4, 5]);
    var intersection = data.intersect([2, 4, 6, 7]);
    assert(intersection.sequenceEqual([2, 4]));
    done();
  });
  it("can detect if a sequence is a subset of another", done => {
    var data = loq([1, 2, 3, 4, 5]);
    assert(data.isSubsetOf([5, 4, 3, 2, 1, 100]));
    assert(!data.isSubsetOf([5, 4, 2, 1, 100]));
    done();
  });
  it("can detect if a sequence is a superset of another", done => {
    var data = loq([5, 4, 3, 2, 1, 100]);
    assert(data.isSupersetOf([1, 2, 3, 4, 5]));
    assert(!data.isSupersetOf([5, 4, 2, 1, 99, 100]));
    done();
  });
});
