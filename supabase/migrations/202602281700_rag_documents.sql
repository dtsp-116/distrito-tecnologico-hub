create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  notice_id uuid not null references public.notices(id) on delete cascade,
  notice_file_id uuid not null references public.notice_files(id) on delete cascade,
  file_name text not null,
  content_preview text,
  status text not null default 'ready' check (status in ('processing', 'ready', 'failed')),
  created_at timestamptz not null default now(),
  unique (notice_file_id)
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  token_count int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_documents_notice_id on public.documents (notice_id);
create index if not exists idx_document_chunks_document_id on public.document_chunks (document_id);

alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;

create policy "documents_select_authenticated" on public.documents
for select using (auth.uid() is not null);

create policy "documents_admin_write" on public.documents
for all using (public.is_admin()) with check (public.is_admin());

create policy "document_chunks_select_authenticated" on public.document_chunks
for select using (auth.uid() is not null);

create policy "document_chunks_admin_write" on public.document_chunks
for all using (public.is_admin()) with check (public.is_admin());
