const tableCache = new Map();

export function getTableCache(key) {
  return tableCache.get(key);
}

export function setTableCache(key, value) {
  tableCache.set(key, value);
  return value;
}

export function clearTableCache(key) {
  if (key) {
    tableCache.delete(key);
    return;
  }

  tableCache.clear();
}