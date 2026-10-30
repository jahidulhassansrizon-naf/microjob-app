"use client";
import { T } from "@/components/i18n/I18nProvider";
import Footer from "@/components/Footer";
function BulletList({ items }: {
    items: string[];
}) {
    return (<ul className="refund-list">
      {items.map((item, index) => (<li key={index}>{item}</li>))}
    </ul>);
}
function RefundSection({ number, title, children, }: {
    number: string;
    title: string;
    children: React.ReactNode;
}) {
    return (<section className="refund-section">
      <h2>
        {number}<T>{". "}</T>{title}
      </h2>
      {children}
    </section>);
}
export default function RefundPolicyPage() {
    return (<>
      <main className="refund-page">
        <style>{`
          .refund-page {
            min-height: 100vh;
            background: #f3f3f3;
            color: #1f2933;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: geometricPrecision;
          }

          .refund-page *,
          .refund-page *::before,
          .refund-page *::after {
            box-sizing: border-box;
          }

          .refund-page a {
            color: #2a79d2;
            text-decoration: none;
          }

          .refund-page a:hover {
            text-decoration: underline;
          }

          .refund-shell {
            width: 100%;
            padding: 80px 24px 60px;
          }

          .refund-paper {
            width: min(960px, calc(100% - 104px));
            margin: 0 auto;
            padding: 30px 28px 29px;
            background: #fff;
            border: 1px solid #e3e3e6;
            border-radius: 11px;
            box-shadow:
              0 1px 2px rgba(15, 23, 42, .02),
              0 5px 15px rgba(15, 23, 42, .018);
          }

          .refund-title {
            margin: 0;
            padding: 0 0 12px;
            border-bottom: 1px solid #20242a;
            color: #101721;
            font-size: 18px;
            line-height: 1.16;
            font-weight: 800;
            letter-spacing: -0.28px;
          }

          .refund-intro {
            margin: 17px 0 24px;
          }

          .refund-intro p,
          .refund-section p {
            margin: 0 0 7px;
            color: #35404b;
            font-size: 10px;
            line-height: 1.47;
            letter-spacing: -0.02px;
          }

          .refund-section {
            margin: 0 0 18px;
          }

          .refund-section h2 {
            margin: 0 0 8px;
            color: #101721;
            font-size: 11px;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: -0.1px;
          }

          .refund-subsection {
            margin-top: 11px;
          }

          .refund-subsection h3 {
            margin: 0 0 6px;
            color: #101721;
            font-size: 10px;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: -0.08px;
          }

          .refund-list {
            margin: 0;
            padding-left: 18px;
            color: #3a4652;
            font-size: 9px;
            line-height: 1.4;
          }

          .refund-list li {
            margin: 0 0 1.5px;
            padding-left: 1px;
          }

          .refund-list li::marker {
            font-size: .8em;
          }

          .refund-contact {
            color: #34414c;
            font-size: 9px;
            line-height: 1.5;
          }

          .refund-contact strong {
            color: #111a24;
          }

          .refund-divider {
            margin-top: 12px;
            border-top: 1px solid #1f2933;
          }

          .refund-closing {
            margin-top: 10px;
            text-align: center;
            color: #35404b;
            font-size: 8.5px;
            line-height: 1.35;
          }

          @media (min-width: 900px) {
            .refund-paper {
              padding: 31px 28px 30px;
            }

            .refund-title {
              font-size: 19px;
            }

            .refund-intro p,
            .refund-section p {
              font-size: 11px;
            }

            .refund-section h2 {
              font-size: 12px;
            }

            .refund-subsection h3 {
              font-size: 11px;
            }

            .refund-list,
            .refund-contact {
              font-size: 10px;
            }

            .refund-closing {
              font-size: 9px;
            }
          }

          @media (max-width: 700px) {
            .refund-paper {
              width: calc(100% - 30px);
              min-height: 0;
            }
          }

          @media (max-width: 520px) {
            .refund-shell {
              padding: 40px 14px 30px;
            }

            .refund-paper {
              width: calc(100% - 28px);
              padding: 29px 28px 28px;
              border-radius: 10px;
            }

            .refund-title {
              font-size: 17px;
            }

            .refund-intro p,
            .refund-section p {
              font-size: 9px;
            }

            .refund-section h2 {
              font-size: 10px;
            }

            .refund-subsection h3 {
              font-size: 9px;
            }

            .refund-list,
            .refund-contact {
              font-size: 8.5px;
            }

            .refund-closing {
              font-size: 8px;
            }
          }
        `}</style>

        <div className="refund-shell">
          <article className="refund-paper">
            <h1 className="refund-title"><T>{"Refund Policy"}</T></h1>

            <div className="refund-intro">
              <p><T>{"Sahaj Kaaj provides digital services and templates on a\r\n                pay-as-you-go credit model\u2014you buy a credit package and each AI\r\n                task (image, document, print, template) costs credits. To ensure\r\n                clarity for users, we follow the Refund Policy below.\r\n              "}</T></p>
            </div>

            <RefundSection number="1" title="Refund Policy for Digital Products / Services">
              <p><T>{"Once credits are spent on AI work or once digital templates are\r\n                downloaded/accessed, no refunds are generally given.\r\n              "}</T></p>
              <p><T>{"Reason:"}</T></p>
              <BulletList items={[
            "It is not possible to return digital files.",
            "Once the buyer downloads the file, it remains with them permanently.",
        ]}/>
              <p style={{ marginTop: 5 }}><T>{"However, refunds will be considered in some special\r\n                circumstances (see below).\r\n              "}</T></p>
            </RefundSection>

            <RefundSection number="2" title="In which cases can a refund be given?">
              <p><T>{"Refunds will be considered in the following cases:"}</T></p>

              <div className="refund-subsection">
                <h3><T>{"2.1 Supply of wrong products/services"}</T></h3>
                <p><T>{"If you receive a different file instead of the template you\r\n                  purchased.\r\n                "}</T></p>
              </div>

              <div className="refund-subsection">
                <h3><T>{"2.2 Technical error in downloadable file"}</T></h3>
                <p><T>{"If file:"}</T></p>
                <BulletList items={[
            "Does not open.",
            "The file is corrupted.",
            "Incomplete or unusable",
        ]}/>
                <p style={{ marginTop: 5 }}><T>{"And if we fail to resolve the issue, a refund will be\r\n                  provided.\r\n                "}</T></p>
              </div>

              <div className="refund-subsection">
                <h3><T>{"2.3 Duplicate Payment"}</T></h3>
                <p><T>{"If you accidentally purchase the same product/service more\r\n                  than once.\r\n                "}</T></p>
              </div>
            </RefundSection>

            <RefundSection number="3" title="No refund will be given in any case.">
              <BulletList items={[
            "User mistake purchase",
            '"Change of mind" or "no longer needed" type reasons',
            "After downloading the product/file",
            "Design likes and dislikes",
            "If you can't use the template due to a software/device issue",
            "If the product/service does not work as expected, but everything is clearly mentioned in the description",
        ]}/>
            </RefundSection>

            <RefundSection number="4" title="Rules for applying for a refund">
              <p><T>{"If you want a refund, you must apply within 7 days."}</T></p>
              <p><T>{"To apply you need:"}</T></p>
              <BulletList items={[
            "Order number",
            "Problem description",
            "Screenshot or video proof if necessary",
        ]}/>
              <div className="refund-contact" style={{ marginTop: 5 }}>
                <div>
                  <strong><T>{"Email:"}</T></strong>{<T>{" "}</T>}
                  <a href="mailto:hello@sebalagbe.com"><T>{"hello@sebalagbe.com"}</T></a>
                </div>
                <div><T>{"We will review your request within 3-5 business days."}</T></div>
              </div>
            </RefundSection>

            <RefundSection number="5" title="If the refund is approved">
              <BulletList items={[
            "The money will be refunded to the payment method used to make the payment.",
            "Refunds can usually take 7 to 14 business days to arrive depending on the bank/payment gateway.",
        ]}/>
            </RefundSection>

            <RefundSection number="6" title="Payment gateway fees">
              <BulletList items={[
            "In some cases, payment gateways (such as SSLCommerz, Moneybag, FastSpring) may not refund transaction fees.",
            "In that case, we will only be able to refund the net amount.",
        ]}/>
            </RefundSection>

            <RefundSection number="7" title="Policy change">
              <p><T>{"Seba Lagbe may update the Refund Policy at any time. The changed\r\n                policy will be effective upon publication on the website.\r\n              "}</T></p>
            </RefundSection>

            <RefundSection number="8" title="Communication">
              <p><T>{"For refund related questions, please contact us:"}</T></p>
              <div className="refund-contact">
                <div>
                  <strong><T>{"Email:"}</T></strong>{<T>{" "}</T>}
                  <a href="mailto:hello@sebalagbe.com"><T>{"hello@sebalagbe.com"}</T></a>
                </div>
                <div>
                  <strong><T>{"Phone:"}</T></strong>{<T>{" "}</T>}
                  <a href="tel:+8801700559595"><T>{"+88 01700-559595"}</T></a>
                </div>
                <div>
                  <strong><T>{"Website:"}</T></strong>{<T>{" "}</T>}
                  <a href="https://sebalagbe.com" target="_blank" rel="noreferrer"><T>{"sebalagbe.com\r\n                  "}</T></a>
                </div>
              </div>
            </RefundSection>

            <div className="refund-divider"/>

            <div className="refund-closing"><T>{"If you purchase services from Seba Lagbe, you will be deemed to\r\n              have accepted all the terms of this Refund Policy.\r\n            "}</T></div>
          </article>
        </div>
      </main>

      <Footer />
    </>);
}
