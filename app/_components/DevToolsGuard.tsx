"use client";

import { useEffect, useState } from "react";

/**
 * DevToolsGuard
 * - Live সাইটে (production) F12 / Ctrl+Shift+I/J/C / Ctrl+U / Right-click বন্ধ করে।
 * - কেউ ব্রাউজার মেনু থেকে DevTools খুললে ধরে ফেলে পুরো পেজে একটা পর্দা দেখায়।
 * - localhost এ কিছুই করে না, তাই আপনার ডেভেলপমেন্ট একদম আগের মতো চলবে।
 */

const LOCAL_HOSTS = ["localhost", "127.0.0.1", "[::1]", "::1"];

function isLocalHost(): boolean {
  const h = window.location.hostname;
  return LOCAL_HOSTS.includes(h) || h.endsWith(".local");
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || el.isContentEditable;
}

export default function DevToolsGuard() {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (isLocalHost()) return;

    // ---------- 1) Keyboard shortcuts ----------
    const onKeyDown = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;
      const code = e.code;
      const shouldBlock =
        e.key === "F12" ||
        (ctrl && e.shiftKey && ["KeyI", "KeyJ", "KeyC", "KeyK"].includes(code)) ||
        (ctrl && !e.shiftKey && code === "KeyU") ||
        (e.metaKey && e.altKey && ["KeyI", "KeyJ", "KeyC", "KeyU"].includes(code));
      if (shouldBlock) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // ---------- 2) Right click (input/textarea বাদে) ----------
    const onContextMenu = (e: MouseEvent) => {
      if (isEditable(e.target)) return;
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("contextmenu", onContextMenu, true);

    // ---------- 3) DevTools খোলা আছে কিনা ধরা ----------
    let getterHit = false;
    const probe = new Image();
    Object.defineProperty(probe, "id", {
      get() {
        getterHit = true;
        return "";
      },
    });

    const check = () => {
      // পদ্ধতি A: debugger থামলে সময় বেড়ে যায় (DevTools খোলা থাকলেই)
      const start = performance.now();
      try {
        new Function("debugger")();
      } catch {
        /* ignore */
      }
      const paused = performance.now() - start > 100;

      // পদ্ধতি B: console খোলা থাকলে element এর getter চলে
      const hit = getterHit;
      getterHit = false;
      try {
        console.debug(probe);
        console.clear();
      } catch {
        /* ignore */
      }

      setBlocked(paused || hit);
    };

    const timer = window.setInterval(check, 1000);
    check();

    return () => {
      window.clearInterval(timer);
      window.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("contextmenu", onContextMenu, true);
    };
  }, []);

  if (!blocked) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        background: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 12,
        padding: 24,
        textAlign: "center",
        fontFamily: "inherit",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 700, color: "#b91c1c" }}>
        ডেভেলপার টুলস বন্ধ করুন
      </div>
      <div style={{ fontSize: 15, color: "#374151", maxWidth: 420 }}>
        নিরাপত্তার কারণে এই ওয়েবসাইটে Developer Tools ব্যবহার করা যায় না।
        চালিয়ে যেতে Developer Tools বন্ধ করে দিন।
      </div>
    </div>
  );
}
