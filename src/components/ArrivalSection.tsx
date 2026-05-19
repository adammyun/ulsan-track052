import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { MapPin, ShieldAlert, Sun, Moon, Ticket } from "lucide-react";
import { useArrival, ARRIVAL_RADIUS } from "@/hooks/useArrival";
import { formatDistance } from "@/lib/geo";

interface Props {
  target: { lat: number; lon: number };
  placeName: string;
  coverImage?: string;
  /** Developer bypass — when true, treat as arrived without GPS check. */
  forceUnlocked?: boolean;
  /** Override the time-of-day used to decide which stamp gets pressed. */
  nowKindOverride?: "day" | "night" | null;
}

type StampKind = "day" | "night";
interface StampMap {
  day?: string;  // ISO time
  night?: string;
}

const stampKey = (placeName: string) => `track052:stamps:${placeName}`;

function currentStampKind(d = new Date()): StampKind {
  const h = d.getHours();
  // 주간 06:00~17:59, 야간 18:00~05:59
  return h >= 6 && h < 18 ? "day" : "night";
}

function formatStampTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("ko-KR", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  });
}

function StampSlot({
  kind, stampedAt,
}: { kind: StampKind; stampedAt?: string }) {
  const stamped = !!stampedAt;
  const Icon = kind === "day" ? Sun : Moon;
  return (
    <div className="relative flex-1 rounded-sm border border-dashed border-faint bg-paper/60 p-4 flex flex-col items-center justify-center gap-2 aspect-square overflow-hidden">
      <AnimatePresence>
        {stamped ? (
          <motion.div
            key="stamp"
            initial={{ scale: 1.8, opacity: 0, rotate: -18 }}
            animate={{ scale: 1, opacity: 1, rotate: -8 }}
            transition={{ type: "spring", stiffness: 220, damping: 14 }}
            className="absolute inset-0 flex flex-col items-center justify-center"
          >
            <div className="border-2 border-accent-c/80 rounded-full px-4 py-3 flex flex-col items-center gap-1 text-accent-c rotate-[-6deg]">
              <Icon className="w-6 h-6" strokeWidth={1.6} />
              <p className="text-[9px] tracking-[0.3em] uppercase">{kind === "day" ? "Day" : "Night"}</p>
            </div>
            <p className="absolute bottom-2 text-[9px] tracking-wider text-ink-light tabular-nums">
              {formatStampTime(stampedAt!)}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-1.5 text-ink-light/60"
          >
            <Icon className="w-5 h-5" strokeWidth={1.4} />
            <p className="text-[9px] tracking-[0.3em] uppercase">{kind === "day" ? "Day" : "Night"}</p>
            <p className="text-[9px] text-ink-light/50">미수집</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ArrivalSection({
  target, placeName, coverImage, forceUnlocked = false,
}: Props) {
  const { status, distance, arrived: gpsArrived, start } = useArrival(target);
  const arrived = gpsArrived || forceUnlocked;
  const firedRef = useRef(false);

  const [stamps, setStamps] = useState<StampMap>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(stampKey(placeName)) || "{}"); }
    catch { return {}; }
  });

  // 새 장소로 모달이 바뀌면 다시 불러옴
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { setStamps(JSON.parse(localStorage.getItem(stampKey(placeName)) || "{}")); }
    catch { setStamps({}); }
    firedRef.current = false;
  }, [placeName]);

  // 도착하면 현재 시간대 스탬프를 찍고 컨페티!
  useEffect(() => {
    if (!arrived || firedRef.current) return;
    firedRef.current = true;

    const kind = currentStampKind();
    setStamps((prev) => {
      if (prev[kind]) return prev;
      const next = { ...prev, [kind]: new Date().toISOString() };
      try { localStorage.setItem(stampKey(placeName), JSON.stringify(next)); } catch {}
      return next;
    });

    const burst = (origin: { x: number; y: number }) =>
      confetti({ particleCount: 90, spread: 75, origin, scalar: 0.9, ticks: 200, zIndex: 9999 });
    burst({ x: 0.25, y: 0.6 });
    setTimeout(() => burst({ x: 0.75, y: 0.6 }), 180);
    setTimeout(() => burst({ x: 0.5, y: 0.4 }), 360);
  }, [arrived, placeName]);

  // 개발자용: 특정 시간대 스탬프 강제 획득
  const forceStamp = (kind: StampKind) => {
    setStamps((prev) => {
      const next = { ...prev, [kind]: new Date().toISOString() };
      try { localStorage.setItem(stampKey(placeName), JSON.stringify(next)); } catch {}
      return next;
    });
    const burst = (origin: { x: number; y: number }) =>
      confetti({ particleCount: 70, spread: 70, origin, scalar: 0.85, ticks: 180, zIndex: 9999 });
    burst({ x: 0.3, y: 0.55 });
    setTimeout(() => burst({ x: 0.7, y: 0.55 }), 160);
  };

  const resetStamps = () => {
    setStamps({});
    try { localStorage.removeItem(stampKey(placeName)); } catch {}
  };

  const insecure = status === "insecure";
  const todayKind = useMemo(() => currentStampKind(), [arrived]);
  const collectedBoth = !!stamps.day && !!stamps.night;

  return (
    <section className="border-t border-faint pt-12 mt-16">
      <p className="text-[10px] tracking-[0.3em] text-ink-light flex items-center gap-3 mb-4">
        ARRIVAL <span className="block w-7 h-px bg-accent-c" />
      </p>
      <h3 className="font-serif-kr text-2xl md:text-3xl text-ink mb-2">방문 기념 티켓 & 스탬프</h3>
      <p className="text-[13px] text-ink-mid mb-6">
        목표 좌표 반경 {ARRIVAL_RADIUS}m 안에 들어오면 도착이 인증되고, 그 시간대의 스탬프가 티켓에 찍혀요.
        낮과 밤, 두 개의 스탬프를 모두 모아보세요.
      </p>

      {!window.isSecureContext && (
        <div className="flex items-start gap-3 p-4 rounded-sm border border-faint bg-card-bg/60 mb-6">
          <ShieldAlert className="w-4 h-4 mt-0.5 text-accent-c shrink-0" />
          <p className="text-[12px] text-ink-mid leading-relaxed">
            GPS 위치 인증은 보안 연결(HTTPS) 환경에서만 동작합니다. 게시된 사이트에서 다시 시도해 주세요.
          </p>
        </div>
      )}

      {/* GPS 상태 패널 */}
      <div className="rounded-sm border border-faint bg-paper p-6 mb-8">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] text-ink-light mb-3">
          <MapPin className="w-3 h-3" />
          <span>TARGET · {target.lat.toFixed(4)}, {target.lon.toFixed(4)}</span>
        </div>

        {arrived ? (
          <p className="font-serif-kr text-[18px] text-ink leading-relaxed">
            {forceUnlocked && status !== "arrived"
              ? "개발자 모드: GPS를 우회해 티켓이 발급되었어요."
              : "도착을 확인했어요. 아래 티켓에 스탬프가 찍혔습니다."}
          </p>
        ) : (
          <>
            {status === "idle" && (
              <>
                <p className="font-serif-kr text-[17px] text-ink mb-5 leading-relaxed">
                  지금 {placeName}에 도착하셨다면 위치를 인증하고 기념 티켓을 받아보세요.
                </p>
                <button
                  onClick={start}
                  disabled={insecure}
                  className="text-[11px] tracking-[0.2em] uppercase px-5 py-2.5 rounded-full border border-ink text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  위치 확인하기
                </button>
              </>
            )}
            {(status === "requesting" || status === "tracking") && (
              <>
                <p className="font-serif-kr text-[17px] text-ink mb-2 leading-relaxed">
                  아직 길 위에 있나요? 목적지에 도착하면 스탬프가 찍힙니다.
                </p>
                {distance !== null && (
                  <p className="text-[12px] text-ink-light tabular-nums">
                    현재 거리 · 약 {formatDistance(distance)}
                  </p>
                )}
                {status === "requesting" && (
                  <p className="text-[11px] text-ink-light mt-2">위치를 가져오는 중…</p>
                )}
              </>
            )}
            {status === "denied" && (
              <p className="text-[13px] text-ink-mid">위치 권한이 거부되었어요. 브라우저 설정에서 위치 접근을 허용해 주세요.</p>
            )}
            {status === "unsupported" && (
              <p className="text-[13px] text-ink-mid">이 기기에서는 위치 정보를 사용할 수 없어요.</p>
            )}
            {status === "error" && (
              <p className="text-[13px] text-ink-mid">위치를 가져오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
            )}
          </>
        )}
      </div>

      {/* 티켓 */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative rounded-md overflow-hidden border border-faint bg-ink-faint/40 shadow-xl"
      >
        {/* 티켓 배경 (장소 이미지) */}
        <div className="relative h-48 md:h-56 overflow-hidden">
          {coverImage && (
            <img
              src={`/images/${coverImage}.jpg`}
              alt={placeName}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] tracking-[0.35em] text-white/80 inline-flex items-center gap-1.5">
                <Ticket className="w-3 h-3" /> TRACK 052 · TICKET
              </p>
              <p className="text-[9px] tracking-[0.2em] text-white/70 tabular-nums">
                {target.lat.toFixed(3)}°N · {target.lon.toFixed(3)}°E
              </p>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.25em] text-accent-c mb-1">VISIT</p>
              <h4 className="font-serif-kr text-2xl md:text-3xl text-white leading-tight">{placeName}</h4>
            </div>
          </div>
        </div>

        {/* 천공 라인 */}
        <div
          className="h-3 bg-paper"
          style={{
            backgroundImage:
              "radial-gradient(circle at 6px 6px, hsl(var(--ink-faint)) 3px, transparent 4px)",
            backgroundSize: "12px 12px",
            backgroundPosition: "0 -3px",
          }}
        />

        {/* 스탬프 영역 */}
        <div className="p-5 bg-paper">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] tracking-[0.3em] text-ink-light">STAMPS</p>
            <p className="text-[10px] tracking-[0.2em] text-ink-light tabular-nums">
              {(stamps.day ? 1 : 0) + (stamps.night ? 1 : 0)} / 2
            </p>
          </div>
          <div className="flex gap-3">
            <StampSlot kind="day" stampedAt={stamps.day} />
            <StampSlot kind="night" stampedAt={stamps.night} />
          </div>
          <p className="mt-4 text-[11px] text-ink-mid leading-relaxed">
            {collectedBoth
              ? "낮과 밤, 두 시간대의 길을 모두 만나셨어요. 완전한 티켓을 모았습니다."
              : arrived
                ? `이번 방문은 ${todayKind === "day" ? "주간(낮)" : "야간(밤)"} 스탬프로 기록됐어요. 반대 시간대에 다시 방문해 나머지를 모아보세요.`
                : "도착을 인증하면 현재 시간대(낮 06–18시 / 밤 18–06시)의 스탬프가 찍힙니다."}
          </p>
        </div>
      </motion.div>

      {/* 개발자 영역 — 실제 시각/위치와 무관하게 스탬프 동작 확인용 */}
      <div className="mt-6 rounded-sm border border-dashed border-faint bg-card-bg/40 p-4">
        <p className="text-[9px] tracking-[0.3em] text-ink-light mb-3">DEV · TEST CONTROLS</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => forceStamp("day")}
            className="text-[10px] tracking-[0.18em] uppercase px-3.5 py-2 rounded-full border border-faint text-ink-mid hover:border-[hsl(var(--accent))] hover:text-accent-c transition-colors inline-flex items-center gap-1.5"
          >
            <Sun className="w-3 h-3" /> 낮 스탬프 획득
          </button>
          <button
            type="button"
            onClick={() => forceStamp("night")}
            className="text-[10px] tracking-[0.18em] uppercase px-3.5 py-2 rounded-full border border-faint text-ink-mid hover:border-[hsl(var(--accent))] hover:text-accent-c transition-colors inline-flex items-center gap-1.5"
          >
            <Moon className="w-3 h-3" /> 밤 스탬프 획득
          </button>
          <button
            type="button"
            onClick={resetStamps}
            className="text-[10px] tracking-[0.18em] uppercase px-3.5 py-2 rounded-full border border-faint text-ink-light hover:text-ink transition-colors"
          >
            스탬프 초기화
          </button>
        </div>
        <p className="mt-3 text-[10px] text-ink-light leading-relaxed">
          실제 시간이나 GPS 위치와 무관하게 두 스탬프가 정상적으로 찍히고 티켓 UI에 반영되는지 확인할 수 있어요.
        </p>
      </div>
    </section>
  );
}
