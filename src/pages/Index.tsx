import { useEffect, useRef, useState } from "react";

type Concept = "default" | "gatgil" | "saetgil" | "jireum";

const CONCEPT_DESC: Record<Concept, string> = {
  default: "갓길 · 샛길 · 지름길 — 원하는 길을 선택하세요",
  gatgil: "GATGIL — 잠시 쉬어가는 길",
  saetgil: "SAETGIL — 아무도 모르는 예쁜 길",
  jireum: "JIREUM — 현지인만 아는 빠른 길",
};
const CONCEPT_TAG: Record<Concept, string> = {
  default: "전체 보기",
  gatgil: "갓길",
  saetgil: "샛길",
  jireum: "지름길",
};

const PICKS = {
  default: {
    img: "pick-taehwa", type: "이번 주 울산의 추천길",
    title: ["태화강 둔치,", "봄볕 속의 산책"], loc: "울산 중구 태화동 · 태화강 국가정원",
    essay: ["계절이 바뀌면 강도 바뀐다.", "봄의 태화강 둔치는 억새 대신 유채꽃이 피어", "노랗게 물드는 계절이다. 아무 생각 없이", "걷기에 이보다 좋은 길은 없다."],
    badges: ["도보 20분", "쉬움", "연중", "반려동물 가능"],
  },
  gatgil: {
    img: "pick-seonam", type: "갓길 — 잠시 쉬어가는 길",
    title: ["선암호수 벤치,", "아무것도 안 해도 되는 곳"], loc: "울산 남구 선암동 · 선암호수공원",
    essay: ["호수 옆 벤치에 앉으면 시간이 다르게 흐른다.", "오리들이 물 위를 지나가고, 바람이 불어오고,", "아무것도 하지 않아도 괜찮다는 기분이", "조용히 찾아오는 울산의 갓길."],
    badges: ["도보 30분", "쉬움", "연중 추천", "반려동물 가능"],
  },
  saetgil: {
    img: "pick-seongnam", type: "샛길 — 아무도 모르는 예쁜 길",
    title: ["성남동 뒷골목,", "유명하지 않아서 더 좋은"], loc: "울산 중구 성남동 · 번영로 뒷편",
    essay: ["번화가 뒤편으로 한 블록만 들어가면", "오래된 담벼락에 꽃이 피어있다.", "관광 안내도에는 없는 그 골목이", "이 도시에서 가장 예쁜 샛길이다."],
    badges: ["도보 15분", "쉬움", "봄·가을", "사진 명소"],
  },
  jireum: {
    img: "pick-hakseong", type: "지름길 — 현지인만 아는 빠른 길",
    title: ["학성공원 뒷길,", "30분을 아끼는 현지인 루트"], loc: "울산 중구 학성동 · 학성공원 북쪽 사면",
    essay: ["정식 등산로를 따라가면 돌아가는 길,", "공원 북쪽 담장을 따라 걸으면", "30분이 절약된다. 게다가 중간에 나오는", "전망 포인트는 정식 코스에는 없다."],
    badges: ["도보 25분", "보통", "아침 추천", "뷰포인트"],
  },
} as const;

