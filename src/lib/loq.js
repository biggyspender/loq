import mergePropertiesAsReadOnly from "./mergePropertiesAsReadOnly.js";

const orderGrouping$ = Symbol("orderGrouping");
const isEnumerable$ = Symbol("isEnumerable");
const srcIterable$ = Symbol("srcIterable");
const empty$ = Symbol("empty");

const truePredicate = () => true;
const identity = x => x;

class Enumerable {
  constructor(iterable) {
    Object.defineProperty(this, srcIterable$, {
      value: iterable,
      writable: false,
      enumerable: false,
      configurable: false

    });
    Object.defineProperty(this, isEnumerable$, {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false

    });
  }

  static create(iterable) {
    if (!iterable[Symbol.iterator]) {
      throw Error("source is not iterable");
    }
    if (iterable[isEnumerable$]) {
      return iterable;
    };
    if (iterable instanceof Set) {
      return new EnumerableSet(iterable); // eslint-disable-line no-use-before-define
    }
    if (iterable instanceof Map) {
      return new EnumerableMap(iterable); // eslint-disable-line no-use-before-define
    }
    return new Enumerable(iterable);
  }

  static empty() {
    // make every attempt to make this as readonly as possible
    // because overwriting it would be disastrous
    if (!Enumerable[empty$]) {
      const emptyIterable = {};

      Object.defineProperty(emptyIterable, Symbol.iterator, {
        value: [][Symbol.iterator],
        writable: false,
        enumerable: true,
        configurable: false
      });
      Object.defineProperty(Enumerable, empty$, {
        value: new Enumerable(emptyIterable),
        writable: false,
        enumerable: false,
        configurable: false
      });
    }
    return Enumerable[empty$];
  }

  static fromGenerator(generator) {
    if (typeof generator === "function") {
      const iterable = {
        [Symbol.iterator]: generator
      };

      return new Enumerable(iterable);
    }
    throw Error("generator is not a function");
  }

  static fromSingleValue(value) {
    return new Enumerable([value]);
  }

  static range(start, amt) {
    return Enumerable.fromGenerator(function * () {
      for (let i = start; i < start + amt; ++i) {
        yield i;
      }
    });
  }

  static repeat(item, numRepeats) {
    return Enumerable.range(0, numRepeats).select(() => item);
  }

  static repeatGenerate(generator, numRepeats) {
    return Enumerable.range(0, numRepeats).select(() => generator());
  }

  * [Symbol.iterator]() {
    for (let i of this[srcIterable$]) {
      yield i;
    }
  }

  aggregate(seed, aggFunc) {
    let v = seed;

    for (let item of this) {
      v = aggFunc(v, item);
    }
    return v;
  }

  all(pred = truePredicate) {
    return !this.any(item => !pred(item));
  }

  any(pred = truePredicate) {
    for (let item of this) {
      if (pred(item)) {
        return true;
      }
    }
    return false;
  }

  average() {
    const f = this.aggregate({
      tot: 0,
      count: 0
    },
      (acc, val) => {
        acc.tot += val;
        acc.count++;
        return acc;
      });

    if (f.count === 0) {
      throw Error("sequence contains no elements");
    }
    return f.tot / f.count;
  }

  concat(...sequences) {
    const src = this;

    return Enumerable.fromGenerator(function * () {
      for (let item of src) {
        yield item;
      }
      for (let seq of sequences) {
        for (let item of seq) {
          yield item;
        }
      }
    });
  }

  count(pred = truePredicate) {
    let c = 0;

    for (let item of this) {
      if (pred(item)) {
        ++c;
      }
    }
    return c;
  }

  distinct() {
    return this.groupBy(x => x).select(g => g.first());
  }

  distinctBy(selector) {
    return this.groupBy(selector).select(g => g.first());
  }

  elementAt(index) {
    return this.single((x, i) => i === index);
  }

  except(seq) {
    const set = new Set();

    for (let item of seq) {
      set.add(item);
    }
    return this.where(item => !set.has(item));
  }

  first(pred = truePredicate) {
    let i = 0;

    for (let item of this) {
      if (pred(item, i++)) {
        return item;
      }
    }
    throw Error("sequence contains no elements");
  }

  firstOrDefault(pred = truePredicate) {
    let i = 0;

    for (let item of this) {
      if (pred(item, i++)) {
        return item;
      }
    }
    return undefined;
  }

  forEach(action) {
    for (let item of this) {
      action(item);
    }
  }

  groupBy(keySelector) {
    const lookup = this.toLookup(keySelector);

    return new Enumerable(lookup.entries()).select(([key, value]) => {
      const returnValue = new GroupedEnumerable(key, value); // eslint-disable-line no-use-before-define

      return returnValue;
    });
  }

