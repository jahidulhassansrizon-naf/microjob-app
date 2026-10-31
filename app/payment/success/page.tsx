import PaymentSuccessClient from "./PaymentSuccessClient";
export const dynamic = "force-dynamic";
type SearchParams = { pp_id?: string | string[]; ppId?: string | string[]; invoice_id?: string | string[]; subscription_id?: string | string[]; provider?: string | string[]; cancelled?: string | string[] };
function first(value?: string | string[]) { return (Array.isArray(value) ? value[0] : value || "").trim(); }
export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return <PaymentSuccessClient
    ppId={first(params.pp_id) || first(params.ppId)}
    invoiceId={first(params.invoice_id)}
    subscriptionId={first(params.subscription_id)}
    provider={first(params.provider) === "uddoktapay" ? "uddoktapay" : "piprapay"}
    cancelled={first(params.cancelled) === "1"}
  />;
}
