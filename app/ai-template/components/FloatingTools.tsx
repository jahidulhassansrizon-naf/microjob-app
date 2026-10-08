"use client";
import { useAiTemplateText } from "./aiTemplateI18n";
export function FloatingTools() {
    const { t } = useAiTemplateText();
    return (<div className="floating-tools">
      <button type="button" className="yellow-float" aria-label={t("Move tool")}><span>↕</span></button>
      <button type="button" className="red-float" aria-label={t("Play tool")}><span>▶</span></button>
    </div>);
}
