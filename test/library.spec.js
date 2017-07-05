/* global describe, it, before */

import chai from "chai";
import loq from "../src/index.js";

const assert = chai.assert;

// const expect = chai.expect;

describe("library function", () => {
  it("should have read-only methods", done => {
    assert.throws(() => {loq.range = null;});
    done();
  });

  it("should have read-only props", done => {
    let oldProp = loq.empty;
    let err;

    try {
      loq.empty = null;
    } catch (e) {
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
    let generator = loq.fromGenerator(function * () {
      for (let i = 0; i < 3; ++i) {
        yield i;
      }
    });

    assert(generator.sequenceEqual([0, 1, 2]));
    done();
  });

  it("throws when passing a non-function to loq.fromGenerator", done => {
    assert.throws(() => loq.fromGenerator({}));
    done();
  });

  it("can repeat a single item", done => {
    let seq = loq.repeat(1, 2);

    assert(seq.sequenceEqual([1, 1]));
    done();
  });

  it("can repeat return value of a generator", done => {
    let seq = loq.repeatGenerate(() => 1, 2);

    assert(seq.sequenceEqual([1, 1]));
    done();
  });

  it("can create a sequence from a single value", done => {
    let seq = loq.fromSingleValue(1);

    assert(seq.sequenceEqual([1]));
    done();
  });

  it("has an empty sequence", done => {
    let seq = loq.empty;

    assert(seq.sequenceEqual([]));
    done();
  });

  it("can't create an Enumerable from a non-iterable", done => {
    assert.throws(() => loq({}));
    done();
  });

  it("can create an EnumerableSet from a Set", done => {
    let set = new Set();

    set.add("woo");
    let lSet = loq(set);

    assert(lSet.__isEnumerableSet);
    assert(lSet.has("woo"));
    assert(!lSet.has("foo"));
    done();
  });

  it("can create an EnumerableMap from a Map", done => {
    let map = new Map();

    map.set("foo", "woo");
    let lMap = loq(map);

    assert(lMap.__isEnumerableMap);
    assert(lMap.values().sequenceEqual(["woo"]));
    assert(lMap.keys().sequenceEqual(["foo"]));
    done();
  });

  it("returns the same object when create is passed an Enumerable", done => {
    let item = loq([]);

    assert(item === loq(item));
    done();
  });

  it("returns the same object when empty is accessed a second time", done => {
    assert(loq.empty === loq.empty);
    done();
  });
});

describe("instance methods", () => {
  it("can compare sequences", done => {
    assert(loq([1, 2, 3]).sequenceEqual([1, 2, 3]));
    assert(!loq([1, 2, 3]).sequenceEqual([1, 2, 4]));
    assert(!loq([1, 2, 3]).sequenceEqual([1, 2, 3, 4]));
    assert(!loq([1, 2, 3, 4]).sequenceEqual([1, 2, 3]));
    done();
  });

  it("can create arrays", done => {
    let data = loq([1, 2, 3]);
    let arr1 = [];

    for (const i of data) {
      arr1.push(i);
    }
    const arr2 = data.toArray();

    assert(loq(arr1).sequenceEqual(arr2));
    done();
  });

  it("can create maps", done => {
    let data = loq([[1, "chris"], [2, "aimee"], [5, "tilly"]]);
    let map = data.toMap(([key, _]) => key, ([_, value]) => value);

    assert(map.get(1) === "chris");
    assert(map.get(2) === "aimee");
    assert(map.get(5) === "tilly");
    assert(map.get(3) === undefined);
    done();
  });

  it("throws if asked to create a map with duplicate keys", done => {
    let data = loq([[1, "chris"], [1, "chris2"], [2, "aimee"], [5, "tilly"]]);

    assert.throws(() => data.toMap(([key, _]) => key, ([_, value]) => value));
    done();
  });

  it("can create 'map' objects", done => {
    let data = loq([[1, "chris"], [2, "aimee"], [5, "tilly"]]);
    let map = data.toObject(([_, key]) => key, ([value, _]) => value);

    assert(map["chris"] === 1);
    assert(map["tilly"] === 5);
    assert(map["aimee"] === 2);
    assert(map["foo"] === undefined);
    done();
  });

  it("throws when creating 'map' objects with non-string keys", done => {
    let data = loq([[1, "chris"], [2, "aimee"], [5, "tilly"]]);

    assert.throws(() => data.toObject(([key, _]) => key, ([_, value]) => value));
    done();
  });

  it("can select sequences", done => {
    assert(loq([1, 2, 3]).select(i => i * 2).sequenceEqual([2, 4, 6]));
    done();
  });
  it("can flatten sequences of sequences", done => {
    let data = [[1, 2], [3, 4]];

    assert(loq(data).selectMany(d => d).sequenceEqual([1, 2, 3, 4]));
    done();
  });

  it("can aggregate", done => {
    assert(loq([1, 2, 3]).aggregate(0, (acc, curr) => acc + curr) === 6);
    done();
  });

  it("has working all", done => {
    let data = loq([1, 2, 3]);

    assert(data.all());
    assert(data.all(d => d < 4));
    assert(!data.all(d => d < 3));
    done();
  });

  it("has working any", done => {
    let data = loq([1, 2, 3]);

    assert(data.any());
    assert(data.any(d => d > 2));
    assert(!data.any(d => d > 3));
    done();
  });

  it("can calculate averages", done => {
    let data = loq([1, 2, 3]);

    assert(data.average() === 2);
    done();
  });

  it("can calculate averages", done => {
    let data = loq([1, 2, 3]);

    assert(data.average() === 2);
    done();
  });

  it("throws when calculating average of empty sequence", done => {
    assert.throws(() => loq([]).average());
    done();
  });

  it("can concatenate sequences", done => {
    let data = loq([0, 1, 2, 3]);

    data = data.concat([4, 5, 6], [7, 8, 9]);
    assert(data.sequenceEqual(loq.range(0, 10)));
    done();
  });

  it("can count sequences", done => {
    let data = loq.fromGenerator(function * () {
      for (let i = 0; i < 100; ++i) {
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
    let data = loq([[1, "chris"], [1, "dog"], [2, "aimee"], [5, "tilly"], [2, "cat"]]);
    let distinctSequence = data.distinctBy(([v, k]) => v);

    assert(!data.all(([v, k]) => k !== "dog"));
    assert(distinctSequence.any(([v, k]) => k === "chris"));
    assert(distinctSequence.all(([v, k]) => k !== "dog"));
    done();
  });

  it("can find all items in a sequence except those in another sequence", done => {
    let data = loq([6, 3, 2, 1, 2, 3]);
    let otherSeq = [2, 3];

    assert(data.except(otherSeq).sequenceEqual([6, 1]));
    done();
  });

  it("can get the first item of a sequence", done => {
    let data = loq([7, 8, 9]);

    assert(data.first() === 7);
    assert(data.first(x => x > 8) === 9);
    assert.throws(() => data.first(x => x > 9));
    done();
  });

  it("can get the first item of a sequence or null", done => {
    let data = loq([7, 8, 9]);

    assert(data.firstOrDefault() === 7);
    assert(data.firstOrDefault(x => x > 8) === 9);
    assert(data.firstOrDefault(x => x > 9) === undefined);
    done();
  });

  it("can iterate a sequence", done => {
    let data = loq([1, 2, 3]);
    let sum = 0;

    data.forEach(v => {sum += v;});
    assert(sum === 6);
    done();
  });

  it("can group a sequence", done => {
    let data = loq([1, 2, 3]);
    let groups = data.groupBy(x => (x / 2) >> 0).toArray();

    assert(groups.length === 2);
    assert(loq(groups[0]).sequenceEqual([1]));
    assert(loq(groups[1]).sequenceEqual([2, 3]));
    done();
  });

  it("can intersect a sequence with another", done => {
    let data = loq([1, 2, 3, 4, 5]);
    let intersection = data.intersect([2, 4, 6, 7]);

    assert(intersection.sequenceEqual([2, 4]));
    done();
  });

  it("can detect if a sequence is a subset of another", done => {
    let data = loq([1, 2, 3, 4, 5]);

    assert(data.isSubsetOf([5, 4, 3, 2, 1, 100]));
    assert(!data.isSubsetOf([5, 4, 2, 1, 100]));
    done();
  });

  it("can detect if a sequence is a superset of another", done => {
    let data = loq([5, 4, 3, 2, 1, 100]);

    assert(data.isSupersetOf([1, 2, 3, 4, 5]));
    assert(!data.isSupersetOf([5, 4, 2, 1, 99, 100]));
    done();
  });

  it("can find the maximum value of a sequence", done => {
    let data = loq([5, 4, 3, 2, 1, 100]);

    assert(data.max() === 100);
    done();
  });

  it("can find the minimum value of a sequence", done => {
    let data = loq([5, 4, 3, 2, 1, 100]);

    assert(data.min() === 1);
    done();
  });

  it("can order a sequence", done => {
    let data = loq([5, 4, 3, 2, 1, 100]);

    assert(data.orderBy(x => x).sequenceEqual([1, 2, 3, 4, 5, 100]));
    done();
  });

  it("can order a sequence in descending order", done => {
    let data = loq([5, 4, 3, 2, 1, 100]);

    assert(data.orderByDescending(x => x).sequenceEqual([100, 5, 4, 3, 2, 1]));
    done();
  });

  it("can reverse a sequence", done => {
    let data = loq([5, 4, 3, 2, 1, 100]);

    assert(data.reverse().sequenceEqual([100, 1, 2, 3, 4, 5]));
    done();
  });

  it("can pick a single (unique) value from a sequence", done => {
    assert(loq.fromSingleValue(5).single() === 5);
    assert(loq([1, 2]).single(x => x === 1) === 1);
    done();
  });

  it("throws when picking single (unique) value from an empty sequence", done => {
    assert.throws(() => loq.empty.single());
    done();
  });

  it("throws when picking single (unique) value from an a sequence of more than one item", done => {
    assert.throws(() => loq([1, 2]).single());
    done();
  });

  it("has working singleOrDefault implementation", done => {
    assert(loq.fromSingleValue(5).singleOrDefault() === 5);
    assert(loq.empty.singleOrDefault() === undefined);
    assert(loq([1, 2]).singleOrDefault(x => x === 1) === 1);
    done();
  });

  it("throws when picking singleOrDefault (unique) value from an a sequence of more than one item", done => {
    assert.throws(() => loq([1, 2]).singleOrDefault());
    done();
  });

  it("has working skip implmentation", done => {
    assert(loq([1, 2, 3, 4, 5]).skip(2).sequenceEqual([3, 4, 5]));
    done();
  });

  it("has working skipWhile implmentation", done => {
    assert(loq([1, 2, 3, 4, 5]).skipWhile(x => x <= 2).sequenceEqual([3, 4, 5]));
    done();
  });

  it("has working sum implmentation", done => {
    assert(loq([1, 2, 3, 4, 5]).sum() === 6 + 6 + 3);
    done();
  });

  it("has working take implmentation", done => {
    assert(loq([1, 2, 3, 4, 5]).take(3).sequenceEqual([1, 2, 3]));
    done();
  });

  it("has working takeWhile implmentation", done => {
    assert(loq([1, 2, 3, 4, 5]).takeWhile(x => x <= 3).sequenceEqual([1, 2, 3]));
    done();
  });

  it("can make a lookup with toLookup", done => {
    let data = loq([1, 2, 2, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 5]);
    let lookup = data.toLookup(x => x, x => x);

    assert(lookup.entries().all(([k, v]) => k === v.count()));
    done();
  });

  it("has working where implmentation", done => {
    assert(loq([1, 2, 3, 4, 5]).where(x => x <= 3 || x > 4).sequenceEqual([1, 2, 3, 5]));
    done();
  });

  it("has working union implmentation", done => {
    assert(loq([1, 2, 3]).union([2, 3, 4], [3, 4, 4, 5]).sequenceEqual([1, 2, 3, 4, 5]));
    done();
  });

  it("has working zip implmentation", done => {
    assert(loq([1, 2, 3]).zip([2, 4, 6], (a, b) => ({a, b})).all(x => x.a * 2 === x.b));
    done();
  });

  it("has working join implementation", done => {
    let d1 = [{
      id: 1,
      value: "chris"
    }, {
      id: 2,
      value: "andrew"
    }, {
      id: 4,
      value: "not relevant"
    }];
    let d2 = [{
      id: 1,
      value: "sperry"
    }, {
      id: 1,
      value: "pike"
    }, {
      id: 2,
      value: "johnson"
    }, {
      id: 3,
      value: "not relevant"
    }];

    assert(loq(d1)
      .join(d2,
        dd1 => dd1.id,
        dd2 => dd2.id,
        (dd1, dd2) => dd1.value + " " + dd2.value)
      .orderBy(x => x)
      .sequenceEqual(["andrew johnson", "chris pike", "chris sperry"]));
    done();
  });
});

describe("OrderedEnumerable", () => {
  it("can perform secondary ordering", done => {
    let d1 = [{
      id: 1,
      value: "a",
      order: 1
    }, {
      id: 2,
      value: "b",
      order: 4
    }, {
      id: 1,
      value: "b",
      order: 2
    }, {
      id: 2,
      value: "a",
      order: 3
    }];

    assert(loq(d1).orderBy(x => x.id).thenBy(x => x.value).select(x => x.order).sequenceEqual([1, 2, 3, 4]));
    done();
  });

  it("can perform secondary descending ordering", done => {
    let d1 = [{
      id: 1,
      value: "a",
      order: 1
    }, {
      id: 2,
      value: "b",
      order: 4
    }, {
      id: 1,
      value: "b",
      order: 2
    }, {
      id: 2,
      value: "a",
      order: 3
    }];

    assert(loq(d1).orderBy(x => x.id).thenByDescending(x => x.value).select(x => x.order).sequenceEqual([2, 1, 4, 3]));
    done();
  });

});

