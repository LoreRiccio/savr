create extension if not exists pgcrypto;

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  emoji text,
  preparation_minutes integer not null
    check (preparation_minutes > 0),
  servings integer not null default 2
    check (servings > 0),
  created_at timestamptz not null default now()
);

create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  default_unit text,
  created_at timestamptz not null default now()
);

create table public.recipe_ingredients (
  recipe_id uuid not null
    references public.recipes(id)
    on delete cascade,

  ingredient_id uuid not null
    references public.ingredients(id)
    on delete restrict,

  quantity numeric(10, 2),
  unit text,
  display_quantity text not null,

  position integer not null
    check (position > 0),

  primary key (recipe_id, ingredient_id),
  unique (recipe_id, position)
);

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),

  recipe_id uuid not null
    references public.recipes(id)
    on delete cascade,

  position integer not null
    check (position > 0),

  instruction text not null,
  image_url text,

  timer_seconds integer
    check (
      timer_seconds is null
      or timer_seconds > 0
    ),

  unique (recipe_id, position)
);

create table public.supermarkets (
  id uuid primary key default gen_random_uuid(),

  chain text not null,
  name text not null,
  address text not null,

  latitude double precision,
  longitude double precision,

  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),

  barcode text unique,
  name text not null,
  brand text not null,
  image_url text,

  pack_quantity numeric(10, 2)
    check (
      pack_quantity is null
      or pack_quantity > 0
    ),

  pack_unit text,

  nutrition jsonb not null default '{}'::jsonb,

  data_source text not null default 'manual',
  updated_at timestamptz not null default now()
);

create table public.ingredient_products (
  ingredient_id uuid not null
    references public.ingredients(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id)
    on delete cascade,

  preference_rank integer not null default 1
    check (preference_rank > 0),

  primary key (ingredient_id, product_id)
);

create table public.store_products (
  id uuid primary key default gen_random_uuid(),

  supermarket_id uuid not null
    references public.supermarkets(id)
    on delete cascade,

  product_id uuid not null
    references public.products(id)
    on delete cascade,

  regular_price numeric(10, 2)
    check (
      regular_price is null
      or regular_price >= 0
    ),

  currency text not null default 'EUR',

  availability text not null default 'unknown'
    check (
      availability in (
        'available',
        'unavailable',
        'unknown'
      )
    ),

  checked_at timestamptz not null default now(),

  unique (supermarket_id, product_id)
);

create table public.offers (
  id uuid primary key default gen_random_uuid(),

  store_product_id uuid not null
    references public.store_products(id)
    on delete cascade,

  sale_price numeric(10, 2) not null
    check (sale_price >= 0),

  starts_at timestamptz not null,
  ends_at timestamptz not null,

  enabled boolean not null default true,

  check (ends_at > starts_at)
);

create index recipe_ingredients_recipe_id_index
  on public.recipe_ingredients(recipe_id);

create index recipe_steps_recipe_id_index
  on public.recipe_steps(recipe_id);

create index ingredient_products_ingredient_index
  on public.ingredient_products(ingredient_id);

create index store_products_supermarket_index
  on public.store_products(supermarket_id);

create index store_products_product_index
  on public.store_products(product_id);

create index offers_store_product_index
  on public.offers(store_product_id);

create index offers_active_dates_index
  on public.offers(starts_at, ends_at);

alter table public.recipes
  enable row level security;

alter table public.ingredients
  enable row level security;

alter table public.recipe_ingredients
  enable row level security;

alter table public.recipe_steps
  enable row level security;

alter table public.supermarkets
  enable row level security;

alter table public.products
  enable row level security;

alter table public.ingredient_products
  enable row level security;

alter table public.store_products
  enable row level security;

alter table public.offers
  enable row level security;

create policy "Recipes are publicly readable"
  on public.recipes
  for select
  to anon, authenticated
  using (true);

create policy "Ingredients are publicly readable"
  on public.ingredients
  for select
  to anon, authenticated
  using (true);

create policy "Recipe ingredients are publicly readable"
  on public.recipe_ingredients
  for select
  to anon, authenticated
  using (true);

create policy "Recipe steps are publicly readable"
  on public.recipe_steps
  for select
  to anon, authenticated
  using (true);

create policy "Supermarkets are publicly readable"
  on public.supermarkets
  for select
  to anon, authenticated
  using (true);

create policy "Products are publicly readable"
  on public.products
  for select
  to anon, authenticated
  using (true);

create policy "Ingredient products are publicly readable"
  on public.ingredient_products
  for select
  to anon, authenticated
  using (true);

create policy "Store products are publicly readable"
  on public.store_products
  for select
  to anon, authenticated
  using (true);

create policy "Offers are publicly readable"
  on public.offers
  for select
  to anon, authenticated
  using (true);

create view public.store_product_prices
with (security_invoker = true)
as
select
  store_products.id as store_product_id,
  store_products.supermarket_id,
  store_products.product_id,
  store_products.regular_price,
  store_products.currency,
  store_products.availability,
  store_products.checked_at,

  active_offer.id as offer_id,
  active_offer.sale_price,
  active_offer.starts_at as offer_starts_at,
  active_offer.ends_at as offer_ends_at,

  coalesce(
    active_offer.sale_price,
    store_products.regular_price
  ) as effective_price,

  (active_offer.id is not null) as is_on_sale

from public.store_products

left join lateral (
  select
    offers.id,
    offers.sale_price,
    offers.starts_at,
    offers.ends_at

  from public.offers

  where
    offers.store_product_id = store_products.id
    and offers.enabled = true
    and offers.starts_at <= now()
    and now() < offers.ends_at
    and (
      store_products.regular_price is null
      or offers.sale_price <
        store_products.regular_price
    )

  order by
    offers.sale_price asc,
    offers.starts_at desc

  limit 1
) as active_offer on true;

grant select
on public.store_product_prices
to anon, authenticated;