-- 유저별 즐겨찾기 단어 테이블
create table if not exists user_favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  word_id    uuid not null references words(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, word_id)
);

-- RLS: 본인 데이터만 접근 가능
alter table user_favorites enable row level security;

create policy "users_own_favorites"
  on user_favorites for all
  to authenticated
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 인덱스
create index if not exists idx_favorites_user_id on user_favorites(user_id);
create index if not exists idx_favorites_word_id on user_favorites(word_id);
