"use client";

import React from "react";
import { MapPin, Phone, ShieldCheck } from "lucide-react";

export default function RegisteredAddress() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50/50">
      <div className="max-w-7xl mx-auto text-center">
        {/* Top Badge & Header */}
        <span className="inline-block bg-orange-100 text-orange-600 text-xs font-semibold px-4 py-1.5 rounded-full mb-4">
          + Organization information
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
          Registered{" "}
          <span className="text-orange-500">Address and license</span>
        </h2>
        <p className="text-gray-500 text-sm max-w-2xl mx-auto mb-12">
          Easy Work is a service of Sigmative. Below is our registered office
          and trade license information.
        </p>

        {/* Address Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Bangladesh Head Office Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left flex flex-col justify-between">
            <div>
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
                Bangladesh · Head Office
              </span>

              <div className="space-y-3 mb-8">
                <div className="flex items-start space-x-3 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                  <span>Bogra - 5800, Bangladesh</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>+88 01700-559595</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center space-x-2 text-xs text-gray-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>
                Trade License Number :{" "}
                <strong className="text-gray-900">26867</strong>
              </span>
            </div>
          </div>

          {/* United States Hub Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm text-left flex flex-col justify-between">
            <div>
              <span className="inline-block bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1 rounded-full mb-6">
                United States · Hub
              </span>

              <div className="space-y-3 mb-8">
                <div className="flex items-start space-x-3 text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                  <span>30 N Gould St Ste R, Sheridan, WY 82801</span>
                </div>
                <div className="flex items-center space-x-3 text-gray-600 text-sm">
                  <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                  <span>+1 3073108090</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center space-x-2 text-xs text-gray-500 font-medium">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>
                LLC EIN Number :{" "}
                <strong className="text-gray-900">36-5158602</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
