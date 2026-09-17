import { supabase } from "@/lib/supabase";

export type Supermarket = {
  id: string;
  chain: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
};

export async function getSupermarkets(): Promise<Supermarket[]> {
  const { data, error } = await supabase
    .from("supermarkets")
    .select(
      `
        id,
        chain,
        name,
        address,
        latitude,
        longitude
      `,
    )
    .order("chain");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getSupermarketById(
  supermarketId: string,
): Promise<Supermarket | null> {
  const { data, error } = await supabase
    .from("supermarkets")
    .select(
      `
        id,
        chain,
        name,
        address,
        latitude,
        longitude
      `,
    )
    .eq("id", supermarketId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
