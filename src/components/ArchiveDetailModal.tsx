import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X, MapPin, Ticket, Sun, Moon, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ArrivalSection from "@/components/ArrivalSection";
import AroundView from "@/components/AroundView";

const GALLERY_POOL = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1600&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80",
  "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=1400&q=80",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?w=1200&q=80",
  "https://images.unsplash.com/photo-1505765050516-f72dcac9c60a?w=1400&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1600&q=80",
];

const isNightHour = (d = new Date()) => {
  const h = d.getHours();
  return h < 6 || h >= 18;
};

interface RouteStep {
  step: string;
  text: string;
  image?: string;
}

interface PathContent {
  story?: string;
  route?: RouteStep[];
  tidbits?: string[];
}

interface PathRow {
  id: string;
  name: string;
  region: string;
  type: string;
  latitude: number;
  longitude: number;
  cover_image: string;
  image_day: string | null;
  image_night: string | null;
  around_view_url: string | null;
  content: PathContent;
  goods_url: string | null;
  goods_type: string;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } },
};

interface PlaceholderData {
  name: string;
  type: string;
  coverUrl: string;
  essay?: string[];
  loc?: string;
  badges?: string[];
  density?: number;
  safety?: number;
}

interface Props {
  id: string | null;
  placeholder?: PlaceholderData | null;
  onClose: () => void;
}

