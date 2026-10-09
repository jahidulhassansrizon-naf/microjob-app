import { T, useProfileText } from "./profileI18n";
import { AlertCircle, ChevronRight } from "lucide-react";
export default function CreditAlert({ credits, onBuyCredit, }: {
    credits: number;
    onBuyCredit: () => void;
}) {
    const { t } = useProfileText();
    return (<div className="bg-red-50 border border-red-100 rounded-2xl p-3 px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-600">
      <div className="flex items-center gap-2.5 text-xs font-semibold">
        <div className="w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
          <AlertCircle size={14}/>
        </div>

        <div>
          <p className="font-bold text-red-700"><T>{"Your credit is running low!"}</T></p>

          <p className="text-[11px] text-red-500 font-medium">{t(`Currently you have only ${credits} ${credits === 1 ? "credit" : "credits"} left.`)}</p>
        </div>
      </div>

      <button type="button" onClick={onBuyCredit} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors self-end sm:self-auto">
        <span><T>{"Click here to buy credit"}</T></span>
        <ChevronRight size={14}/>
      </button>
    </div>);
}
