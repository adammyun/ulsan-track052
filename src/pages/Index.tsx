import { useEffect, useMemo, useRef, useState } from "react";

type Concept = "track" | "gatgil" | "saetgil" | "jireum";
type PickConcept = Exclude<Concept, "track">;

const CONCEPT_LABEL: Record<Concept, string> = {
  track: "Track : 052",
  gatgil: "갓길",
  saetgil: "샛길",
  jireum: "지름길",
};
const CONCEPT_DESC: Record<Concept, string> = {
  track: "ULSAN HIDDEN TRACK — 오늘의 길을 골라보세요",
  gatgil: "GATGIL — 잠시 쉬어가는 길",
  saetgil: "SAETGIL — 아무도 모르는 예쁜 길",
  jireum: "JIREUM — 현지인만 아는 빠른 길",
};

// 순환 순서: 선택한 요소 기준으로 [left, center(selected), right]
const CYCLE: Concept[] = ["track", "gatgil", "saetgil", "jireum"];
const PICK_CYCLE: PickConcept[] = ["gatgil", "saetgil", "jireum"];
const cycleAround = (c: Concept) => {
  const i = CYCLE.indexOf(c);
  const n = CYCLE.length;
  return {
    left: CYCLE[(i + n - 1) % n],
    center: c,
    right: CYCLE[(i + 1) % n],
  };
};
const cycleAroundPick = (c: PickConcept) => {
  const i = PICK_CYCLE.indexOf(c);
  const n = PICK_CYCLE.length;
  return {
    left: PICK_CYCLE[(i + n - 1) % n],
    center: c,
    right: PICK_CYCLE[(i + 1) % n],
  };
};

const PICKS: Record<PickConcept, {
  img: string; type: string; title: string[]; loc: string; essay: string[]; badges: string[];
  density: number; safety: number;
}> = {
  gatgil: {
    img: "pick-seonam", type: "갓길 — 잠시 쉬어가는 길",
    title: ["선암호수 벤치,", "아무것도 안 해도 되는 곳"], loc: "울산 남구 선암동 · 선암호수공원",
    essay: ["호수 옆 벤치에 앉으면 시간이 다르게 흐른다.", "오리들이 물 위를 지나가고, 바람이 불어오고,", "아무것도 하지 않아도 괜찮다는 기분이", "조용히 찾아오는 울산의 갓길."],
    badges: ["도보 30분", "쉬움", "연중 추천", "반려동물 가능"],
    density: 3, safety: 4,
  },
  saetgil: {
    img: "pick-seongnam", type: "샛길 — 아무도 모르는 예쁜 길",
    title: ["성남동 뒷골목,", "유명하지 않아서 더 좋은"], loc: "울산 중구 성남동 · 번영로 뒷편",
    essay: ["번화가 뒤편으로 한 블록만 들어가면", "오래된 담벼락에 꽃이 피어있다.", "관광 안내도에는 없는 그 골목이", "이 도시에서 가장 예쁜 샛길이다."],
    badges: ["도보 15분", "쉬움", "봄·가을", "사진 명소"],
    density: 2, safety: 3,
  },
  jireum: {
    img: "pick-hakseong", type: "지름길 — 현지인만 아는 빠른 길",
    title: ["학성공원 뒷길,", "30분을 아끼는 현지인 루트"], loc: "울산 중구 학성동 · 학성공원 북쪽 사면",
    essay: ["정식 등산로를 따라가면 돌아가는 길,", "공원 북쪽 담장을 따라 걸으면", "30분이 절약된다. 게다가 중간에 나오는", "전망 포인트는 정식 코스에는 없다."],
    badges: ["도보 25분", "보통", "아침 추천", "뷰포인트"],
    density: 4, safety: 3,
  },
};

