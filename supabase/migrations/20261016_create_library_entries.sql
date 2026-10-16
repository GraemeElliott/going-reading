-- My Library: books a user owns, physically, digitally or both.
-- Independent of shelves (user_books) and lists (books_in_lists).

create table if not exists public.library_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  isbn text not null,
  -- Book details are copied in (like user_books) so an owned book doesn't
  -- need to be on a shelf
  title text not null,
  authors text[] not null default '{}',
  image text,
  date_published text,
  publisher text,
  pages integer,
  formats text[] not null,
  date_added date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One or both of 'physical' / 'digital', never empty
  constraint library_entries_formats_valid check (
    cardinality(formats) between 1 and 2
    and formats <@ array['physical', 'digital']::text[]
  ),
  -- A book owned in both formats is one entry, not two
  constraint library_entries_user_isbn_key unique (user_id, isbn)
);

create index if not exists library_entries_user_date_idx
  on public.library_entries (user_id, date_added desc, created_at desc);

-- Row level security: users can only see and change their own entries
alter table public.library_entries enable row level security;

create policy "Users can view their own library entries"
  on public.library_entries for select
  using (auth.uid() = user_id);

create policy "Users can add to their own library"
  on public.library_entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own library entries"
  on public.library_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can remove their own library entries"
  on public.library_entries for delete
  using (auth.uid() = user_id);
