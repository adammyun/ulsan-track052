import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, type Variants } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
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
  around_view_url: string | null;
  content: PathContent;
  goods_url: string | null;
  goods_type: string;
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

const isNightHour = (d = new Date()) => {
  const h = d.getHours();
  return h < 6 || h >= 18;
};

export default function ArchiveDetail() {
  const { id } = useParams<{ id: string }>();

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  return (
    <main className="min-h-screen bg-paper text-ink grain">
      <header className="border-b border-faint sticky top-0 bg-paper/90 backdrop-blur-md z-30">
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between">
          <Link
            to="/#archive"
            className="text-[11px] tracking-[0.3em] uppercase text-ink-mid hover:text-ink transition-colors"
          >
            ← Archive
          </Link>
          <div className="text-[10px] tracking-[0.3em] uppercase text-ink-light">Track : 052</div>
        </div>
      </header>

      {isLoading && (
        <div className="max-w-[800px] mx-auto px-6 py-32 text-center text-ink-light text-sm">
          불러오는 중…
        </div>
      )}

      {error && (
        <div className="max-w-[800px] mx-auto px-6 py-32 text-center text-ink-mid text-sm">
          데이터를 불러오지 못했어요.
        </div>
      )}

      {data && (
        <>
          {/* Hero */}
          <motion.section
            initial="hidden"
            animate="show"
            variants={fadeUp}
            className="relative h-[55vh] min-h-[380px] overflow-hidden bg-[hsl(var(--ink-faint))]"
          >
            <img
              src={`/images/${data.cover_image}.jpg`}
              alt={data.name}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 max-w-[1200px] mx-auto px-6 md:px-10 pb-10 text-white">
              <p className="text-[10px] tracking-[0.3em] text-accent-c mb-3">{data.type.toUpperCase()}</p>
              <h1 className="font-serif-kr text-3xl md:text-5xl leading-tight mb-3">{data.name}</h1>
              <p className="text-[11px] tracking-[0.18em] text-white/70 tabular-nums">
                {data.latitude.toFixed(4)}° N · {data.longitude.toFixed(4)}° E
              </p>
            </div>
          </motion.section>

          <article className="max-w-[760px] mx-auto px-6 md:px-10 py-16 md:py-24">
            {/* Story */}
            {data.content?.story && (
              <motion.section
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeUp}
                className="mb-16"
              >
                <p className="text-[10px] tracking-[0.3em] text-ink-light flex items-center gap-3 mb-5">
                  STORY <span className="block w-7 h-px bg-accent-c" />
                </p>
                <p className="font-serif-kr text-[19px] md:text-[21px] leading-[1.95] text-ink/90">
                  {data.content.story}
                </p>
              </motion.section>
            )}

            {/* Route */}
            {data.content?.route && data.content.route.length > 0 && (
              <motion.section
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="mb-16"
              >
                <p className="text-[10px] tracking-[0.3em] text-ink-light flex items-center gap-3 mb-6">
                  ROUTE <span className="block w-7 h-px bg-accent-c" />
                </p>
                <ol className="space-y-7">
                  {data.content.route.map((s) => (
                    <li key={s.step} className="grid grid-cols-[48px_1fr] gap-5 items-start">
                      <span className="font-display text-3xl text-accent-c opacity-60 leading-none">
                        {s.step}
                      </span>
                      <div>
                        <p className="font-serif-kr text-[16px] md:text-[17px] leading-[1.85] text-ink/85">
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

            {/* Tidbits */}
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
                      className="font-serif-kr italic text-[15px] leading-[1.8] text-ink-mid"
                    >
                      — {t}
                    </li>
                  ))}
                </ul>
              </motion.section>
            )}

            {/* Around View */}
            <AroundView
              pathId={data.id}
              panoramaUrl={data.around_view_url ?? undefined}
              panoramaUrlNight={data.around_view_url ? data.around_view_url.replace(/\.jpg$/i, "-night.jpg") : undefined}
              isNight={isNightHour()}
              caption={`${data.name} · around view`}
            />

            {/* Arrival */}
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
              />
            </motion.div>
          </article>
        </>
      )}
    </main>
  );
}
