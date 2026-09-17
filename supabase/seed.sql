-- =========================================================
-- RICETTE
-- =========================================================

insert into public.recipes (
  id,
  name,
  emoji,
  preparation_minutes,
  servings
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'Pasta al pomodoro',
    '🍝',
    20,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'Insalata di pollo',
    '🥗',
    25,
    2
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    'Riso con verdure',
    '🍚',
    30,
    2
  )
on conflict (id) do nothing;


-- =========================================================
-- INGREDIENTI
-- =========================================================

insert into public.ingredients (
  id,
  name,
  default_unit
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    'Pasta',
    'g'
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    'Passata di pomodoro',
    'g'
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    'Olio extravergine',
    'ml'
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    'Sale',
    'g'
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    'Petto di pollo',
    'g'
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    'Insalata',
    'g'
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    'Pomodorini',
    'g'
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    'Riso',
    'g'
  ),
  (
    '10000000-0000-0000-0000-000000000009',
    'Zucchine',
    'piece'
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    'Peperone',
    'piece'
  )
on conflict (id) do nothing;


-- =========================================================
-- INGREDIENTI DELLE RICETTE
-- =========================================================

insert into public.recipe_ingredients (
  recipe_id,
  ingredient_id,
  quantity,
  unit,
  display_quantity,
  position
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000001',
    180,
    'g',
    '180 g',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000002',
    250,
    'g',
    '250 g',
    2
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000003',
    30,
    'ml',
    '2 cucchiai',
    3
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    '10000000-0000-0000-0000-000000000004',
    null,
    null,
    'Quanto basta',
    4
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000005',
    300,
    'g',
    '300 g',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000006',
    150,
    'g',
    '150 g',
    2
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000007',
    150,
    'g',
    '150 g',
    3
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    '10000000-0000-0000-0000-000000000003',
    30,
    'ml',
    '2 cucchiai',
    4
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000008',
    180,
    'g',
    '180 g',
    1
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000009',
    2,
    'piece',
    '2',
    2
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000010',
    1,
    'piece',
    '1',
    3
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    '10000000-0000-0000-0000-000000000003',
    30,
    'ml',
    '2 cucchiai',
    4
  )
on conflict (recipe_id, ingredient_id) do nothing;


-- =========================================================
-- PASSAGGI DI PREPARAZIONE
-- =========================================================

insert into public.recipe_steps (
  recipe_id,
  position,
  instruction
)
values
  (
    '00000000-0000-0000-0000-000000000001',
    1,
    'Metti a bollire una pentola d’acqua.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    2,
    'Aggiungi il sale quando l’acqua bolle.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    3,
    'Cuoci la pasta seguendo il tempo indicato.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    4,
    'Scalda il sugo di pomodoro in una padella.'
  ),
  (
    '00000000-0000-0000-0000-000000000001',
    5,
    'Scola la pasta e uniscila al sugo.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    1,
    'Scalda una padella.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    2,
    'Cuoci il pollo fino a completa doratura.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    3,
    'Lava e taglia l’insalata.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    4,
    'Taglia il pollo a strisce.'
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    5,
    'Unisci gli ingredienti e condisci.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    1,
    'Lava e taglia le verdure.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    2,
    'Cuoci le verdure in padella.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    3,
    'Porta a bollore una pentola d’acqua.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    4,
    'Cuoci e scola il riso.'
  ),
  (
    '00000000-0000-0000-0000-000000000003',
    5,
    'Unisci il riso alle verdure.'
  )
on conflict (recipe_id, position) do nothing;



-- =========================================================
-- SUPERMERCATI DIMOSTRATIVI
-- =========================================================

insert into public.supermarkets (
  id,
  chain,
  name,
  address
)
values
  (
    '30000000-0000-0000-0000-000000000001',
    'Mercadona',
    'Mercadona Demo',
    'Punto vendita dimostrativo'
  ),
  (
    '30000000-0000-0000-0000-000000000002',
    'DIA',
    'DIA Demo',
    'Punto vendita dimostrativo'
  ),
  (
    '30000000-0000-0000-0000-000000000003',
    'Alcampo',
    'Alcampo Demo',
    'Punto vendita dimostrativo'
  )
on conflict (id) do nothing;


-- =========================================================
-- PRODOTTI DIMOSTRATIVI
-- =========================================================

insert into public.products (
  id,
  name,
  brand,
  pack_quantity,
  pack_unit,
  nutrition,
  data_source
)
values
  (
    '40000000-0000-0000-0000-000000000001',
    'Pasta di semola',
    'Savr Base',
    500,
    'g',
    '{
      "energy_kcal": 350,
      "protein_g": 13,
      "carbohydrates_g": 70,
      "fat_g": 1.5
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    'Pasta di semola',
    'Savr Scelta',
    500,
    'g',
    '{
      "energy_kcal": 355,
      "protein_g": 12.5,
      "carbohydrates_g": 71,
      "fat_g": 1.4
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    'Passata di pomodoro',
    'Savr Base',
    700,
    'g',
    '{
      "energy_kcal": 29,
      "protein_g": 1.4,
      "carbohydrates_g": 4.5,
      "fat_g": 0.2
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'Passata di pomodoro',
    'Savr Scelta',
    700,
    'g',
    '{
      "energy_kcal": 31,
      "protein_g": 1.5,
      "carbohydrates_g": 4.8,
      "fat_g": 0.2
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000005',
    'Olio extravergine di oliva',
    'Savr Base',
    1000,
    'ml',
    '{
      "energy_kcal": 824,
      "fat_g": 91.6
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000006',
    'Sale fino',
    'Savr Base',
    1000,
    'g',
    '{
      "energy_kcal": 0,
      "salt_g": 100
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000007',
    'Petto di pollo',
    'Savr Base',
    500,
    'g',
    '{
      "energy_kcal": 110,
      "protein_g": 23,
      "fat_g": 1.2
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000008',
    'Insalata fresca',
    'Savr Base',
    200,
    'g',
    '{
      "energy_kcal": 15,
      "protein_g": 1.4,
      "carbohydrates_g": 2.9
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000009',
    'Pomodorini',
    'Savr Base',
    500,
    'g',
    '{
      "energy_kcal": 18,
      "protein_g": 0.9,
      "carbohydrates_g": 3.9
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000010',
    'Riso',
    'Savr Base',
    1000,
    'g',
    '{
      "energy_kcal": 360,
      "protein_g": 7,
      "carbohydrates_g": 79,
      "fat_g": 0.6
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000011',
    'Zucchine',
    'Savr Base',
    1000,
    'g',
    '{
      "energy_kcal": 17,
      "protein_g": 1.2,
      "carbohydrates_g": 3.1
    }'::jsonb,
    'demo'
  ),
  (
    '40000000-0000-0000-0000-000000000012',
    'Peperoni',
    'Savr Base',
    500,
    'g',
    '{
      "energy_kcal": 31,
      "protein_g": 1,
      "carbohydrates_g": 6
    }'::jsonb,
    'demo'
  )
