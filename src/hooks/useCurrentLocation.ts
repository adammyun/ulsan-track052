import { useEffect, useState } from "react";

export type LocationStatus = "idle" | "loading" | "ready" | "denied" | "error" | "insecure" | "unsupported";

interface State {
  status: LocationStatus;
  label: string | null;
}

/**
 * Resolve the user's coarse current location ("울산광역시 남구" 형태) via
 * navigator.geolocation + BigDataCloud free reverse-geocoder (no API key).
 */
export function useCurrentLocation(): State {
  const [state, setState] = useState<State>({ status: "loading", label: null });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.isSecureContext) {
      setState({ status: "insecure", label: null });
      return;
    }
    if (!("geolocation" in navigator)) {
      setState({ status: "unsupported", label: null });
      return;
    }

    let cancelled = false;
    setState({ status: "loading", label: null });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`,
          );
          if (!res.ok) throw new Error("reverse-geocode failed");
          const data = await res.json();
          if (cancelled) return;
          const principal =
            data.principalSubdivision || data.countryName || "";
          const local =
            data.city || data.locality || data.localityInfo?.administrative?.[3]?.name || "";
          const label = [principal, local].filter(Boolean).join(" ") || "위치 알 수 없음";
          setState({ status: "ready", label });
        } catch {
          if (!cancelled) setState({ status: "error", label: null });
        }
      },
      (err) => {
        if (cancelled) return;
        if (err.code === err.PERMISSION_DENIED) setState({ status: "denied", label: null });
        else setState({ status: "error", label: null });
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 12_000 },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
