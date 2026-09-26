"use client";

import type { QuestionManager } from "../../hooks/useQuestionManager";
import type { Question } from "../../types/question";
import AutoCreatePanel from "./AutoCreatePanel";
import FetchedQuestionList from "./FetchedQuestionList";
import QuestionFilters from "./QuestionFilters";
import SelectedQuestionsPanel from "./SelectedQuestionsPanel";

export default function CanvasSidebar({
  manager,
  demoMode,
  onExitDemo,
  displaySelectedQuestions,
}: {
  manager: QuestionManager;
  demoMode: boolean;
  onExitDemo: () => void;
  displaySelectedQuestions: Question[];
}) {
  const { selectedTab, setSelectedTab } = manager;

  return (
    <aside className="screen-only flex w-full min-h-0 shrink-0 flex-col gap-3 lg:w-[315px] xl:w-[330px]">
      <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
        <button
          type="button"
          onClick={() => setSelectedTab("browse")}
          className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition ${
            selectedTab === "browse"
              ? "bg-orange-50 text-[#F3A847]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Browse &amp; pick
        </button>

        <button
          type="button"
          onClick={() => setSelectedTab("auto")}
          className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition ${
            selectedTab === "auto"
              ? "bg-orange-50 text-[#F3A847]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Auto create
        </button>
      </div>

      {selectedTab === "browse" ? (
        <>
          <QuestionFilters manager={manager} onExitDemo={onExitDemo} />
          <FetchedQuestionList manager={manager} onExitDemo={onExitDemo} />
          <SelectedQuestionsPanel
            manager={manager}
            displaySelectedQuestions={displaySelectedQuestions}
          />
        </>
      ) : (
        <AutoCreatePanel manager={manager} onExitDemo={onExitDemo} />
      )}
    </aside>
  );
}