export default function ArchiveDetailModal({ id, placeholder = null, onClose }: Props) {
  const open = !!id || !!placeholder;
  const [forceUnlocked, setForceUnlocked] = useState(false);
  // 모달 내부 전용 낮/밤 오버라이드. null 이면 실제 시각을 따름.
  const [forcedNight, setForcedNight] = useState<boolean | null>(null);
  const effectiveNight = forcedNight ?? isNightHour();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["path", id],
    queryFn: async (): Promise<PathRow | null> => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("paths")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PathRow;
    },
    enabled: !!id,
  });

  // Gallery — deterministic per article so it doesn't reshuffle on rerender
  const galleryKey = id ?? placeholder?.name ?? "x";
  const gallery = useMemo(() => {
    let h = 0;
    for (let i = 0; i < galleryKey.length; i++) h = (h * 31 + galleryKey.charCodeAt(i)) | 0;
    const start = Math.abs(h) % GALLERY_POOL.length;
    return Array.from({ length: 6 }, (_, i) => GALLERY_POOL[(start + i) % GALLERY_POOL.length]);
  }, [galleryKey]);

  // Reset dev bypass + theme override whenever we open a different article
  useEffect(() => {
    setForceUnlocked(false);
    setForcedNight(null);
    setLightboxIdx(null);
  }, [id, placeholder?.name]);

  // Scroll lock + ESC to close
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="archive-modal"
          className="fixed inset-0 z-[200] flex items-start md:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className={`relative z-10 w-full md:w-[min(960px,92vw)] h-[100dvh] md:h-[min(90vh,920px)] md:my-auto md:rounded-md overflow-hidden text-ink shadow-2xl flex flex-col transition-colors duration-500 ${effectiveNight ? "night bg-paper/95 backdrop-blur-xl" : "bg-paper/95 backdrop-blur-xl"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 md:px-8 py-3.5 border-b border-faint bg-paper/80 backdrop-blur-md shrink-0 transition-colors duration-500">
              <div className="flex items-center gap-3">
                <button
                  onDoubleClick={() => setForceUnlocked(true)}
                  title="Path ID (double-click: dev GPS unlock)"
                  className="group flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-ink-light hover:text-ink transition-colors select-none"
                >
                  <MapPin className="w-3 h-3" />
                  <span>{id ?? (placeholder ? "PLACEHOLDER" : "—")}</span>
                  {forceUnlocked && (
                    <span className="text-[9px] tracking-[0.2em] text-accent-c">· DEV UNLOCKED</span>
                  )}
                </button>
                <button
                  onDoubleClick={() => setForcedNight((v) => !(v ?? isNightHour()))}
                  title="더블클릭: 낮 ↔ 밤 토글"
                  className="flex items-center gap-1.5 text-[10px] tracking-[0.3em] uppercase text-ink-light hover:text-ink transition-colors select-none"
                >
                  <Ticket className="w-3 h-3" />
                  {effectiveNight ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                  {forcedNight !== null && (
                    <span className="text-[9px] tracking-[0.2em] text-accent-c">· FORCED</span>
                  )}
                </button>
              </div>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 inline-flex items-center justify-center rounded-full text-ink-light hover:text-ink hover:bg-card-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>


            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto overscroll-contain grain transition-colors duration-500">
              {placeholder && (
                <>
                  <motion.section
                    initial="hidden"
                    animate="show"
                    variants={fadeUp}
                    className="relative h-[42vh] min-h-[280px] overflow-hidden bg-[hsl(var(--ink-faint))]"
                  >
                    <img
                      src={placeholder.coverUrl}
                      alt={placeholder.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 px-6 md:px-10 pb-7 text-white">
                      <p className="text-[10px] tracking-[0.3em] text-accent-c mb-2">
                        {placeholder.type.toUpperCase()} · COMING SOON
                      </p>
                      <h1 className="font-serif-kr text-2xl md:text-4xl leading-tight mb-2">
                        {placeholder.name}
                      </h1>
                    </div>
                  </motion.section>
                  <article className="max-w-[720px] mx-auto px-6 md:px-10 py-16 text-center">
                    {placeholder.loc && (
                      <p className="text-[11px] text-ink-light tracking-[0.18em] mb-6">{placeholder.loc}</p>
                    )}
                    {placeholder.essay && placeholder.essay.length > 0 ? (
                      <p className="font-serif-kr italic text-[16px] md:text-[18px] leading-[2.1] text-ink-mid mb-8">
                        {placeholder.essay.map((l, i) => (
                          <span key={i}>{l}<br /></span>
                        ))}
                      </p>
                    ) : (
                      <p className="font-serif-kr text-[18px] md:text-[20px] leading-[1.95] text-ink/85 mb-6">
                        이 길의 상세 이야기는 아직 준비 중입니다.<br />
                        곧 길의 좌표, 동선, 그리고 작은 여담들로 다시 찾아올게요.
                      </p>
                    )}
                    {placeholder.badges && placeholder.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 justify-center mb-2">
                        {placeholder.badges.map((b) => (
                          <span key={b} className="text-[9px] px-2.5 py-1 border border-faint text-ink-mid tracking-wide rounded-full">{b}</span>
                        ))}
                      </div>
                    )}
                  </article>
                </>
              )}
              {!placeholder && isLoading && (
                <div className="py-32 text-center text-ink-light text-sm">불러오는 중…</div>
              )}
              {!placeholder && error && (
                <div className="py-32 text-center text-ink-mid text-sm">
                  데이터를 불러오지 못했어요.
                </div>
              )}
              {data && (
                <>
                  <motion.section
                    initial="hidden"
                    animate="show"
                    variants={fadeUp}
                    className="relative h-[42vh] min-h-[280px] overflow-hidden bg-[hsl(var(--ink-faint))]"
                  >
                    {(() => {
                      const fallback = `/images/${data.cover_image}.jpg`;
                      const dayUrl = data.image_day || fallback;
                      const nightUrl = data.image_night || data.image_day || fallback;
                      const activeUrl = effectiveNight ? nightUrl : dayUrl;
                      return (
                        <AnimatePresence mode="sync" initial={false}>
                          <motion.img
                            key={activeUrl}
                            src={activeUrl}
                            alt={data.name}
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.9, ease: "easeInOut" }}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        </AnimatePresence>
                      );
                    })()}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 px-6 md:px-10 pb-7 text-white">
                      <p className="text-[10px] tracking-[0.3em] text-accent-c mb-2">
                        {data.type.toUpperCase()}
                      </p>
                      <h1 className="font-serif-kr text-2xl md:text-4xl leading-tight mb-2">
                        {data.name}
                      </h1>
                      <p className="text-[11px] tracking-[0.18em] text-white/70 tabular-nums">
                        {data.latitude.toFixed(4)}° N · {data.longitude.toFixed(4)}° E
                      </p>
                    </div>
                  </motion.section>

                  <article className="max-w-[720px] mx-auto px-6 md:px-10 py-12 md:py-16">
                    {data.content?.story && (
                      <motion.section
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={fadeUp}
                        className="mb-14"
                      >
                        <p className="text-[10px] tracking-[0.3em] text-ink-light flex items-center gap-3 mb-5">
                          STORY <span className="block w-7 h-px bg-accent-c" />
                        </p>
                        <p className="font-serif-kr text-[18px] md:text-[20px] leading-[1.95] text-ink/90">
                          {data.content.story}
                        </p>
                      </motion.section>
                    )}

                    {data.content?.route && data.content.route.length > 0 && (
                      <motion.section
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.2 }}
                        variants={fadeUp}
                        className="mb-14"
                      >
                        <p className="text-[10px] tracking-[0.3em] text-ink-light flex items-center gap-3 mb-6">
                          ROUTE <span className="block w-7 h-px bg-accent-c" />
                        </p>
                        <ol className="space-y-7">
                          {data.content.route.map((s) => (
                            <li
                              key={s.step}
                              className="grid grid-cols-[48px_1fr] gap-5 items-start"
                            >
                              <span className="font-display text-3xl text-accent-c opacity-60 leading-none">
                                {s.step}
                              </span>
                              <div>
                                <p className="font-serif-kr text-[15px] md:text-[16px] leading-[1.85] text-ink/85">
                                  {s.text}
                                </p>
                                {s.image && (
                                  <img
                                    src={s.image}
                                    alt={`step ${s.step}`}
                                    className="mt-3 w-full rounded-sm"
                                    loading="lazy"
                                  />
                                )}
                              </div>
                            </li>
                          ))}
                        </ol>
                      </motion.section>
                    )}

                    {data.content?.tidbits && data.content.tidbits.length > 0 && (
                      <motion.section
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true, amount: 0.3 }}
                        variants={fadeUp}
                        className="mb-4"
                      >
                        <p className="text-[10px] tracking-[0.3em] text-ink-light flex items-center gap-3 mb-5">
                          TIDBITS <span className="block w-7 h-px bg-accent-c" />
                        </p>
                        <ul className="space-y-3 border-l border-faint pl-5">
                          {data.content.tidbits.map((t, i) => (
                            <li
                              key={i}
                              className="font-serif-kr italic text-[14px] leading-[1.8] text-ink-mid"
                            >
                              — {t}
                            </li>
                          ))}
                        </ul>
                      </motion.section>
                    )}

                    <AroundView
                      pathId={data.id}
                      panoramaUrl={data.around_view_url ?? undefined}
                      caption={`${data.name} · 360° around view (placeholder)`}
                    />

                    <motion.div
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.2 }}
                      variants={fadeUp}
                    >
                      <ArrivalSection
                        target={{ lat: data.latitude, lon: data.longitude }}
                        placeName={data.name}
                        coverImage={data.cover_image}
                        forceUnlocked={forceUnlocked}
                        nowKindOverride={effectiveNight ? "night" : "day"}
                      />
                    </motion.div>

                    {/* More Scenes Gallery */}
                    <motion.section
                      initial="hidden"
                      whileInView="show"
                      viewport={{ once: true, amount: 0.15 }}
                      variants={fadeUp}
                      className="mt-16"
                    >
                      <div className={`rounded-md p-5 md:p-6 backdrop-blur-md border transition-colors duration-500 ${effectiveNight ? "bg-black/55 border-white/10" : "bg-white/75 border-black/5"}`}>
                      <p className={`text-[10px] tracking-[0.3em] flex items-center gap-3 mb-3 ${effectiveNight ? "text-white/80" : "text-ink"} [text-shadow:0_1px_2px_rgba(0,0,0,0.35)]`}>
                        MORE SCENES <span className="block w-7 h-px bg-accent-c" />
                      </p>
                      <p className={`text-[12px] mb-5 leading-relaxed ${effectiveNight ? "text-white/85" : "text-ink-mid"} [text-shadow:0_1px_2px_rgba(0,0,0,0.25)]`}>
                        이 길의 분위기를 더 담은 풍경들. 이미지를 누르면 크게 볼 수 있어요.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 [grid-auto-rows:10rem] md:[grid-auto-rows:11rem]">
                        {gallery.map((src, i) => {
                          const span =
                            i === 0
                              ? "col-span-2 row-span-2"
                              : i === 3
                                ? "row-span-2"
                                : "";
                          return (
                            <button
                              key={src + i}
                              type="button"
                              onClick={() => setLightboxIdx(i)}
                              className={`relative overflow-hidden rounded-sm group bg-ink-faint ${span}`}
                            >
                              <img
                                src={src}
                                alt={`${data.name} scene ${i + 1}`}
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
                            </button>
                          );
                        })}
                      </div>
                      </div>
                    </motion.section>
                  </article>
                </>
              )}
            </div>
          </motion.div>

          {/* Lightbox */}
          <AnimatePresence>
            {lightboxIdx !== null && (
              <motion.div
                key="lightbox"
                className="absolute inset-0 z-30 flex items-center justify-center p-4 md:p-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                onClick={() => setLightboxIdx(null)}
              >
                <div className="absolute inset-0 bg-black/90 backdrop-blur" />
                <motion.img
                  key={gallery[lightboxIdx]}
                  src={gallery[lightboxIdx]}
                  alt=""
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="relative max-h-full max-w-full object-contain rounded-sm shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  aria-label="이전"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx((v) => (v === null ? v : (v - 1 + gallery.length) % gallery.length));
                  }}
                  className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="다음"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx((v) => (v === null ? v : (v + 1) % gallery.length));
                  }}
                  className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 inline-flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="닫기"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(null);
                  }}
                  className="absolute top-4 right-4 w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>

  );
}