type ArchItem = { img: string; type: string; name: string; meta: string; tags: string; extra?: boolean; density: number; safety: number };
const NAMGU: ArchItem[] = [
  { img: "arch-samsan-alley", type: "샛길", name: "삼산동 주택가 골목", meta: "남구 · 20분 · 쉬움", tags: "namgu", density: 3, safety: 3 },
  { img: "arch-jangseongpo", type: "갓길", name: "장생포 고래문화마을", meta: "남구 · 40분 · 쉬움", tags: "namgu", density: 4, safety: 4 },
  { img: "arch-seonam-shortcut", type: "지름길", name: "선암호수공원 숏컷", meta: "남구 · 25분 · 쉬움", tags: "namgu", density: 3, safety: 4 },
  { img: "arch-sinjeong-mural", type: "샛길", name: "신정동 벽화 골목", meta: "남구 · 25분 · 쉬움", tags: "namgu", extra: true, density: 2, safety: 3 },
  { img: "arch-namgu-riverside", type: "갓길", name: "남구 강변 둘레길", meta: "남구 · 50분 · 쉬움", tags: "namgu", extra: true, density: 4, safety: 4 },
  { img: "arch-sinjeong-market", type: "지름길", name: "신정 시장 뒷길", meta: "남구 · 15분 · 쉬움", tags: "namgu", extra: true, density: 5, safety: 3 },
];
const JUNGGU: ArchItem[] = [
  { img: "arch-taehwa-reeds", type: "갓길", name: "태화강 둔치 억새밭", meta: "중구 · 20분 · 쉬움", tags: "junggu", density: 5, safety: 5 },
  { img: "arch-seongnam-flower", type: "샛길", name: "성남동 꽃담 골목", meta: "중구 · 15분 · 쉬움", tags: "junggu", density: 2, safety: 3 },
  { img: "arch-hakseong-trail", type: "지름길", name: "학성공원 우회 산책로", meta: "중구 · 30분 · 보통", tags: "junggu", density: 3, safety: 3 },
  { img: "arch-jungang-market", type: "샛길", name: "중앙시장 뒷골목", meta: "중구 · 20분 · 쉬움", tags: "junggu", extra: true, density: 4, safety: 2 },
  { img: "arch-taehwa-bridge", type: "갓길", name: "태화교 다리 산책길", meta: "중구 · 30분 · 쉬움", tags: "junggu", extra: true, density: 4, safety: 4 },
  { img: "arch-hakseong-ridge", type: "지름길", name: "학성 능선 지름길", meta: "중구 · 20분 · 보통", tags: "junggu", extra: true, density: 2, safety: 2 },
];

// 무드보드 — 낮/밤 별도 이미지. 밤은 같은 장소의 또다른 자연 야경.
const MOOD: { day: string; night: string; label: string; ratio: string }[] = [
  { day: "mood-taehwa-autumn",     night: "mood-taehwa-autumn-night",     label: "태화강 억새밭, 가을",  ratio: "aspect-[4/3]" },
  { day: "mood-seongnam-spring",   night: "mood-seongnam-spring-night",   label: "성남동 골목, 봄 오후", ratio: "aspect-[3/4]" },
  { day: "mood-seonam-dawn",       night: "mood-seonam-dawn-night",       label: "선암호수, 여름 새벽",  ratio: "aspect-square" },
  { day: "mood-jangseongpo-night", night: "mood-jangseongpo-night",       label: "장생포 야경",         ratio: "aspect-[3/4]" },
  { day: "mood-hakseong-winter",   night: "mood-hakseong-winter-night",   label: "학성공원, 겨울 아침", ratio: "aspect-[4/3]" },
  { day: "mood-samsan-evening",    night: "mood-samsan-evening-night",    label: "삼산동 주택가, 저녁", ratio: "aspect-square" },
];

// 가이드 — 4페이지의 챕터식 페이지 넘김
const GUIDE_INTRO = {
  title: "인생이라는 큰 길에서 잠시 벗어나",
  subtitle: "쉬어갈 수 있는 작은 길들을 소개합니다",
  body:
    "Track 052는 울산이라는 도시의 옆길과 뒷길, 그리고 지름길을 천천히 걷고 기록하는 작은 아카이브입니다. " +
    "정해진 목적지 대신, 길 그 자체가 목적인 산책. 오늘의 마음에 어울리는 길을 골라 잠시 천천히 걸어보세요.",
};
const GUIDE = [
  {
    n: "01", t: "길의 종류를 골라요",
    d: "쉬고 싶은 날엔 갓길, 새로운 것을 발견하고 싶은 날엔 샛길, 효율적으로 움직이고 싶은 날엔 지름길. 오늘의 기분이 길을 결정합니다.",
    extra: "세 갈래의 길은 모두 같은 도시 안에 있습니다. 다만 어떤 길을 고르느냐에 따라 도시가 보여주는 표정이 달라질 뿐. 매일 다른 길을 골라보는 것만으로도 익숙한 동네가 새롭게 보이기 시작해요.",
  },
  {
    n: "02", t: "낮과 밤을 다르게 봐요",
    d: "태화강 둔치는 낮에는 억새밭이, 밤에는 십리대숲 불빛이 전혀 다른 표정을 만듭니다. 같은 길도 시간이 달라지면 새로운 곳이 돼요.",
    extra: "오른쪽 위의 낮/밤 토글을 눌러보세요. 한 장의 사진이 천천히 다른 시간대로 바뀌며, 길이 가진 또 다른 얼굴을 보여줍니다. 같은 자리에서, 다른 시간을.",
  },
  {
    n: "03", t: "목적지를 버려요",
    d: "Track 052가 소개하는 길에는 출발지와 방향만 있습니다. 어디까지 가야 한다는 부담 없이, 마음이 멈추는 곳에서 멈추세요.",
    extra: "산책의 본질은 ‘도착’이 아니라 ‘걷는 동안’에 있습니다. 중간에 마음에 드는 벤치가 있다면 앉으세요. 골목이 예쁘면 잠시 사진도 찍어요. 길을 잃어도 괜찮은 코스만 골라 두었습니다.",
  },
  {
    n: "04", t: "기록을 남겨요",
    d: "오늘 발견한 작은 것들을 사진으로 남겨주세요. #Track052 태그와 함께라면 당신의 길이 다른 누군가의 오늘 코스가 됩니다.",
    extra: "이 사이트의 무드보드는 모두 독자분들이 #Track052 로 공유해주신 길에서 시작되었어요. 거창한 풍경이 아니어도 좋습니다. 오늘의 그 길, 오늘의 그 빛을 기록해 주세요.",
  },
];

