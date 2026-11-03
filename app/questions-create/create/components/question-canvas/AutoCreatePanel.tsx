"use client";

import { T } from "../../i18n";
import { Shuffle, Sparkles } from "lucide-react";
import type { QuestionManager } from "../../hooks/useQuestionManager";

export default function AutoCreatePanel({
  manager,
  onExitDemo,
}: {
  manager: QuestionManager;
  onExitDemo: () => void;
}) {
  const { questions, autoCount, setAutoCount, handleAutoCreate } = manager;

  return (
    <section className="rounded-xl border border-[#E7DCC7] bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FCE9E6] text-[#D42020]">
          <Sparkles size={18} />
        </span>
        <div>
          <h3 className="text-[14px] font-extrabold text-[#342B1E]">
            <T>Automatic question selection</T>
          </h3>
          <p className="mt-1 text-[12px] leading-5 text-[#80715A]">
            <T>Let the tool choose a random set from the questions you have loaded.</T>
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-[#EEE6D8] bg-[#FCF8EF] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="auto-question-count"
            className="text-[12px] font-bold text-[#65563F]"
          >
            <T>Number of questions</T>
          </label>
          <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[#83745C]">
            {questions.length} <T>available</T>
          </span>
        </div>
        <input
          id="auto-question-count"
          type="number"
          min={1}
          max={Math.max(1, questions.length)}
          value={autoCount}
          onChange={(event) =>
            setAutoCount(Math.max(1, Number(event.target.value) || 1))
          }
          className="mt-2 w-full rounded-lg border border-[#E7DCC7] bg-white px-3 py-2.5 text-[14px] font-bold text-[#342B1E] outline-none transition focus:border-[#D42020] focus:ring-2 focus:ring-[#D42020]/10"
        />
        <button
          type="button"
          onClick={() => {
            onExitDemo();
            handleAutoCreate();
          }}
          disabled={!questions.length}
          className={`mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.99] ${
            questions.length
              ? "bg-[#D42020] text-white shadow-sm shadow-red-900/10 hover:bg-[#B91C1C]"
              : "cursor-not-allowed bg-[#D42020]/50 text-white"
          }`}
        >
          <Shuffle size={15} />
          <T>Create random set</T>
        </button>
      </div>

      <p className="mt-3 text-[11px] leading-5 text-[#8A795F]">
        <T>Load questions first from Browse &amp; pick. Then return here to create a random set.</T>
      </p>
    </section>
  );
}
