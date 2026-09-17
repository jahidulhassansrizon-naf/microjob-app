"use client";

import * as React from "react";
import { Play } from "lucide-react";

export default function ContactMap() {
  return (
    <section className="relative min-h-[1000px] overflow-hidden bg-[#f3f4f5] px-4 pb-0 pt-[78px] sm:px-6 lg:px-8">
      <div className="relative z-10 mx-auto w-full max-w-[1180px] text-center">
        {/* Badge */}
        <span className="inline-flex h-[42px] items-center rounded-full border border-[#ff8a00] bg-white px-[19px] text-[14px] font-medium text-[#ff7a00]">
          Address
        </span>

        {/* Heading */}
        <h2 className="mx-auto mt-[27px] max-w-[930px] text-[48px] font-extrabold leading-[1.17] tracking-[-2px] text-black sm:text-[54px] lg:text-[58px]">
          Come to us. <span className="text-[#ff7a00]">In the office</span>
        </h2>

        {/* Description */}
        <p className="mt-[31px] text-[17px] font-normal leading-[1.5] text-[#18263a]">
          Our office address is Latifpur, Colony, Bogra-5800, Bangladesh.
        </p>

        {/* Buttons */}
        <div className="mt-[51px] flex flex-wrap items-center justify-center gap-[15px]">
          <a
            href="https://maps.google.com/?q=Latifpur+Colony+Bogra+Bangladesh"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-[58px] min-w-[248px] items-center justify-center gap-[10px] rounded-full bg-gradient-to-r from-[#ffae00] via-[#ff7900] to-[#ff3b19] px-7 text-[16px] font-semibold text-white shadow-[0_3px_7px_rgba(255,108,0,0.24)] transition hover:brightness-105"
          >
            <span>View location on map</span>
            <span className="text-[25px] leading-none">→</span>
          </a>

          <button
            type="button"
            className="inline-flex h-[58px] min-w-[292px] items-center justify-center gap-[10px] rounded-full border border-[#ececef] bg-white px-7 text-[16px] font-medium text-[#344054] shadow-[0_2px_6px_rgba(20,20,40,0.06)] transition hover:bg-[#fafafa]"
          >
            <span className="flex h-[17px] w-[17px] items-center justify-center rounded-full border border-[#67758a]">
              <Play className="h-[8px] w-[8px] fill-[#67758a] text-[#67758a]" />
            </span>

            <span>Watch the video tutorial</span>
          </button>
        </div>

        {/* World Map */}
        <div className="relative mx-auto mt-[77px] w-full max-w-[1200px]">
          <img
            src="https://sohozkaj.com/assets/global-map.svg"
            alt="World map"
            className="block h-auto w-full select-none object-contain"
            draggable={false}
          />

          {/* Bogra, Bangladesh location label */}
          <div className="pointer-events-none absolute left-[70.8%] top-[36%] z-20 -translate-x-1/2 -translate-y-full">
            <div className="relative flex items-center gap-[10px] rounded-[4px] bg-white px-[14px] py-[9px] shadow-[0_5px_18px_rgba(20,20,50,0.08)]">
              {/* Bangladesh Flag */}
              <span
                aria-hidden="true"
                className="relative h-[14px] w-[21px] shrink-0 overflow-hidden rounded-[2px] bg-[#006a4e]"
              >
                <span className="absolute left-[7px] top-[2px] h-[10px] w-[10px] rounded-full bg-[#f42a41]" />
              </span>

              <span className="whitespace-nowrap text-[16px] font-extrabold leading-none text-[#101828]">
                Bogra, Bangladesh.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
