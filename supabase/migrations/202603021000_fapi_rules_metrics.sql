create table if not exists public.fapi_rules (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('geral', 'agencia', 'edital')),
  agencia_id uuid references public.agencies(id) on delete cascade,
  edital_id uuid references public.notices(id) on delete cascade,
  descricao text not null,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fapi_rules_scope_check check (
    (tipo = 'geral' and agencia_id is null and edital_id is null)
    or (tipo = 'agencia' and agencia_id is not null and edital_id is null)
    or (tipo = 'edital' and edital_id is not null)
  )
);

create index if not exists idx_fapi_rules_tipo_ativa
  on public.fapi_rules (tipo, ativa);

create index if not exists idx_fapi_rules_agencia
  on public.fapi_rules (agencia_id)
  where agencia_id is not null;

create index if not exists idx_fapi_rules_edital
  on public.fapi_rules (edital_id)
  where edital_id is not null;

alter table public.fapi_rules enable row level security;

create policy "fapi_rules_select_authenticated" on public.fapi_rules
for select using (auth.uid() is not null);

create policy "fapi_rules_admin_write" on public.fapi_rules
for all using (public.is_admin()) with check (public.is_admin());

create table if not exists public.fapi_analysis_metrics (
  id uuid primary key default gen_random_uuid(),
  metric_date date not null default current_date,
  agency_id uuid references public.agencies(id) on delete set null,
  analysis_count integer not null default 0,
  avg_response_ms numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fapi_analysis_metrics_unique unique (metric_date, agency_id)
);

create index if not exists idx_fapi_metrics_date
  on public.fapi_analysis_metrics (metric_date desc);

create index if not exists idx_fapi_metrics_agency
  on public.fapi_analysis_metrics (agency_id)
  where agency_id is not null;

alter table public.fapi_analysis_metrics enable row level security;

create policy "fapi_metrics_admin_only" on public.fapi_analysis_metrics
for all using (public.is_admin()) with check (public.is_admin());
