# JHZZang12.github.io

Supabase 기반 게시판과 회원가입/로그인이 포함된 GitHub Pages 저장소입니다.

## 배포 구조

- 정적 페이지는 GitHub Pages로 배포됩니다.
- `board/config.js`는 커밋하지 않고, GitHub Actions가 배포 시점에 생성합니다.
- 게시글 저장과 회원가입/로그인은 Supabase가 담당합니다.

## GitHub 설정

1. 저장소 `Settings > Pages`에서 배포 소스를 `GitHub Actions`로 둡니다.
2. 저장소 `Settings > Environments > github-pages`에 아래 시크릿을 추가합니다.
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
3. `main` 브랜치에 푸시하면 `.github/workflows/deploy-pages.yml`이 Pages를 배포합니다.

## Supabase 설정

1. Supabase SQL Editor에서 `supabase/board_posts.sql`을 실행합니다.
2. `Authentication > Providers > Email`이 켜져 있는지 확인합니다.
3. `Authentication > URL Configuration`에서 아래 값을 확인합니다.
   - Site URL: `https://jhzzang12.github.io`
   - Redirect URL: `https://jhzzang12.github.io/board/`

## 로컬 확인

1. `board/config.example.js`를 참고해 `board/config.js`를 직접 만들면 로컬에서도 확인할 수 있습니다.
2. 브라우저에서 `board/index.html`을 열어 회원가입, 로그인, 게시글 등록을 점검합니다.
