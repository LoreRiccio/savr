export type Supermarket = {
  id: string;
  name: string;
  address: string;
  distance: string;
};

export const supermarkets: Supermarket[] = [
  {
    id: "mercadona",
    name: "Mercadona",
    address: "Punto vendita più vicino",
    distance: "800 m",
  },
  {
    id: "dia",
    name: "DIA",
    address: "Punto vendita nelle vicinanze",
    distance: "1,2 km",
  },
  {
    id: "alcampo",
    name: "Alcampo",
    address: "Punto vendita nelle vicinanze",
    distance: "2,4 km",
  },
];

export function getSupermarketById(id: string) {
  return supermarkets.find((supermarket) => supermarket.id === id);
}
