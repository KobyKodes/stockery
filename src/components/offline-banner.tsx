"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { WifiOff } from "lucide-react";

// The app is online only. When the connection drops, say so and stop every
// control that would try to write, so a take is never silently lost.

const OnlineContext = createContext(true);

/** True while the browser believes it can reach the network. */
export function useOnline() {
  return useContext(OnlineContext);
}

export function OnlineProvider({ children }: { children: ReactNode }) {
  // Assume online until the browser says otherwise, so the server and the
  // first client render agree.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return (
    <OnlineContext.Provider value={online}>
      {online ? null : (
        <div role="status" className="sticky top-14 z-40 flex items-center gap-3 bg-bay-red px-4 py-2 text-paper md:px-6">
          <WifiOff aria-hidden className="size-5 shrink-0" />
          <p className="text-base">You&apos;re offline. Changes won&apos;t save until you&apos;re back on Wi-Fi.</p>
        </div>
      )}
      {children}
    </OnlineContext.Provider>
  );
}
