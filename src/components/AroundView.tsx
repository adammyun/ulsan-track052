import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin, type Marker } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { X, MessageCircle } from "lucide-react";

interface AroundComment {
  id: string;
  path_id: string;
  user_name: string;
  avatar_url: string | null;
  pitch: number;
  yaw: number;
  content: string;
  created_at: string;
  _dummy?: boolean;
}

interface Props {
  pathId: string;
  panoramaUrl?: string;
  panoramaUrlNight?: string;
  isNight?: boolean;
  caption?: string;
}

const PLACEHOLDER_PANO =
  "https://photo-sphere-viewer-data.netlify.app/assets/sphere.jpg";

// 반응형/줄바꿈 확인용 더미 코멘트 (서로 다른 위치 & 길이)
const DUMMY_COMMENTS: AroundComment[] = [
  {
    id: "dummy-1",
    path_id: "_",
    user_name: "수민",
    avatar_url: null,
    pitch: 0.05,
    yaw: 0.6,
    content: "여기 노을이 정말 예뻐요 🌅",
    created_at: new Date().toISOString(),
    _dummy: true,
  },
  {
    id: "dummy-2",
    path_id: "_",
    user_name: "여행자 J",
    avatar_url: null,
    pitch: -0.15,
    yaw: 2.4,
    content:
      "이 모퉁이를 돌면 작은 카페가 하나 나오는데, 사장님이 직접 내려주시는 핸드드립이 인상적이었어요. 오래 머물고 싶어지는 자리예요.",
    created_at: new Date().toISOString(),
    _dummy: true,
  },
  {
    id: "dummy-3",
    path_id: "_",
    user_name: "지나가던 사람",
    avatar_url: null,
    pitch: 0.2,
    yaw: 4.1,
    content: "비 오는 날 다시 와보고 싶다.",
    created_at: new Date().toISOString(),
    _dummy: true,
  },
  {
    id: "dummy-4",
    path_id: "_",
    user_name: "ulsan_walker",
    avatar_url: null,
    pitch: -0.05,
    yaw: 5.3,
    content:
      "아침 7시쯤에 오면 사람이 거의 없어서 이 풍경을 통째로 가질 수 있어요. 새소리만 들립니다.",
    created_at: new Date().toISOString(),
    _dummy: true,
  },
];

