//- Helper functions for working directly against JavaScript arrays.  Note that all of these functions are immutable
//- and do not change the state of the passed arguments.  I should therefore not be used other than in implementing
//- wrapper packages over native JavaScript files.
//-
//- Characteristics of functions within native packages:
//- * They may not throw an exception,
//- * They may not mutate their parameters,
//- * They are all curried, and
//- * They may not return nil or undefined.
//-
//- Further to that a native package may only be dependent on other native packages or standard node.js packages

const Maybe = mrequire("core:Native.Data.Maybe:1.0.0");


//- Get the number of elements within an array.
//= length :: Array a -> Int
const length = a =>
    a.length;
assumptionEqual(length([]), 0);
assumptionEqual(length([1, 2, 3]), 3);


// Find the first element in an array where the passed predicate is true
//= find :: (a -> Bool) -> Array a -> Maybe a
const find = p => a => {
    for (let lp = 0; lp < a.length; lp += 1) {
        if (p(a[lp])) {
            return Maybe.Just(a[lp]);
        }
    }
    return Maybe.Nothing;
};
assumptionEqual(find(n => n > 4)([1, 2, 3, 4, 5, 6]), Maybe.Just(5));
assumptionEqual(find(n => n > 40)([1, 2, 3, 4, 5, 6]), Maybe.Nothing);


//- Locate an mapped element within an array.  Should no element be found then this function returns Nothing otherwise
//- it returns Just the mapped result.
//= findMap :: (a -> Maybe b) -> Array a -> Maybe b
const findMap = f => a => {
    for (let lp = 0; lp < a.length; lp += 1) {
        const fResult = f(a[lp]);

        if (fResult.isJust()) {
            return fResult;
        }
    }

    return Maybe.Nothing;
};


//- Apply a function to every element of an array
//= map :: (a -> b) -> Array a -> Array b
const map = f => a =>
    a.map(f);
assumptionEqual(map(x => x * 2)([]), []);
assumptionEqual(map(x => x * 2)([1, 2, 3]), [2, 4, 6]);


// Same as map but the function is also applied to the index of each element (starting at zero).
//= indexedMap :: (Int -> a -> b) -> Array a -> Array b
const indexedMap = f => a => {
    const adaptor = (value, index) =>
        f(index)(value);

    return a.map(adaptor);
};


//- Append an element onto the end of an array.
//= append :: a -> Array a -> Array a
const append = item => a =>
    [...a, item];
assumptionEqual(append(4)([1, 2, 3]), [1, 2, 3, 4]);
assumptionEqual(append(4)([]), [4]);


//- Add an element onto the front of an array.
//= prepend :: a -> Array a -> Array a
const prepend = item => a =>
    [item, ...a];
assumptionEqual(prepend(0)([1, 2, 3]), [0, 1, 2, 3]);
assumptionEqual(prepend(0)([]), [0]);


//- Creates an array by slicing elements from the passed array starting at `start` and ending at but excluding the element
//- before `end`.
//= slice :: Int -> Int -> Array a -> Array a
const slice = start => end => a =>
    a.slice(start, end);
assumptionEqual(slice(1)(3)([1, 2, 3, 4]), [2, 3]);
assumptionEqual(slice(3)(-1)([1, 2, 3, 4]), []);
assumptionEqual(slice(10)(12)([1, 2, 3, 4]), []);
assumptionEqual(slice(1)(100)([1, 2, 3, 4]), [2, 3, 4]);


