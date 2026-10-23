"use client";
import { T } from "../../i18n";
import { Shuffle } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";
export default function AutoCreatePanel({ manager, onExitDemo, }: {
    manager: QuestionManager;
    onExitDemo: () => void;
}) {
    const { questions, autoCount, setAutoCount, handleAutoCreate } = manager;
    return (<section className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#FBB6B6] bg-[#FEE9E9] text-[#DC2626]">
                  <Shuffle size={17}/>
                </div>

                <div>
                  <h3 className="text-[17px] font-bold text-[#3B2F1E]"><T>{"Auto create\n                  "}</T></h3>

                  <p className="text-[14px] text-[#6B5A40]"><T>{"Pick a random set from the fetched questions.\n                  "}</T></p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-[13px] font-semibold uppercase tracking-wide text-[#6B5A40]"><T>{"Number of questions\n                "}</T></label>

                <input type="number" min={1} max={Math.max(1, questions.length)} value={autoCount} onChange={(event) => setAutoCount(Math.max(1, Number(event.target.value) || 1))} className="w-full rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] px-3 py-2.5 text-[15px] font-semibold text-[#3B2F1E] outline-none transition duration-150 focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20"/>

                <button type="button" onClick={() => {
            onExitDemo();
            handleAutoCreate();
        }} disabled={!questions.length} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold transition duration-150 active:scale-[0.98] ${questions.length
            ? "bg-[#D42020] text-white hover:bg-[#AE1717]"
            : "cursor-not-allowed bg-[#D42020]/70 text-white"}`}>
                  <Shuffle size={16}/><T>{"Create random set\n                "}</T></button>

                <p className="text-[14px] leading-[1.7] text-[#6B5A40]"><T>{"Fetch questions first from Browse &amp; pick, then use Auto\n                  create to select a random set.\n                "}</T></p>
              </div>
            </section>);
}
