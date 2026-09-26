"use client";

import type { Dispatch, FocusEvent, FormEvent, SetStateAction } from "react";

export default function PaperHeader({
  showHeader,
  hiddenRegionBlockIds,
  fontSize,
  logoUrl,
  institutionName,
  setInstitutionName,
  examName,
  setExamName,
  selectedSubject,
  selectedClass,
  selectedChapter,
  timeText,
  totalMarks,
  setNoEnabled,
  setNo,
  headerNoteEnabled,
  headerNote,
  activeRegionTargetIds,
  canvasTextOverrides,
  isRegionBlockActive,
  handleRegionBlockInput,
  handleRegionBlockBlur,
  handleRegionBlockFocus,
  onRegionTargetCommit,
  readEditableText,
}: {
  showHeader: boolean;
  hiddenRegionBlockIds: Set<string>;
  fontSize: number;
  logoUrl: string;
  institutionName: string;
  setInstitutionName: Dispatch<SetStateAction<string>>;
  examName: string;
  setExamName: Dispatch<SetStateAction<string>>;
  selectedSubject: string;
  selectedClass: string;
  selectedChapter: string;
  timeText: string;
  totalMarks: number;
  setNoEnabled: boolean;
  setNo: string;
  headerNoteEnabled: boolean;
  headerNote: string;
  activeRegionTargetIds: Set<string>;
  canvasTextOverrides: Record<string, string>;
  isRegionBlockActive: (blockId: string) => boolean;
  handleRegionBlockInput: (blockId: string, element: HTMLElement) => void;
  handleRegionBlockBlur: (
    event: FocusEvent<HTMLElement>,
    blockId: string,
  ) => void;
  handleRegionBlockFocus: (blockId: string) => void;
  onRegionTargetCommit?: (targetId: string, value: string) => void;
  readEditableText: (element: HTMLElement) => string;
}) {
  const headerActive = isRegionBlockActive("paper:header");

  return (
    <>
      {showHeader && !hiddenRegionBlockIds.has("paper:header") ? (
        <header
          data-paper-header="true"
          data-region-edit-target="paper:header"
          contentEditable={headerActive}
          suppressContentEditableWarning
          onInput={(event) =>
            handleRegionBlockInput("paper:header", event.currentTarget)
          }
          onBlur={(event) => handleRegionBlockBlur(event, "paper:header")}
          onFocus={() => handleRegionBlockFocus("paper:header")}
          onPointerDown={(event) => {
            if (headerActive) {
              event.stopPropagation();
            }
          }}
          className="relative border-b border-[#8B8B8B] pb-2.5 text-center"
        >
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="absolute left-0 top-0 h-8 w-auto max-w-[64px] object-contain"
            />
          ) : null}

          <div className="absolute right-0 top-0 text-[8px] font-semibold text-gray-500">
            {setNoEnabled ? (
              <>
                <span
                  data-region-edit-target="paper:set-no-label"
                  contentEditable={activeRegionTargetIds.has(
                    "paper:set-no-label",
                  )}
                  suppressContentEditableWarning
                  onPointerDown={(event) => {
                    if (activeRegionTargetIds.has("paper:set-no-label")) {
                      event.stopPropagation();
                    }
                  }}
                  onClick={(event) => {
                    if (activeRegionTargetIds.has("paper:set-no-label")) {
                      event.stopPropagation();
                    }
                  }}
                  onBlur={(event) => {
                    if (
                      !headerActive &&
                      activeRegionTargetIds.has("paper:set-no-label")
                    ) {
                      onRegionTargetCommit?.(
                        "paper:set-no-label",
                        readEditableText(event.currentTarget),
                      );
                    }
                  }}
                  className={
                    activeRegionTargetIds.has("paper:set-no-label")
                      ? "outline-none"
                      : ""
                  }
                >
                  {Object.prototype.hasOwnProperty.call(
                    canvasTextOverrides,
                    "paper:set-no-label",
                  )
                    ? canvasTextOverrides["paper:set-no-label"]
                    : "Set No:"}
                </span>{" "}
                <span
                  data-region-edit-target="paper:set-no"
                  contentEditable={activeRegionTargetIds.has("paper:set-no")}
                  suppressContentEditableWarning
                  onPointerDown={(event) => {
                    if (activeRegionTargetIds.has("paper:set-no")) {
                      event.stopPropagation();
                    }
                  }}
                  onClick={(event) => {
                    if (activeRegionTargetIds.has("paper:set-no")) {
                      event.stopPropagation();
                    }
                  }}
                  onBlur={(event) => {
                    if (
                      !headerActive &&
                      activeRegionTargetIds.has("paper:set-no")
                    ) {
                      onRegionTargetCommit?.(
                        "paper:set-no",
                        readEditableText(event.currentTarget),
                      );
                    }
                  }}
                  className={
                    activeRegionTargetIds.has("paper:set-no")
                      ? "outline-none"
                      : ""
                  }
                >
                  {setNo || "—"}
                </span>
              </>
            ) : null}
          </div>

          {headerNoteEnabled && headerNote ? (
            <div className="mb-1 text-[8px] font-semibold text-gray-500">
              <span
                data-region-edit-target="paper:header-note"
                contentEditable={activeRegionTargetIds.has("paper:header-note")}
                suppressContentEditableWarning
                onPointerDown={(event) => {
                  if (activeRegionTargetIds.has("paper:header-note")) {
                    event.stopPropagation();
                  }
                }}
                onClick={(event) => {
                  if (activeRegionTargetIds.has("paper:header-note")) {
                    event.stopPropagation();
                  }
                }}
                onBlur={(event) => {
                  if (
                    !headerActive &&
                    activeRegionTargetIds.has("paper:header-note")
                  ) {
                    onRegionTargetCommit?.(
                      "paper:header-note",
                      readEditableText(event.currentTarget),
                    );
                  }
                }}
                className={
                  activeRegionTargetIds.has("paper:header-note")
                    ? "outline-none"
                    : ""
                }
              >
                {headerNote}
              </span>
            </div>
          ) : null}

          <input
            value={institutionName}
            placeholder={
              headerActive
                ? ""
                : "Institution name (school / coaching / college)"
            }
            onChange={(event) => setInstitutionName(event.target.value)}
            className="w-full border-0 bg-transparent text-center font-extrabold text-gray-900 outline-none placeholder:text-gray-300 placeholder:opacity-60"
            style={{
              fontSize: `${Math.max(14, fontSize + 3)}px`,
            }}
            data-paper-input="institution"
            data-region-edit-target="paper:institution"
          />

          <input
            value={examName}
            placeholder={headerActive ? "" : "Set the exam name here"}
            onChange={(event) => setExamName(event.target.value)}
            className="mt-0.5 w-full border-0 bg-transparent text-center font-bold text-gray-600 outline-none placeholder:text-gray-300 placeholder:opacity-60"
            style={{
              fontSize: `${Math.max(11, fontSize + 1)}px`,
            }}
            data-paper-input="exam"
            data-region-edit-target="paper:exam"
          />

          <p className="mt-2 text-[9px] font-semibold text-gray-700">
            <span
              data-region-edit-target="paper:subject-label"
              contentEditable={activeRegionTargetIds.has("paper:subject-label")}
              suppressContentEditableWarning
              onPointerDown={(event) => {
                if (activeRegionTargetIds.has("paper:subject-label")) {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => {
                if (activeRegionTargetIds.has("paper:subject-label")) {
                  event.stopPropagation();
                }
              }}
              onBlur={(event) => {
                if (
                  !headerActive &&
                  activeRegionTargetIds.has("paper:subject-label")
                ) {
                  onRegionTargetCommit?.(
                    "paper:subject-label",
                    readEditableText(event.currentTarget),
                  );
                }
              }}
              className={
                activeRegionTargetIds.has("paper:subject-label")
                  ? "outline-none"
                  : ""
              }
            >
              {Object.prototype.hasOwnProperty.call(
                canvasTextOverrides,
                "paper:subject-label",
              )
                ? canvasTextOverrides["paper:subject-label"]
                : "Subject:"}
            </span>{" "}
            <span
              data-region-edit-target="paper:subject"
              contentEditable={activeRegionTargetIds.has("paper:subject")}
              suppressContentEditableWarning
              onPointerDown={(event) => {
                if (activeRegionTargetIds.has("paper:subject")) {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => {
                if (activeRegionTargetIds.has("paper:subject")) {
                  event.stopPropagation();
                }
              }}
              onBlur={(event) => {
                if (
                  !headerActive &&
                  activeRegionTargetIds.has("paper:subject")
                ) {
                  onRegionTargetCommit?.(
                    "paper:subject",
                    readEditableText(event.currentTarget),
                  );
                }
              }}
              className={
                activeRegionTargetIds.has("paper:subject") ? "outline-none" : ""
              }
            >
              {Object.prototype.hasOwnProperty.call(
                canvasTextOverrides,
                "paper:subject",
              )
                ? canvasTextOverrides["paper:subject"]
                : selectedSubject || ""}
            </span>
          </p>

          <p className="text-[9px] font-semibold text-gray-700">
            <span
              data-region-edit-target="paper:class-label"
              contentEditable={activeRegionTargetIds.has("paper:class-label")}
              suppressContentEditableWarning
              onPointerDown={(event) => {
                if (activeRegionTargetIds.has("paper:class-label")) {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => {
                if (activeRegionTargetIds.has("paper:class-label")) {
                  event.stopPropagation();
                }
              }}
              onBlur={(event) => {
                if (
                  !headerActive &&
                  activeRegionTargetIds.has("paper:class-label")
                ) {
                  onRegionTargetCommit?.(
                    "paper:class-label",
                    readEditableText(event.currentTarget),
                  );
                }
              }}
              className={
                activeRegionTargetIds.has("paper:class-label")
                  ? "outline-none"
                  : ""
              }
            >
              {Object.prototype.hasOwnProperty.call(
                canvasTextOverrides,
                "paper:class-label",
              )
                ? canvasTextOverrides["paper:class-label"]
                : "Class:"}
            </span>{" "}
            <span
              data-region-edit-target="paper:class"
              contentEditable={activeRegionTargetIds.has("paper:class")}
              suppressContentEditableWarning
              onPointerDown={(event) => {
                if (activeRegionTargetIds.has("paper:class")) {
                  event.stopPropagation();
                }
              }}
              onClick={(event) => {
                if (activeRegionTargetIds.has("paper:class")) {
                  event.stopPropagation();
                }
              }}
              onBlur={(event) => {
                if (!headerActive && activeRegionTargetIds.has("paper:class")) {
                  onRegionTargetCommit?.(
                    "paper:class",
                    readEditableText(event.currentTarget),
                  );
                }
              }}
              className={
                activeRegionTargetIds.has("paper:class") ? "outline-none" : ""
              }
            >
              {Object.prototype.hasOwnProperty.call(
                canvasTextOverrides,
                "paper:class",
              )
                ? canvasTextOverrides["paper:class"]
                : selectedClass || ""}
            </span>
          </p>

          <div className="mt-2 flex items-center justify-between border-t border-dashed border-gray-500 pt-1.5 text-[8px] font-semibold text-gray-700">
            <span>
              <span
                data-region-edit-target="paper:time-label"
                contentEditable={activeRegionTargetIds.has("paper:time-label")}
                suppressContentEditableWarning
                onPointerDown={(event) => {
                  if (activeRegionTargetIds.has("paper:time-label")) {
                    event.stopPropagation();
                  }
                }}
                onClick={(event) => {
                  if (activeRegionTargetIds.has("paper:time-label")) {
                    event.stopPropagation();
                  }
                }}
                onBlur={(event) => {
                  if (
                    !headerActive &&
                    activeRegionTargetIds.has("paper:time-label")
                  ) {
                    onRegionTargetCommit?.(
                      "paper:time-label",
                      readEditableText(event.currentTarget),
                    );
                  }
                }}
                className={
                  activeRegionTargetIds.has("paper:time-label")
                    ? "outline-none"
                    : ""
                }
              >
                {Object.prototype.hasOwnProperty.call(
                  canvasTextOverrides,
                  "paper:time-label",
                )
                  ? canvasTextOverrides["paper:time-label"]
                  : "Time:"}
              </span>{" "}
              <span
                data-region-edit-target="paper:time"
                contentEditable={activeRegionTargetIds.has("paper:time")}
                suppressContentEditableWarning
                onPointerDown={(event) => {
                  if (activeRegionTargetIds.has("paper:time")) {
                    event.stopPropagation();
                  }
                }}
                onClick={(event) => {
                  if (activeRegionTargetIds.has("paper:time")) {
                    event.stopPropagation();
                  }
                }}
                onBlur={(event) => {
                  if (
                    !headerActive &&
                    activeRegionTargetIds.has("paper:time")
                  ) {
                    onRegionTargetCommit?.(
                      "paper:time",
                      readEditableText(event.currentTarget),
                    );
                  }
                }}
                className={
                  activeRegionTargetIds.has("paper:time") ? "outline-none" : ""
                }
              >
                {Object.prototype.hasOwnProperty.call(
                  canvasTextOverrides,
                  "paper:time",
                )
                  ? canvasTextOverrides["paper:time"]
                  : timeText || ""}
              </span>
            </span>

            <span>
              <span
                data-region-edit-target="paper:full-marks-label"
                contentEditable={activeRegionTargetIds.has(
                  "paper:full-marks-label",
                )}
                suppressContentEditableWarning
                onPointerDown={(event) => {
                  if (activeRegionTargetIds.has("paper:full-marks-label")) {
                    event.stopPropagation();
                  }
                }}
                onClick={(event) => {
                  if (activeRegionTargetIds.has("paper:full-marks-label")) {
                    event.stopPropagation();
                  }
                }}
                onBlur={(event) => {
                  if (
                    !headerActive &&
                    activeRegionTargetIds.has("paper:full-marks-label")
                  ) {
                    onRegionTargetCommit?.(
                      "paper:full-marks-label",
                      readEditableText(event.currentTarget),
                    );
                  }
                }}
                className={
                  activeRegionTargetIds.has("paper:full-marks-label")
                    ? "outline-none"
                    : ""
                }
              >
                {Object.prototype.hasOwnProperty.call(
                  canvasTextOverrides,
                  "paper:full-marks-label",
                )
                  ? canvasTextOverrides["paper:full-marks-label"]
                  : "Full Marks:"}
              </span>{" "}
              <span
                data-region-edit-target="paper:full-marks"
                contentEditable={activeRegionTargetIds.has("paper:full-marks")}
                suppressContentEditableWarning
                onPointerDown={(event) => {
                  if (activeRegionTargetIds.has("paper:full-marks")) {
                    event.stopPropagation();
                  }
                }}
                onClick={(event) => {
                  if (activeRegionTargetIds.has("paper:full-marks")) {
                    event.stopPropagation();
                  }
                }}
                onBlur={(event) => {
                  if (
                    !headerActive &&
                    activeRegionTargetIds.has("paper:full-marks")
                  ) {
                    onRegionTargetCommit?.(
                      "paper:full-marks",
                      readEditableText(event.currentTarget),
                    );
                  }
                }}
                className={
                  activeRegionTargetIds.has("paper:full-marks")
                    ? "outline-none"
                    : ""
                }
              >
                {Object.prototype.hasOwnProperty.call(
                  canvasTextOverrides,
                  "paper:full-marks",
                )
                  ? canvasTextOverrides["paper:full-marks"]
                  : String(totalMarks)}
              </span>
            </span>
          </div>
        </header>
      ) : null}

      {showHeader && !hiddenRegionBlockIds.has("paper:chapter-block") ? (
        <div
          data-paper-chapter="true"
          data-region-edit-target="paper:chapter-block"
          contentEditable={isRegionBlockActive("paper:chapter-block")}
          suppressContentEditableWarning
          onInput={(event) =>
            handleRegionBlockInput("paper:chapter-block", event.currentTarget)
          }
          onBlur={(event) =>
            handleRegionBlockBlur(event, "paper:chapter-block")
          }
          onFocus={() => handleRegionBlockFocus("paper:chapter-block")}
          onPointerDown={(event) => {
            if (isRegionBlockActive("paper:chapter-block")) {
              event.stopPropagation();
            }
          }}
          className="mt-2 text-left text-[8px] text-gray-500"
        >
          <span
            data-region-edit-target="paper:chapter-label"
            contentEditable={activeRegionTargetIds.has("paper:chapter-label")}
            suppressContentEditableWarning
            onPointerDown={(event) => {
              if (activeRegionTargetIds.has("paper:chapter-label")) {
                event.stopPropagation();
              }
            }}
            onClick={(event) => {
              if (activeRegionTargetIds.has("paper:chapter-label")) {
                event.stopPropagation();
              }
            }}
            onBlur={(event) => {
              if (
                !isRegionBlockActive("paper:chapter-block") &&
                activeRegionTargetIds.has("paper:chapter-label")
              ) {
                onRegionTargetCommit?.(
                  "paper:chapter-label",
                  readEditableText(event.currentTarget),
                );
              }
            }}
            className={
              activeRegionTargetIds.has("paper:chapter-label")
                ? "outline-none"
                : ""
            }
          >
            {Object.prototype.hasOwnProperty.call(
              canvasTextOverrides,
              "paper:chapter-label",
            )
              ? canvasTextOverrides["paper:chapter-label"]
              : "Chapter:"}
          </span>{" "}
          <span
            data-region-edit-target="paper:chapter"
            contentEditable={activeRegionTargetIds.has("paper:chapter")}
            suppressContentEditableWarning
            onPointerDown={(event) => {
              if (activeRegionTargetIds.has("paper:chapter")) {
                event.stopPropagation();
              }
            }}
            onClick={(event) => {
              if (activeRegionTargetIds.has("paper:chapter")) {
                event.stopPropagation();
              }
            }}
            onBlur={(event) => {
              if (
                !isRegionBlockActive("paper:chapter-block") &&
                activeRegionTargetIds.has("paper:chapter")
              ) {
                onRegionTargetCommit?.(
                  "paper:chapter",
                  readEditableText(event.currentTarget),
                );
              }
            }}
            className={
              activeRegionTargetIds.has("paper:chapter") ? "outline-none" : ""
            }
          >
            {Object.prototype.hasOwnProperty.call(
              canvasTextOverrides,
              "paper:chapter",
            )
              ? canvasTextOverrides["paper:chapter"]
              : selectedChapter || ""}
          </span>
        </div>
      ) : null}
    </>
  );
}
