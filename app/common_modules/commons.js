// 내림차순
function objectSortByDESC(obj) {
    return obj.sort((a, b) => b.sortKey - a.sortKey);;
}
function objectSortByStrDESC(obj) {
    return obj.sort((a, b) => a.sortKey.toLowerCase() > b.sortKey.toLowerCase() ? -1 : 1);
}

// 오름차순
function objectSortByASC(obj) {
    return obj.sort((a, b) => a.sortKey - b.sortKey);;
}

function objectSortByStrASC(obj) {
    return obj.sort((a, b) => a.sortKey.toLowerCase() < b.sortKey.toLowerCase() ? -1 : 1);
}

function getExpireSecond(second) {
    let nowDate = new Date();
    let timestamp = nowDate.getTime() + (second * 1000);
    return timestamp;
}

function getNowDate() {
    let nowDate = new Date();
    let currDate = nowDate.format("yyyyMMdd");
    return currDate;
}

function deepClone(value, weakMap = new WeakMap()) {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (weakMap.has(value)) {
        return weakMap.get(value);
    }

    if (value instanceof Date) {
        return new Date(value);
    }

    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }

    if (value instanceof Map) {
        const result = new Map();
        weakMap.set(value, result);
        value.forEach((v, k) => {
            result.set(deepClone(k, weakMap), deepClone(v, weakMap));
        });
        return result;
    }

    if (value instanceof Set) {
        const result = new Set();
        weakMap.set(value, result);
        value.forEach(v => {
            result.add(deepClone(v, weakMap));
        });
        return result;
    }

    const result = Array.isArray(value) ? [] : {};
    weakMap.set(value, result);

    Object.keys(value).forEach(key => {
        result[key] = deepClone(value[key], weakMap);
    });

    return result;
}

module.exports = {
    objectSortByDESC,
    objectSortByStrASC,
    objectSortByStrDESC,
    objectSortByStrDESC,
    objectSortByASC,
    getExpireSecond,
    getNowDate,
    deepClone
}