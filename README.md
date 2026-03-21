# VocaBook

일본어 단어 및 문장 학습 앱 (Next.js 15 + Supabase)

## 로컬 개발

1. `.env.local.example` → `.env.local` 복사 후 Supabase 키 입력
2. `npm install`
3. Supabase 대시보드에서 SQL 에디터로 `supabase/migrations/` 파일 순서대로 실행
4. `npm run dev`

## 배포 (Vercel)

1. GitHub에 push
2. vercel.com에서 저장소 연결
3. Environment Variables에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 입력
4. Deploy
