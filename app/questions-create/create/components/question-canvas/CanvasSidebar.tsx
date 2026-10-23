"use client";
import { T } from "../../i18n";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import type { Question } from "../../types/question";
import AutoCreatePanel from "./AutoCreatePanel";
import FetchedQuestionList from "./FetchedQuestionList";
import QuestionFilters from "./QuestionFilters";
import SelectedQuestionsPanel from "./SelectedQuestionsPanel";
export default function CanvasSidebar({ manager, demoMode, onExitDemo, displaySelectedQuestions, }: {
    manager: QuestionManager;
    demoMode: boolean;
    onExitDemo: () => void;
    displaySelectedQuestions: Question[];
}) {
    const { selectedTab, setSelectedTab } = manager;
    return (<aside className="screen-only page-font flex w-full min-h-0 shrink-0 flex-col gap-3 lg:w-[315px] xl:w-[330px]">
      <div className="flex rounded-xl border border-[#E3D6B8] bg-[#FBF6E8] p-1 shadow-sm">
        <button type="button" onClick={() => setSelectedTab("browse")} className={`flex-1 rounded-lg py-2.5 text-[15px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${selectedTab === "browse"
            ? "border border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40"
            : "text-[#5A4A32] hover:bg-[#EFE3C8] hover:text-[#3B2F1E]"}`}><T>{"Browse &amp; pick\n        "}</T></button>

        <button type="button" onClick={() => setSelectedTab("auto")} className={`flex-1 rounded-lg py-2.5 text-[15px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${selectedTab === "auto"
            ? "border border-[#DC2626] bg-[#F6D9A8] text-[#DC2626] ring-2 ring-[#DC2626]/40"
            : "text-[#5A4A32] hover:bg-[#EFE3C8] hover:text-[#3B2F1E]"}`}><T>{"Auto create\n        "}</T></button>
      </div>

      {selectedTab === "browse" ? (<>
          <QuestionFilters manager={manager} onExitDemo={onExitDemo}/>
          <FetchedQuestionList manager={manager} onExitDemo={onExitDemo}/>
          <SelectedQuestionsPanel manager={manager} displaySelectedQuestions={displaySelectedQuestions}/>
        </>) : (<AutoCreatePanel manager={manager} onExitDemo={onExitDemo}/>)}
    </aside>);
}