  groupJoin(innerSeq, outerKeySelector, innerKeySelector, selector) {
    innerSeq = Enumerable.create(innerSeq);
    const lookup = innerSeq.toLookup(innerKeySelector);
    const outerSeq = this;

    return Enumerable.fromGenerator(function * () {
      for (let outerItem of outerSeq) {
        let innerItems = lookup.get(innerKeySelector(outerItem)) || Enumerable.empty();

        yield selector(outerItem, innerItems);
      }
    });
  }

  intersect(seq) {
    const set = new Set();

    for (let item of seq) {
      set.add(item);
    }
    return this.where(item => set.has(item));
  }

  isSubsetOf(seq) {
    const set = new Set(seq);

    return this.all(x => set.has(x));
  }

  isSupersetOf(seq) {
    return Enumerable.create(seq).isSubsetOf(this);
  }

  join(innerSeq, outerKeySelector, innerKeySelector, selector) {
    innerSeq = Enumerable.create(innerSeq);
    const lookup = innerSeq.toLookup(innerKeySelector);
    const outerSeq = this;

    return Enumerable.fromGenerator(function * () {
      for (let outerItem of outerSeq) {
        let innerItems = lookup.get(innerKeySelector(outerItem)) || Enumerable.empty();

        for (let innerItem of innerItems) {
          yield selector(outerItem, innerItem);
        }
      }
    });
  }

  max() {
    return this.aggregate(null, (acc, val) => acc == null ? val : Math.max(acc, val));
  }

  min() {
    return this.aggregate(null, (acc, val) => acc == null ? val : Math.min(acc, val));
  }

  orderBy(keySelector, descending = false) {
    const groups = this.groupBy(x => keySelector(x));
    const groupsArr = groups.toArray();
    const sortFactor = descending ? -1 : 1;

    groupsArr.sort((a, b) => {
      return (a.key < b.key) ? -sortFactor : ((a.key > b.key) ? sortFactor : /* istanbul ignore next */ 0);
    });
    const returnValue = new OrderedEnumerable(groupsArr);// eslint-disable-line no-use-before-define

    return returnValue;
  }

  orderByDescending(keySelector) {
    return this.orderBy(keySelector, true);
  }

  reverse() {
    return new Enumerable(this.toArray().reverse());
  }

  select(selector) {
    const src = this;

    return Enumerable.fromGenerator(function * () {
      let i = 0;

      for (let item of src) {
        yield selector(item, i++);
      }
    });
  }

  selectMany(selector) {
    const src = this;

    return Enumerable.fromGenerator(function * () {
      let i = 0;

      for (let seq of src) {
        for (let item of selector(seq, i++)) {
          yield item;
        }
      }
    });
  }

  sequenceEqual(seq) {
    const it1 = this[Symbol.iterator]();
    const it2 = seq[Symbol.iterator]();

    for (; ;) {
      const it1Result = it1.next();
      const it2Result = it2.next();

      if (it1Result.done && it2Result.done) {
        return true;
      }
      if (it1Result.done || it2Result.done) {
        return false;
      }
      if (it1Result.value !== it2Result.value) {
        return false;
      }
    }
  }

  single(pred = truePredicate) {
    let itemCount = 0;
    let foundItem;
    let i = 0;

    for (let item of this) {
      if (pred(item, i++)) {
        ++itemCount;
        if (itemCount > 1) {
          throw Error("sequence contains more than one element");
        }
        foundItem = item;
      }
    }
    if (itemCount === 1) {
      // ReSharper disable once UsageOfPossiblyUnassignedValue
      return foundItem;
    }
    throw Error("sequence contains no elements");
  }

  singleOrDefault(pred = truePredicate) {
    let itemCount = 0;
    let foundItem;
    let i = 0;

    for (let item of this) {
      if (pred(item, i++)) {
        ++itemCount;
        if (itemCount > 1) {
          throw Error("sequence contains more than one element");
        }
        foundItem = item;
      }
    }

    if (itemCount === 1) {
      // ReSharper disable once UsageOfPossiblyUnassignedValue
      return foundItem;
    }
    return undefined;
  }

  skip(numItems) {
    return this.skipWhile((x, i) => i < numItems);
  }

  skipWhile(pred = truePredicate) {
    const src = this;

    return Enumerable.fromGenerator(function * () {
      let i = 0;

      for (let item of src) {
        const result = pred(item, i++);

        if (result) {
          continue;
        }
        yield item;
      }
    });
  }

  sum() {
    return this.aggregate(0, (acc, val) => acc + val);
  }

  take(numItems) {
    return this.takeWhile((x, i) => i < numItems);
  }

