"use client";

import type { QuestionManager } from "../../hooks/useQuestionManager";
import type { FilterOption } from "../../types/question";
import { Check, ChevronDown, ChevronUp, Loader2, Search, SlidersHorizontal } from "lucide-react";
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
  const selected = options.find((option) => option.value === value);
  const display = loading
    ? `Loading ${label.toLowerCase()}...`
    : selected?.label || placeholder;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={onOpen}
        className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-[11px] font-semibold transition ${
          disabled || loading
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-300"
            : open
              ? "border-[#F3A847] bg-white text-gray-800 ring-1 ring-[#F3A847]/20"
              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
        }`}
      >
        <span className="truncate">{display}</span>
        {open ? (
          <ChevronUp size={13} className="text-gray-400" />
        ) : (
          <ChevronDown size={13} className="text-gray-400" />
        )}
      </button>

      {open && !disabled && !loading ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-56 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-[0_16px_35px_rgba(17,24,39,0.12)]">
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => onChange(option.value)}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-[11px] transition ${active ? "bg-orange-50/70 font-bold text-gray-900" : "font-medium text-gray-600 hover:bg-gray-50"}`}
              >
                <span className="w-4 shrink-0">
                  {active ? <Check size={13} className="text-[#F3A847]" /> : null}
                </span>
                <span className="truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
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
                className="rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setFiltersOpen((current) => !current)}
                  className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-3 text-left"
                >
                  <span className="flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-[0.09em] text-gray-700">
                    <SlidersHorizontal size={13} className="text-[#F3A847]" />
                    Filters
                  </span>

                  {filtersOpen ? (
                    <ChevronUp size={14} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={14} className="text-gray-400" />
                  )}
                </button>

                {filtersOpen ? (
                  <div className="space-y-2.5 p-3">
                    <FilterSelect
                      label="class"
                      value={selectedClass}
                      placeholder="Select class"
                      options={CLASS_OPTIONS}
                      open={openFilter === "class"}
                      onOpen={() =>
                        setOpenFilter(openFilter === "class" ? null : "class")
                      }
                      onChange={handleClassChange}
                    />

                    <FilterSelect
                      label="subject"
                      value={selectedSubject}
                      placeholder="Select subject"
                      options={subjects}
                      loading={loadingSubjects}
                      disabled={!selectedClass}
                      open={openFilter === "subject"}
                      onOpen={() =>
                        setOpenFilter(
                          openFilter === "subject" ? null : "subject",
                        )
                      }
                      onChange={handleSubjectChange}
                    />

                    <FilterSelect
                      label="chapter"
                      value={selectedChapter}
                      placeholder="Select chapter"
                      options={chapters}
                      loading={loadingChapters}
                      disabled={!selectedSubject}
                      open={openFilter === "chapter"}
                      onOpen={() =>
                        setOpenFilter(
                          openFilter === "chapter" ? null : "chapter",
                        )
                      }
                      onChange={handleChapterChange}
                    />

                    <FilterSelect
                      label="question type"
                      value={selectedQuestionType}
                      placeholder="All question types"
                      options={QUESTION_TYPE_OPTIONS}
                      disabled={!selectedChapter}
                      open={openFilter === "type"}
                      onOpen={() =>
                        setOpenFilter(openFilter === "type" ? null : "type")
                      }
                      onChange={(value) => {
                        setSelectedQuestionType(value);

                        setOpenFilter(null);
                      }}
                    />

                    <div
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${
                        selectedChapter
                          ? "border-gray-200 bg-white"
                          : "border-gray-200 bg-gray-50 opacity-50"
                      }`}
                    >
                      <Search size={13} className="shrink-0 text-gray-400" />

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
                        placeholder="Search questions..."
                        className="w-full border-0 bg-transparent text-[11px] font-medium text-gray-700 outline-none placeholder:text-gray-300"
                      />
                    </div>

                    {questionError ? (
                      <p className="rounded-lg bg-red-50 px-2.5 py-2 text-[10px] font-semibold text-red-500">
                        {questionError}
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
                      className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-extrabold transition ${
                        !selectedClass ||
                        !selectedSubject ||
                        !selectedChapter ||
                        loadingQuestions
                          ? "cursor-not-allowed bg-amber-100 text-amber-400"
                          : "bg-[#F3A847] text-white hover:bg-[#e29a3e]"
                      }`}
                    >
                      {loadingQuestions ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <SlidersHorizontal size={13} />
                      )}

                      {loadingQuestions ? "Loading..." : "Apply filter"}
                    </button>
                  </div>
                ) : null}
              </section>
  );
}
