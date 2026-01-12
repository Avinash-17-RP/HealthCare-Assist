const NAMESPACE = 'hca_';
const get = (key, fallback) => {
  try {
    const raw = localStorage.getItem(NAMESPACE + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};
const set = (key, value) => {
  localStorage.setItem(NAMESPACE + key, JSON.stringify(value));
};
const getArray = (key) => {
  const v = get(key, []);
  return Array.isArray(v) ? v : [];
};
const push = (key, item) => {
  const arr = getArray(key);
  arr.push(item);
  set(key, arr);
  return arr;
};
const update = (key, id, updater) => {
  const arr = getArray(key).map(i => i.id === id ? updater(i) : i);
  set(key, arr);
  return arr;
};
const remove = (key, id) => {
  const arr = getArray(key).filter(i => i.id !== id);
  set(key, arr);
  return arr;
};
export { get, set, getArray, push, update, remove };

