"use client";
import { T } from "@/components/i18n/I18nProvider";
import { Shuffle } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";
export default function AutoCreatePanel({ manager, onExitDemo, }: {
    manager: QuestionManager;
    onExitDemo: () => void;
}) {
    const { questions, autoCount, setAutoCount, handleAutoCreate } = manager;
    return (<section className="rounded-xl border border-[#E2E8F0] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E2E8F0] text-[#2563EB]">
                  <Shuffle size={14}/>
                </div>

                <div>
                  <h3 className="text-[11px] font-extrabold text-[#0F172A]"><T>{"Auto create\n                  "}</T></h3>

                  <p className="text-[9px] text-[#0F172A]/55"><T>{"Pick a random set from the fetched questions.\n                  "}</T></p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-[10px] font-bold text-[#0F172A]/70"><T>{"Number of questions\n                "}</T></label>

                <input type="number" min={1} max={Math.max(1, questions.length)} value={autoCount} onChange={(event) => setAutoCount(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-xl border border-[#E2E8F0] px-3 py-2.5 text-[11px] font-semibold outline-none focus:border-[#2563EB]"/>

                <button type="button" onClick={() => {
            onExitDemo();
            handleAutoCreate();
        }} disabled={!questions.length} className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-extrabold ${questions.length
            ? "bg-[#2563EB] text-white hover:bg-[#2563EB]"
            : "cursor-not-allowed bg-[#E2E8F0] text-[#0F172A]/40"}`}>
                  <Shuffle size={13}/><T>{"Create random set\n                "}</T></button>

                <p className="text-[9px] leading-relaxed text-[#0F172A]/55"><T>{"Fetch questions first from Browse &amp; pick, then use Auto\n                  create to select a random set.\n                "}</T></p>
              </div>
            </section>);
}