on conflict (id) do nothing;


-- =========================================================
-- COLLEGAMENTI INGREDIENTI-PRODOTTI
-- =========================================================

insert into public.ingredient_products (
  ingredient_id,
  product_id,
  preference_rank
)
values
  (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000001',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000001',
    '40000000-0000-0000-0000-000000000002',
    2
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000003',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000002',
    '40000000-0000-0000-0000-000000000004',
    2
  ),
  (
    '10000000-0000-0000-0000-000000000003',
    '40000000-0000-0000-0000-000000000005',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000004',
    '40000000-0000-0000-0000-000000000006',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000005',
    '40000000-0000-0000-0000-000000000007',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000006',
    '40000000-0000-0000-0000-000000000008',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000007',
    '40000000-0000-0000-0000-000000000009',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000008',
    '40000000-0000-0000-0000-000000000010',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000009',
    '40000000-0000-0000-0000-000000000011',
    1
  ),
  (
    '10000000-0000-0000-0000-000000000010',
    '40000000-0000-0000-0000-000000000012',
    1
  )
on conflict (ingredient_id, product_id) do nothing;



-- =========================================================
-- PREZZI NEI PUNTI VENDITA
-- =========================================================

with base_prices (
  product_id,
  base_price
) as (
  values
    (
      '40000000-0000-0000-0000-000000000001'::uuid,
      1.25::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000002'::uuid,
      1.45::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000003'::uuid,
      1.35::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000004'::uuid,
      1.65::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000005'::uuid,
      7.50::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000006'::uuid,
      0.85::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000007'::uuid,
      5.90::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000008'::uuid,
      1.35::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000009'::uuid,
      2.20::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000010'::uuid,
      2.15::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000011'::uuid,
      2.40::numeric
    ),
    (
      '40000000-0000-0000-0000-000000000012'::uuid,
      1.70::numeric
    )
),
store_multipliers (
  supermarket_id,
  multiplier
) as (
  values
    (
      '30000000-0000-0000-0000-000000000001'::uuid,
      1.00::numeric
    ),
    (
      '30000000-0000-0000-0000-000000000002'::uuid,
      0.95::numeric
    ),
    (
      '30000000-0000-0000-0000-000000000003'::uuid,
      1.05::numeric
    )
)
insert into public.store_products (
  supermarket_id,
  product_id,
  regular_price,
  currency,
  availability
)
select
  store_multipliers.supermarket_id,
  base_prices.product_id,

  round(
    base_prices.base_price *
    store_multipliers.multiplier,
    2
  ),

  'EUR',
  'available'

from base_prices
cross join store_multipliers

on conflict (supermarket_id, product_id)
do update set
  regular_price = excluded.regular_price,
  currency = excluded.currency,
  availability = excluded.availability,
  checked_at = now();


-- =========================================================
-- OFFERTE DIMOSTRATIVE
-- =========================================================

with demo_offers (
  supermarket_id,
  product_id,
  sale_price
) as (
  values
    (
      '30000000-0000-0000-0000-000000000001'::uuid,
      '40000000-0000-0000-0000-000000000002'::uuid,
      0.99::numeric
    ),
    (
      '30000000-0000-0000-0000-000000000002'::uuid,
      '40000000-0000-0000-0000-000000000004'::uuid,
      1.09::numeric
    ),
    (
      '30000000-0000-0000-0000-000000000003'::uuid,
      '40000000-0000-0000-0000-000000000007'::uuid,
      4.75::numeric
    ),
    (
      '30000000-0000-0000-0000-000000000001'::uuid,
      '40000000-0000-0000-0000-000000000010'::uuid,
      1.59::numeric
    ),
    (
      '30000000-0000-0000-0000-000000000002'::uuid,
      '40000000-0000-0000-0000-000000000012'::uuid,
      1.29::numeric
    )
)
insert into public.offers (
  store_product_id,
  sale_price,
  starts_at,
  ends_at,
  enabled
)
select
  store_products.id,
  demo_offers.sale_price,
  now() - interval '1 day',
  now() + interval '90 days',
  true

from demo_offers

join public.store_products
  on store_products.supermarket_id =
    demo_offers.supermarket_id
  and store_products.product_id =
    demo_offers.product_id

where not exists (
  select 1
  from public.offers existing_offer

  where
    existing_offer.store_product_id =
      store_products.id
    and existing_offer.enabled = true
    and existing_offer.starts_at <= now()
    and now() < existing_offer.ends_at
);