do $seed_products$
declare
  starter_products jsonb := $json$
  [
    {"id":"p1","name":"Hdpe Pipe Fitting Machines","category":"On Site Equipments","description":"Heavy-duty butt fusion and electrofusion jointing machines for telecom and water infrastructure.","featured":true},
    {"id":"p2","name":"Compression End Cap HDPE 20mm","category":"HDPE Duct Accessories","description":"Precision compression end cap preventing debris and moisture ingress in active fiber conduit networks.","featured":true},
    {"id":"p3","name":"HDPE Pipe 110mm PN 16","category":"HDPE Main Ducts","description":"High-density polyethylene main duct with high ring stiffness for direct buried municipal applications.","featured":true},
    {"id":"p4","name":"PVC Elbow 90°","category":"HDPE Duct Accessories","description":"Engineered 90-degree smooth curve bend designed for friction-free cable pulling.","featured":true},
    {"id":"p5","name":"Fiber Optic Cable","category":"Telecom Infra Services","description":"Single-mode ITU-T G.652D optical fiber cable optimized for air-blown microduct deployment.","featured":true},
    {"id":"p6","name":"PPR Pipe 32mm","category":"HDPE Main Ducts","description":"Polypropylene random copolymer piping designed for industrial fluid conveyance and heavy conduit runs.","featured":true},
    {"id":"p7","name":"Micro Duct 2 Way 12/08 mm","category":"HDPE Microducts","description":"Dual pathway microduct with low-friction ribbed inner lining for long-distance blown-fiber scalability.","featured":true},
    {"id":"p8","name":"HDPE PE100 Mini Duct Full Orange 20/16 mm","category":"HDPE Miniducts","description":"High-visibility orange PE100 mini duct ideal for last-mile FTTx connectivity.","featured":false},
    {"id":"p9","name":"HDPE PE100 Duct 20/16 mm SDR 11 PN 16","category":"HDPE Miniducts","description":"Heavy-duty UV stabilized duct designed for rocky trenches and challenging soil conditions.","featured":false},
    {"id":"p10","name":"HDPE PE100 Main Duct 90 mm PN 10","category":"HDPE Main Ducts","description":"Structural conduit providing robust channel protection for multiple subducts.","featured":false},
    {"id":"p11","name":"Drum Roller for Microduct Rolls","category":"On Site Equipments","description":"Heavy-duty drum roller for smooth microduct roll handling on installation sites.","featured":false},
    {"id":"p12","name":"Warning Tape STC","category":"Warning Tapes","description":"High-visibility underground warning tape for telecom and utility trench identification.","featured":false},
    {"id":"p13","name":"Microduct End Cap 12/08MM","category":"HDPE Duct Accessories","description":"Watertight and dustproof end cap for microduct protection.","featured":false},
    {"id":"p14","name":"PP Rope 3 mm x 1000 Metre","category":"Rope","description":"High-tensile polypropylene pulling rope, 3 mm by 1000 metres.","featured":false},
    {"id":"p15","name":"Plastic Spacer 20 mm 5 Way Base","category":"Plastic Pipe Spacer","description":"Five-way modular plastic pipe spacer base for multi-duct trench alignment.","featured":false},
    {"id":"p16","name":"Duct End Plug 25mm","category":"Telecom Infra Services","description":"Expandable rubber and polymer end plug for sealing telecom ducts.","featured":false},
    {"id":"p17","name":"HDPE - CD 110 mm with 5 Subducts 33/28 mm (PECD)","category":"HDPE Corrugated Ducts","description":"Double-wall corrugated outer duct pre-installed with five 33/28 mm subducts.","featured":false}
  ]$json$::jsonb;
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'data'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'sort_order'
  ) then
    insert into public.products (id, sort_order, data)
    select
      item->>'id',
      (ordinality - 1)::integer,
      item - 'id'
    from jsonb_array_elements(starter_products) with ordinality as seed(item, ordinality)
    on conflict (id) do nothing;
  elsif exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'name'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'category'
  ) and exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'description'
  ) then
    if exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'products'
        and column_name = 'sort_order'
    ) and exists (
      select 1
      from information_schema.columns
      where table_schema = 'public'
        and table_name = 'products'
        and column_name = 'featured'
    ) then
      insert into public.products (id, name, category, description, sort_order, featured)
      select
        item->>'id',
        item->>'name',
        item->>'category',
        item->>'description',
        (ordinality - 1)::integer,
        ordinality <= 7
      from jsonb_array_elements(starter_products) with ordinality as seed(item, ordinality)
      on conflict (id) do nothing;
    else
      insert into public.products (id, name, category, description)
      select
        item->>'id',
        item->>'name',
        item->>'category',
        item->>'description'
      from jsonb_array_elements(starter_products) as seed(item)
      on conflict (id) do nothing;
    end if;
  else
    raise exception 'Unsupported public.products schema; no starter products were inserted.';
  end if;
end
$seed_products$;
