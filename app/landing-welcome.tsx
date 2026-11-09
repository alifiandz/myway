"use client";
import { useEffect, useRef } from "react";

// The approved standalone design keeps its own styles and animation lifecycle.
// Only these two explicit actions can reach the surrounding application.
export default function LandingWelcome({ openAccount, explore }: { openAccount: () => void; explore: () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== "myway-landing-action") return;
      if (event.data.action === "account") openAccount();
      else if (event.data.action === "browse") explore();
    };
    window.addEventListener("message", receive);
    return () => window.removeEventListener("message", receive);
  }, [openAccount, explore]);
  return <iframe ref={frame} className="myway-landing-frame" src="/welcome/index.html" title="MyWay · Explore. Plan. Go Further." />;
}
