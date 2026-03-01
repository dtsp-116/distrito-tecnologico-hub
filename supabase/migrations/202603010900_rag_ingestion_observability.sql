alter table if exists public.notice_files
  add column if not exists rag_status text default 'empty',
  add column if not exists rag_extraction_method text default 'unknown',
  add column if not exists rag_extracted_char_count integer default 0,
  add column if not exists rag_chunk_count integer default 0,
  add column if not exists rag_last_error text,
  add column if not exists rag_processed_at timestamptz;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notice_files_rag_status_check'
  ) then
    alter table public.notice_files
      add constraint notice_files_rag_status_check
      check (rag_status in ('ready', 'empty', 'error'));
  end if;
end $$;

create index if not exists idx_notice_files_notice_rag_status
  on public.notice_files (notice_id, rag_status);
