create table quiz_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  set_id     uuid references sets(id) on delete set null,
  set_name   text not null,
  mode       text not null check (mode in ('hira', 'meaning')),
  score      integer not null,
  total      integer not null,
  questions  jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table quiz_history enable row level security;

-- 본인 내역만 접근 가능
create policy "users_own_quiz_history"
  on quiz_history for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_quiz_history_user_id    on quiz_history(user_id);
create index idx_quiz_history_created_at on quiz_history(created_at desc);
