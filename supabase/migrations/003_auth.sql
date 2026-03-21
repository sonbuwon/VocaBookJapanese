-- RLS 활성화 (인증된 사용자만 데이터 접근 가능)
alter table sets  enable row level security;
alter table words enable row level security;

-- 인증된 사용자는 모든 세트 읽기 가능
create policy "authenticated_read_sets"
  on sets for select
  to authenticated
  using (true);

-- 인증된 사용자는 모든 단어 읽기 가능
create policy "authenticated_read_words"
  on words for select
  to authenticated
  using (true);