// ── 이미지 컴포넌트 ───────────────────────────────────────────────
function DayNightImg({ base, alt, isNight, className = "" }: { base: string; alt: string; isNight: boolean; className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <img src={`/images/${base}-day.jpg`} alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isNight ? "opacity-0" : "opacity-100"}`} loading="lazy" />
      <img src={`/images/${base}-night.jpg`} alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isNight ? "opacity-100" : "opacity-0"}`} loading="lazy" />
    </div>
  );
}

// 아카이브 카드: -night.jpg 가 있으면 크로스페이드, 없으면 day만
function ArchImg({ base, alt, isNight }: { base: string; alt: string; isNight: boolean }) {
  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <img src={`/images/${base}.jpg`} alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${isNight ? "opacity-0" : "opacity-100"}`} loading="lazy" />
      <img src={`/images/${base}-night.jpg`} alt={alt}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${isNight ? "opacity-100" : "opacity-0"}`} loading="lazy" />
    </div>
  );
}

function MoodImg({ day, night, alt, isNight }: { day: string; night: string; alt: string; isNight: boolean }) {
  return (
    <>
      <img src={`/images/${day}.jpg`} alt={alt}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = `/images/${night}.jpg`; }}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${isNight ? "opacity-0" : "opacity-100"}`} loading="lazy" />
      <img src={`/images/${night}.jpg`} alt={alt}
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = `/images/${day}.jpg`; }}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-1000 group-hover:scale-105 ${isNight ? "opacity-100" : "opacity-0"}`} loading="lazy" />
    </>
  );
}

