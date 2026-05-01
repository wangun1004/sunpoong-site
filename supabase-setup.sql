-- ============================================================
--  선풍건설산업 Supabase 데이터베이스 초기 설정
--
--  사용법:
--  1. https://supabase.com 에서 프로젝트 생성
--  2. 프로젝트 대시보드 → SQL Editor → New Query
--  3. 아래 SQL 전체를 붙여넣고 실행 (Run)
--  4. js/config.js 에 SUPABASE_URL, SUPABASE_ANON 값 입력
-- ============================================================

-- ── 견적 문의 테이블 ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inquiries (
  id            BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name          TEXT NOT NULL,
  phone         TEXT NOT NULL,
  email         TEXT,
  company       TEXT,
  address       TEXT,
  area          NUMERIC,
  structure     TEXT,
  service_type  TEXT,
  message       TEXT,
  status        TEXT DEFAULT 'pending',   -- pending | reviewing | completed | cancelled
  admin_notes   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 게시판 테이블 ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS board_posts (
  id         BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  author     TEXT DEFAULT '관리자',
  category   TEXT DEFAULT 'notice',       -- notice | project | news | qna
  views      INT DEFAULT 0,
  is_notice  BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security 활성화 ────────────────────────────────
ALTER TABLE inquiries   ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_posts ENABLE ROW LEVEL SECURITY;

-- ── 정책: 견적 문의 ──────────────────────────────────────────
-- 비로그인 사용자: INSERT만 허용 (견적 문의 제출)
CREATE POLICY "anon_insert_inquiries"
  ON inquiries FOR INSERT TO anon
  WITH CHECK (true);

-- 로그인 관리자: 모든 권한
CREATE POLICY "admin_all_inquiries"
  ON inquiries FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── 정책: 게시판 ─────────────────────────────────────────────
-- 비로그인 사용자: 읽기만 허용
CREATE POLICY "anon_read_posts"
  ON board_posts FOR SELECT TO anon
  USING (true);

-- 로그인 관리자: 모든 권한
CREATE POLICY "admin_all_posts"
  ON board_posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── 샘플 게시글 ──────────────────────────────────────────────
INSERT INTO board_posts (title, content, category, is_notice, views) VALUES
(
  '선풍건설산업 홈페이지 오픈 안내',
  '선풍건설산업 공식 홈페이지가 오픈되었습니다. AI 해체계획서 자동 작성, 견적 문의 등 다양한 기능을 이용하실 수 있습니다. 많은 이용 바랍니다.',
  'notice', FALSE, 1
),
(
  '2025년 하절기 현장 안전관리 강화 안내',
  E'폭염 대비 하절기 현장 안전관리를 강화합니다.\n\n• 오전 11시 ~ 오후 2시 옥외 작업 제한\n• 충분한 수분 보충 및 그늘 휴식 의무화\n• 열사병 예방 교육 전 직원 이수 완료\n• 현장 냉방 시설 설치 완료',
  'notice', TRUE, 42
),
(
  '광주 서구 주상복합 해체공사 완료',
  E'연면적 1,200㎡, 지상 5층 철근콘크리트 구조 주상복합 건물 해체공사를 성공적으로 완료하였습니다.\n\n• 공사 기간: 2025.03.15 ~ 2025.04.20\n• 공법: 기계식 + 인력 혼합 해체\n• 특이사항: 인접 주거지역 방진망 3중 설치, 소음 민원 0건 달성',
  'project', FALSE, 87
);

-- ── 시공 프로젝트 테이블 ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  title       TEXT NOT NULL,
  category    TEXT NOT NULL DEFAULT 'rc',  -- rc | steel | interior | cutting | waste
  description TEXT,
  tags        TEXT[] DEFAULT '{}',
  youtube_url TEXT,
  images      TEXT[] DEFAULT '{}',         -- Storage 공개 URL 최대 5개
  status      TEXT DEFAULT 'published',    -- published | draft
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_read_projects"
  ON projects FOR SELECT TO anon
  USING (status = 'published');

CREATE POLICY "admin_all_projects"
  ON projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ── Storage 버킷: project-images ─────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "public_read_project_images"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'project-images');

CREATE POLICY "admin_upload_project_images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-images');

CREATE POLICY "admin_update_project_images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-images');

CREATE POLICY "admin_delete_project_images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-images');

-- ── 관리자 계정 생성 안내 ────────────────────────────────────
-- Supabase 대시보드 → Authentication → Users → Invite user
-- 이메일: admin@sunpoong.co.kr  (원하는 이메일로 변경)
-- 이후 이메일로 받은 링크에서 비밀번호 설정
