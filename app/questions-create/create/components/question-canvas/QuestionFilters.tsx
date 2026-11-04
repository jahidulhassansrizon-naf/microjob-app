"use client";

import { T, useQuestionText } from "../../i18n";
import type { QuestionManager } from "../../hooks/useQuestionManager";
import type { FilterOption } from "../../types/question";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { CLASS_OPTIONS, QUESTION_TYPE_OPTIONS } from "../../types/question";

function FilterSelect({
  label,
  value,
  options,
  placeholder,
  disabled,
  loading,
  open,
  onOpen,
  onChange,
}: {
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

  return (
    <div className="relative min-w-0">
      <span className="mb-1.5 block text-[12px] font-bold text-[#77684F]">
        <T>{label}</T>
      </span>
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onOpen}
        className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-[13px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 ${
          disabled || loading
            ? "cursor-not-allowed border-[#E8DFCF] bg-[#F5F0E6] text-[#9B8D76]"
            : open
              ? "border-[#D42020] bg-white text-[#342B1E] ring-2 ring-[#D42020]/10"
              : "border-[#E7DCC7] bg-white text-[#4A3D2A] hover:border-[#D8C9A6] hover:bg-[#FFFEFB]"
        }`}
      >
        <span className="truncate">{display}</span>
        {open ? (
          <ChevronUp size={15} className="shrink-0 text-[#8B7655]" />
        ) : (
          <ChevronDown size={15} className="shrink-0 text-[#8B7655]" />
        )}
      </button>

      {open && !disabled && !loading ? (
        <>
          <span
            aria-hidden="true"
            className="absolute right-5 top-full z-[51] h-3 w-3 rotate-45 border-l border-t border-[#E7DCC7] bg-white"
          />
          <div className="scroll absolute left-0 right-0 top-full z-50 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-[#E7DCC7] bg-white py-1 shadow-[0_12px_30px_rgba(45,35,20,0.16)]">
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => onChange(option.value)}
                  className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[13px] transition ${
                    active
                      ? "bg-[#FFF1EF] font-bold text-[#B91C1C]"
                      : "font-medium text-[#4A3D2A] hover:bg-[#F8F3E9]"
                  }`}
                >
                  <span className="flex w-4 shrink-0 justify-center">
                    {active ? <Check size={14} className="text-[#D42020]" /> : null}
                  </span>
                  <span className="truncate"><T>{option.label}</T></span>
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}

export default function QuestionFilters({
  manager,
  onExitDemo,
}: {
  manager: QuestionManager;
  onExitDemo: () => void;
}) {
  const { t } = useQuestionText();
  const {
    filtersOpen,
    setFiltersOpen,
    openFilter,
    setOpenFilter,
    selectedClass,
    selectedSubject,
    selectedChapter,
    selectedQuestionType,
    searchQuery,
    setSearchQuery,
    subjects,
    chapters,
    loadingSubjects,
    loadingChapters,
    questionError,
    loadingQuestions,
    handleClassChange,
    handleSubjectChange,
    handleChapterChange,
    handleFetchQuestions,
    setSelectedQuestionType,
  } = manager;

  return (
    <section
      id="question-filter-panel"
      className="overflow-visible rounded-xl border border-[#E9DFCE] bg-[#F8F3E9]"
    >
      <button
        type="button"
        onClick={() => setFiltersOpen((current) => !current)}
        aria-expanded={filtersOpen}
        className="flex w-full items-center justify-between gap-3 rounded-t-xl px-3.5 py-3 text-left transition hover:bg-[#F2EBDD] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#D42020] shadow-sm">
            <SlidersHorizontal size={15} />
          </span>
          <span className="min-w-0">
            <span className="block text-[13px] font-extrabold text-[#3A3021]">
              <T>Question filters</T>
            </span>
            {!filtersOpen && selectedClass && selectedSubject && selectedChapter ? (
              <span className="mt-0.5 block truncate text-[11px] font-semibold text-[#B91C1C]">
                {[
                  selectedClass,
                  subjects.find((item) => item.value === selectedSubject)?.label ?? selectedSubject,
                  chapters.find((item) => item.value === selectedChapter)?.label ?? selectedChapter,
                ].join(" · ")}
              </span>
            ) : (
              <span className="mt-0.5 block text-[11px] text-[#83745C]">
                <T>Choose class, subject and chapter.</T>
              </span>
            )}
          </span>
        </span>
        {filtersOpen ? (
          <ChevronUp size={16} className="shrink-0 text-[#87765A]" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-[#87765A]" />
        )}
      </button>

      {filtersOpen ? (
        <div className="space-y-3 border-t border-[#E9DFCE] px-3.5 pb-3.5 pt-3">
          <FilterSelect
            label="Class"
            value={selectedClass}
            placeholder="Select class"
            options={CLASS_OPTIONS}
            open={openFilter === "class"}
            onOpen={() => setOpenFilter(openFilter === "class" ? null : "class")}
            onChange={handleClassChange}
          />
          <FilterSelect
            label="Subject"
            value={selectedSubject}
            placeholder="Select subject"
            options={subjects}
            loading={loadingSubjects}
            disabled={!selectedClass}
            open={openFilter === "subject"}
            onOpen={() => setOpenFilter(openFilter === "subject" ? null : "subject")}
            onChange={handleSubjectChange}
          />
          <FilterSelect
            label="Chapter"
            value={selectedChapter}
            placeholder="Select chapter"
            options={chapters}
            loading={loadingChapters}
            disabled={!selectedSubject}
            open={openFilter === "chapter"}
            onOpen={() => setOpenFilter(openFilter === "chapter" ? null : "chapter")}
            onChange={handleChapterChange}
          />
          <FilterSelect
            label="Question type"
            value={selectedQuestionType}
            placeholder="All question types"
            options={QUESTION_TYPE_OPTIONS}
            disabled={!selectedChapter}
            open={openFilter === "type"}
            onOpen={() => setOpenFilter(openFilter === "type" ? null : "type")}
            onChange={(value) => {
              setSelectedQuestionType(value);
              setOpenFilter(null);
            }}
          />

          <div
            className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 transition focus-within:border-[#D42020] focus-within:ring-2 focus-within:ring-[#D42020]/10 ${
              selectedChapter
                ? "border-[#E7DCC7] bg-white"
                : "border-[#E9DFCE] bg-[#F3EDE2] opacity-60"
            }`}
          >
            <Search size={15} className="shrink-0 text-[#8A795F]" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              disabled={!selectedChapter}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  onExitDemo();
                  handleFetchQuestions();
                }
              }}
              placeholder={t("Search questions...")}
              className="w-full border-0 bg-transparent py-2 text-[13px] font-medium text-[#342B1E] outline-none placeholder:text-[#A99B83]"
            />
          </div>

          {questionError ? (
            <p className="rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-[12px] font-semibold leading-5 text-red-600">
              <T>{questionError}</T>
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => {
              onExitDemo();
              handleFetchQuestions();
            }}
            disabled={
              !selectedClass ||
              !selectedSubject ||
              !selectedChapter ||
              loadingQuestions
            }
            className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D42020]/25 active:scale-[0.99] ${
              !selectedClass ||
              !selectedSubject ||
              !selectedChapter ||
              loadingQuestions
                ? "cursor-not-allowed bg-[#D42020]/55 text-white"
                : "bg-[#D42020] text-white shadow-sm shadow-red-900/10 hover:bg-[#B91C1C]"
            }`}
          >
            {loadingQuestions ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Search size={15} />
            )}
            {loadingQuestions ? <T>Loading...</T> : <T>Apply filter</T>}
          </button>
          <p className="text-[11px] leading-4 text-[#8A795F]">
            <T>Select all required fields to load matching questions.</T>
          </p>
        </div>
      ) : null}
    </section>
  );
}
