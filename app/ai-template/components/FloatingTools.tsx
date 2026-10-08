"use client";
import { T } from "@/components/i18n/I18nProvider";
export function FloatingTools() {
    return (<div className="floating-tools">
      <button type="button" className="yellow-float"><T>{"\u2195"}</T></button>
      <button type="button" className="red-float"><span><T>{"\u25B6"}</T></span></button>
    </div>);
}
