-- 기존 write 정책 삭제 (004_admin.sql에서 생성한 모든 유저 대상 정책)
drop policy if exists "authenticated_insert_sets"  on sets;
drop policy if exists "authenticated_update_sets"  on sets;
drop policy if exists "authenticated_delete_sets"  on sets;
drop policy if exists "authenticated_insert_words" on words;
drop policy if exists "authenticated_update_words" on words;
drop policy if exists "authenticated_delete_words" on words;

-- app_metadata에 role = 'admin'인 유저만 sets 수정 가능
create policy "admin_insert_sets"
  on sets for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_update_sets"
  on sets for update
  to authenticated
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_delete_sets"
  on sets for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- app_metadata에 role = 'admin'인 유저만 words 수정 가능
create policy "admin_insert_words"
  on words for insert
  to authenticated
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_update_words"
  on words for update
  to authenticated
  using  ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "admin_delete_words"
  on words for delete
  to authenticated
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
