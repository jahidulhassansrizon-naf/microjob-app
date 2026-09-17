"use client";

import React, { useState } from "react";
import { Phone, Mail, Clock } from "lucide-react";

export default function ContactHero() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    details: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
  };

  return (
    <section className="relative overflow-hidden bg-[#f3f4f6] px-4 sm:px-6 lg:px-8">
      {/* Reference-style top background */}
      <div className="absolute inset-x-0 top-0 h-[650px] bg-gradient-to-b from-[#fcf5f1] via-[#f9f4f5] to-[#f1f1f8]" />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-[1100px] pt-[102px] pb-24">
        {/* Header */}
        <div className="mx-auto max-w-[760px] text-center">
          <span className="inline-flex h-[35px] items-center rounded-full border border-[#ff8a00] bg-white/20 px-[17px] text-[13px] font-medium leading-none text-[#ff7a00]">
            Do you have questions?
          </span>

          <h1 className="mt-[25px] text-center text-[52px] font-extrabold leading-[1.36] tracking-[-1.7px] text-black sm:text-[54px]">
            <span className="text-[#ff7a00]">Easy communication</span>
            <span>Do it,</span>
            <br />
            <span>you will get the solution</span>
            <br />
            <span>quickly.</span>
          </h1>

          <p className="mx-auto mt-[30px] max-w-[700px] text-[17px] font-normal leading-[1.55] text-[#15243a]">
            Our team is ready to answer your questions and support you. Fill out
            the form below
            <br className="hidden sm:block" />
            and we will get back to you shortly.
          </p>
        </div>

        {/* Form + contact cards */}
        <div className="mx-auto mt-[96px] grid max-w-[764px] grid-cols-1 items-start gap-5 lg:grid-cols-[500px_242px]">
          {/* Form */}
          <div className="rounded-[26px] bg-white px-[34px] py-[31px] shadow-[0_8px_30px_rgba(26,31,44,0.04)]">
            <h2 className="text-[29px] font-extrabold leading-[1.25] tracking-[-0.8px] text-black">
              Send your <span className="text-[#ff7a00]">message.</span>
            </h2>

            <p className="mt-[8px] text-[16px] leading-[1.45] text-[#344054]">
              Fill out the form and we will contact you soon.
            </p>

            <form onSubmit={handleSubmit} className="mt-[26px] space-y-[13px]">
              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Your name
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name......."
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Email Address <span className="text-[#ff7a00]">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email address........"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Phone number <span className="text-[#ff7a00]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Enter your phone number......."
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="What do you want to know about?"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="h-[43px] w-full rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <div>
                <label className="mb-[7px] block text-[13px] font-bold text-black">
                  Details <span className="text-[#ff7a00]">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Write your words..."
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                  className="h-[102px] w-full resize-none rounded-[7px] border border-[#d7dbe2] bg-white px-[15px] py-[12px] text-[13px] text-black outline-none placeholder:text-[#a3afbf] focus:border-[#ff7a00] focus:ring-2 focus:ring-[#ff7a00]/10"
                />
              </div>

              <button
                type="submit"
                className="mt-[3px] h-[45px] w-full rounded-[7px] bg-[#ff5a00] px-6 text-[13px] font-bold text-white transition hover:bg-[#f45100] active:scale-[0.995]"
              >
                Send us
              </button>
            </form>
          </div>

          {/* Contact information */}
          <div className="space-y-5">
            {/* Phone */}
            <div className="min-h-[167px] rounded-[24px] border border-black bg-white px-[26px] py-[25px]">
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#00cc67] text-white">
                  <Phone className="h-[27px] w-[27px]" strokeWidth={2.1} />
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-black">
                    Phone number
                  </h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#7b8798]">
                    9 am to 6 pm
                  </p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#dfe3e8]" />

              <div className="space-y-[4px] text-[14px] font-semibold leading-[1.2] text-[#334155]">
                <p>+88 01700-559595</p>
                <p>+88 01718-542596</p>
              </div>
            </div>

            {/* Email */}
            <div className="min-h-[167px] rounded-[24px] border border-black bg-white px-[26px] py-[25px]">
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#1e9eff] text-white">
                  <Mail className="h-[27px] w-[27px]" strokeWidth={2.1} />
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-black">
                    Email
                  </h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#7b8798]">
                    Reply within 24 hours
                  </p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#dfe3e8]" />

              <div className="space-y-[4px] text-[13px] font-semibold leading-[1.2] text-[#334155]">
                <p>hello@sohozkaj.com</p>
                <p>support@sohozkaj.com</p>
              </div>
            </div>

            {/* Office hours */}
            <div className="min-h-[175px] rounded-[24px] border border-black bg-white px-[26px] py-[25px]">
              <div className="flex items-start gap-[16px]">
                <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[13px] bg-[#d43ce8] text-white">
                  <Clock className="h-[27px] w-[27px]" strokeWidth={2.1} />
                </div>

                <div className="min-w-0 pt-[1px]">
                  <h3 className="text-[17px] font-extrabold leading-[1.1] text-black">
                    Office hours
                  </h3>
                  <p className="mt-[4px] text-[12px] leading-[1.2] text-[#7b8798]">
                    Reliable and fast support
                  </p>
                </div>
              </div>

              <div className="my-[16px] h-px bg-[#dfe3e8]" />

              <div className="space-y-[13px] text-[12px] text-[#475467]">
                <div>
                  <p className="font-extrabold text-black">Sunday - Thursday</p>
                  <p className="mt-[3px] text-[#667085]">09:00 AM - 05:00 PM</p>
                </div>

                <div>
                  <p className="font-extrabold text-black">Friday - Saturday</p>
                  <p className="mt-[3px] text-[#98a2b3]">Weekend</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