type ArchItem = { img: string; type: string; name: string; meta: string; tags: string; extra?: boolean };
const NAMGU: ArchItem[] = [
  { img: "arch-samsan-alley", type: "샛길", name: "삼산동 주택가 골목", meta: "남구 · 20분 · 쉬움", tags: "namgu" },
  { img: "arch-jangseongpo", type: "갓길", name: "장생포 고래문화마을", meta: "남구 · 40분 · 쉬움", tags: "namgu" },
  { img: "arch-seonam-shortcut", type: "지름길", name: "선암호수공원 숏컷", meta: "남구 · 25분 · 쉬움", tags: "namgu" },
  { img: "arch-sinjeong-mural", type: "샛길", name: "신정동 벽화 골목", meta: "남구 · 25분 · 쉬움", tags: "namgu", extra: true },
  { img: "arch-namgu-riverside", type: "갓길", name: "남구 강변 둘레길", meta: "남구 · 50분 · 쉬움", tags: "namgu", extra: true },
  { img: "arch-sinjeong-market", type: "지름길", name: "신정 시장 뒷길", meta: "남구 · 15분 · 쉬움", tags: "namgu", extra: true },
];
const JUNGGU: ArchItem[] = [
  { img: "arch-taehwa-reeds", type: "갓길", name: "태화강 둔치 억새밭", meta: "중구 · 20분 · 쉬움", tags: "junggu" },
  { img: "arch-seongnam-flower", type: "샛길", name: "성남동 꽃담 골목", meta: "중구 · 15분 · 쉬움", tags: "junggu" },
  { img: "arch-hakseong-trail", type: "지름길", name: "학성공원 우회 산책로", meta: "중구 · 30분 · 보통", tags: "junggu" },
  { img: "arch-jungang-market", type: "샛길", name: "중앙시장 뒷골목", meta: "중구 · 20분 · 쉬움", tags: "junggu", extra: true },
  { img: "arch-taehwa-bridge", type: "갓길", name: "태화교 다리 산책길", meta: "중구 · 30분 · 쉬움", tags: "junggu", extra: true },
  { img: "arch-hakseong-ridge", type: "지름길", name: "학성 능선 지름길", meta: "중구 · 20분 · 보통", tags: "junggu", extra: true },
];

// 무드보드: day/night 페어. (mood-* 파일은 미생성이라 pick/arch 이미지로 매핑)
const MOOD: { day: string; night: string; label: string; ratio: string }[] = [
  { day: "arch-taehwa-reeds",     night: "pick-taehwa-night",  label: "태화강 억새밭, 가을",  ratio: "aspect-[4/3]" },
  { day: "arch-seongnam-flower",  night: "pick-seongnam-night", label: "성남동 골목, 봄 오후", ratio: "aspect-[3/4]" },
  { day: "pick-seonam-day",       night: "pick-seonam-night",  label: "선암호수, 여름 새벽",  ratio: "aspect-square" },
  { day: "arch-jangseongpo",      night: "pick-seongnam-night", label: "장생포 야경",         ratio: "aspect-[3/4]" },
  { day: "arch-hakseong-trail",   night: "pick-hakseong-night", label: "학성공원, 겨울 아침", ratio: "aspect-[4/3]" },
  { day: "arch-samsan-alley",     night: "pick-seongnam-night", label: "삼산동 주택가, 저녁", ratio: "aspect-square" },
];

const GUIDE = [
  { n: "01", t: "길의 종류를 골라요", d: "쉬고 싶은 날엔 갓길, 새로운 것을 발견하고 싶은 날엔 샛길, 효율적으로 움직이고 싶은 날엔 지름길. 오늘의 기분이 길을 결정합니다." },
  { n: "02", t: "낮과 밤을 다르게 봐요", d: "태화강 둔치는 낮에는 억새밭이, 밤에는 십리대숲 불빛이 전혀 다른 표정을 만듭니다. 같은 길도 시간이 달라지면 새로운 곳이 돼요." },
  { n: "03", t: "목적지를 버려요", d: "Track 052가 소개하는 길에는 출발지와 방향만 있습니다. 어디까지 가야 한다는 부담 없이, 마음이 멈추는 곳에서 멈추세요." },
  { n: "04", t: "기록을 남겨요", d: "오늘 발견한 작은 것들을 사진으로 남겨주세요. #Track052 태그와 함께라면 당신의 길이 다른 누군가의 오늘 코스가 됩니다." },
];

// Day/Night 이미지 컴포넌트 — 두 이미지를 겹쳐 두고 opacity로 크로스페이드
function DayNightImg({ base, alt, isNight, className = "" }: { base: string; alt: string; isNight: boolean; className?: string }) {
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      <img src={`/images/${base}-day.jpg`} alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isNight ? "opacity-0" : "opacity-100"}`} loading="lazy" />
      <img src={`/images/${base}-night.jpg`} alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isNight ? "opacity-100" : "opacity-0"}`} loading="lazy" />
    </div>
  );
}

// 단일 이미지 (낮/밤 페어가 없는 경우)
function SoloImg({ src, alt }: { src: string; alt: string }) {
  return (
    <img src={`/images/${src}.jpg`} alt={alt}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />
  );
}

