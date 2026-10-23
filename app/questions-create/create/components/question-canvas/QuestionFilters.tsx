"use client";
import { T, useQuestionText } from "../../i18n";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import type { FilterOption } from "../../types/question";
import { Check, ChevronDown, ChevronUp, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { CLASS_OPTIONS, QUESTION_TYPE_OPTIONS } from "../../types/question";
function FilterSelect({ label, value, options, placeholder, disabled, loading, open, onOpen, onChange, }: {
    label: string;
    value: string;
    options: FilterOption[];
    placeholder: string;
    disabled?: boolean;
    loading?: boolean;
    open: boolean;
    onOpen: () => void;
    onChange: (value: string) => void;
}) {
    const { t } = useQuestionText();
    const selected = options.find((option) => option.value === value);
    const display = loading
        ? t(`Loading ${label.toLowerCase()}...`)
        : t(selected?.label || placeholder);
    return (<div className="relative">
      <button type="button" disabled={disabled || loading} onClick={onOpen} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left text-[15px] font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 ${disabled || loading
            ? "cursor-not-allowed border-[#E3D6B8] bg-[#F6EEDB] text-[#7A6A50] opacity-70"
            : open
                ? "border-[#DC2626] bg-[#FBF6E8] text-[#3B2F1E] ring-2 ring-[#DC2626]/40"
                : "border-[#E3D6B8] bg-[#FBF6E8] text-[#3B2F1E] hover:border-[#D8C9A6] hover:bg-[#EFE3C8]"}`}>
        <span className="truncate">{display}</span>
        {open ? (<ChevronUp size={16} className="text-[#6B5A40]"/>) : (<ChevronDown size={16} className="text-[#6B5A40]"/>)}
      </button>

      {open && !disabled && !loading ? (<>
      <span aria-hidden="true" className="absolute right-6 top-full z-[51] h-3 w-3 rotate-45 border-l-2 border-t-2 border-[#DC2626] bg-[#F0DDB5]"/>
      <div className="scroll absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border-2 border-[#DC2626] bg-[#F0DDB5] py-1 shadow-xl">
          {options.map((option) => {
                const active = option.value === value;
                return (<button type="button" key={option.value} onClick={() => onChange(option.value)} className={`flex w-full items-center gap-2 px-3 py-3 text-left text-[15px] transition duration-150 ${active ? "bg-[#F6D9A8] font-bold text-[#3B2F1E]" : "font-medium text-[#3B2F1E] hover:bg-[#F6D9A8]/70"}`}>
                <span className="w-4 shrink-0">
                  {active ? <Check size={16} className="text-[#DC2626]"/> : null}
                </span>
                <span className="truncate">{<T>{option.label}</T>}</span>
              </button>);
            })}
        </div></>) : null}
    </div>);
}
export default function QuestionFilters({ manager, onExitDemo, }: {
    manager: QuestionManager;
    onExitDemo: () => void;
}) {
    const { t } = useQuestionText();
    const { filtersOpen, setFiltersOpen, openFilter, setOpenFilter, selectedClass, selectedSubject, selectedChapter, selectedQuestionType, searchQuery, setSearchQuery, subjects, chapters, loadingSubjects, loadingChapters, questionError, loadingQuestions, handleClassChange, handleSubjectChange, handleChapterChange, handleFetchQuestions, setSelectedQuestionType, } = manager;
    return (<section id="question-filter-panel" className="rounded-2xl border border-[#E3D6B8] bg-[#FBF6E8] shadow-sm">
                <button type="button" onClick={() => setFiltersOpen((current) => !current)} className="flex w-full items-center justify-between rounded-t-2xl border-b border-[#E3D6B8] px-4 py-3.5 text-left transition duration-150 hover:bg-[#EFE3C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40">
                  <span className="flex items-center gap-2 text-[15px] font-bold uppercase tracking-wide text-[#3B2F1E]">
                    <SlidersHorizontal size={16} className="text-[#DC2626]"/><T>{"Filters\n                  "}</T></span>

                  {filtersOpen ? (<ChevronUp size={17} className="text-[#6B5A40]"/>) : (<ChevronDown size={17} className="text-[#6B5A40]"/>)}
                </button>

                {filtersOpen ? (<div className="space-y-3 p-4">
                    <FilterSelect label="class" value={selectedClass} placeholder="Select class" options={CLASS_OPTIONS} open={openFilter === "class"} onOpen={() => setOpenFilter(openFilter === "class" ? null : "class")} onChange={handleClassChange}/>

                    <FilterSelect label="subject" value={selectedSubject} placeholder="Select subject" options={subjects} loading={loadingSubjects} disabled={!selectedClass} open={openFilter === "subject"} onOpen={() => setOpenFilter(openFilter === "subject" ? null : "subject")} onChange={handleSubjectChange}/>

                    <FilterSelect label="chapter" value={selectedChapter} placeholder="Select chapter" options={chapters} loading={loadingChapters} disabled={!selectedSubject} open={openFilter === "chapter"} onOpen={() => setOpenFilter(openFilter === "chapter" ? null : "chapter")} onChange={handleChapterChange}/>

                    <FilterSelect label="question type" value={selectedQuestionType} placeholder="All question types" options={QUESTION_TYPE_OPTIONS} disabled={!selectedChapter} open={openFilter === "type"} onOpen={() => setOpenFilter(openFilter === "type" ? null : "type")} onChange={(value) => {
                setSelectedQuestionType(value);
                setOpenFilter(null);
            }}/>

                    <div className={`flex items-center gap-2 rounded-xl border px-3 py-3 transition duration-150 focus-within:border-[#DC2626] focus-within:ring-2 focus-within:ring-[#DC2626]/20 ${selectedChapter
                ? "border-[#E3D6B8] bg-[#FBF6E8]"
                : "border-[#E3D6B8] bg-[#F6EEDB] opacity-50"}`}>
                      <Search size={16} className="shrink-0 text-[#6B5A40]"/>

                      <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} disabled={!selectedChapter} onKeyDown={(event) => {
                if (event.key === "Enter") {
                    onExitDemo();
                    handleFetchQuestions();
                }
            }} placeholder={t("Search questions...")} className="w-full border-0 bg-transparent text-[15px] font-medium text-[#3B2F1E] outline-none placeholder:text-[#B0A080]"/>
                    </div>

                    {questionError ? (<p className="rounded-lg bg-red-50 px-3 py-2 text-[14px] font-semibold text-red-500">
                        <T>{questionError}</T>
                      </p>) : null}

                    <button type="button" onClick={() => {
                onExitDemo();
                handleFetchQuestions();
            }} disabled={!selectedClass ||
                !selectedSubject ||
                !selectedChapter ||
                loadingQuestions} className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[15px] font-bold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/40 active:scale-[0.98] ${!selectedClass ||
                !selectedSubject ||
                !selectedChapter ||
                loadingQuestions
                ? "cursor-not-allowed bg-[#D42020]/70 text-white"
                : "bg-[#D42020] text-white hover:bg-[#AE1717]"}`}>
                      {loadingQuestions ? (<Loader2 size={16} className="animate-spin"/>) : (<SlidersHorizontal size={16}/>)}

                      {loadingQuestions ? <T>{"Loading..."}</T> : <T>{"Apply filter"}</T>}
                    </button>
                  </div>) : null}
              </section>);
}
