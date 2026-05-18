import { useEffect, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { X, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ArrivalSection from "@/components/ArrivalSection";
import AroundView from "@/components/AroundView";

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
}

interface Props {
  id: string | null;
  placeholder?: PlaceholderData | null;
  onClose: () => void;
}

export default function ArchiveDetailModal({ id, placeholder = null, onClose }: Props) {
  const open = !!id || !!placeholder;
  const [forceUnlocked, setForceUnlocked] = useState(false);

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

  // Reset dev bypass whenever we open a different article
  useEffect(() => {
    setForceUnlocked(false);
  }, [id]);

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
            className="relative z-10 w-full md:w-[min(960px,92vw)] h-[100dvh] md:h-[min(90vh,920px)] md:my-auto md:rounded-md overflow-hidden bg-paper text-ink shadow-2xl flex flex-col transition-colors duration-500"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 md:px-8 py-3.5 border-b border-faint bg-paper/95 backdrop-blur-md shrink-0 transition-colors duration-500">
              <button
                onDoubleClick={() => setForceUnlocked(true)}
                title="Path ID (double-click: dev unlock)"
                className="group flex items-center gap-2 text-[10px] tracking-[0.3em] uppercase text-ink-light hover:text-ink transition-colors select-none"
              >
                <MapPin className="w-3 h-3" />
                <span>{id ?? (placeholder ? "PLACEHOLDER" : "—")}</span>
                {forceUnlocked && (
                  <span className="text-[9px] tracking-[0.2em] text-accent-c">· DEV UNLOCKED</span>
                )}
              </button>
              <button
                onClick={onClose}
                aria-label="Close"
                className="w-8 h-8 inline-flex items-center justify-center rounded-full text-ink-light hover:text-ink hover:bg-card-bg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body (scrollable) */}
            <div className="flex-1 overflow-y-auto overscroll-contain grain">
              {isLoading && (
                <div className="py-32 text-center text-ink-light text-sm">불러오는 중…</div>
              )}
              {error && (
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
                    <img
                      src={`/images/${data.cover_image}.jpg`}
                      alt={data.name}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = "none";
                      }}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
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
                      />
                    </motion.div>
                  </article>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