export default function AroundView({ pathId, panoramaUrl, panoramaUrlNight, isNight = false, caption }: Props) {
  const activePanorama = (isNight ? panoramaUrlNight : panoramaUrl) || panoramaUrl || panoramaUrlNight;
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Viewer | null>(null);
  const markersRef = useRef<MarkersPlugin | null>(null);

  const [comments, setComments] = useState<AroundComment[]>([]);
  const [activeComment, setActiveComment] = useState<AroundComment | null>(null);
  const [draft, setDraft] = useState<{ pitch: number; yaw: number } | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 더미 예시 코멘트는 항상 유지하고, 사용자 코멘트는 누적해서 함께 렌더링
  const effectiveComments = useMemo<AroundComment[]>(
    () => [...DUMMY_COMMENTS, ...comments],
    [comments],
  );

  // Fetch comments
  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("around_view_comments")
      .select("*")
      .eq("path_id", pathId)
      .order("created_at", { ascending: true });
    if (error) {
      console.error(error);
      return;
    }
    setComments((data ?? []) as AroundComment[]);
  }, [pathId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  // Init viewer
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: activePanorama || PLACEHOLDER_PANO,
      navbar: false,
      defaultZoomLvl: 0,
      mousewheel: false,
      plugins: [[MarkersPlugin, {}]],
    });
    viewerRef.current = viewer;
    markersRef.current = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;

    const onClick = (e: { data: { rightclick: boolean; pitch: number; yaw: number; target?: unknown } }) => {
      if (e.data.rightclick) return;
      setActiveComment(null);
      setDraft({ pitch: e.data.pitch, yaw: e.data.yaw });
    };
    viewer.addEventListener("click", onClick as never);

    const onSelect = ({ marker }: { marker: Marker }) => {
      const c = (marker.config.data as { comment?: AroundComment } | undefined)?.comment;
      if (c) {
        setDraft(null);
        setActiveComment(c);
      }
    };
    markersRef.current.addEventListener("select-marker", onSelect as never);

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      markersRef.current = null;
    };
  }, [activePanorama]);

  // Sync markers
  useEffect(() => {
    const plugin = markersRef.current;
    if (!plugin) return;
    plugin.setMarkers(
      effectiveComments.map((c) => ({
        id: c.id,
        position: { pitch: c.pitch, yaw: c.yaw },
        html: `<div class="av-dot"><span class="av-dot-core"></span><span class="av-dot-ring"></span></div>`,
        anchor: "center center",
        tooltip: {
          content: `<div class="flex items-center gap-2">
            ${
              c.avatar_url
                ? `<img src="${c.avatar_url}" alt="" class="w-6 h-6 rounded-full object-cover" />`
                : `<div class="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white">${c.user_name.charAt(0)}</div>`
            }
            <span class="text-xs text-white/90">${escapeHtml(c.user_name)}</span>
          </div>`,
          className: "av-tooltip",
        },
        data: { comment: c },
      })),
    );
  }, [effectiveComments]);

  const submitComment = async () => {
    if (!draft || !text.trim()) return;
    setSubmitting(true);
    const payload = {
      path_id: pathId,
      user_name: name.trim() || "익명의 여행자",
      avatar_url: null,
      pitch: draft.pitch,
      yaw: draft.yaw,
      content: text.trim().slice(0, 280),
    };
    const { data, error } = await supabase
      .from("around_view_comments")
      .insert(payload)
      .select()
      .single();
    setSubmitting(false);
    if (error) {
      toast({ title: "코멘트 저장 실패", description: error.message, variant: "destructive" });
      return;
    }
    setComments((prev) => [...prev, data as AroundComment]);
    setDraft(null);
    setText("");
    toast({ title: "코멘트가 추가됐어요" });
  };

  return (
    <section className="my-16">
      <p className="text-[10px] tracking-[0.3em] text-ink flex items-center gap-3 mb-5 font-medium">
        AROUND VIEW <span className="block w-7 h-px bg-accent-c" />
      </p>
      <p className="text-[12px] text-ink/80 mb-4 leading-relaxed">
        파노라마를 드래그해 둘러보세요. 빈 공간을 클릭하면 그 자리에 짧은 이야기를 남길 수 있어요.
      </p>

      {/* 바깥 컨테이너는 overflow-visible — 말풍선/입력창이 잘리지 않도록 */}
      <div className="relative aspect-[16/9] md:aspect-[2/1]">
        {/* 뷰어 캔버스만 클리핑 */}
        <div className="absolute inset-0 rounded-sm overflow-hidden bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
          <div ref={containerRef} className="absolute inset-0" />

          {comments.length === 0 && (
            <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] tracking-[0.2em] text-white/60 uppercase flex items-center gap-2">
              <MessageCircle className="w-3 h-3" /> 예시 코멘트 · 마커를 눌러보세요
            </div>
          )}
        </div>

        {/* Speech bubble for active comment — 뷰어 위에 떠 있고, 잘리지 않음 */}
        <AnimatePresence>
          {activeComment && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-1/2 -translate-x-1/2 bottom-3 md:bottom-6 w-[min(calc(100%-1.5rem),28rem)] z-50 [filter:drop-shadow(0_12px_32px_rgba(0,0,0,0.7))]"
            >
              <div className="relative bg-stone-900/95 backdrop-blur-md text-white rounded-2xl px-5 py-4 shadow-2xl border border-white/15 ring-1 ring-black/40">
                <button
                  onClick={() => setActiveComment(null)}
                  className="absolute top-2 right-2 text-white/70 hover:text-white"
                  aria-label="닫기"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="w-7 h-7 ring-1 ring-white/20">
                    {activeComment.avatar_url && <AvatarImage src={activeComment.avatar_url} />}
                    <AvatarFallback className="text-[10px] bg-white/15 text-white">
                      {activeComment.user_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] tracking-wider text-white/80">
                    {activeComment.user_name}
                  </span>
                </div>
                <p className="font-serif-kr text-[15px] leading-[1.7] text-white break-words whitespace-pre-wrap">
                  {activeComment.content}
                </p>
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-stone-900/95 rotate-45 border-r border-b border-white/15" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New comment composer */}
        <AnimatePresence>
          {draft && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.25 }}
              className="absolute left-1/2 -translate-x-1/2 bottom-3 md:bottom-4 w-[min(calc(100%-1.5rem),26rem)] z-50 max-h-[calc(100%-1.5rem)] overflow-y-auto"
            >
              <div className="bg-stone-900/95 backdrop-blur-md rounded-lg p-4 shadow-2xl border border-white/15 ring-1 ring-black/40 text-white">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] tracking-[0.3em] text-white/70">
                    NEW · {draft.pitch.toFixed(2)} / {draft.yaw.toFixed(2)}
                  </p>
                  <button
                    onClick={() => {
                      setDraft(null);
                      setText("");
                    }}
                    className="text-white/70 hover:text-white"
                    aria-label="취소"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 60))}
                  placeholder="이름 (선택)"
                  className="mb-2 h-8 text-[12px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                />
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 280))}
                  placeholder="이 자리에 어떤 이야기를 남길까요?"
                  className="text-[13px] min-h-[72px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30 font-serif-kr"
                  autoFocus
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-white/60 tabular-nums">
                    {text.length}/280
                  </span>
                  <Button
                    size="sm"
                    disabled={!text.trim() || submitting}
                    onClick={submitComment}
                    className="h-7 text-[11px] tracking-[0.2em] uppercase bg-white text-stone-900 hover:bg-white/90"
                  >
                    {submitting ? "남기는 중…" : "남기기"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {caption && (
        <p className="mt-3 text-[11px] text-ink-light italic">{caption}</p>
      )}

      <style>{`
        .av-dot {
          position: relative;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .av-dot-core {
          position: absolute;
          width: 8px;
          height: 8px;
          border-radius: 9999px;
          background: hsl(var(--accent));
          box-shadow: 0 0 12px hsl(var(--accent) / 0.9), 0 0 2px rgba(255,255,255,0.9);
        }
        .av-dot-ring {
          position: absolute;
          width: 22px;
          height: 22px;
          border-radius: 9999px;
          border: 1px solid hsl(var(--accent) / 0.6);
          opacity: 0.7;
          animation: avPulse 2.4s ease-out infinite;
        }
        @keyframes avPulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .av-tooltip {
          background: rgba(15, 15, 18, 0.92) !important;
          color: #fff !important;
          border-radius: 8px !important;
          padding: 6px 10px !important;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
      `}</style>
    </section>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string),
  );
}
