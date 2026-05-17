import { MapPin } from "lucide-react";
import { useCurrentLocation } from "@/hooks/useCurrentLocation";

interface Props {
  scrolled: boolean;
}

export default function HeaderLocation({ scrolled }: Props) {
  const { status, label } = useCurrentLocation();

  let text = "위치를 찾는 중...";
  if (status === "ready" && label) text = `현재 위치: ${label}`;
  else if (status === "denied" || status === "error" || status === "insecure" || status === "unsupported") {
    text = "위치 알 수 없음";
  } else if (status === "loading") text = "위치를 찾는 중...";

  return (
    <div
      className={`mt-1 flex items-center justify-end gap-1 text-[9px] tracking-[0.12em] tabular-nums transition-colors ${
        scrolled ? "text-ink-light" : "text-white/55"
      }`}
      aria-live="polite"
    >
      <MapPin className="w-2.5 h-2.5 opacity-80" />
      <span className="truncate max-w-[180px]">{text}</span>
    </div>
  );
}
