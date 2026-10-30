import PaymentSuccessClient from "./PaymentSuccessClient";

export const dynamic = "force-dynamic";

type SearchParams = {
  pp_id?: string | string[];
  ppId?: string | string[];
  subscription_id?: string | string[];
};

function first(value?: string | string[]) {
  return (Array.isArray(value) ? value[0] : value || "").trim();
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  return (
    <PaymentSuccessClient
      ppId={first(params.pp_id) || first(params.ppId)}
      subscriptionId={first(params.subscription_id)}
    />
  );
}
