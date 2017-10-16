interface IEnumerable<T> {
	aggregate<TAcc>(seed: T, aggFunc: (acc: TAcc, item: T) => TAcc): TAcc;
	all(pred?: (item: T) => boolean): boolean;
	any(pred?: (item: T) => boolean): boolean;
	average(): number;
	concat(...sequences: any[]): IEnumerable<T>; //needs work
	count(pred?: (item: T) => boolean): number;
	distinct(): IEnumerable<T>;
	distinctBy<TSelector>(selector: (item: T) => TSelector): IEnumerable<T>;
	elementAt(index: number): T;
	except(seq: IEnumerable<T>): IEnumerable<T>;
	first(pred?: (item: T) => boolean): T;
	firstOrDefault(pred?: (item: T) => boolean): T;
	forEach(action: (item: T) => void): void;
	groupBy<TKey>(selector: (item: T) => TKey): IEnumerable<IGroupedEnumerable<TKey, T>>;
	groupJoin<TInner, TKeyOuter, TKeyInner, TOut>(
		innerSeq: IEnumerable<TInner>,
		outerKeySelector: (item: T) => TKeyOuter,
		innerKeySelector: (item: TInner) => TKeyInner,
		selector: (outerItem: T, innerItems: IEnumerable<TInner>) => TOut): IEnumerable<TOut>; //maybe needs work
	intersect(seq: IEnumerable<T>): IEnumerable<T>;
	isSubsetOf(seq: IEnumerable<T>): boolean;
	isSupersetOf(seq: IEnumerable<T>): boolean;
	join<TInner, TKeyOuter, TKeyInner, TOut>(
		innerSeq: IEnumerable<TInner>,
		outerKeySelector: (item: T) => TKeyOuter,
		innerKeySelector: (item: TInner) => TKeyInner,
		selector: (outerItem: T, innerItem: TInner) => TOut): IEnumerable<TOut>;
	max(): number;
	min(): number;
	orderBy<TKey>(keySelector: (item: T) => TKey): IOrderedEnumerable<TKey>;
	orderByDescending<TKey>(keySelector: (item: T) => TKey): IOrderedEnumerable<TKey>;
	reverse(): IEnumerable<T>;
	select<TOut>(selector: (item: T) => TOut): IEnumerable<TOut>;
	selectMany<TOut>(selector: (item: T) => IEnumerable<TOut>): IEnumerable<TOut>;
	sequenceEqual(sequence: IEnumerable<T>): boolean;
	single(pred?: (item: T) => boolean): T;
	singleOrDefault(pred?: (item: T) => boolean): T;
	skip(amt: number): IEnumerable<T>;
	skipWhile(pred: (item: T) => boolean): IEnumerable<T>;
	sum(): number;
	take(amt: number): IEnumerable<T>;
	takeWhile(pred: (item: T) => boolean): IEnumerable<T>;
	toArray(): T[];
	toLookup<TKey, TValue>(keySelector: (item: T) => TKey, valueSelector: (item: T) => TValue): IEnumerableMap<TKey, TValue[]>;
	toMap<TKey, TValue>(keySelector: (item: T) => TKey, valueSelector: (item: T) => TValue): IEnumerableMap<TKey, TValue>;
	toObject<TKey, TValue>(keySelector: (item: T) => TKey, valueSelector: (item: T) => TValue): any;
	where(pred: (item: T) => boolean): IEnumerable<T>;
	union(...seqs: IEnumerable<T>[]): IEnumerable<T>;
	zip<TOther, TOut>(seq: IEnumerable<TOther>, selector: (item1: T, item2: TOther) => TOut): IEnumerable<TOut>;
	dump(): void;
}
interface IEnumerableSet<T> extends IEnumerable<T> {
	entries(): IEnumerable<any[]>; //needs work
	values(): IEnumerable<T>;
	has(item: T): boolean;
	convertToObject(): any;
}

interface IEnumerableMap<TKey, TValue> extends IEnumerableSet<any[]> { //needs work
	keys(): IEnumerable<TKey>;
	get(key: TKey): TValue;

}
interface IOrderedEnumerable<T> extends IEnumerable<T> {
	thenBy<TKey>(keySelector: (item: T) => TKey): IOrderedEnumerable<TKey>;
	thenByDescending<TKey>(keySelector: (item: T) => TKey): IOrderedEnumerable<TKey>;
}
interface IGroupedEnumerable<TKey, T> extends IEnumerable<IEnumerable<T>> {
	key: TKey;
}
declare module "loq" {
	export default interface ILoq {
		create<T>(src: any): IEnumerable<T>; //needs work
		fromSingleValue<T>(item: T): IEnumerable<T>;
		fromGenerator<T>(genFunc: Function): IEnumerable<T>; //needs work
		range(start: number, amt: number): IEnumerable<number>,
		repeat<T>(item: T, amt: number): IEnumerable<T>,
		repeatGenerate<T>(generator: () => T, amt: number): IEnumerable<T>,
		empty<T>(): IEnumerable<T>
	}
}