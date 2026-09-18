export type NearbySupermarket = {
  id: string;
  name: string;
  chain: string;
  address: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
};

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
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

function calculateDistance(
  userLatitude: number,
  userLongitude: number,
  storeLatitude: number,
  storeLongitude: number,
) {
  const earthRadius = 6371000;
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const latitudeDifference = toRadians(storeLatitude - userLatitude);
  const longitudeDifference = toRadians(storeLongitude - userLongitude);

  const firstLatitude = toRadians(userLatitude);
  const secondLatitude = toRadians(storeLatitude);

  const value =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  return 2 * earthRadius * Math.asin(Math.sqrt(value));
}

function createAddress(tags: Record<string, string>) {
  const street = tags["addr:street"];
  const houseNumber = tags["addr:housenumber"];
  const city = tags["addr:city"];

  const streetAddress = [street, houseNumber].filter(Boolean).join(" ");

  return (
    [streetAddress, city].filter(Boolean).join(", ") ||
    "Indirizzo non disponibile"
  );
}

export async function getNearbySupermarkets(
  latitude: number,
  longitude: number,
): Promise<NearbySupermarket[]> {
  const query = `
    [out:json][timeout:20];
    (
      node["shop"="supermarket"](around:5000,${latitude},${longitude});
      way["shop"="supermarket"](around:5000,${latitude},${longitude});
      relation["shop"="supermarket"](around:5000,${latitude},${longitude});
    );
    out center tags;
  `;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error("Impossibile cercare i supermercati vicini.");
  }

  const data = (await response.json()) as OverpassResponse;

  return data.elements
    .map((element) => {
      const storeLatitude = element.lat ?? element.center?.lat;
      const storeLongitude = element.lon ?? element.center?.lon;

      if (storeLatitude === undefined || storeLongitude === undefined) {
        return null;
      }

      const tags = element.tags ?? {};
      const name = tags.name ?? tags.brand ?? "Supermercato";
      const chain = tags.brand ?? tags.operator ?? name;

      return {
        id: `osm-${element.type}-${element.id}`,
        name,
        chain,
        address: createAddress(tags),
        latitude: storeLatitude,
        longitude: storeLongitude,
        distanceMeters: calculateDistance(
          latitude,
          longitude,
          storeLatitude,
          storeLongitude,
        ),
      };
    })
    .filter(
      (supermarket): supermarket is NearbySupermarket => supermarket !== null,
    )
    .sort(
      (firstSupermarket, secondSupermarket) =>
        firstSupermarket.distanceMeters - secondSupermarket.distanceMeters,
    )
    .slice(0, 10);
}
