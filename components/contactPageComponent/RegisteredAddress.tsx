"use client";
import { T } from "@/components/i18n/I18nProvider";
import React from "react";
import { MapPin, Phone, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
export default function RegisteredAddress() {
    return (<section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto text-center">
        {/* Top Badge & Header */}
        <motion.span initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.1 }} className="inline-block bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 shadow-sm"><T>{"+ Organization information\r\n        "}</T></motion.span>

        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }} className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] mb-3"><T>{"Registered "}</T><span className="text-[#2563EB]"><T>{"Address and license"}</T></span>
        </motion.h2>

        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }} className="text-[#334155] text-sm max-w-2xl mx-auto mb-12"><T>{"Easy Work is a service of Sigmative. Below is our registered office\r\n          and trade license information.\r\n        "}</T></motion.p>

        {/* Address Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Bangladesh Head Office Card */}
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }} whileHover={{ y: -6, transition: { duration: 0.2 } }} className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,23,42,0.04)] text-left flex flex-col justify-between">
            <div>
              <span className="inline-block bg-[#EFF6FF] text-[#2563EB] border border-[#E2E8F0] text-xs font-semibold px-3 py-1 rounded-full mb-6"><T>{"Bangladesh \u00B7 Head Office\r\n              "}</T></span>

              <div className="space-y-3 mb-8">
                <div className="flex items-start space-x-3 text-[#64748B] text-sm italic">
                  <MapPin className="w-4 h-4 text-[#2563EB] mt-1 shrink-0 not-italic"/>
                  <span><T>{"Address will be updated soon..."}</T></span>
                </div>
                <div className="flex items-center space-x-3 text-[#64748B] text-sm italic">
                  <Phone className="w-4 h-4 text-[#10B981] shrink-0 not-italic"/>
                  <span><T>{"Phone number will be updated soon..."}</T></span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center space-x-2 text-xs text-[#64748B] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#10B981]"/>
              <span><T>{"Trade License Number :"}</T>{<T>{" "}</T>}
                <strong className="text-[#64748B] font-normal italic"><T>{"Trade license number will be updated soon...\r\n                "}</T></strong>
              </span>
            </div>
          </motion.div>

          {/* United States Hub Card */}
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }} whileHover={{ y: -6, transition: { duration: 0.2 } }} className="bg-white p-8 rounded-3xl border border-[#E2E8F0] shadow-[0_8px_30px_rgba(15,23,42,0.04)] text-left flex flex-col justify-between">
            <div>
              <span className="inline-block bg-[#EFF6FF] text-[#2563EB] border border-[#E2E8F0] text-xs font-semibold px-3 py-1 rounded-full mb-6"><T>{"United States \u00B7 Hub\r\n              "}</T></span>

              <div className="space-y-3 mb-8">
                <div className="flex items-start space-x-3 text-[#64748B] text-sm italic">
                  <MapPin className="w-4 h-4 text-[#2563EB] mt-1 shrink-0 not-italic"/>
                  <span><T>{"Address will be updated soon..."}</T></span>
                </div>
                <div className="flex items-center space-x-3 text-[#64748B] text-sm italic">
                  <Phone className="w-4 h-4 text-[#10B981] shrink-0 not-italic"/>
                  <span><T>{"Phone number will be updated soon..."}</T></span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#E2E8F0] flex items-center space-x-2 text-xs text-[#64748B] font-medium">
              <ShieldCheck className="w-4 h-4 text-[#10B981]"/>
              <span><T>{"LLC EIN Number :"}</T>{<T>{" "}</T>}
                <strong className="text-[#64748B] font-normal italic"><T>{"EIN number will be updated soon...\r\n                "}</T></strong>
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>);
}
