"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

const LOGIN_SUCCESS_ATTR = "data-login-success";

export default function LoginSuccessOverlay() {
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const userObj = JSON.parse(userStr);
      if (userObj?.fullName) {
        setUserName(userObj.fullName);
      }
    } catch {
      // Cached user data is optional.
    }
  }, []);

  const close = () => {
    document.documentElement.removeAttribute(LOGIN_SUCCESS_ATTR);
  };

  return (
    <div className="login-success-overlay fixed inset-0 z-[999] items-center justify-center bg-slate-900/50 px-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-success-title"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white p-7 text-center shadow-xl"
      >
        <button
          type="button"
          onClick={close}
          className="absolute right-3 top-3 z-10 cursor-pointer rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
          <CheckCircle2 size={26} strokeWidth={2} />
        </div>

        <h3 id="login-success-title" className="text-lg font-semibold text-slate-900">
          Login Successful!
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Welcome back
          {userName !== "User" && (
            <>
              , <span className="font-medium text-slate-900">{userName}</span>
            </>
          )}
          !
        </p>

        <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="login-success-progress h-full w-full origin-left rounded-full bg-[#2563EB]" />
        </div>
      </div>
    </div>
  );
}
