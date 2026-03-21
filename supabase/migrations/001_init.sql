-- sets 테이블
create table if not exists sets (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  type       text not null,  -- 'word' | 'sent'
  created_at timestamptz default now()
);

-- words 테이블
create table if not exists words (
  id         uuid primary key default gen_random_uuid(),
  set_id     uuid not null references sets(id) on delete cascade,
  jp         text not null,
  hira       text not null,
  ko         text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

-- RLS 비활성화 (향후 인증 추가 시 활성화)
alter table sets  disable row level security;
alter table words disable row level security;

-- 인덱스
create index if not exists idx_words_set_id on words(set_id);
create index if not exists idx_sets_type    on sets(type);
