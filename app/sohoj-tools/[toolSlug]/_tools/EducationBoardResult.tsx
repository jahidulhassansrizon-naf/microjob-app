"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Star,
  Share2,
  AlertTriangle,
  ChevronDown,
  ArrowLeft,
  FileUser,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Globe2,
  CheckCircle2,
} from "lucide-react";
const OFFICIAL_RESULT_URL = "https://www.educationboardresults.gov.bd/v2/home";
export default function EducationBoardResult() {
  const [showHowToUse, setShowHowToUse] = useState(false);
  const [openedOfficialPortal, setOpenedOfficialPortal] = useState(false);
  const openOfficialPortal = () => {
    window.open(OFFICIAL_RESULT_URL, "_blank", "noopener,noreferrer");
    setOpenedOfficialPortal(true);
  };
  return (
    <div className="w-full space-y-5 text-gray-800 font-sans">
      {" "}
      {/* Breadcrumb */}{" "}
      <div className="flex items-center gap-2 text-xs text-gray-500">
        {" "}
        <Link
          href="/sohoj-tools"
          className="flex items-center gap-1 hover:text-gray-900 transition-colors"
        >
          {" "}
          <ArrowLeft size={14} /> <span>Back to Tools</span>{" "}
        </Link>{" "}
        <span>/</span> <span>Educational Tools</span> <span>/</span>{" "}
        <span className="font-semibold text-gray-900">
          {" "}
          Education Board Result{" "}
        </span>{" "}
      </div>{" "}
      {/* Header */}{" "}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
        {" "}
        <div className="flex items-center gap-3.5">
          {" "}
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            {" "}
            <GraduationCap size={24} />{" "}
          </div>{" "}
          <div>
            {" "}
            <div className="flex items-center gap-2">
              {" "}
              <h1 className="text-lg font-bold text-gray-900">
                {" "}
                Education Board Result{" "}
              </h1>{" "}
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {" "}
                Free{" "}
              </span>{" "}
            </div>{" "}
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              {" "}
              Check your JSC, SSC, HSC and equivalent results through the
              official Bangladesh education board result website.{" "}
            </p>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex items-center gap-2">
          {" "}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
            aria-label="Favorite"
          >
            {" "}
            <Star size={16} />{" "}
          </button>{" "}
          <button
            type="button"
            className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all border border-gray-100"
            aria-label="Share"
          >
            {" "}
            <Share2 size={16} />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* Main Content */}{" "}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {" "}
        {/* Left Information Card */}{" "}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          {" "}
          <div className="space-y-5">
            {" "}
            <div>
              {" "}
              <h2 className="text-sm font-bold text-gray-900">
                {" "}
                Check your official result{" "}
              </h2>{" "}
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                {" "}
                Your result is checked directly on the official Education Board
                result website. We do not ask you to enter or store your
                personal result information here.{" "}
              </p>{" "}
            </div>{" "}
            {/* Official Website Card */}{" "}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
              {" "}
              <div className="flex items-start gap-3">
                {" "}
                <div className="w-10 h-10 rounded-xl bg-white border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  {" "}
                  <Globe2 size={18} />{" "}
                </div>{" "}
                <div className="min-w-0">
                  {" "}
                  <h3 className="text-xs font-bold text-gray-900">
                    {" "}
                    Official Education Board Website{" "}
                  </h3>{" "}
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                    {" "}
                    Click the button below to open the official result website
                    in a new tab.{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
              <button
                type="button"
                onClick={openOfficialPortal}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                {" "}
                <ExternalLink size={14} />{" "}
                <span> Open Official Result Website </span>{" "}
              </button>{" "}
              {openedOfficialPortal && (
                <div className="mt-3 bg-white border border-emerald-100 rounded-xl p-3">
                  {" "}
                  <div className="flex items-start gap-2">
                    {" "}
                    <CheckCircle2
                      size={14}
                      className="text-emerald-600 mt-0.5 shrink-0"
                    />{" "}
                    <p className="text-[10px] text-emerald-700 leading-relaxed">
                      {" "}
                      The official website has been opened in a new tab.
                      Complete the required verification and enter your result
                      information there to view your result.{" "}
                    </p>{" "}
                  </div>{" "}
                </div>
              )}{" "}
            </div>{" "}
            {/* Security Card */}{" "}
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
              {" "}
              <div className="flex items-start gap-3">
                {" "}
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-gray-600 flex items-center justify-center shrink-0">
                  {" "}
                  <ShieldCheck size={17} />{" "}
                </div>{" "}
                <div>
                  {" "}
                  <h3 className="text-[11px] font-bold text-gray-800">
                    {" "}
                    Why are you being redirected?{" "}
                  </h3>{" "}
                  <p className="text-[10px] text-gray-500 mt-1 leading-relaxed">
                    {" "}
                    The official result website handles its own browser
                    verification, CAPTCHA, session and result search
                    process.{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
            {/* Steps */}{" "}
            <div>
              {" "}
              <h3 className="text-[11px] font-bold text-gray-800 mb-2">
                {" "}
                What to do next{" "}
              </h3>{" "}
              <div className="space-y-2">
                {" "}
                <div className="flex items-start gap-2">
                  {" "}
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                    {" "}
                    1{" "}
                  </span>{" "}
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {" "}
                    Click{" "}
                    <span className="font-semibold text-gray-700">
                      {" "}
                      Open Official Result Website{" "}
                    </span>{" "}
                    .{" "}
                  </p>{" "}
                </div>{" "}
                <div className="flex items-start gap-2">
                  {" "}
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                    {" "}
                    2{" "}
                  </span>{" "}
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {" "}
                    Complete the official website&apos;s browser verification if
                    it appears.{" "}
                  </p>{" "}
                </div>{" "}
                <div className="flex items-start gap-2">
                  {" "}
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                    {" "}
                    3{" "}
                  </span>{" "}
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {" "}
                    Enter your Board, Examination, Year, Roll, Registration and
                    CAPTCHA on the official website.{" "}
                  </p>{" "}
                </div>{" "}
                <div className="flex items-start gap-2">
                  {" "}
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                    {" "}
                    4{" "}
                  </span>{" "}
                  <p className="text-[10px] text-gray-500 leading-relaxed">
                    {" "}
                    Submit the form there to view your official result.{" "}
                  </p>{" "}
                </div>{" "}
              </div>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
        {/* Right Main Card */}{" "}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col min-h-[500px]">
          {" "}
          <div className="flex items-center justify-between">
            {" "}
            <h2 className="text-xs font-bold text-gray-700">
              {" "}
              Official result access{" "}
            </h2>{" "}
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100">
              {" "}
              Secure redirect{" "}
            </span>{" "}
          </div>{" "}
          <div className="my-auto">
            {" "}
            <div className="max-w-xl mx-auto text-center">
              {" "}
              <div className="w-16 h-16 mx-auto bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                {" "}
                <GraduationCap size={30} />{" "}
              </div>{" "}
              <h3 className="mt-4 text-base font-bold text-gray-900">
                {" "}
                View your result on the official website{" "}
              </h3>{" "}
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                {" "}
                To provide the most reliable result lookup, this page does not
                collect your Roll, Registration or CAPTCHA information. Click
                the button below and use the official Education Board result
                system directly.{" "}
              </p>{" "}
              {/* Primary CTA */}{" "}
              <button
                type="button"
                onClick={openOfficialPortal}
                className="mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
              >
                {" "}
                <ExternalLink size={15} />{" "}
                <span> Click Here to View Official Result </span>{" "}
              </button>{" "}
              <p className="mt-3 text-[10px] text-gray-400">
                {" "}
                The official website will open in a new tab.{" "}
              </p>{" "}
            </div>{" "}
          </div>{" "}
        </div>{" "}
      </div>{" "}
      {/* Bottom Status */}{" "}
      <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {" "}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
          {" "}
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />{" "}
          <span>
            {" "}
            Your result will be checked on the official Education Board
            website.{" "}
          </span>{" "}
        </div>{" "}
        <button
          type="button"
          onClick={openOfficialPortal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
        >
          {" "}
          <ExternalLink size={13} /> <span> Open Official Website </span>{" "}
        </button>{" "}
      </div>{" "}
      {/* How To Use */}{" "}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        {" "}
        <button
          type="button"
          onClick={() => setShowHowToUse(!showHowToUse)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-gray-800 hover:bg-gray-50/50 transition-colors"
        >
          {" "}
          <div className="flex items-center gap-2">
            {" "}
            <span className="text-orange-500"> ? </span>{" "}
            <span> How to use </span>{" "}
          </div>{" "}
          {showHowToUse ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}{" "}
        </button>{" "}
        {showHowToUse && (
          <div className="px-5 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
            {" "}
            <div className="space-y-2">
              {" "}
              <p>
                {" "}
                1. Click the{" "}
                <span className="font-semibold text-gray-700">
                  {" "}
                  Open Official Result Website{" "}
                </span>{" "}
                button.{" "}
              </p>{" "}
              <p>
                {" "}
                2. Complete the browser verification if the official website
                asks for it.{" "}
              </p>{" "}
              <p>
                {" "}
                3. On the official website, enter your Board, Examination, Year,
                Roll, Registration and CAPTCHA.{" "}
              </p>{" "}
              <p> 4. Submit the official form to view your result. </p>{" "}
            </div>{" "}
          </div>
        )}{" "}
      </div>{" "}
      {/* Related Tools */}{" "}
      <div className="space-y-3 pt-2">
        {" "}
        <h3 className="text-xs font-bold text-gray-900">
          {" "}
          Tools in the same category{" "}
        </h3>{" "}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {" "}
          <Link
            href="/sohoj-tools/national-university-result"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-200 transition-all flex items-start gap-3 group"
          >
            {" "}
            <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
              {" "}
              <GraduationCap size={16} />{" "}
            </div>{" "}
            <div>
              {" "}
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                {" "}
                National University Result{" "}
              </h4>{" "}
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                {" "}
                Check Honours, Degree Pass and Masters results.{" "}
              </p>{" "}
            </div>{" "}
          </Link>{" "}
          <Link
            href="/sohoj-tools/ats-friendly-cv-maker"
            className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-200 transition-all flex items-start gap-3 group"
          >
            {" "}
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
              {" "}
              <FileUser size={16} />{" "}
            </div>{" "}
            <div>
              {" "}
              <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                {" "}
                ATS Friendly CV Maker{" "}
              </h4>{" "}
              <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                {" "}
                Build an ATS-friendly CV with live preview.{" "}
              </p>{" "}
            </div>{" "}
          </Link>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
