import type { Ref } from 'vue';
import { watch } from 'vue';

interface SyncRefOptions {
  master?: 'a' | 'b'
}

export function syncRef<T>(
  a: Ref<T>,
  b: Ref<T>,
  { master }: SyncRefOptions = {},
) {
  const [masterRef, slaveRef] = master === 'b' ? [b, a] : [a, b];
  let syncing = false;

  // Initial sync: the side with a value wins; master takes priority if both have one
  syncing = true;
  if (masterRef.value != null) {
    slaveRef.value = masterRef.value;
  }
  else if (slaveRef.value != null) {
    masterRef.value = slaveRef.value;
  }
  syncing = false;

  // slave → master: propose value
  watch(slaveRef, val => {
    if (syncing) return;
    masterRef.value = val;
  }, { flush: 'sync' });

  // master → slave: enforce value (guard blocks slave's re-proposal)
  watch(masterRef, val => {
    syncing = true;
    slaveRef.value = val;
    syncing = false;
  }, { flush: 'sync' });
}
