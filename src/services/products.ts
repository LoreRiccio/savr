import { supabase } from "@/lib/supabase";

export type NutritionValues = {
  energy_kcal?: number;
  protein_g?: number;
  carbohydrates_g?: number;
  fat_g?: number;
  salt_g?: number;
};

export type StoreProductOption = {
  storeProductId: string;
  productId: string;
  name: string;
  brand: string;
  imageUrl: string | null;
  packQuantity: number | null;
  packUnit: string | null;
  nutrition: NutritionValues;
  regularPrice: number | null;
  effectivePrice: number | null;
  currency: string;
  availability: string;
  isOnSale: boolean;
  preferenceRank: number;
};

function numberOrNull(value: number | string | null): number | null {
  if (value === null) {
    return null;
  }

  const convertedValue = Number(value);

  return Number.isNaN(convertedValue) ? null : convertedValue;
}

export async function getProductsForIngredient(
  ingredientId: string,
  supermarketId: string,
): Promise<StoreProductOption[]> {
  const { data: links, error: linksError } = await supabase
    .from("ingredient_products")
    .select(
      `
          preference_rank,
          product:products (
            id,
            name,
            brand,
            image_url,
            pack_quantity,
            pack_unit,
            nutrition
          )
        `,
    )
    .eq("ingredient_id", ingredientId);

  if (linksError) {
    throw new Error(linksError.message);
  }

  const normalizedProducts = (links ?? []).flatMap((link) => {
    const product = Array.isArray(link.product)
      ? link.product[0]
      : link.product;

    if (!product) {
      return [];
    }

    return [
      {
        product,
        preferenceRank: link.preference_rank,
      },
    ];
  });

  const productIds = normalizedProducts.map(({ product }) => product.id);

  if (productIds.length === 0) {
    return [];
  }

  const { data: prices, error: pricesError } = await supabase
    .from("store_product_prices")
    .select(
      `
          store_product_id,
          product_id,
          regular_price,
          effective_price,
          currency,
          availability,
          is_on_sale
        `,
    )
    .eq("supermarket_id", supermarketId)
    .in("product_id", productIds)
    .neq("availability", "unavailable");

  if (pricesError) {
    throw new Error(pricesError.message);
  }

  const pricesByProductId = new Map(
    (prices ?? []).map((price) => [price.product_id, price]),
  );

  const products: StoreProductOption[] = normalizedProducts.flatMap(
    ({ product, preferenceRank }) => {
      const price = pricesByProductId.get(product.id);

      if (!price) {
        return [];
      }

      return [
        {
          storeProductId: price.store_product_id,
          productId: product.id,
          name: product.name,
          brand: product.brand,
          imageUrl: product.image_url,
          packQuantity: numberOrNull(product.pack_quantity),
          packUnit: product.pack_unit,
          nutrition: (product.nutrition as NutritionValues) ?? {},
          regularPrice: numberOrNull(price.regular_price),
          effectivePrice: numberOrNull(price.effective_price),
          currency: price.currency,
          availability: price.availability,
          isOnSale: price.is_on_sale,
          preferenceRank,
        },
      ];
    },
  );

  return products.sort((first, second) => {
    if (first.isOnSale !== second.isOnSale) {
      return first.isOnSale ? -1 : 1;
    }

    if (first.preferenceRank !== second.preferenceRank) {
      return first.preferenceRank - second.preferenceRank;
    }

    return (
      (first.effectivePrice ?? Number.MAX_VALUE) -
      (second.effectivePrice ?? Number.MAX_VALUE)
    );
  });
}

export async function getStoreProductsByIds(
  storeProductIds: string[],
): Promise<StoreProductOption[]> {
  if (storeProductIds.length === 0) {
    return [];
  }

  const { data: prices, error: pricesError } = await supabase
    .from("store_product_prices")
    .select(
      `
          store_product_id,
          product_id,
          regular_price,
          effective_price,
          currency,
          availability,
          is_on_sale
        `,
    )
    .in("store_product_id", storeProductIds);

  if (pricesError) {
    throw new Error(pricesError.message);
  }

  const productIds = (prices ?? []).map((price) => price.product_id);

  if (productIds.length === 0) {
    return [];
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
          id,
          name,
          brand,
          image_url,
          pack_quantity,
          pack_unit,
          nutrition
        `,
    )
    .in("id", productIds);

  if (productsError) {
    throw new Error(productsError.message);
  }

  const productsById = new Map(
    (products ?? []).map((product) => [product.id, product]),
  );

  const pricesByStoreProductId = new Map(
    (prices ?? []).map((price) => [price.store_product_id, price]),
  );

  return storeProductIds.flatMap((storeProductId) => {
    const price = pricesByStoreProductId.get(storeProductId);

    if (!price) {
      return [];
    }

    const product = productsById.get(price.product_id);

    if (!product) {
      return [];
    }

    return [
      {
        storeProductId: price.store_product_id,
        productId: product.id,
        name: product.name,
        brand: product.brand,
        imageUrl: product.image_url,
        packQuantity: numberOrNull(product.pack_quantity),
        packUnit: product.pack_unit,
        nutrition: (product.nutrition as NutritionValues) ?? {},
        regularPrice: numberOrNull(price.regular_price),
        effectivePrice: numberOrNull(price.effective_price),
        currency: price.currency,
        availability: price.availability,
        isOnSale: price.is_on_sale,
        preferenceRank: 1,
      },
    ];
  });
}
