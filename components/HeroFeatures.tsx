"use client";
import { T } from "@/components/i18n/I18nProvider";
import { Sparkles } from "lucide-react";
import { Aurora, GRAD_TEXT, SectionHead } from "@/components/ui/Premium";

export default function HeroFeatures() {
  return (
    <section className="relative isolate overflow-hidden bg-white pb-10 pt-20 sm:pt-28">
      <Aurora variant="top" />
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 mx-auto h-px max-w-[1400px] bg-gradient-to-r from-transparent via-indigo-200 to-transparent"
      />

      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 md:px-12">
        <SectionHead
          icon={<Sparkles size={12} />}
          eyebrow={<T>{"AI Photoshop"}</T>}
          title={
            <>
              <T>{"Create "}</T>
              <span className={GRAD_TEXT}>
                <T>{"professional photos"}</T>
              </span>
              {<T> </T>}
              <T>{"faster "}</T>
              <br className="hidden sm:inline" />
              <T>{"and more precisely"}</T>
            </>
          }
          sub={
            <T>
              {
                "Create professional photos from normal images in just a few seconds without Photoshop, using Seba Lagbe."
              }
            </T>
          }
        />
      </div>
    </section>
  );
}
