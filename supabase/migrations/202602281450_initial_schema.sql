create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  acronym text not null unique,
  description text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete restrict,
  title text not null,
  access_link text,
  status text not null check (status in ('aberto', 'encerrado', 'em_breve')),
  publish_date date not null,
  deadline_date date not null,
  summary text not null,
  description text not null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.notice_tags (
  notice_id uuid not null references public.notices(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (notice_id, tag_id)
);

create table if not exists public.notice_files (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text,
  size_bytes bigint not null,
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.agencies enable row level security;
alter table public.notices enable row level security;
alter table public.tags enable row level security;
alter table public.notice_tags enable row level security;
alter table public.notice_files enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
$$;

create policy "profiles_select_own" on public.profiles
for select using (id = auth.uid());

create policy "profiles_update_own" on public.profiles
for update using (id = auth.uid());

create policy "agencies_select_authenticated" on public.agencies
for select using (auth.uid() is not null);

create policy "agencies_admin_write" on public.agencies
for all using (public.is_admin()) with check (public.is_admin());

create policy "notices_select_authenticated" on public.notices
for select using (auth.uid() is not null);

create policy "notices_admin_write" on public.notices
for all using (public.is_admin()) with check (public.is_admin());

create policy "tags_select_authenticated" on public.tags
for select using (auth.uid() is not null);

create policy "tags_admin_write" on public.tags
for all using (public.is_admin()) with check (public.is_admin());

create policy "notice_tags_select_authenticated" on public.notice_tags
for select using (auth.uid() is not null);

create policy "notice_tags_admin_write" on public.notice_tags
for all using (public.is_admin()) with check (public.is_admin());

create policy "notice_files_select_authenticated" on public.notice_files
for select using (auth.uid() is not null);

create policy "notice_files_admin_write" on public.notice_files
for all using (public.is_admin()) with check (public.is_admin());

insert into storage.buckets (id, name, public)
values ('notice-files', 'notice-files', false)
on conflict (id) do nothing;

create policy "notice_files_storage_read_authenticated" on storage.objects
for select using (bucket_id = 'notice-files' and auth.uid() is not null);

create policy "notice_files_storage_admin_write" on storage.objects
for insert with check (bucket_id = 'notice-files' and public.is_admin());

create policy "notice_files_storage_admin_update" on storage.objects
for update using (bucket_id = 'notice-files' and public.is_admin());

create policy "notice_files_storage_admin_delete" on storage.objects
for delete using (bucket_id = 'notice-files' and public.is_admin());
