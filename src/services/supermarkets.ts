import { supabase } from "@/lib/supabase";

export type Supermarket = {
  id: string;
  chain: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  distanceMeters?: number;
  catalogSupermarketId?: string | null;
};

type OverpassElement = {
  id: number;
  type: "node" | "way" | "relation";
  lat?: number;
  lon?: number;
  center?: {
    lat: number;
    lon: number;
  };
  tags?: Record<string, string>;
};

type OverpassResponse = {
  elements: OverpassElement[];
};

type CatalogSupermarket = {
  id: string;
  chain: string;
  name: string;
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

export async function getNearbySupermarkets(
  latitude: number,
  longitude: number,
): Promise<Supermarket[]> {
  const radiusInMeters = 5000;

  const query = `
    [out:json][timeout:25];
    (
      node["shop"="supermarket"](around:${radiusInMeters},${latitude},${longitude});
      way["shop"="supermarket"](around:${radiusInMeters},${latitude},${longitude});
      relation["shop"="supermarket"](around:${radiusInMeters},${latitude},${longitude});
    );
    out center tags;
  `;

  const url =
    "https://overpass-api.de/api/interpreter?data=" + encodeURIComponent(query);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Non è stato possibile cercare i supermercati vicini.");
  }

  const data = (await response.json()) as OverpassResponse;

  return data.elements
    .map((element): Supermarket | null => {
      const supermarketLatitude = element.lat ?? element.center?.lat;
      const supermarketLongitude = element.lon ?? element.center?.lon;

      if (
        supermarketLatitude === undefined ||
        supermarketLongitude === undefined
      ) {
        return null;
      }

      const tags = element.tags ?? {};
      const name = tags.name ?? tags.brand ?? "Supermercato";
      const chain = tags.brand ?? tags.operator ?? name;

      const street = tags["addr:street"];
      const houseNumber = tags["addr:housenumber"];
      const city = tags["addr:city"];

      const address =
        [[street, houseNumber].filter(Boolean).join(" "), city]
          .filter(Boolean)
          .join(", ") || "Indirizzo non disponibile";

      return {
        id: `osm-${element.type}-${element.id}`,
        chain,
        name,
        address,
        latitude: supermarketLatitude,
        longitude: supermarketLongitude,
        distanceMeters: calculateDistance(
          latitude,
          longitude,
          supermarketLatitude,
          supermarketLongitude,
        ),
      };
    })
    .filter((supermarket): supermarket is Supermarket => supermarket !== null)
    .sort(
      (first, second) =>
        (first.distanceMeters ?? 0) - (second.distanceMeters ?? 0),
    )
    .slice(0, 20);
}

export async function addCatalogAvailability(
  supermarkets: Supermarket[],
): Promise<Supermarket[]> {
  const { data, error } = await supabase
    .from("supermarkets")
    .select("id, chain, name");

  if (error) {
    throw new Error(error.message);
  }

  const catalogSupermarkets = (data ?? []) as CatalogSupermarket[];

  return supermarkets
    .map((supermarket) => ({
      ...supermarket,
      catalogSupermarketId: findCatalogSupermarketId(
        catalogSupermarkets,
        supermarket.chain,
        supermarket.name,
      ),
    }))
    .sort((first, second) => {
      const firstAvailabilityRank = first.catalogSupermarketId ? 0 : 1;
      const secondAvailabilityRank = second.catalogSupermarketId ? 0 : 1;

      if (firstAvailabilityRank !== secondAvailabilityRank) {
        return firstAvailabilityRank - secondAvailabilityRank;
      }

      return (
        (first.distanceMeters ?? Number.MAX_VALUE) -
        (second.distanceMeters ?? Number.MAX_VALUE)
      );
    });
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

function calculateDistance(
  firstLatitude: number,
  firstLongitude: number,
  secondLatitude: number,
  secondLongitude: number,
) {
  const earthRadius = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const latitudeDifference = toRadians(secondLatitude - firstLatitude);
  const longitudeDifference = toRadians(secondLongitude - firstLongitude);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(firstLatitude)) *
      Math.cos(toRadians(secondLatitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return Math.round(
    earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value)),
  );
}

export async function getCatalogSupermarketId(
  chain: string,
  name: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("supermarkets")
    .select("id, chain, name");

  if (error) {
    throw new Error(error.message);
  }

  return findCatalogSupermarketId(
    (data ?? []) as CatalogSupermarket[],
    chain,
    name,
  );
}

function findCatalogSupermarketId(
  catalogSupermarkets: CatalogSupermarket[],
  chain: string,
  name: string,
): string | null {
  const selectedStoreName = normalizeStoreName(`${chain} ${name}`);

  const matchingSupermarket = catalogSupermarkets.find((supermarket) => {
    const databaseChain = normalizeStoreName(supermarket.chain);

    return (
      selectedStoreName.includes(databaseChain) ||
      databaseChain.includes(selectedStoreName)
    );
  });

  return matchingSupermarket?.id ?? null;
}

function normalizeStoreName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}
