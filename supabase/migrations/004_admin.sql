-- sets 테이블에 sort_order 컬럼 추가
alter table sets add column if not exists sort_order integer not null default 0;

-- 기존 sets의 sort_order를 타입별 created_at 순서로 초기화
with ranked as (
  select id, row_number() over (partition by type order by created_at) as rn
  from sets
)
update sets set sort_order = ranked.rn
from ranked
where sets.id = ranked.id;

-- 인증된 사용자가 sets를 insert/update/delete 할 수 있도록 RLS 정책 추가
create policy "authenticated_insert_sets"
  on sets for insert
  to authenticated
  with check (true);

create policy "authenticated_update_sets"
  on sets for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_delete_sets"
  on sets for delete
  to authenticated
  using (true);

-- 인증된 사용자가 words를 insert/update/delete 할 수 있도록 RLS 정책 추가
create policy "authenticated_insert_words"
  on words for insert
  to authenticated
  with check (true);

create policy "authenticated_update_words"
  on words for update
  to authenticated
  using (true)
  with check (true);

create policy "authenticated_delete_words"
  on words for delete
  to authenticated
  using (true);
