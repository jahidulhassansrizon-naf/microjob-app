"use client";

import { Shuffle } from "lucide-react";
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
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-[#F3A847]">
                  <Shuffle size={14} />
                </div>

                <div>
                  <h3 className="text-[11px] font-extrabold text-gray-800">
                    Auto create
                  </h3>

                  <p className="text-[9px] text-gray-400">
                    Pick a random set from the fetched questions.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <label className="text-[10px] font-bold text-gray-500">
                  Number of questions
                </label>

                <input
                  type="number"
                  min={1}
                  max={Math.max(1, questions.length)}
                  value={autoCount}
                  onChange={(event) =>
                    setAutoCount(Math.max(1, Number(event.target.value) || 1))
                  }
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-[11px] font-semibold outline-none focus:border-[#F3A847]"
                />

                <button
                  type="button"
                  onClick={() => {
                    onExitDemo();
                    handleAutoCreate();
                  }}
                  disabled={!questions.length}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-extrabold ${
                    questions.length
                      ? "bg-[#F3A847] text-white hover:bg-[#e29a3e]"
                      : "cursor-not-allowed bg-gray-100 text-gray-300"
                  }`}
                >
                  <Shuffle size={13} />
                  Create random set
                </button>

                <p className="text-[9px] leading-relaxed text-gray-400">
                  Fetch questions first from Browse &amp; pick, then use Auto
                  create to select a random set.
                </p>
              </div>
            </section>
  );
}
