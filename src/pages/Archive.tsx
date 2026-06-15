import { Link } from "react-router-dom";

export default function Archive() {
  return (
    <main className="min-h-dvh bg-paper text-ink grain">
      {/* Top bar */}
      <header className="border-b border-faint">
        <div className="max-w-[1400px] mx-auto px-6 md:px-10 py-5 flex items-center justify-between">
          <Link to="/" className="text-xs tracking-[0.3em] uppercase text-ink-mid hover:text-ink transition-colors">
            ← Home
          </Link>
          <div className="text-[10px] tracking-[0.3em] uppercase text-ink-light">Archive</div>
        </div>
      </header>

      {/* Archive Content */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-10 pt-20 pb-14 text-center">
        <h1 className="font-display text-4xl mb-6">Archive</h1>
        <p className="text-ink-mid">이전 발행물과 디지털 굿즈가 모이는 공간입니다.</p>
        {/* 여기에 나중에 v0로 만든 굿즈 카드들을 넣으면 됩니다 */}
      </section>
    </main>
  );
}