//- Create an array containing a range of integers from the first parameter to, but not including, the
//- second parameter.  If the first parameter is larger than the second parameter then the range will
//- be a descending range.
//= range :: Int -> Int -> Array Int
const range = lower => upper => {
    if (lower < upper) {
        let result = [];
        for (let lp = lower; lp < upper; lp += 1) {
            result.push(lp);
        }
        return result;
    } else {
        let result = [];
        for (let lp = lower; lp > upper; lp -= 1) {
            result.push(lp);
        }
        return result;
    }
};
assumptionEqual(range(1)(10), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assumptionEqual(range(10)(1), [10, 9, 8, 7, 6, 5, 4, 3, 2]);


//- Combine two arrays by appending the second argument onto the first.
//= concat :: Array a -> Array a -> Array a
const concat = a1 => a2 =>
    a1.concat(a2);
assumptionEqual(concat([])([]), []);
assumptionEqual(concat([1, 2])([3, 4]), [1, 2, 3, 4]);


//- A reduction function that treats the array like a traditional list made of Nil and Cons elements.  It works by accepting two functions which, if the array is empty
//- will call the first function without any arguments otherwise it will call the second function passing the 'head' of the array and the 'tail' of the array.
//= reduce :: (() -> b) -> (a -> Array a -> b) -> Array a -> b
const reduce = fNil => fCons => a =>
    (a.length === 0)
        ? fNil()
        : fCons(a[0])(a.slice(1));
assumptionEqual(reduce(() => ({}))(h => t => ({head: h, tail: t}))([]), {});
assumptionEqual(reduce(() => ({}))(h => t => ({head: h, tail: t}))([1, 2, 3]), {head: 1, tail: [2, 3]});


// Flatten an array.
//= flatten :: Array Array a => Array a
const flatten = a =>
    a.reduce((x, y) => x.concat(y));
assumptionEqual(flatten([[]]), []);
assumptionEqual(flatten([[1], [], [2, 3]]), [1, 2, 3]);


//- Apply a function to pairs of elements at the same index in two arrays, collecting the results in a new array.
//-
//- If one array is longer, elements will be discarded from the longer array.
//= zipWith :: (a -> b -> c) -> Array a -> Array b -> Array c
const zipWith = f => a1 => a2 => {
    let result = [];

    const upper = Math.min(a1.length, a2.length);
    for (let lp = 0; lp < upper; lp +=1) {
        result.push(f(a1[lp])(a2[lp]));
    }

    return result;
};
assumptionEqual(zipWith(v1 => v2 => v1 * v2)([])([]), []);
assumptionEqual(zipWith(v1 => v2 => v1 * v2)([1, 2, 3])([]), []);
assumptionEqual(zipWith(v1 => v2 => v1 * v2)([1, 2, 3])([4, 5, 6, 7]), [4, 10, 18]);
assumptionEqual(zipWith(v1 => v2 => v1 * v2)([1, 2, 3, 4, 5, 6])([4, 5, 6]), [4, 10, 18]);


//- Join the elements of an array together by converting each element to a string and then concatenating them together with the separator.
//= join :: Array a -> String -> String
const join = sep => a =>
    a.join(sep);
assumptionEqual(join(", ")([1, 2, 3]), "1, 2, 3");
assumptionEqual(join(", ")([]), "");


//- Filter all elements within an array based on a predicate and return a new array containing only those elements for
//- the predicate was true.
//= filter :: (a -> Bool) -> Array a -> Array a
const filter = predicate => a =>
    a.filter(predicate);
assumptionEqual(filter(n => n > 5)([1, 10, 2, 9, 3, 8, 4, 7, 5, 6]), [10, 9, 8, 7, 6]);


//- Sort the elements of an array based on the passed compare function.
//- * If compare(a)(b) is less than 0, sort a to a lower index than b, i.e. a comes first.
//- * If compare(a)(b) returns 0, leave a and b unchanged with respect to each other, but sorted with respect to all different elements.
//- * If compare(a)(b) is greater than 0, sort b to a lower index than a.
//- compare(a)(b) must always return the same content when given a specific pair of elements a and b as its two arguments.
//- If inconsistent results are returned then the sort order is undefined.
//= sort :: (a -> a -> Native.Integer) -> Array a -> Array a
const sort = compare => a =>
    [...a].sort((x, y) => compare(x)(y));
assumptionEqual(sort(a => b => a < b ? -1 : a > b ? 1 : 0)([1, 9, 2, 8, 3, 7, 4, 6, 5]), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assumptionEqual(sort(a => b => a < b ? -1 : a > b ? 1 : 0)(["one", "nine", "two", "eight", "three", "seven", "four", "six", "five"]), ["eight","five","four","nine","one","seven","six","three","two"]);


//- Folds all of the elements from the left.
//= foldl :: b -> (b -> a -> b) -> Array a -> b
const foldl = z => f => a => {
    let result = z;
    for (let lp = 0; lp < a.length; lp += 1) {
        result = f(result)(a[lp]);
    }
    return result;
};


//- Folds all of the elements from the right.
//= foldr :: b -> (a -> b -> b) -> Array a -> b
const foldr = z => f => a => {
    let result = z;
    for (let lp = a.length - 1; lp >= 0; lp -= 1) {
        result = f(a[lp])(result);
    }
    return result;
};


//- Calculates the sum of all the elmenets within an array.
//= sum :: Array Num -> Num
const sum = ns =>
    foldl(0)(acc => i => acc + i)(ns);
assumptionEqual(0, sum([]));
assumptionEqual(6, sum([1, 2, 3]));


//- Removes the first `n` elements from the front of the passed array.
//= drop :: Int -> Array a -> Array a
const drop = n => a =>
    slice(n)(length(a))(a);
assumptionEqual([], drop(1)([1]));
assumptionEqual([2, 3, 4], drop(1)([1, 2, 3, 4]));
assumptionEqual([3, 4], drop(2)([1, 2, 3, 4]));


//- A safe way to read a content at a particular index from an array.
//= at :: Int -> Array a Maybe a
const at = index => a =>
    (index < 0 || index >= a.length)
        ? Maybe.Nothing
        : Maybe.Just(a[index]);
assumptionEqual(at(3)([1, 2, 3, 4]), Maybe.Just(4));
assumptionEqual(at(9)([1, 2, 3, 4]), Maybe.Nothing);
assumptionEqual(at(-2)([1, 2, 3, 4]), Maybe.Nothing);


// Set the element at a particular index. Returns an updated array. If the index is out of range, the array is
// unaltered.
//= set :: Int -> a -> Array a
const set = index => value => a =>
    (index >= 0 && index < length(a))
        ? concat(append(value)(slice(0)(index)(a)))(drop(index + 1)(a))
        : a;
assumptionEqual(set(-1)(9)([0, 1, 2, 3, 4]), [0, 1, 2, 3, 4]);
assumptionEqual(set(10)(9)([0, 1, 2, 3, 4]), [0, 1, 2, 3, 4]);
assumptionEqual(set(0)(9)([0, 1, 2, 3, 4]), [9, 1, 2, 3, 4]);
assumptionEqual(set(3)(9)([0, 1, 2, 3, 4]), [0, 1, 2, 9, 4]);
assumptionEqual(set(4)(9)([0, 1, 2, 3, 4]), [0, 1, 2, 3, 9]);


//- Returns an array containing all elements that satisfy the passed predicate.
//= any :: (a -> Bool) -> Array a -> Array a
const any = p => a =>
    a.some(p);
assumption(!any(x => x < 0)([1, 2, 3, 4]));
assumption(any(x => x < 0)([1, 2, -3, 4]));


// Confirms that all elements within the array satisfy the passed predicate.
//= all :: (a -> Bool) -> Array a -> Bool
const all = p =>
    foldl(true)(acc => i => acc && p(i));
assumptionEqual(all(n => n > 0)([1, 2, 3, 4]), true);
assumptionEqual(all(n => n > 3)([1, 2, 3, 4]), false);


module.exports = {
    all,
    any,
    append,
    at,
    concat,
    drop,
    indexedMap,
    filter,
    find,
    findMap,
    flatten,
    foldl,
    foldr,
    join,
    length,
    map,
    prepend,
    range,
    reduce,
    set,
    slice,
    sort,
    sum,
    zipWith
};
