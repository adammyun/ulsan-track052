import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Magazine article body — minimal editorial layout
 * - Refactored: Framer Motion added for scroll animations
 * - Refactored: Extracted into reusable <MarginArticle> component
 */

type Comment = {
  id: string;
  paragraphId: string;
  author: string;
  text: string;
  createdAt: number;
};

// ==========================================
// 1. Mock Data (테스트용 데이터)
// ==========================================
const PARAGRAPHS: { id: string; text: string }[] = [
  {
    id: "p1",
    text: "울산은 도시이기 전에 하나의 길이다. 산업의 동맥과 사람의 발자국이 교차하는 자리, 그 사이 어딘가에 우리는 052라는 숫자를 적어둔다.",
  },
  {
    id: "p2",
    text: "갓길은 언제나 임시의 장소처럼 보이지만, 사실은 가장 오래 머무는 사람들이 만드는 풍경이다. 멈춰선 트럭, 잠시 내린 사람, 그리고 그 옆을 스치는 바람.",
  },
  {
    id: "p3",
    text: "샛길로 접어들면 도시의 톤이 달라진다. 간판의 채도가 낮아지고, 발걸음의 속도가 느려지며, 익숙한 풍경이 낯선 각도로 다시 보인다.",
  },
  {
    id: "p4",
    text: "지름길은 가장 빠른 길이지만, 가장 적은 것을 기억하게 만드는 길이기도 하다. 우리는 종종 그 사이에서, 천천히 걷기로 결심한다.",
  },
  {
    id: "p5",
    text: "이 매거진은 그런 순간들을 모은다. 빠르게 지나치는 도시의 한 장면을 잠시 멈춰 세우고, 작은 코멘트를 여백에 적어두는 일.",
  },
];

const SEED_COMMENTS: Comment[] = [
  { id: "c1", paragraphId: "p1", author: "Editor", text: "도입부 톤이 좋아요. ‘하나의 길’이라는 메타포가 시리즈 전체를 관통합니다.", createdAt: Date.now() - 1000 * 60 * 60 * 3 },
  { id: "c2", paragraphId: "p3", author: "Reader", text: "‘간판의 채도’ — 이 표현 너무 좋네요.", createdAt: Date.now() - 1000 * 60 * 40 },
  { id: "c4", paragraphId: "p5", author: "Editor", text: "마무리 문단으로 자연스럽게 이어집니다.", createdAt: Date.now() - 1000 * 60 * 10 },
];

