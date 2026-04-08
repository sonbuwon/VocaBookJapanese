-- 대화 스크립트 라인 테이블
create table dialog_lines (
  id         uuid primary key default gen_random_uuid(),
  set_id     uuid not null references sets(id) on delete cascade,
  speaker    text not null check (speaker in ('A', 'B')),
  jp         text not null,
  hira       text not null,
  ko         text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- 주요 단어 테이블
create table dialog_vocab (
  id         uuid primary key default gen_random_uuid(),
  set_id     uuid not null references sets(id) on delete cascade,
  jp         text not null,
  hira       text not null,
  ko         text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- 주요 표현 테이블
create table dialog_expressions (
  id         uuid primary key default gen_random_uuid(),
  set_id     uuid not null references sets(id) on delete cascade,
  jp         text not null,
  hira       text not null,
  ko         text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index idx_dialog_lines_set_id       on dialog_lines(set_id);
create index idx_dialog_vocab_set_id       on dialog_vocab(set_id);
create index idx_dialog_expressions_set_id on dialog_expressions(set_id);

-- RLS 활성화
alter table dialog_lines       enable row level security;
alter table dialog_vocab       enable row level security;
alter table dialog_expressions enable row level security;

-- 인증된 유저 읽기
create policy "authenticated_read_dialog_lines"
  on dialog_lines for select to authenticated using (true);

create policy "authenticated_read_dialog_vocab"
  on dialog_vocab for select to authenticated using (true);

create policy "authenticated_read_dialog_expressions"
  on dialog_expressions for select to authenticated using (true);

-- 어드민 전용 쓰기
create policy "admin_all_dialog_lines"
  on dialog_lines for all to authenticated
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_all_dialog_vocab"
  on dialog_vocab for all to authenticated
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_all_dialog_expressions"
  on dialog_expressions for all to authenticated
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
