-- 개인 단어 관리 기능 추가
-- sets 테이블에 is_default, owner_id 컬럼 추가
alter table sets
  add column if not exists is_default boolean not null default false,
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

-- 기존 세트는 모두 기본 제공 단어로 설정
update sets set is_default = true where is_default = false;

-- ─── sets SELECT 정책 업데이트 ─────────────────────────────────────────
-- 기존 "모든 인증 유저 읽기" 정책 삭제 후 세분화
drop policy if exists "authenticated_read_sets" on sets;

-- 기본 제공 단어: 모든 인증 유저 읽기 가능
create policy "read_default_sets"
  on sets for select
  to authenticated
  using (is_default = true);

-- 개인 단어: 자기 자신의 세트만 읽기 가능
create policy "read_own_sets"
  on sets for select
  to authenticated
  using (owner_id = auth.uid());

-- ─── sets 개인 사용자 쓰기 정책 추가 ─────────────────────────────────────
-- 일반 유저: 자신의 개인 세트 생성 가능
create policy "user_insert_own_sets"
  on sets for insert
  to authenticated
  with check (
    owner_id = auth.uid()
    and is_default = false
  );

-- 일반 유저: 자신의 개인 세트 수정 가능
create policy "user_update_own_sets"
  on sets for update
  to authenticated
  using  (owner_id = auth.uid() and is_default = false)
  with check (owner_id = auth.uid() and is_default = false);

-- 일반 유저: 자신의 개인 세트 삭제 가능
create policy "user_delete_own_sets"
  on sets for delete
  to authenticated
  using (owner_id = auth.uid() and is_default = false);

-- ─── words 개인 사용자 쓰기 정책 추가 ────────────────────────────────────
-- 일반 유저: 자신의 개인 세트에 속한 단어 생성
create policy "user_insert_own_words"
  on words for insert
  to authenticated
  with check (
    exists (
      select 1 from sets
      where sets.id = set_id
        and sets.owner_id = auth.uid()
        and sets.is_default = false
    )
  );

-- 일반 유저: 자신의 개인 세트에 속한 단어 수정
create policy "user_update_own_words"
  on words for update
  to authenticated
  using (
    exists (
      select 1 from sets
      where sets.id = set_id
        and sets.owner_id = auth.uid()
        and sets.is_default = false
    )
  )
  with check (
    exists (
      select 1 from sets
      where sets.id = set_id
        and sets.owner_id = auth.uid()
        and sets.is_default = false
    )
  );

-- 일반 유저: 자신의 개인 세트에 속한 단어 삭제
create policy "user_delete_own_words"
  on words for delete
  to authenticated
  using (
    exists (
      select 1 from sets
      where sets.id = set_id
        and sets.owner_id = auth.uid()
        and sets.is_default = false
    )
  );