// ==========================================
// 2. Main Page Layout (메인 페이지 껍데기)
// ==========================================
export default function Article() {
  return (
    <main className="min-h-dvh bg-paper text-ink grain">
      {/* Top bar */}
      <header className="border-b border-faint">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <Link to="/" className="text-xs tracking-[0.3em] uppercase text-ink-mid hover:text-ink transition-colors">
            ← Track : 052
          </Link>
          <div className="text-[10px] tracking-[0.3em] uppercase text-ink-light">Issue 03 · Editorial</div>
        </div>
      </header>

      {/* Article masthead with Framer Motion fade-up */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-[1400px] mx-auto px-6 md:px-10 pt-20 pb-14"
      >
        <div className="max-w-[640px] mx-auto">
          <div className="text-[10px] tracking-[0.35em] uppercase text-ink-light mb-6">Essay · 052</div>
          <h1 className="font-display text-4xl md:text-5xl leading-[1.15] tracking-tight">
            여백에 적어둔 도시,<br />그리고 길의 기록
          </h1>
          <p className="mt-6 text-sm text-ink-mid leading-relaxed">
            글 — 편집부 · 사진 — 김도현 · 2026.05
          </p>
        </div>
      </motion.section>

      {/* Reusable Component injected here */}
      <MarginArticle paragraphs={PARAGRAPHS} initialComments={SEED_COMMENTS} />

      <footer className="border-t border-faint">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-10 text-[10px] tracking-[0.3em] uppercase text-ink-light flex justify-between">
          <span>Track : 052</span>
          <span>Editorial</span>
        </div>
      </footer>
    </main>
  );
}

// ==========================================
// 3. Reusable Component (재사용 가능한 마진 코멘트 본문)
// ==========================================
interface MarginArticleProps {
  paragraphs: { id: string; text: string }[];
  initialComments: Comment[];
}

export function MarginArticle({ paragraphs, initialComments }: MarginArticleProps) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [composeFor, setComposeFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const paragraphRefs = useRef<Record<string, HTMLParagraphElement | null>>({});
  const [offsets, setOffsets] = useState<Record<string, number>>({});
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Measure paragraph offsets so comments align vertically
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const base = containerRef.current.getBoundingClientRect().top;
      const next: Record<string, number> = {};
      for (const p of paragraphs) {
        const el = paragraphRefs.current[p.id];
        if (el) next[p.id] = el.getBoundingClientRect().top - base;
      }
      setOffsets(next);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [comments, composeFor, paragraphs]);

  const commentsByParagraph = useMemo(() => {
    const map: Record<string, Comment[]> = {};
    for (const c of comments) (map[c.paragraphId] ||= []).push(c);
    return map;
  }, [comments]);

  const submitComment = (pid: string) => {
    const text = draft.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      { id: `c-${Date.now()}`, paragraphId: pid, author: "You", text, createdAt: Date.now() },
    ]);
    setDraft("");
    setComposeFor(null);
    setActiveId(pid);
  };

  return (
    <section ref={containerRef} className="relative max-w-[1400px] mx-auto px-6 md:px-10 pb-32">
      <div className="md:grid md:grid-cols-[1fr_minmax(0,640px)_1fr] md:gap-10">
        {/* left margin spacer */}
        <div aria-hidden className="hidden md:block" />

        {/* reading column */}
        <article className="font-serif-kr text-[18px] md:text-[19px] leading-[2] tracking-[-0.005em] text-ink space-y-7">
          {paragraphs.map((p, index) => {
            const isActive = activeId === p.id || composeFor === p.id;
            return (
              <motion.p
                key={p.id}
                ref={(el) => (paragraphRefs.current[p.id] = el as HTMLParagraphElement)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.6, delay: index * 0.05 }}
                onMouseEnter={() => setActiveId(p.id)}
                onMouseLeave={() => setActiveId((cur) => (cur === p.id ? null : cur))}
                onClick={() => {
                  setComposeFor(p.id);
                  setActiveId(p.id);
                }}
                className={[
                  "relative cursor-text transition-all duration-500 ease-out",
                  "border-r-2 pr-4 -mr-4",
                  isActive ? "border-ink/30 text-ink" : "border-transparent text-ink/85",
                ].join(" ")}
              >
                {p.text}
              </motion.p>
            );
          })}
        </article>

        {/* right margin: floating comments (desktop) */}
        <aside className="hidden md:block relative">
          {paragraphs.map((p) => {
            const list = commentsByParagraph[p.id] || [];
            const isActive = activeId === p.id || composeFor === p.id;
            const top = offsets[p.id] ?? 0;
            const isComposing = composeFor === p.id;
            if (list.length === 0 && !isComposing) return null;
            return (
              <div
                key={p.id}
                className="absolute left-0 right-0 transition-all duration-500 ease-out"
                style={{
                  top,
                  opacity: isActive ? 1 : 0.28,
                  transform: isActive ? "translateX(0)" : "translateX(-4px)",
                }}
              >
                {/* connector line */}
                <div
                  aria-hidden
                  className="absolute -left-10 top-3 h-px bg-ink/20 transition-all duration-500"
                  style={{ width: isActive ? "2.25rem" : "1.25rem" }}
                />
                <div className="space-y-2 pr-2">
                  {list.map((c) => (
                    <CommentBubble key={c.id} comment={c} active={isActive} />
                  ))}
                  {isComposing && (
                    <ComposeBubble
                      value={draft}
                      onChange={setDraft}
                      onSubmit={() => submitComment(p.id)}
                      onCancel={() => {
                        setComposeFor(null);
                        setDraft("");
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </aside>
      </div>

      {/* Mobile: comments inline below body */}
      <div className="md:hidden mt-16 border-t border-faint pt-8 space-y-6">
        <div className="text-[10px] tracking-[0.3em] uppercase text-ink-light">Margin notes</div>
        {comments.map((c) => (
          <div key={c.id} className="text-sm text-ink-mid">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-light mb-1">
              {paragraphs.findIndex((p) => p.id === c.paragraphId) + 1}문단 · {c.author}
            </div>
            {c.text}
          </div>
        ))}
      </div>
    </section>
  );
}

// ==========================================
// 4. Sub Components (코멘트 말풍선 및 입력창 UI)
// ==========================================
function CommentBubble({ comment, active }: { comment: Comment; active: boolean }) {
  return (
    <div
      className={[
        "rounded-sm border bg-card-bg/60 backdrop-blur-sm px-3 py-2 text-[12.5px] leading-relaxed",
        "transition-all duration-500 ease-out",
        active
          ? "border-ink/15 text-ink shadow-[0_1px_0_hsl(var(--ink)/0.04)]"
          : "border-transparent text-ink-light",
      ].join(" ")}
    >
      <div className="text-[9px] tracking-[0.25em] uppercase text-ink-light mb-1">
        {comment.author} · {timeAgo(comment.createdAt)}
      </div>
      <div>{comment.text}</div>
    </div>
  );
}

function ComposeBubble({
  value,
  onChange,
  onSubmit,
  onCancel,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="rounded-sm border border-ink/20 bg-paper px-3 py-2 animate-fade-up">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
          if (e.key === "Escape") onCancel();
        }}
        placeholder="여백에 코멘트를 남겨보세요…"
        rows={2}
        className="w-full bg-transparent text-[12.5px] leading-relaxed text-ink placeholder:text-ink-light focus:outline-none resize-none"
      />
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] tracking-[0.25em] uppercase text-ink-light">⌘ + ↵ 등록</span>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="text-[10px] tracking-[0.2em] uppercase text-ink-light hover:text-ink transition-colors"
          >
            취소
          </button>
          <button
            onClick={onSubmit}
            className="text-[10px] tracking-[0.2em] uppercase text-ink hover:text-accent-c transition-colors"
          >
            등록
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "방금";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  return `${d}일 전`;
}