// 5점 도트 인디케이터 — 낮: 인구 밀집도 / 밤: 혼자 다닐 때 안전도
function Dots({ value, label, tone = "ink", size = "sm" }: { value: number; label: string; tone?: "ink" | "light"; size?: "sm" | "xs" }) {
  const v = Math.max(0, Math.min(5, value));
  const dot = size === "xs" ? "w-1.5 h-1.5" : "w-2 h-2";
  const filled = "bg-accent-c border-[hsl(var(--accent))]";
  const empty = tone === "light"
    ? "bg-transparent border-white/30"
    : "bg-transparent border-[hsl(var(--ink-faint))]";
  const labelColor = tone === "light" ? "text-white/55" : "text-ink-light";
  return (
    <div className="inline-flex items-center gap-2" aria-label={`${label} ${v} / 5`}>
      <span className={`text-[9px] tracking-[0.2em] ${labelColor} uppercase`}>{label}</span>
      <span className="inline-flex items-center gap-1">
        {[0,1,2,3,4].map((i) => (
          <span key={i} className={`${dot} rounded-full border transition-colors ${i < v ? filled : empty}`} />
        ))}
      </span>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────────────
export default function Index() {
  const [intro, setIntro] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [concept, setConcept] = useState<Concept>("track");
  const [trackPick, setTrackPick] = useState<PickConcept>(() => {
    const arr: PickConcept[] = ["gatgil", "saetgil", "jireum"];
    return arr[Math.floor(Math.random() * arr.length)];
  });
  const [filter, setFilter] = useState<"all" | "namgu" | "junggu">("all");
  const [moreNamgu, setMoreNamgu] = useState(false);
  const [moreJunggu, setMoreJunggu] = useState(false);
  const [guidePage, setGuidePage] = useState(0); // 0 = intro, 1..4 = chapters
  const [guideTick, setGuideTick] = useState(0); // 진행바 리셋용 키
  const [slotDir, setSlotDir] = useState<"r" | "l">("r"); // 텍스트 슬롯 슬라이드 방향
  const [slotKey, setSlotKey] = useState(0); // 같은 컨셉 재선택 시에도 재실행
  const prevConceptRef = useRef<Concept>(concept);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // 컨셉/픽 변경 시 슬라이드 방향 결정
  useEffect(() => {
    const prev = prevConceptRef.current;
    if (prev !== concept) {
      const pi = CYCLE.indexOf(prev);
      const ci = CYCLE.indexOf(concept);
      const forward = (ci - pi + CYCLE.length) % CYCLE.length <= CYCLE.length / 2;
      setSlotDir(forward ? "r" : "l");
      prevConceptRef.current = concept;
    }
    setSlotKey((k) => k + 1);
  }, [concept, trackPick]);

  useEffect(() => {
    const t = setTimeout(() => setIntro(false), 2400);
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener("scroll", onScroll); };
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("night", isNight);
    document.documentElement.classList.toggle("day", !isNight);
  }, [isNight]);

  // 가이드 자동 페이지 넘김 — 8초마다, 마지막 → 처음 순환
  useEffect(() => {
    const t = setInterval(() => setGuidePage((p) => (p + 1) % 5), 8000);
    return () => clearInterval(t);
  }, []);

  // 진행바 리셋 — 페이지가 바뀔 때마다 애니메이션 키 갱신
  useEffect(() => { setGuideTick((k) => k + 1); }, [guidePage]);

  useEffect(() => {
    observerRef.current?.disconnect();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    observerRef.current = io;
    return () => io.disconnect();
  }, [concept, filter, moreNamgu, moreJunggu, guidePage, intro]);

  // Track 선택 시엔 랜덤 픽, 그 외엔 해당 컨셉
  const pickConcept: PickConcept = concept === "track" ? trackPick : concept;
  const pick = PICKS[pickConcept];
  const namguList = moreNamgu ? NAMGU : NAMGU.filter((i) => !i.extra);
  const jungguList = moreJunggu ? JUNGGU : JUNGGU.filter((i) => !i.extra);
  const showNamgu = filter !== "junggu";
  const showJunggu = filter !== "namgu";
  const displayConcept = concept === "track" ? trackPick : concept;
  const cycle = useMemo(() => cycleAroundPick(displayConcept), [displayConcept]);
  const setHeroConcept = (next: PickConcept) => {
    setConcept(next);
    setTrackPick(next);
  };

  return (
    <main className="bg-paper text-ink min-h-screen">
      {/* Intro */}
      <div className={`fixed inset-0 z-[9000] bg-paper flex flex-col items-center justify-center gap-5 transition-opacity duration-700 ${intro ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <p className="text-[11px] tracking-[0.4em] text-ink-light animate-fade-up">TRACK : 052</p>
        <div className="w-11 h-px bg-[hsl(var(--ink-faint))] overflow-hidden">
          <div className="h-full bg-accent-c" style={{ animation: "loadbar 2.2s ease forwards" }} />
        </div>
        <p className="font-serif-kr italic text-[13px] text-ink-light animate-fade-up">울산의 길을 기록합니다</p>
      </div>

      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between transition-all duration-300 ${scrolled ? "py-3 px-6 md:px-14 bg-paper/95 backdrop-blur-md border-b border-faint" : "py-5 px-6 md:px-14"}`}>
        <a href="#" className={`text-[11px] tracking-[0.3em] transition-colors ${scrolled ? "text-ink-light" : "text-white/60"}`}>TRACK : 052</a>
        <ul className="hidden md:flex gap-8 list-none">
          {[["#pick", "에디터 픽"], ["#archive", "아카이브"], ["#guide", "가이드"], ["#moodboard", "포토"]].map(([h, l]) => (
            <li key={h}><a href={h} className={`text-[10px] tracking-[0.16em] transition-colors hover:text-accent-c ${scrolled ? "text-ink-light" : "text-white/55"}`}>{l}</a></li>
          ))}
        </ul>
        <button onClick={() => setIsNight((v) => !v)}
          className={`flex items-center gap-1.5 text-[9px] tracking-[0.14em] px-3 py-1.5 rounded-full border transition-all ${scrolled ? "border-[hsl(var(--accent))] text-accent-c" : "border-white/30 text-white/60"}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          {isNight ? "밤" : "낮"}
        </button>
      </nav>

      {/* Hero — 자연 친화 배경 + 낮/밤 크로스페이드 + 별 효과 */}
      <section id="hero" className="relative min-h-screen grain flex flex-col items-center justify-center px-6 text-center overflow-hidden bg-black">
        {/* 자연 배경 (낮/밤) */}
        <img src="/images/hero-nature-day.jpg" alt=""
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/pick-taehwa-day.jpg"; }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ${isNight ? "opacity-0" : "opacity-100"}`} />
        <img src="/images/hero-nature-night.jpg" alt=""
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/pick-taehwa-night.jpg"; }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1400ms] ${isNight ? "opacity-100" : "opacity-0"}`} />
        {/* 더 어둡게 깔리는 그라디언트 — 텍스트 가독성 강화, 자연 분위기 유지 */}
        <div className="absolute inset-0 transition-colors duration-1000"
          style={{ background: isNight
            ? "linear-gradient(180deg, rgba(3,5,12,0.78) 0%, rgba(3,5,12,0.6) 45%, rgba(3,5,12,0.88) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.78) 100%)" }} />
        {/* 중앙 비네트 — 텍스트 뒤를 한번 더 가라앉힘 */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 65%)" }} />

        {/* 별 (밤에만) */}
        <svg className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${isNight ? "opacity-100" : "opacity-0"}`} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <g fill="#fff">
            {[[110,72,.8,.55],[290,130,1,.75],[460,55,.6,.5],[620,105,.9,.65],[780,40,.7,.55],[920,125,1.1,.85],[1060,65,.8,.6],[540,165,.9,.55],[690,225,.8,.55],[200,260,.7,.5],[1200,220,.9,.7],[1340,90,.6,.45],[850,260,.7,.5]].map((s,i)=>(
              <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} opacity={s[3] as number}>
                <animate attributeName="opacity" values={`${(s[3] as number)*0.4};${s[3]};${(s[3] as number)*0.4}`} dur={`${2+i*0.3}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        </svg>

        {/* 대괄호 위치 고정 — 좌우 요소 클릭으로 갓길/샛길/지름길 전환 */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-6xl animate-fade-up">
          <div className="flex items-center justify-center gap-3 md:gap-6 lg:gap-8 w-full">
            <button
              key={`left-${slotKey}-${cycle.left}`}
              onClick={() => setHeroConcept(cycle.left)}
              aria-label={`${CONCEPT_LABEL[cycle.left]}로 전환`}
              className={`hidden md:flex w-[clamp(6rem,18vw,14rem)] items-center justify-end whitespace-nowrap font-serif-kr text-2xl lg:text-4xl leading-[1.2] text-white/35 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:text-white/80 ${slotDir === "r" ? "animate-slide-in-l" : "animate-slide-in-r"}`}
            >
              {CONCEPT_LABEL[cycle.left]}
            </button>

            <button
              onClick={() => {
                const idx = PICK_CYCLE.indexOf(displayConcept);
                setHeroConcept(PICK_CYCLE[(idx + 1) % PICK_CYCLE.length]);
              }}
              aria-label={`${CONCEPT_LABEL[cycle.center]} 선택됨. 다음 길로 전환`}
              className="group inline-flex items-center justify-center gap-2 md:gap-4 lg:gap-5 shrink-0"
            >
              <span className="font-display text-6xl md:text-8xl lg:text-9xl text-white/90 leading-none -tracking-[0.02em] select-none shrink-0">[</span>

              <div
                className="relative flex items-center justify-center overflow-hidden align-middle shrink-0"
                style={{ width: "clamp(13rem, 40vw, 28rem)", height: "clamp(5.25rem, 10vw, 8.5rem)" }}
              >
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                  <div
                    key={`center-${slotKey}-${cycle.center}`}
                    className={`inline-flex items-center justify-center whitespace-nowrap px-2 md:px-3 py-[0.14em] font-serif-kr text-accent-c leading-[1.08] text-[2.35rem] md:text-[3.9rem] lg:text-[5rem] will-change-transform ${slotDir === "r" ? "animate-slide-in-r" : "animate-slide-in-l"}`}
                  >
                    {CONCEPT_LABEL[cycle.center]}
                  </div>
                </div>
              </div>

              <span className="font-display text-6xl md:text-8xl lg:text-9xl text-white/90 leading-none -tracking-[0.02em] select-none shrink-0">]</span>
            </button>

            <button
              key={`right-${slotKey}-${cycle.right}`}
              onClick={() => setHeroConcept(cycle.right)}
              aria-label={`${CONCEPT_LABEL[cycle.right]}로 전환`}
              className={`hidden md:flex w-[clamp(6rem,18vw,14rem)] items-center justify-start whitespace-nowrap font-serif-kr text-2xl lg:text-4xl leading-[1.2] text-white/35 transition-colors hover:text-white/70 focus-visible:outline-none focus-visible:text-white/80 ${slotDir === "r" ? "animate-slide-in-r" : "animate-slide-in-l"}`}
            >
              {CONCEPT_LABEL[cycle.right]}
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-8 animate-fade-up">
          <p className="text-[9px] tracking-[0.32em] text-accent-c mb-2.5">ULSAN HIDDEN TRACK</p>
          <p className="font-serif-kr italic text-sm md:text-base text-white/60 tracking-wide">울산의 길목에서, 오늘의 길을 찾습니다</p>
        </div>
        <div className="relative z-10 mt-5 min-h-[22px] animate-fade-up">
          <span className="text-[9px] tracking-[0.22em] text-white/55 px-3.5 py-1 border border-white/15 rounded-full backdrop-blur-sm">
            {CONCEPT_DESC[concept]}
          </span>
        </div>
        <div className="absolute bottom-11 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-10 animate-fade-up">
          <div className="w-px h-9 bg-white/25 relative overflow-hidden">
            <span className="absolute -top-full left-0 w-full h-full bg-accent-c" style={{ animation: "drop-line 2s 1.8s infinite ease" }} />
          </div>
          <p className="text-[8px] tracking-[0.3em] text-white/40">SCROLL</p>
        </div>
      </section>

      {/* Editor's Pick */}
      <section id="pick" className="px-6 md:px-14 py-24 bg-paper transition-colors duration-700">
        <div className="flex items-baseline justify-between mb-12">
          <p className="reveal text-[9px] tracking-[0.3em] text-ink-light flex items-center gap-3.5">
            EDITOR'S PICK<span className="block w-7 h-px bg-accent-c" />
          </p>
          <span className="text-[9px] tracking-[0.18em] text-accent-c bg-accent-soft px-3 py-1 rounded-full transition-all">
            {concept === "track" ? `Track : 052 · ${CONCEPT_LABEL[pickConcept]}` : CONCEPT_LABEL[concept]}
          </span>
        </div>
        <div key={pickConcept} className="grid md:grid-cols-[1.25fr_1fr] gap-10 md:gap-14 items-start animate-fade-up">
          <div className="reveal group relative aspect-[4/3] overflow-hidden rounded-sm bg-[hsl(var(--ink-faint))]">
            <DayNightImg base={pick.img} alt={pick.title.join(" ")} isNight={isNight} className="transition-transform duration-700 group-hover:scale-[1.04]" />
          </div>
          <div className="reveal" style={{ transitionDelay: "120ms" }}>
            <p className="text-[9px] tracking-[0.2em] text-accent-c mb-3.5">{pick.type}</p>
            <h2 className="font-serif-kr text-2xl md:text-[28px] leading-[1.35] mb-2 text-ink">
              {pick.title.map((t, i) => <span key={i}>{t}<br/></span>)}
            </h2>
            <p className="text-[11px] text-ink-light tracking-wider mb-4">{pick.loc}</p>
            <div className="mb-6 pb-6 border-b border-faint">
              <Dots
                value={isNight ? pick.safety : pick.density}
                label={isNight ? "밤길 안전도" : "인구 밀집도"}
              />
            </div>
            <p className="font-serif-kr italic text-sm text-ink-mid leading-[2.1] mb-7">
              {pick.essay.map((l, i) => <span key={i}>{l}<br/></span>)}
            </p>
            <div className="flex flex-wrap gap-1.5 mb-7">
              {pick.badges.map((b) => (
                <span key={b} className="text-[9px] px-2.5 py-1 border border-faint text-ink-mid tracking-wide rounded-full hover:border-[hsl(var(--accent))] hover:text-accent-c transition-colors cursor-default">{b}</span>
              ))}
            </div>
            <a href="#" className="text-[10px] tracking-[0.18em] text-ink border-b border-current pb-0.5 hover:text-accent-c transition-colors">지도에서 보기</a>
          </div>
        </div>
      </section>

      {/* Archive */}
      <section id="archive" className="px-6 md:px-14 py-24 bg-card-bg transition-colors duration-700">
        <p className="reveal text-[9px] tracking-[0.3em] text-ink-light flex items-center gap-3.5 mb-6">
          ARCHIVE<span className="block w-7 h-px bg-accent-c" />
        </p>
        <div className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-9">
          <div>
            <h2 className="font-serif-kr text-4xl md:text-5xl text-ink leading-tight">울산의 길목들</h2>
            <p className="text-[12px] text-ink-light mt-2">남구 · 중구를 중심으로 기록한 길</p>
          </div>
          <div className="flex flex-wrap gap-1.5 md:justify-end">
            {([["all","전체"],["namgu","남구"],["junggu","중구"]] as const).map(([k,l])=>(
              <button key={k} onClick={()=>setFilter(k as any)}
                className={`text-[9px] tracking-wide px-3 py-1.5 rounded-full border transition-all ${filter===k?"border-[hsl(var(--accent))] text-accent-c bg-accent-soft":"border-faint text-ink-light hover:border-[hsl(var(--accent))] hover:text-accent-c"}`}>{l}</button>
            ))}
            {["동구","울주군"].map((l)=>(
              <span key={l} className="text-[9px] tracking-wide px-3 py-1.5 rounded-full border border-faint text-ink-light opacity-30 cursor-not-allowed">{l}</span>
            ))}
          </div>
        </div>

        {showNamgu && (
          <>
            <div className="reveal flex items-center gap-3.5 mt-11 mb-5">
              <span className="text-[10px] tracking-[0.2em] text-ink-light">남구</span>
              <div className="flex-1 h-px bg-[hsl(var(--ink-faint))]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 md:gap-8">
              {namguList.map((it, i) => (
                <article key={it.img} className="reveal group cursor-pointer" style={{ transitionDelay: `${(i%3)*100}ms` }}>
                  <div className="relative aspect-[4/5] overflow-hidden mb-4 rounded-sm bg-[hsl(var(--ink-faint))]">
                    <ArchImg base={it.img} alt={it.name} isNight={isNight} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-serif-kr italic text-sm text-white">자세히 보기</span>
                    </div>
                    <span className="absolute top-3 left-3 text-[10px] tracking-[0.22em] px-2.5 py-1 rounded-full bg-paper/90 text-accent-c backdrop-blur-sm">
                      {it.type}
                    </span>
                  </div>
                  <p className="font-serif-kr text-[20px] md:text-[22px] leading-tight text-ink mb-1.5">{it.name}</p>
                  <p className="text-[11px] text-ink-light tracking-wide mb-3">{it.meta}</p>
                  <Dots value={isNight ? it.safety : it.density} label={isNight ? "안전도" : "밀집도"} />
                </article>
              ))}
            </div>
            <div className="mt-7 flex items-center gap-3.5">
              <button onClick={()=>setMoreNamgu(v=>!v)} className="text-[9px] tracking-[0.2em] px-5 py-2 border border-faint rounded-full text-ink-light hover:border-[hsl(var(--accent))] hover:text-accent-c transition-colors">
                {moreNamgu ? "접기" : "더보기"}
              </button>
              <span className="text-[10px] text-ink-light">{moreNamgu ? "전체 6곳을 보고 있어요" : "+ 3곳 더 있어요"}</span>
            </div>
          </>
        )}

        {showJunggu && (
          <>
            <div className="reveal flex items-center gap-3.5 mt-14 mb-5">
              <span className="text-[10px] tracking-[0.2em] text-ink-light">중구</span>
              <div className="flex-1 h-px bg-[hsl(var(--ink-faint))]" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-7 md:gap-8">
              {jungguList.map((it, i) => (
                <article key={it.img} className="reveal group cursor-pointer" style={{ transitionDelay: `${(i%3)*100}ms` }}>
                  <div className="relative aspect-[4/5] overflow-hidden mb-4 rounded-sm bg-[hsl(var(--ink-faint))]">
                    <ArchImg base={it.img} alt={it.name} isNight={isNight} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-serif-kr italic text-sm text-white">자세히 보기</span>
                    </div>
                    <span className="absolute top-3 left-3 text-[10px] tracking-[0.22em] px-2.5 py-1 rounded-full bg-paper/90 text-accent-c backdrop-blur-sm">
                      {it.type}
                    </span>
                  </div>
                  <p className="font-serif-kr text-[20px] md:text-[22px] leading-tight text-ink mb-1.5">{it.name}</p>
                  <p className="text-[11px] text-ink-light tracking-wide mb-3">{it.meta}</p>
                  <Dots value={isNight ? it.safety : it.density} label={isNight ? "안전도" : "밀집도"} />
                </article>
              ))}
            </div>
            <div className="mt-7 flex items-center gap-3.5">
              <button onClick={()=>setMoreJunggu(v=>!v)} className="text-[9px] tracking-[0.2em] px-5 py-2 border border-faint rounded-full text-ink-light hover:border-[hsl(var(--accent))] hover:text-accent-c transition-colors">
                {moreJunggu ? "접기" : "더보기"}
              </button>
              <span className="text-[10px] text-ink-light">{moreJunggu ? "전체 6곳을 보고 있어요" : "+ 3곳 더 있어요"}</span>
            </div>
          </>
        )}

        <div className="reveal flex items-center gap-3.5 mt-14 mb-5">
          <span className="text-[10px] tracking-[0.2em] text-ink-light">동구 · 울주군</span>
          <span className="text-[9px] tracking-wide text-ink-light bg-[hsl(var(--ink-faint))] px-2.5 py-0.5 rounded-full opacity-60">COMING SOON</span>
          <div className="flex-1 h-px bg-[hsl(var(--ink-faint))]" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {["동구","북구","울주군"].map((r,i)=>(
            <div key={r} className="reveal border border-dashed border-faint rounded-sm p-11 flex flex-col items-center justify-center gap-2 text-center" style={{ transitionDelay: `${i*100}ms` }}>
              <p className="text-[9px] tracking-[0.2em] text-ink-light opacity-50">COMING SOON</p>
              <p className="font-serif-kr text-lg text-ink-light opacity-40">{r}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Guide — 페이지 넘김 */}
      <section id="guide" className="px-6 md:px-14 py-20 bg-guide transition-colors duration-700">
        <div className="flex items-center justify-between mb-6">
          <p className="reveal text-[9px] tracking-[0.3em] text-white/30 flex items-center gap-3.5">
            WALKING GUIDE<span className="block w-7 h-px bg-accent-c" />
          </p>
          <span className="text-[9px] tracking-[0.2em] text-white/40 tabular-nums">
            {String(guidePage + 1).padStart(2, "0")} / 05
          </span>
        </div>

        <div className="relative">
          <article key={`g-${guidePage}`} className="animate-fade-up">
            {guidePage === 0 ? (
              <div className="grid md:grid-cols-[1fr_1.1fr] gap-8 md:gap-14 items-center">
                <div>
                  <p className="font-display italic text-accent-c text-2xl md:text-4xl mb-5 opacity-80">— Prologue</p>
                  <h2 className="font-serif-kr text-3xl md:text-5xl lg:text-[54px] leading-[1.3] text-white/90 mb-2">
                    {GUIDE_INTRO.title}<br/>
                    <span className="text-accent-c">{GUIDE_INTRO.subtitle}</span>
                  </h2>
                </div>
                <div>
                  <p className="font-serif-kr italic text-lg md:text-xl leading-[1.95] text-white/65">
                    {GUIDE_INTRO.body}
                  </p>
                  <div className="mt-6 flex items-center gap-3 text-[10px] tracking-[0.2em] text-white/35">
                    <span className="block w-7 h-px bg-accent-c" />
                    TRACK : 052 · ULSAN
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-[0.85fr_1.6fr] gap-8 md:gap-14 items-center">
                <div>
                  <div className="font-display text-7xl md:text-[140px] text-accent-c opacity-30 leading-none mb-4">
                    {GUIDE[guidePage - 1].n}
                  </div>
                  <h3 className="font-serif-kr text-3xl md:text-[40px] leading-[1.3] text-white/90">
                    {GUIDE[guidePage - 1].t}
                  </h3>
                </div>
                <div className="space-y-5">
                  <p className="font-serif-kr text-lg md:text-2xl leading-[1.85] text-white/75">
                    {GUIDE[guidePage - 1].d}
                  </p>
                  <p className="text-sm md:text-[15px] leading-[1.95] text-white/45 border-l border-white/15 pl-5">
                    {GUIDE[guidePage - 1].extra}
                  </p>
                </div>
              </div>
            )}
          </article>
        </div>

        {/* 자동 전환 타이머 바 */}
        <div className="mt-10 h-px bg-white/[0.07] overflow-hidden">
          <div
            key={guideTick}
            className="h-full bg-accent-c"
            style={{ animation: "loadbar 8s linear forwards" }}
          />
        </div>

        {/* 페이지 컨트롤 */}
        <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-5">
          <button
            onClick={() => setGuidePage((p) => (p === 0 ? 4 : p - 1))}
            className="text-[10px] tracking-[0.22em] text-white/55 hover:text-accent-c transition-colors"
          >
            ← 이전 장
          </button>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <button
                key={i}
                onClick={() => setGuidePage(i)}
                className={`h-1 rounded-full transition-all ${guidePage === i ? "w-8 bg-accent-c" : "w-4 bg-white/15 hover:bg-white/30"}`}
                aria-label={`Page ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={() => setGuidePage((p) => (p + 1) % 5)}
            className="text-[10px] tracking-[0.22em] text-white/55 hover:text-accent-c transition-colors"
          >
            다음 장 →
          </button>
        </div>
      </section>

      {/* Moodboard */}
      <section id="moodboard" className="px-6 md:px-14 py-24 bg-paper transition-colors duration-700">
        <p className="reveal text-[9px] tracking-[0.3em] text-ink-light flex items-center gap-3.5 mb-6">
          PHOTO MOODBOARD<span className="block w-7 h-px bg-accent-c" />
        </p>
        <h2 className="reveal font-serif-kr text-3xl text-ink mb-2">당신의 길목</h2>
        <p className="reveal text-[11px] text-ink-light tracking-wide mb-11">
          직접 찍은 사진을 <span className="font-serif-kr italic text-[13px] text-accent-c">#Track052</span> 태그와 함께 공유해주세요
        </p>
        <div className="reveal columns-2 md:columns-3 gap-3.5 [column-fill:_balance]">
          {MOOD.map((m, i) => (
            <div key={i} className={`group break-inside-avoid mb-3.5 overflow-hidden relative rounded-sm bg-[hsl(var(--ink-faint))] ${m.ratio}`}>
              <MoodImg day={m.day} night={m.night} alt={m.label} isNight={isNight} />
              <div className="absolute inset-x-0 bottom-0 px-3.5 pt-5 pb-3 bg-gradient-to-t from-black/65 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="font-serif-kr italic text-[11px] text-white">{m.label}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className={`px-6 md:px-14 pt-14 pb-8 transition-colors duration-700 ${isNight ? "bg-[#030407]" : "bg-[#0e0d0b]"}`}>
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-7 pb-10 border-b border-white/[0.07] mb-6">
          <div>
            <p className="text-[10px] tracking-[0.35em] text-white/60 mb-2.5">TRACK : 052</p>
            <p className="text-[11px] text-white/25 leading-[1.9] max-w-[200px]">울산의 숨은 길을 기록합니다.<br/>갓길 · 샛길 · 지름길.</p>
          </div>
          <div className="flex flex-col gap-2.5 md:items-end">
            <p className="text-[9px] tracking-[0.18em] text-white/30">새로운 길이 열릴 때 알려드릴게요</p>
            <form className="flex" onSubmit={(e)=>e.preventDefault()}>
              <input type="email" placeholder="이메일 주소" className="bg-white/5 border border-white/10 border-r-0 px-3.5 py-2.5 text-[11px] text-white/70 outline-none w-52 placeholder:text-white/20" />
              <button className="bg-accent-c text-white text-[9px] tracking-[0.18em] px-4 hover:opacity-80 transition-opacity">구독</button>
            </form>
          </div>
        </div>
        <div className="flex flex-col-reverse md:flex-row md:justify-between md:items-center gap-4">
          <p className="text-[9px] tracking-wider text-white/15">© 2025 TRACK : 052. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-5">
            {["INSTAGRAM","ABOUT","CONTACT"].map((l)=>(
              <a key={l} href="#" className="text-[9px] tracking-wider text-white/25 hover:text-accent-c transition-colors">{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}
