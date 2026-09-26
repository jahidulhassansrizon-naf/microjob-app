"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Star,
  Share,
  Calculator,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Cake,
  Sparkles,
  Users,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const relatedTools = [
  {
    title: "Family Card Form",
    description:
      "Fill in your details on the left — see a live application letter on the right and download as PDF.",
    href: "/sohoj-tools/family-card-form",
    icon: CreditCard,
  },
  {
    title: "Voter Migration Form",
    description:
      "Fill in your details on the left — see a live Form-13 on the right and download it as PDF.",
    href: "/sohoj-tools/voter-migration-form",
    icon: FileText,
  },
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Milestones relevant to everyday life in Bangladesh — ties this tool to the
// same real-world paperwork the neighbouring tools (NID / voter / family
// card) are for, instead of only showing an abstract number.
const MILESTONES: { label: string; age: number }[] = [
  { label: "Eligible for NID & voter registration", age: 18 },
  { label: "Legal driving age (non-heavy vehicle)", age: 18 },
  { label: "Legal marriage age (women)", age: 18 },
  { label: "Legal marriage age (men)", age: 21 },
  { label: "Standard government retirement age", age: 59 },
];

// ---------------------------------------------------------------------------
// Small date helpers
// ---------------------------------------------------------------------------

type YMD = { years: number; months: number; days: number };

function daysInMonth(month1to12: number, year: number) {
  return new Date(year, month1to12, 0).getDate();
}

function isValidDate(day: number, month1to12: number, year: number) {
  if (!day || !month1to12 || !year) return false;
  if (year < 1000 || year > 9999) return false;
  return day >= 1 && day <= daysInMonth(month1to12, year);
}

function makeDate(day: number, month1to12: number, year: number) {
  return new Date(year, month1to12 - 1, day);
}

function stripTime(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendar-accurate difference between two dates, `to` assumed >= `from`. */
function diffYMD(
  from: Date,
  to: Date,
): YMD & { totalDays: number; totalWeeks: number; totalMonths: number } {
  let years = to.getFullYear() - from.getFullYear();
  let months = to.getMonth() - from.getMonth();
  let days = to.getDate() - from.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(to.getFullYear(), to.getMonth(), 0);
    days += prevMonth.getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalDays = Math.round((to.getTime() - from.getTime()) / 86400000);
  const totalWeeks = Math.floor(totalDays / 7);
  const totalMonths = years * 12 + months;

  return { years, months, days, totalDays, totalWeeks, totalMonths };
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function lifeStage(years: number) {
  if (years < 2) return "Infant";
  if (years < 4) return "Toddler";
  if (years < 13) return "Child";
  if (years < 20) return "Teenager";
  if (years < 60) return "Adult";
  return "Senior citizen";
}

function plural(n: number, unit: string) {
  return `${n} ${unit}${n === 1 ? "" : "s"}`;
}

function shortDuration(ymd: YMD) {
  const parts: string[] = [];
  if (ymd.years) parts.push(plural(ymd.years, "year"));
  if (ymd.months) parts.push(plural(ymd.months, "month"));
  if (ymd.days || parts.length === 0) parts.push(plural(ymd.days, "day"));
  return parts.join(", ");
}

// ---------------------------------------------------------------------------
// Reusable Day / Month / Year picker — plain, labelled dropdowns instead of
// a native <input type="date">, so there's no mm/dd vs dd/mm ambiguity and
// nothing to type. Works the same for anyone, regardless of reading level.
// ---------------------------------------------------------------------------

function DatePicker({
  idPrefix,
  day,
  month,
  year,
  onDay,
  onMonth,
  onYear,
  yearFrom,
  yearTo,
}: {
  idPrefix: string;
  day: string;
  month: string;
  year: string;
  onDay: (v: string) => void;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
  yearFrom: number;
  yearTo: number;
}) {
  const maxDay = month && year ? daysInMonth(Number(month), Number(year)) : 31;
  const days = Array.from({ length: maxDay }, (_, i) => i + 1);
  const years: number[] = [];
  if (yearFrom <= yearTo) {
    for (let y = yearTo; y >= yearFrom; y--) years.push(y);
  } else {
    for (let y = yearFrom; y >= yearTo; y--) years.push(y);
  }

  const selectClass =
    "w-full bg-white border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-purple-500 cursor-pointer";

  return (
    <div className="grid grid-cols-3 gap-2">
      <div>
        <label htmlFor={`${idPrefix}-day`} className="sr-only">
          Day
        </label>
        <select
          id={`${idPrefix}-day`}
          value={day}
          onChange={(e) => onDay(e.target.value)}
          className={selectClass}
        >
          <option value="">Day</option>
          {days.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-month`} className="sr-only">
          Month
        </label>
        <select
          id={`${idPrefix}-month`}
          value={month}
          onChange={(e) => onMonth(e.target.value)}
          className={selectClass}
        >
          <option value="">Month</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${idPrefix}-year`} className="sr-only">
          Year
        </label>
        <select
          id={`${idPrefix}-year`}
          value={year}
          onChange={(e) => onYear(e.target.value)}
          className={selectClass}
        >
          <option value="">Year</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function AgeCalculator() {
  const router = useRouter();
  const today = useMemo(() => stripTime(new Date()), []);
  const currentYear = today.getFullYear();

  // Date of birth
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");

  // "Age at date" — off by default (= today)
  const [useCustomTargetDate, setUseCustomTargetDate] = useState(false);
  const [targetDay, setTargetDay] = useState("");
  const [targetMonth, setTargetMonth] = useState("");
  const [targetYear, setTargetYear] = useState("");

  // Compare with someone else
  const [compareOn, setCompareOn] = useState(false);
  const [cmpDay, setCmpDay] = useState("");
  const [cmpMonth, setCmpMonth] = useState("");
  const [cmpYear, setCmpYear] = useState("");

  const [isFavorite, setIsFavorite] = useState(false);
  const [showHowToUse, setShowHowToUse] = useState(true);
  const [copied, setCopied] = useState(false);

  // --- Parse & validate DOB -------------------------------------------------
  const dobComplete = !!(dobDay && dobMonth && dobYear);
  const dobValid =
    dobComplete &&
    isValidDate(Number(dobDay), Number(dobMonth), Number(dobYear));
  const birthDate = dobValid
    ? makeDate(Number(dobDay), Number(dobMonth), Number(dobYear))
    : null;
  const dobIsFuture = birthDate ? birthDate > today : false;

  // --- Parse & validate target date ("age at date") ------------------------
  const targetComplete =
    !useCustomTargetDate || !!(targetDay && targetMonth && targetYear);
  const targetValid =
    !useCustomTargetDate ||
    (targetComplete &&
      isValidDate(Number(targetDay), Number(targetMonth), Number(targetYear)));
  const targetDate = useCustomTargetDate
    ? targetValid && targetComplete
      ? makeDate(Number(targetDay), Number(targetMonth), Number(targetYear))
      : null
    : today;
  const targetBeforeBirth =
    birthDate && targetDate ? targetDate < birthDate : false;

  // --- Error messages, plain language, one at a time ------------------------
  let errorMessage = "";
  if (dobComplete && !dobValid)
    errorMessage =
      "That date of birth doesn't exist. Please check the day and month.";
  else if (dobIsFuture) errorMessage = "Date of birth can't be in the future.";
  else if (useCustomTargetDate && targetComplete && !targetValid)
    errorMessage = "That date doesn't exist. Please check the day and month.";
  else if (targetBeforeBirth)
    errorMessage =
      "This date is earlier than the date of birth — pick a later date.";

  const canCalculate =
    dobValid &&
    !dobIsFuture &&
    targetValid &&
    targetComplete &&
    !targetBeforeBirth;
  const age =
    canCalculate && birthDate && targetDate
      ? diffYMD(birthDate, targetDate)
      : null;

  // --- Next birthday --------------------------------------------------------
  const nextBirthday = useMemo(() => {
    if (!canCalculate || !birthDate || !targetDate) return null;
    let next = new Date(
      targetDate.getFullYear(),
      birthDate.getMonth(),
      birthDate.getDate(),
    );
    if (next < targetDate)
      next = new Date(
        targetDate.getFullYear() + 1,
        birthDate.getMonth(),
        birthDate.getDate(),
      );
    const untilNext = diffYMD(targetDate, next);
    const turningAge = next.getFullYear() - birthDate.getFullYear();
    const isToday = untilNext.totalDays === 0;
    return { date: next, untilNext, turningAge, isToday };
  }, [canCalculate, birthDate, targetDate]);

  // --- Milestones -------------------------------------------------------------
  const milestones = useMemo(() => {
    if (!canCalculate || !birthDate || !targetDate) return [];
    return MILESTONES.map((m) => {
      const milestoneDate = new Date(birthDate);
      milestoneDate.setFullYear(birthDate.getFullYear() + m.age);
      const reached = targetDate >= milestoneDate;
      return {
        ...m,
        date: milestoneDate,
        reached,
        remaining: reached ? null : diffYMD(targetDate, milestoneDate),
      };
    });
  }, [canCalculate, birthDate, targetDate]);

  // --- Compare with a second person -------------------------------------------
  const cmpComplete = !!(cmpDay && cmpMonth && cmpYear);
  const cmpValid =
    cmpComplete &&
    isValidDate(Number(cmpDay), Number(cmpMonth), Number(cmpYear));
  const cmpDate = cmpValid
    ? makeDate(Number(cmpDay), Number(cmpMonth), Number(cmpYear))
    : null;
  const cmpFuture = cmpDate ? cmpDate > today : false;

  const comparison = useMemo(() => {
    if (
      !compareOn ||
      !canCalculate ||
      !birthDate ||
      !targetDate ||
      !cmpDate ||
      cmpFuture
    )
      return null;
    const olderIsBirth = birthDate <= cmpDate;
    const diff = olderIsBirth
      ? diffYMD(birthDate, cmpDate)
      : diffYMD(cmpDate, birthDate);
    const isSame = diff.years === 0 && diff.months === 0 && diff.days === 0;
    return { diff, personOneOlder: !olderIsBirth, isSame };
  }, [compareOn, canCalculate, birthDate, targetDate, cmpDate, cmpFuture]);

  // --- Actions ---------------------------------------------------------------
  const handleReset = () => {
    setDobDay("");
    setDobMonth("");
    setDobYear("");
    setUseCustomTargetDate(false);
    setTargetDay("");
    setTargetMonth("");
    setTargetYear("");
    setCompareOn(false);
    setCmpDay("");
    setCmpMonth("");
    setCmpYear("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!age || !birthDate) return;
    const text = `Date of birth: ${formatDate(birthDate)}\nExact age: ${age.years} years, ${age.months} months, ${age.days} days\nTotal days: ${age.totalDays.toLocaleString()}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard may be unavailable — fail silently, nothing else to do here.
    }
  };

  return (
    <div className="w-full text-gray-800 font-sans pb-16 print:pb-0">
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-2">
              <button
                onClick={() => router.back()}
                className="p-1 hover:bg-gray-200/60 rounded-md transition-colors text-gray-700 flex items-center justify-center -ml-1 cursor-pointer"
                title="Go back"
              >
                <ArrowLeft size={16} />
              </button>
              <Link href="/sohoj-tools" className="hover:text-gray-700">
                Sohoj Tools
              </Link>
              <span>/</span>
              <span className="hover:text-gray-700 cursor-pointer">
                General Tools
              </span>
              <span>/</span>
              <span className="text-gray-900 font-semibold">
                Age Calculator
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-purple-100 text-purple-700 rounded-lg flex items-center justify-center font-bold shadow-2xs">
                <Calculator size={18} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                Age Calculator
              </h1>
              <span className="bg-emerald-100 text-emerald-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                Free
              </span>
            </div>
            <p className="text-xs text-gray-500 font-medium mt-1">
              Pick your date of birth from the dropdowns — your exact age
              appears instantly, no typing needed.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              aria-pressed={isFavorite}
              aria-label="Save to favourites"
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-purple-500 hover:border-purple-300 transition-all shadow-2xs cursor-pointer"
            >
              <Star
                size={16}
                className={isFavorite ? "fill-purple-400 text-purple-400" : ""}
              />
            </button>
            <button
              aria-label="Share this tool"
              className="p-2 bg-white rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 transition-all shadow-2xs cursor-pointer"
            >
              <Share size={16} />
            </button>
          </div>
        </div>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: ENTER DATES FORM */}
          <div className="lg:col-span-5 space-y-4 print:hidden">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <span className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Enter dates
                </span>
              </div>

              {/* Date of Birth */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Cake size={13} className="text-purple-500" />
                  Date of birth <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-gray-400 font-medium">
                  Choose the day, month and year — cannot be a future date
                </p>
                <DatePicker
                  idPrefix="dob"
                  day={dobDay}
                  month={dobMonth}
                  year={dobYear}
                  onDay={setDobDay}
                  onMonth={setDobMonth}
                  onYear={setDobYear}
                  yearFrom={currentYear - 120}
                  yearTo={currentYear}
                />
              </div>

              {/* Age at date toggle */}
              <div className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold">
                      <Clock3 size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        Calculate age on a different date
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Off = calculate as of today
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomTargetDate}
                      onChange={() => setUseCustomTargetDate((v) => !v)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  </label>
                </div>
                {useCustomTargetDate && (
                  <div className="pt-1">
                    <DatePicker
                      idPrefix="target"
                      day={targetDay}
                      month={targetMonth}
                      year={targetYear}
                      onDay={setTargetDay}
                      onMonth={setTargetMonth}
                      onYear={setTargetYear}
                      yearFrom={currentYear - 120}
                      yearTo={currentYear + 5}
                    />
                  </div>
                )}
              </div>

              {/* Compare Age Toggle Box */}
              <div className="border border-gray-200 rounded-xl p-3.5 space-y-3 bg-gray-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">
                      <Users size={14} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-900">
                        Compare with another person
                      </h4>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Enter their birth date to see who is older
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={compareOn}
                      onChange={() => setCompareOn((v) => !v)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600" />
                  </label>
                </div>
                {compareOn && (
                  <div className="pt-1 space-y-2">
                    <DatePicker
                      idPrefix="cmp"
                      day={cmpDay}
                      month={cmpMonth}
                      year={cmpYear}
                      onDay={setCmpDay}
                      onMonth={setCmpMonth}
                      onYear={setCmpYear}
                      yearFrom={currentYear - 120}
                      yearTo={currentYear}
                    />
                    {cmpComplete && !cmpValid && (
                      <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> That date doesn't exist.
                      </p>
                    )}
                    {cmpFuture && (
                      <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} /> That date can't be in the
                        future.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Inline error */}
              {errorMessage && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 rounded-xl px-3.5 py-2.5">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <p className="text-xs font-semibold leading-relaxed">
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: RESULTS */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
                  <span className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    <span>Your age</span>
                  </span>
                  <span className="text-[11px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-md">
                    {age ? "Calculated" : "Empty"}
                  </span>
                </div>

                {age && birthDate && targetDate ? (
                  <div className="mt-6 space-y-6">
                    {/* Headline result */}
                    <div className="bg-purple-50 border border-purple-200 rounded-2xl p-6 text-center space-y-2">
                      <p className="text-xs font-bold text-purple-700 uppercase tracking-widest">
                        {useCustomTargetDate
                          ? `Age on ${formatDate(targetDate)}`
                          : "Exact age today"}
                      </p>
                      <h2 className="text-3xl font-extrabold text-purple-900">
                        {age.years}{" "}
                        <span className="text-base font-normal">Years</span>,{" "}
                        {age.months}{" "}
                        <span className="text-base font-normal">Months</span>,{" "}
                        {age.days}{" "}
                        <span className="text-base font-normal">Days</span>
                      </h2>
                      <span className="inline-block bg-white text-purple-700 border border-purple-200 text-[11px] font-bold px-3 py-1 rounded-full">
                        {lifeStage(age.years)}
                      </span>
                    </div>

                    {/* Quick stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Months
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {age.totalMonths.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Weeks
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {age.totalWeeks.toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-gray-50 border border-gray-200/80 rounded-xl p-4 text-center space-y-1 col-span-2 sm:col-span-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          Total Days
                        </p>
                        <p className="text-base font-bold text-gray-900">
                          {age.totalDays.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Next birthday */}
                    {nextBirthday && (
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center shrink-0">
                          <Sparkles size={17} />
                        </div>
                        <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                          {nextBirthday.isToday ? (
                            <>
                              🎉 Birthday today — turning{" "}
                              <b>{nextBirthday.turningAge}</b>!
                            </>
                          ) : (
                            <>
                              Turns <b>{nextBirthday.turningAge}</b> in{" "}
                              <b>{shortDuration(nextBirthday.untilNext)}</b>, on{" "}
                              {formatDate(nextBirthday.date)}
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Milestones relevant to daily life / paperwork in BD */}
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-gray-900">
                        Milestones
                      </p>
                      <div className="space-y-1.5">
                        {milestones.map((m) => (
                          <div
                            key={m.label}
                            className="flex items-center justify-between gap-3 bg-gray-50 border border-gray-200/80 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {m.reached ? (
                                <CheckCircle2
                                  size={15}
                                  className="text-emerald-500 shrink-0"
                                />
                              ) : (
                                <AlertCircle
                                  size={15}
                                  className="text-gray-300 shrink-0"
                                />
                              )}
                              <span className="text-[11px] font-semibold text-gray-700 truncate">
                                {m.label}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-bold whitespace-nowrap ${m.reached ? "text-emerald-600" : "text-gray-400"}`}
                            >
                              {m.reached
                                ? `Since ${formatDate(m.date)}`
                                : `In ${shortDuration(m.remaining as YMD)}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comparison result */}
                    {compareOn && comparison && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                          <Users size={17} />
                        </div>
                        <p className="text-xs font-semibold text-blue-800 leading-relaxed">
                          {comparison.isSame ? (
                            "Both people are exactly the same age."
                          ) : (
                            <>
                              The first date of birth is{" "}
                              <b>{shortDuration(comparison.diff)}</b>{" "}
                              {comparison.personOneOlder ? "older" : "younger"}{" "}
                              than the second.
                            </>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 print:hidden">
                      <button
                        onClick={handleCopy}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                        {copied ? "Copied" : "Copy result"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-16 flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-2xs">
                      <Calculator size={22} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900">
                      Choose a date of birth on the left to see the age
                      instantly.
                    </h3>
                    <p className="text-[11px] text-gray-400 font-medium max-w-xs leading-relaxed">
                      No typing required — just pick the day, month and year
                      from the dropdown lists.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR */}
        <div className="bg-white border border-gray-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs print:hidden">
          <div className="text-xs font-medium text-gray-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>
              Everything is calculated in your browser — nothing is uploaded to
              any server.
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Reset
            </button>
            <button
              onClick={() => window.print()}
              disabled={!age}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Calculator size={14} />
              <span>Print / Save</span>
            </button>
          </div>
        </div>

        {/* HOW TO USE */}
        <div className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden shadow-2xs print:hidden">
          <button
            onClick={() => setShowHowToUse(!showHowToUse)}
            className="w-full p-4 text-left flex items-center justify-between font-bold text-xs text-gray-900 hover:bg-gray-50/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              <span>How to use</span>
            </div>
            {showHowToUse ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showHowToUse && (
            <div className="p-4 pt-0 text-xs text-gray-600 space-y-2 border-t border-gray-100 font-medium leading-relaxed">
              <p>
                1. Pick the day, month and year of birth from the three dropdown
                lists — no typing needed.
              </p>
              <p>
                2. Your exact age, next birthday and total days lived appear
                immediately on the right.
              </p>
              <p>
                3. Turn on "Calculate age on a different date" to see the age as
                of a past or future date.
              </p>
              <p>
                4. Turn on "Compare with another person" to see who is older and
                by how much.
              </p>
            </div>
          )}
        </div>

        {/* TOOLS IN THE SAME CATEGORY */}
        <div className="pt-4 space-y-3 print:hidden">
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">
            Tools in the same category
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedTools.map((tool, idx) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={idx}
                  href={tool.href}
                  className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-purple-300 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-9 h-9 bg-purple-50 text-purple-600 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-100 transition-colors">
                      <ToolIcon size={18} />
                    </div>
                    <h3 className="text-xs font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
