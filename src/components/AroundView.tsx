import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Viewer } from "@photo-sphere-viewer/core";
import { MarkersPlugin, type Marker } from "@photo-sphere-viewer/markers-plugin";
import "@photo-sphere-viewer/core/index.css";
import "@photo-sphere-viewer/markers-plugin/index.css";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { X, MessageCircle } from "lucide-react";
import { Pencil, Trash2 } from "lucide-react";

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
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<AroundComment | null>(null);
  const [editText, setEditText] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 더미 예시 코멘트는 항상 유지하고, 사용자 코멘트는 누적해서 함께 렌더링
  const effectiveComments = useMemo<AroundComment[]>(
    () => [...DUMMY_COMMENTS, ...comments],
    [comments],
  );

  // Fetch comments
  const loadComments = useCallback(async () => {
    const { data, error } = await supabase
      .from("around_view_comments")
      .select("id,path_id,user_name,avatar_url,pitch,yaw,content,created_at")
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

  // ── Photo Sphere Viewer 초기화 ──────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;
    const viewer = new Viewer({
      container: containerRef.current,
      panorama: activePanorama || PLACEHOLDER_PANO,
      navbar: false,
      defaultZoomLvl: 30,
      mousewheel: false,
      touchmoveTwoFingers: false,
      plugins: [[MarkersPlugin, {}]],
    });
    viewerRef.current = viewer;
    markersRef.current = viewer.getPlugin(MarkersPlugin) as MarkersPlugin;

    const handleClick = (_: unknown, data: { rightclick: boolean; yaw: number; pitch: number; target: HTMLElement | null }) => {
      if (data.rightclick) return;
      // 마커 클릭은 select-marker가 따로 처리
      if (data.target && data.target.closest?.(".psv-marker")) return;
      setActiveComment(null);
      setDraft({ pitch: data.pitch, yaw: data.yaw });
    };
    const handleSelect = (_: unknown, marker: Marker) => {
      const id = marker.id;
      const found =
        DUMMY_COMMENTS.find((c) => c.id === id) ||
        // 최신 comments는 클로저 대신 setState 콜백으로 조회 어렵 -> querySelector 우회
        null;
      if (found) {
        setDraft(null);
        setActiveComment(found);
        return;
      }
      // 사용자 코멘트: data 속성에서 직접 가져오기
      const data = (marker.data ?? {}) as { comment?: AroundComment };
      if (data.comment) {
        setDraft(null);
        setActiveComment(data.comment);
      }
    };
    viewer.addEventListener("click", handleClick as never);
    markersRef.current.addEventListener("select-marker", handleSelect as never);

    return () => {
      viewer.destroy();
      viewerRef.current = null;
      markersRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 파노라마 교체
  useEffect(() => {
    const v = viewerRef.current;
    if (!v) return;
    v.setPanorama(activePanorama || PLACEHOLDER_PANO, { showLoader: true }).catch(() => {});
  }, [activePanorama]);

  // 마커 동기화
  useEffect(() => {
    const m = markersRef.current;
    if (!m) return;
    const html = `
      <div class="av-dot" aria-label="코멘트">
        <span class="av-dot-pulse"></span>
        <span class="av-dot-outline"></span>
        <span class="av-dot-ring"></span>
        <span class="av-dot-core"></span>
      </div>`;
    m.setMarkers(
      effectiveComments.map((c) => ({
        id: c.id,
        position: { yaw: c.yaw, pitch: c.pitch },
        html,
        anchor: "center center",
        size: { width: 26, height: 26 },
        zIndex: 100,
        data: { comment: c },
      })),
    );
  }, [effectiveComments]);

  const submitComment = async () => {
    if (!draft || !text.trim()) return;
    if (password && (password.length < 4 || password.length > 60)) {
      toast({ title: "비밀번호는 4~60자여야 해요", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.rpc("insert_around_comment", {
      _path_id: pathId,
      _user_name: name.trim() || "익명의 여행자",
      _pitch: draft.pitch,
      _yaw: draft.yaw,
      _content: text.trim().slice(0, 280),
      _password: password || null,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: "코멘트 저장 실패", description: error.message, variant: "destructive" });
      return;
    }
    const inserted = Array.isArray(data) ? data[0] : data;
    if (inserted) {
      const safe = inserted as unknown as AroundComment;
      setComments((prev) => [...prev, safe]);
    }
    setDraft(null);
    setText("");
    setPassword("");
    toast({ title: "코멘트가 추가됐어요" });
  };

  const submitEdit = async () => {
    if (!editing || !editText.trim()) return;
    if (!editPassword) {
      toast({ title: "비밀번호를 입력해주세요", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    const { data, error } = await supabase.rpc("update_around_comment", {
      _id: editing.id,
      _password: editPassword,
      _content: editText.trim().slice(0, 280),
    });
    setActionLoading(false);
    if (error) {
      toast({ title: "수정 실패", description: error.message, variant: "destructive" });
      return;
    }
    const updated = Array.isArray(data) ? data[0] : data;
    if (updated) {
      const safe = updated as unknown as AroundComment;
      setComments((prev) => prev.map((c) => (c.id === editing.id ? safe : c)));
      setActiveComment(safe);
    }
    setEditing(null);
    setEditText("");
    setEditPassword("");
    toast({ title: "코멘트를 수정했어요" });
  };

  const submitDelete = async () => {
    if (!deletingId) return;
    if (!deletePassword) {
      toast({ title: "비밀번호를 입력해주세요", variant: "destructive" });
      return;
    }
    setActionLoading(true);
    const { error } = await supabase.rpc("delete_around_comment", {
      _id: deletingId,
      _password: deletePassword,
    });
    setActionLoading(false);
    if (error) {
      toast({ title: "삭제 실패", description: error.message, variant: "destructive" });
      return;
    }
    setComments((prev) => prev.filter((c) => c.id !== deletingId));
    if (activeComment?.id === deletingId) setActiveComment(null);
    setDeletingId(null);
    setDeletePassword("");
    toast({ title: "코멘트를 삭제했어요" });
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
        {/* 구면 파노라마 뷰어 */}
        <div
          ref={containerRef}
          className="av-psv-container absolute inset-0 rounded-sm overflow-hidden bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]"
        />
        {comments.length === 0 && (
          <div className="pointer-events-none absolute bottom-3 left-3 text-[10px] tracking-[0.2em] text-white/60 uppercase flex items-center gap-2 z-10">
            <MessageCircle className="w-3 h-3" /> 예시 코멘트 · 마커를 눌러보세요
          </div>
        )}

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
                {!activeComment._dummy && (
                  <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-end gap-1">
                    <button
                      onClick={() => {
                        setEditing(activeComment);
                        setEditText(activeComment.content);
                        setEditPassword("");
                      }}
                      className="text-[10px] tracking-[0.2em] uppercase text-white/70 hover:text-white inline-flex items-center gap-1 px-2 py-1"
                    >
                      <Pencil className="w-3 h-3" /> 수정
                    </button>
                    <button
                      onClick={() => {
                        setDeletingId(activeComment.id);
                        setDeletePassword("");
                      }}
                      className="text-[10px] tracking-[0.2em] uppercase text-red-300/80 hover:text-red-200 inline-flex items-center gap-1 px-2 py-1"
                    >
                      <Trash2 className="w-3 h-3" /> 삭제
                    </button>
                  </div>
                )}
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
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 60))}
                  placeholder="수정/삭제용 비밀번호 (선택, 4~60자)"
                  className="mt-2 h-8 text-[12px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
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

        {/* Edit modal overlay */}
        <AnimatePresence>
          {editing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setEditing(null)}
            >
              <div
                className="w-[min(100%,28rem)] bg-stone-900 rounded-lg p-5 border border-white/15 ring-1 ring-black/40 text-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] tracking-[0.3em] text-white/70">EDIT COMMENT</p>
                  <button onClick={() => setEditing(null)} className="text-white/70 hover:text-white" aria-label="닫기">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <Textarea
                  value={editText}
                  onChange={(e) => setEditText(e.target.value.slice(0, 280))}
                  className="text-[13px] min-h-[100px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30 font-serif-kr"
                  autoFocus
                />
                <Input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value.slice(0, 60))}
                  placeholder="작성 시 입력한 비밀번호"
                  className="mt-2 h-9 text-[12px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] text-white/60 tabular-nums">{editText.length}/280</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing(null)}
                      className="h-8 text-[11px] tracking-[0.2em] uppercase text-white/80 hover:text-white hover:bg-white/10"
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      disabled={!editText.trim() || !editPassword || actionLoading}
                      onClick={submitEdit}
                      className="h-8 text-[11px] tracking-[0.2em] uppercase bg-white text-stone-900 hover:bg-white/90"
                    >
                      {actionLoading ? "수정 중…" : "수정"}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete confirm overlay */}
        <AnimatePresence>
          {deletingId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
              onClick={() => setDeletingId(null)}
            >
              <div
                className="w-[min(100%,24rem)] bg-stone-900 rounded-lg p-5 border border-white/15 ring-1 ring-black/40 text-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] tracking-[0.3em] text-red-300/90">DELETE COMMENT</p>
                  <button onClick={() => setDeletingId(null)} className="text-white/70 hover:text-white" aria-label="닫기">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[12px] text-white/80 mb-3 leading-relaxed">
                  정말 이 코멘트를 삭제할까요? 삭제 후에는 되돌릴 수 없습니다.
                </p>
                <Input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value.slice(0, 60))}
                  placeholder="작성 시 입력한 비밀번호"
                  className="h-9 text-[12px] bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
                  autoFocus
                />
                <div className="flex justify-end gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setDeletingId(null)}
                    className="h-8 text-[11px] tracking-[0.2em] uppercase text-white/80 hover:text-white hover:bg-white/10"
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    disabled={!deletePassword || actionLoading}
                    onClick={submitDelete}
                    className="h-8 text-[11px] tracking-[0.2em] uppercase bg-red-500 text-white hover:bg-red-500/90"
                  >
                    {actionLoading ? "삭제 중…" : "삭제"}
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

    </section>
  );
}
