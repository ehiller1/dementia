/**
 * SES-safe helper to replace Map.prototype.getOrInsert
 * SES lockdown removes prototype extensions, so we use a plain function
 */
export function getOrInsert<K, V>(m: Map<K, V>, key: K, init: () => V): V {
  if (!m.has(key)) {
    m.set(key, init());
  }
  return m.get(key)!;
}

/**
 * SES-safe helper for WeakMap
 */
export function getOrInsertWeak<K extends object, V>(
  m: WeakMap<K, V>,
  key: K,
  init: () => V
): V {
  if (!m.has(key)) {
    m.set(key, init());
  }
  return m.get(key)!;
}