  takeWhile(pred = truePredicate) {
    const src = this;

    return Enumerable.fromGenerator(function * () {
      let i = 0;

      for (let item of src) {
        const result = pred(item, i++);

        if (!result) {
          break;
        }
        yield item;
      }
    });
  }

  toArray() {
    return Array.from(this);
  }

  toLookup(keySelector, valueSelector = identity) {
    const map = new Map();

    for (let item of this) {
      const key = keySelector(item);
      let arr;

      if (map.has(key)) {
        arr = map.get(key)[srcIterable$];
      } else {
        arr = [];
        map.set(key, new Enumerable(arr));
      }
      arr.push(valueSelector(item));
    }
    return new EnumerableMap(map); // eslint-disable-line no-use-before-define
  }

  toMap(keySelector, valueSelector = identity) {
    const map = new Map();

    for (let item of this) {
      const key = keySelector(item);
      const value = valueSelector(item);

      if (map.has(key)) {
        throw Error("duplicate key detected");
      }
      map.set(key, value);
    }
    return new EnumerableMap(map); // eslint-disable-line no-use-before-define
  }

  toObject(keySelector, valueSelector = identity) {
    return this.toMap(keySelector, valueSelector).convertToObject();
  }

  where(pred = truePredicate) {
    const src = this;

    return Enumerable.fromGenerator(function * () {
      let i = 0;

      for (let item of src) {
        if (pred(item, i++)) {
          yield item;
        }
      }
    });
  }

  union(...seqs) {
    const set = new Set();

    return this.concat(...seqs).where(item => {
      if (set.has(item)) {
        return false;
      }
      set.add(item);
      return true;
    });
  }

  zip(seq, selector) {
    const src = this;

    return Enumerable.fromGenerator(function * () {
      const it1 = src[Symbol.iterator]();
      const it2 = seq[Symbol.iterator]();

      for (; ;) {
        const it1Result = it1.next();
        const it2Result = it2.next();

        if (it1Result.done || it2Result.done) {
          break;
        }
        yield selector(it1Result.value, it2Result.value);
      }
    });
  }

  dump() {
    /* istanbul ignore next */
    console.log(this.toArray());
  }
}

class GroupedEnumerable extends Enumerable {
  constructor(key, iterable) {
    super(iterable);
    Object.defineProperty(this, "key", {
      value: key,
      writable: false,
      enumerable: true,
      configurable: false

    });

  }
}

class OrderedEnumerable extends Enumerable {
  constructor(groupsArr) {
    const wrappedGroupsArr = Enumerable.create(groupsArr);

    super(wrappedGroupsArr.selectMany(g => g));
    Object.defineProperty(this, orderGrouping$, {
      value: wrappedGroupsArr,
      writable: false,
      enumerable: false,
      configurable: false

    });

  }

  thenBy(keySelector, descending = false) {
    const groupsArr = this[orderGrouping$];
    const subGroupings =
      groupsArr.selectMany(g => g.orderBy(x => keySelector(x), descending)[orderGrouping$]);

    return new OrderedEnumerable(subGroupings);
  }

  thenByDescending(keySelector) {
    return this.thenBy(keySelector, true);
  }
}

class EnumerableSet extends Enumerable {
  constructor(set) {
    super(set);
    Object.defineProperty(this, "__isEnumerableSet", {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false

    });

  }

  entries() {
    return new Enumerable(this[srcIterable$].entries());
  }

  values() {
    return new Enumerable(this[srcIterable$].values());
  }

  has(...args) {
    return this[srcIterable$].has(...args);
  }
}

class EnumerableMap extends EnumerableSet {
  constructor(map) {
    super(map);
    this.__isEnumerableMap = true;
    Object.defineProperty(this, "__isEnumerableMap", {
      value: true,
      writable: false,
      enumerable: false,
      configurable: false

    });

  }

  keys() {
    return new Enumerable(this[srcIterable$].keys());
  }

  get(...args) {
    return this[srcIterable$].get(...args);
  }

  convertToObject() {
    return this.entries().aggregate({}, (acc, [key, value]) => {
      if (typeof (key) !== "string") {
        throw Error("key type is not string");
      }
      acc[key] = value;
      return acc;
    });
  }
}

const loq = Enumerable.create.bind(Enumerable);

const lqProps = {
  fromSingleValue: Enumerable.fromSingleValue,
  fromGenerator: Enumerable.fromGenerator,
  range: Enumerable.range,
  repeat: Enumerable.repeat,
  repeatGenerate: Enumerable.repeatGenerate,
  empty: Enumerable.empty
};

mergePropertiesAsReadOnly(lqProps, loq);

export default loq;