// Mood image — day/night 다른 이미지를 크로스페이드
function MoodImg({ day, night, alt, isNight }: { day: string; night: string; alt: string; isNight: boolean }) {
  return (
    <>
      <img src={`/images/${day}.jpg`} alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isNight ? "opacity-0" : "opacity-100"}`} loading="lazy" />
      <img src={`/images/${night}.jpg`} alt={alt}
        className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isNight ? "opacity-100" : "opacity-0"}`} loading="lazy" />
    </>
  );
}

export default function Index() {
  const [intro, setIntro] = useState(true);
  const [scrolled, setScrolled] = useState(false);
  const [isNight, setIsNight] = useState(false);
  const [concept, setConcept] = useState<Concept>("default");
  const [filter, setFilter] = useState<"all" | "namgu" | "junggu">("all");
  const [moreNamgu, setMoreNamgu] = useState(false);
  const [moreJunggu, setMoreJunggu] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

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

  // reveal-on-scroll
  useEffect(() => {
    observerRef.current?.disconnect();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); });
    }, { threshold: 0.12, rootMargin: "0px 0px -60px 0px" });
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    observerRef.current = io;
    return () => io.disconnect();
  }, [concept, filter, moreNamgu, moreJunggu, intro]);

  const pick = PICKS[concept];
  const namguList = moreNamgu ? NAMGU : NAMGU.filter((i) => !i.extra);
  const jungguList = moreJunggu ? JUNGGU : JUNGGU.filter((i) => !i.extra);
  const showNamgu = filter !== "junggu";
  const showJunggu = filter !== "namgu";

  return (
    <main className="bg-paper text-ink min-h-screen">
      {/* Intro */}
      <div className={`fixed inset-0 z-[9000] bg-paper flex flex-col items-center justify-center gap-5 transition-opacity duration-700 ${intro ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <p className="text-[11px] tracking-[0.4em] text-ink-light animate-fade-up">TRACK 052</p>
        <div className="w-11 h-px bg-[hsl(var(--ink-faint))] overflow-hidden">
          <div className="h-full bg-accent-c" style={{ animation: "loadbar 2.2s ease forwards" }} />
        </div>
        <p className="font-serif-kr italic text-[13px] text-ink-light animate-fade-up">울산의 길을 기록합니다</p>
      </div>

      {/* Nav */}
      <nav className={`fixed top-0 inset-x-0 z-50 flex items-center justify-between transition-all duration-300 ${scrolled ? "py-3 px-6 md:px-14 bg-paper/95 backdrop-blur-md border-b border-faint" : "py-5 px-6 md:px-14"}`}>
        <a href="#" className={`text-[11px] tracking-[0.3em] transition-colors ${scrolled ? "text-ink-light" : "text-white/60"}`}>TRACK 052</a>
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

      {/* Hero */}
      <section id="hero" className="relative min-h-screen grain flex flex-col items-center justify-center px-6 text-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, hsl(var(--hero-from)), hsl(var(--hero-to)))" }}>
        <svg className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-1000 ${isNight ? "opacity-100" : "opacity-0"}`} viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
          <g fill="#fff">
            {[[110,72,.8,.55],[290,130,1,.75],[460,55,.6,.5],[620,105,.9,.65],[780,40,.7,.55],[920,125,1.1,.85],[1060,65,.8,.6],[540,165,.9,.55],[690,225,.8,.55]].map((s,i)=>(
              <circle key={i} cx={s[0]} cy={s[1]} r={s[2]} opacity={s[3]} />
            ))}
          </g>
        </svg>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-0 w-full max-w-5xl animate-fade-up">
          <div className="flex md:flex-col gap-5 md:gap-3.5 md:items-end md:pr-9">
            {(["gatgil","saetgil"] as const).map((c)=>(
              <button key={c} onClick={()=>setConcept(c)}
                className={`relative font-serif-kr text-base md:text-2xl whitespace-nowrap pb-0.5 transition-colors ${concept===c?"text-white/70":"text-white/15 hover:text-white/40"}`}>
                {c==="gatgil"?"갓길":"샛길"}
                <span className={`absolute left-0 right-0 bottom-0 h-px bg-accent-c origin-right transition-transform duration-300 ${concept===c?"scale-x-100":"scale-x-0"}`}/>
              </button>
            ))}
          </div>
          <div className="flex items-center flex-shrink-0">
            <span className="font-display text-6xl md:text-8xl lg:text-9xl text-white/90 leading-none -tracking-[0.02em]">[</span>
            <span className="font-display text-6xl md:text-8xl lg:text-9xl text-white/90 leading-none -tracking-[0.02em] px-3 min-w-[2.8ch] text-center">
              Track 052
            </span>
            <span className="font-display text-6xl md:text-8xl lg:text-9xl text-white/90 leading-none -tracking-[0.02em]">]</span>
          </div>
          <div className="flex md:flex-col md:items-start md:pl-9">
            <button onClick={()=>setConcept("jireum")}
              className={`relative font-serif-kr text-base md:text-2xl whitespace-nowrap pb-0.5 transition-colors ${concept==="jireum"?"text-white/70":"text-white/15 hover:text-white/40"}`}>
              지름길
              <span className={`absolute left-0 right-0 bottom-0 h-px bg-accent-c origin-left transition-transform duration-300 ${concept==="jireum"?"scale-x-100":"scale-x-0"}`}/>
            </button>
          </div>
        </div>
        <div className="relative z-10 mt-7 animate-fade-up">
          <p className="text-[9px] tracking-[0.32em] text-accent-c mb-2.5">ULSAN HIDDEN TRACK</p>
          <p className="font-serif-kr italic text-sm text-white/35 tracking-wide">울산의 길목에서, 오늘의 길을 찾습니다</p>
        </div>
        <div className="relative z-10 mt-5 min-h-[22px] animate-fade-up">
          <span className="text-[9px] tracking-[0.22em] text-white/30 px-3.5 py-1 border border-white/10 rounded-full">{CONCEPT_DESC[concept]}</span>
        </div>
        <div className="absolute bottom-11 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2.5 z-10 animate-fade-up">
          <div className="w-px h-9 bg-white/20 relative overflow-hidden">
            <span className="absolute -top-full left-0 w-full h-full bg-accent-c" style={{ animation: "drop-line 2s 1.8s infinite ease" }} />
          </div>
          <p className="text-[8px] tracking-[0.3em] text-white/25">SCROLL</p>
        </div>
      </section>

      {/* Editor's Pick */}
      <section id="pick" className="px-6 md:px-14 py-24 bg-paper transition-colors duration-700">
        <div className="flex items-baseline justify-between mb-12">
          <p className="reveal text-[9px] tracking-[0.3em] text-ink-light flex items-center gap-3.5">
            EDITOR'S PICK<span className="block w-7 h-px bg-accent-c" />
          </p>
          <span className="text-[9px] tracking-[0.18em] text-accent-c bg-accent-soft px-3 py-1 rounded-full transition-all">{CONCEPT_TAG[concept]}</span>
        </div>
        <div key={concept} className="grid md:grid-cols-[1.25fr_1fr] gap-10 md:gap-14 items-start animate-fade-up">
          <div className="reveal group relative aspect-[4/3] overflow-hidden rounded-sm bg-[hsl(var(--ink-faint))]">
            <DayNightImg base={pick.img} alt={pick.title.join(" ")} isNight={isNight} className="transition-transform duration-700 group-hover:scale-[1.04]" />
          </div>
          <div className="reveal" style={{ transitionDelay: "120ms" }}>
            <p className="text-[9px] tracking-[0.2em] text-accent-c mb-3.5">{pick.type}</p>
            <h2 className="font-serif-kr text-2xl md:text-[28px] leading-[1.35] mb-2 text-ink">
              {pick.title.map((t, i) => <span key={i}>{t}<br/></span>)}
            </h2>
            <p className="text-[11px] text-ink-light tracking-wider mb-6 pb-6 border-b border-faint">{pick.loc}</p>
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
            <h2 className="font-serif-kr text-3xl text-ink">울산의 길목들</h2>
            <p className="text-[11px] text-ink-light mt-1">남구 · 중구를 중심으로 기록한 길</p>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {namguList.map((it, i) => (
                <article key={it.img} className="reveal group cursor-pointer" style={{ transitionDelay: `${(i%3)*100}ms` }}>
                  <div className="relative aspect-[3/2] overflow-hidden mb-3 rounded-sm bg-[hsl(var(--ink-faint))]">
                    <SoloImg src={it.img} alt={it.name} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-serif-kr italic text-xs text-white">자세히 보기</span>
                    </div>
                  </div>
                  <p className="text-[9px] tracking-[0.18em] text-accent-c mb-1">{it.type}</p>
                  <p className="font-serif-kr text-[15px] text-ink mb-1">{it.name}</p>
                  <p className="text-[10px] text-ink-light tracking-wide">{it.meta}</p>
                </article>
              ))}
            </div>
            {!moreNamgu && (
              <div className="mt-7 flex items-center gap-3.5">
                <button onClick={()=>setMoreNamgu(true)} className="text-[9px] tracking-[0.2em] px-5 py-2 border border-faint rounded-full text-ink-light hover:border-[hsl(var(--accent))] hover:text-accent-c transition-colors">더보기</button>
                <span className="text-[10px] text-ink-light">+ 3곳 더 있어요</span>
              </div>
            )}
          </>
        )}

        {showJunggu && (
          <>
            <div className="reveal flex items-center gap-3.5 mt-14 mb-5">
              <span className="text-[10px] tracking-[0.2em] text-ink-light">중구</span>
              <div className="flex-1 h-px bg-[hsl(var(--ink-faint))]" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {jungguList.map((it, i) => (
                <article key={it.img} className="reveal group cursor-pointer" style={{ transitionDelay: `${(i%3)*100}ms` }}>
                  <div className="relative aspect-[3/2] overflow-hidden mb-3 rounded-sm bg-[hsl(var(--ink-faint))]">
                    <SoloImg src={it.img} alt={it.name} />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-serif-kr italic text-xs text-white">자세히 보기</span>
                    </div>
                  </div>
                  <p className="text-[9px] tracking-[0.18em] text-accent-c mb-1">{it.type}</p>
                  <p className="font-serif-kr text-[15px] text-ink mb-1">{it.name}</p>
                  <p className="text-[10px] text-ink-light tracking-wide">{it.meta}</p>
                </article>
              ))}
            </div>
            {!moreJunggu && (
              <div className="mt-7 flex items-center gap-3.5">
                <button onClick={()=>setMoreJunggu(true)} className="text-[9px] tracking-[0.2em] px-5 py-2 border border-faint rounded-full text-ink-light hover:border-[hsl(var(--accent))] hover:text-accent-c transition-colors">더보기</button>
                <span className="text-[10px] text-ink-light">+ 3곳 더 있어요</span>
              </div>
            )}
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

      {/* Guide */}
      <section id="guide" className="px-6 md:px-14 py-24 bg-guide transition-colors duration-700">
        <p className="reveal text-[9px] tracking-[0.3em] text-white/25 flex items-center gap-3.5 mb-6">
          WALKING GUIDE<span className="block w-7 h-px bg-accent-c" />
        </p>
        <h2 className="reveal font-serif-kr text-3xl text-white/80 mb-12">울산의 길을 걷기 전에</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-white/[0.07]">
          {GUIDE.map((g,i)=>(
            <div key={g.n} className="reveal p-7 border-b md:border-b-0 md:border-r last:border-r-0 border-white/[0.07] hover:bg-white/[0.025] transition-colors" style={{ transitionDelay: `${i*100}ms` }}>
              <div className="font-display text-4xl text-accent-c opacity-40 leading-none mb-3.5">{g.n}</div>
              <p className="font-serif-kr text-sm text-white/75 mb-2.5">{g.t}</p>
              <p className="text-[11px] leading-[1.95] text-white/35">{g.d}</p>
            </div>
          ))}
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
            <p className="text-[10px] tracking-[0.35em] text-white/60 mb-2.5">TRACK 052</p>
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
          <p className="text-[9px] tracking-wider text-white/15">© 2025 TRACK 052. ALL RIGHTS RESERVED.</p>
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
