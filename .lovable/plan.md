## 개요
아카이브 클릭 팝업을 "장소별 상세 페이지"로 고도화하고, GPS 기반 도착 인증 + 디지털 굿즈 보상 플로우를 추가합니다. 데이터는 Lovable Cloud(`paths` 테이블)에 저장하고, 좌표/콘텐츠/굿즈 URL을 동적으로 불러옵니다.

## 1. Lovable Cloud 활성화 & 데이터 모델
백엔드(Supabase)가 아직 연결되어 있지 않으므로 Cloud를 활성화한 뒤 마이그레이션으로 다음 테이블을 만듭니다.

`paths` 테이블
- `id` (text, PK) — 아카이브 아이템과 매칭 (예: 'namgu-01')
- `name` (text)
- `region` (text: 'namgu' | 'junggu' …)
- `type` (text)
- `latitude` (double precision)
- `longitude` (double precision)
- `content_json` (jsonb) — `{ story, route: [{step, text, image}], tidbits: [string] }`
- `goods_url` (text) — 배경화면/스탬프 이미지 URL
- `cover_image` (text)
- `created_at` (timestamptz)

RLS: `select` 공개(익명 허용), 쓰기는 비활성. 초기 시드 데이터로 현재 NAMGU/JUNGGU 9곳을 INSERT (좌표는 울산 남구/중구 대표 좌표 placeholder, 추후 실제 좌표로 교체).

기존 `NAMGU`/`JUNGGU` 배열의 각 항목에 `id` 필드를 추가해 DB row와 연결합니다.

## 2. 상세 페이지 라우팅
모달 대신 전용 라우트로 승격하여 깊이 있는 콘텐츠를 표현합니다.

- 새 라우트: `/archive/:id` → `src/pages/ArchiveDetail.tsx`
- 기존 모달의 `onClick={() => setSelectedArchive(it)}` → `navigate(`/archive/${it.id}`)`로 변경 (기존 모달 코드 제거)
- 페이지에서 `id`로 Supabase `paths` row를 fetch (`@tanstack/react-query` 사용)

상세 페이지 레이아웃 (에디토리얼 톤 유지):
1. Hero: cover image + 장소명 + 좌표 표시
2. 장소 스토리 (`content_json.story`)
3. 상세 동선 (`content_json.route` — 스텝별 텍스트 + 이미지)
4. 여담 / Tidbits (`content_json.tidbits`)
5. **도착 확인 및 굿즈 받기** 섹션 (3·4번 항목)

## 3. GPS 기반 도착 인증
`src/lib/geo.ts`에 Haversine 함수 추가:
```text
haversine(lat1, lon1, lat2, lon2) → meters
```

`src/hooks/useArrival.ts`:
- `navigator.geolocation.watchPosition` 으로 실시간 위치 추적
- 타깃 좌표와의 거리 계산
- 50m 이내 → `arrived: true`
- 상태: `idle | requesting | tracking | arrived | denied | unsupported | insecure`
- `window.isSecureContext === false`면 즉시 `insecure` 반환

UI 상태별 표시:
- 대기: "위치 확인하기" 버튼
- 추적 중·미도달: "아직 길 위에 있나요? 목적지에 도착하면 굿즈가 해금됩니다." + 현재 거리(예: 약 230m 남음)
- 권한 거부/미지원: 안내 메시지
- 비-HTTPS: "GPS 인증은 HTTPS(보안 연결) 환경에서만 동작합니다" 배너

## 4. 디지털 굿즈 보상
- 도착 전: 굿즈 영역 블러 + 자물쇠 아이콘
- 도착(`arrived === true`) 시:
  - `canvas-confetti` 패키지로 컨페티 발사
  - 굿즈 카드 fade+scale-in (Framer Motion)
  - `<a href={goods_url} download>` 다운로드 버튼 활성화
  - 종류: 배경화면 또는 스탬프 (`content_json.goods_type` 으로 구분 가능, 기본 wallpaper)

## 5. 변경/생성 파일
신규
- `src/pages/ArchiveDetail.tsx`
- `src/hooks/useArrival.ts`
- `src/lib/geo.ts`
- `src/components/ArrivalSection.tsx` (도착/굿즈 UI)
- Supabase 마이그레이션 (paths 테이블 + 시드)

수정
- `src/App.tsx` — `/archive/:id` 라우트 추가
- `src/pages/Index.tsx` — `ArchItem`에 `id` 추가, 카드 클릭을 navigate로, 기존 모달 제거

신규 패키지: `canvas-confetti`

## 6. 확인 / QA
- 빌드 통과
- 로컬에서 `/archive/namgu-01` 접근 시 데이터 렌더 확인
- HTTPS preview에서 위치 권한 → 거리 표시 → (테스트 위해 50m 임시 임계값 옵션 가능) 도착 시 컨페티+굿즈 버튼 동작
- HTTP 접근 시 insecure 배너 노출

## 열린 질문
1. 좌표 시드값을 임시 placeholder로 채우고 추후 정확한 좌표를 넣어도 될까요, 아니면 사용자가 좌표 리스트를 제공해 주시겠어요?
2. 굿즈는 우선 기본 wallpaper 1종을 placeholder 이미지로 시드해 두고, 실제 굿즈 이미지는 나중에 교체하는 방식으로 진행해도 될까요?