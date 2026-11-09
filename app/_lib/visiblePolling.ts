/**
 * setInterval that does nothing while the browser tab is hidden, and refreshes
 * once as soon as the tab becomes visible again. Hidden/background tabs therefore
 * make no server requests (saves Vercel function invocations and Active CPU).
 * Returns a cleanup function.
 */
export function visibleInterval(callback: () => void, ms: number): () => void {
  const timer = window.setInterval(() => {
    if (document.visibilityState === "hidden") return;
    callback();
  }, ms);
  const onVisible = () => {
    if (document.visibilityState === "visible") callback();
  };
  document.addEventListener("visibilitychange", onVisible);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onVisible);
  };
}
