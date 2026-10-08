"use client";
import { T } from "@/components/i18n/I18nProvider";
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
    return (<aside className="screen-only flex w-full min-h-0 shrink-0 flex-col gap-3 lg:w-[315px] xl:w-[330px]">
      <div className="flex rounded-xl border border-[#E2E8F0] bg-white p-1 shadow-sm">
        <button type="button" onClick={() => setSelectedTab("browse")} className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition ${selectedTab === "browse"
            ? "bg-[#E2E8F0] text-[#2563EB]"
            : "text-[#0F172A]/70 hover:text-[#0F172A]"}`}><T>{"Browse &amp; pick\n        "}</T></button>

        <button type="button" onClick={() => setSelectedTab("auto")} className={`flex-1 rounded-lg py-2 text-[11px] font-bold transition ${selectedTab === "auto"
            ? "bg-[#E2E8F0] text-[#2563EB]"
            : "text-[#0F172A]/70 hover:text-[#0F172A]"}`}><T>{"Auto create\n        "}</T></button>
      </div>

      {selectedTab === "browse" ? (<>
          <QuestionFilters manager={manager} onExitDemo={onExitDemo}/>
          <FetchedQuestionList manager={manager} onExitDemo={onExitDemo}/>
          <SelectedQuestionsPanel manager={manager} displaySelectedQuestions={displaySelectedQuestions}/>
        </>) : (<AutoCreatePanel manager={manager} onExitDemo={onExitDemo}/>)}
    </aside>);
}
