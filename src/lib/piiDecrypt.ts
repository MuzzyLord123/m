import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export function isEncryptedPii(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("ENC:");
}

export async function decryptPiiValue(value: string | null | undefined): Promise<string | null> {
  if (!value) return value ?? null;
  if (!isEncryptedPii(value)) return value;
  if (cache.has(value)) return cache.get(value)!;
  const { data, error } = await supabase.rpc("decrypt_pii", { p_encrypted_value: value });
  if (error || !data) return value;
  cache.set(value, data);
  return data;
}

/** Decrypts specified PII fields on an array of records in place (returns new array). */
export async function decryptPiiFields<T extends Record<string, any>>(
  records: T[],
  fields: (keyof T)[]
): Promise<T[]> {
  const uniqueValues = new Set<string>();
  for (const r of records) {
    for (const f of fields) {
      const v = r[f];
      if (isEncryptedPii(v) && !cache.has(v)) uniqueValues.add(v);
    }
  }
  await Promise.all(
    Array.from(uniqueValues).map(async (v) => {
      const { data } = await supabase.rpc("decrypt_pii", { p_encrypted_value: v });
      if (data) cache.set(v, data);
    })
  );
  return records.map((r) => {
    const next = { ...r };
    for (const f of fields) {
      const v = r[f];
      if (isEncryptedPii(v) && cache.has(v)) {
        (next as any)[f] = cache.get(v);
      }
    }
    return next;
  });
}
