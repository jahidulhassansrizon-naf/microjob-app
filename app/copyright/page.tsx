"use client";
import { T } from "@/components/i18n/I18nProvider";
import Footer from "@/components/Footer";
function CopyrightSection({ number, title, children, }: {
    number: string;
    title: string;
    children: React.ReactNode;
}) {
    return (<section className="copyright-section">
      <h2>
        {number}<T>{". "}</T>{title}
      </h2>
      {children}
    </section>);
}
function BulletList({ items }: {
    items: string[];
}) {
    return (<ul className="copyright-list">
      {items.map((item, index) => (<li key={index}>{item}</li>))}
    </ul>);
}
export default function CopyrightPolicyPage() {
    return (<>
      <main className="copyright-page">
        <style>{`
          .copyright-page {
            min-height: 100vh;
            background: #f3f3f3;
            color: #1e2a36;
            font-family: Arial, Helvetica, sans-serif;
            -webkit-font-smoothing: antialiased;
            text-rendering: optimizeLegibility;
          }

          .copyright-page *,
          .copyright-page *::before,
          .copyright-page *::after {
            box-sizing: border-box;
          }

          .copyright-page a {
            color: #2a76d2;
            text-decoration: none;
          }

          .copyright-page a:hover {
            text-decoration: underline;
          }

          .copyright-shell {
            width: 100%;
            padding: 80px 24px 60px;
          }

          .copyright-paper {
            width: min(100%, 960px);
            margin: 0 auto;
            padding: 31px 28px 30px;
            background: #fff;
            border: 1px solid #e4e4e7;
            border-radius: 12px;
            box-shadow:
              0 1px 2px rgba(15, 23, 42, 0.018),
              0 5px 14px rgba(15, 23, 42, 0.018);
          }

          .copyright-title {
            margin: 0;
            padding: 0 0 12px;
            border-bottom: 1px solid #1f2937;
            color: #0f1822;
            font-size: 18px;
            line-height: 1.18;
            font-weight: 800;
            letter-spacing: -0.35px;
          }

          .copyright-intro {
            margin: 17px 0 24px;
          }

          .copyright-intro p,
          .copyright-section p {
            margin: 0 0 9px;
            color: #34404b;
            font-size: 10px;
            line-height: 1.48;
            letter-spacing: -0.03px;
          }

          .copyright-section {
            margin: 0 0 20px;
          }

          .copyright-section h2 {
            margin: 0 0 9px;
            color: #111923;
            font-size: 11px;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: -0.12px;
          }

          .copyright-subsection {
            margin-top: 12px;
          }

          .copyright-subsection h3 {
            margin: 0 0 7px;
            color: #111923;
            font-size: 10px;
            line-height: 1.25;
            font-weight: 800;
            letter-spacing: -0.1px;
          }

          .copyright-list {
            margin: 0;
            padding-left: 18px;
            color: #394550;
            font-size: 9px;
            line-height: 1.43;
          }

          .copyright-list li {
            margin: 0 0 2px;
            padding-left: 1px;
          }

          .copyright-list li::marker {
            font-size: 0.8em;
          }

          .contact-lines {
            font-size: 9px;
            line-height: 1.5;
            color: #394550;
          }

          .contact-lines strong {
            color: #111923;
          }

          .copyright-divider {
            margin-top: 16px;
            border-top: 1px solid #24303b;
          }

          .copyright-closing {
            margin-top: 12px;
            text-align: center;
            color: #34404b;
            font-size: 8.7px;
            line-height: 1.35;
          }

          @media (min-width: 700px) {
            .copyright-shell {
              padding: 80px 24px 60px;
            }

            .copyright-paper {
              width: min(100%, 960px);
              padding: 30px 28px 29px;
            }

            .copyright-title {
              font-size: 19px;
            }

            .copyright-intro p,
            .copyright-section p {
              font-size: 10px;
            }

            .copyright-section h2 {
              font-size: 11px;
            }

            .copyright-subsection h3 {
              font-size: 10px;
            }
          }

          @media (min-width: 1000px) {
            .copyright-paper {
              padding: 32px 29px 31px;
            }

            .copyright-title {
              font-size: 20px;
            }

            .copyright-intro p,
            .copyright-section p {
              font-size: 11px;
            }

            .copyright-section h2 {
              font-size: 12px;
            }

            .copyright-subsection h3 {
              font-size: 11px;
            }

            .copyright-list {
              font-size: 10px;
            }

            .contact-lines {
              font-size: 10px;
            }

            .copyright-closing {
              font-size: 9px;
            }
          }

          @media (max-width: 520px) {
            .copyright-shell {
              padding: 40px 14px 30px;
            }

            .copyright-paper {
              padding: 30px 28px 29px;
              border-radius: 11px;
            }

            .copyright-title {
              font-size: 17px;
            }

            .copyright-intro {
              margin-top: 16px;
              margin-bottom: 24px;
            }
          }
        `}</style>

        <div className="copyright-shell">
          <article className="copyright-paper">
            <h1 className="copyright-title"><T>{"Copyright Policy"}</T></h1>

            <div className="copyright-intro">
              <p><T>{"Shohada Kaj (&quot;we&quot;, &quot;us&quot;,\r\n                &quot;website&quot;) values the protection of copyright and\r\n                digital copyrights. Our goal is to ensure the protection of\r\n                digital products and templates and comply with copyright laws.\r\n              "}</T></p>
              <p><T>{"In accordance with this policy, we follow the DMCA (Digital\r\n                Millennium Copyright Act) and international copyright law.\r\n              "}</T></p>
            </div>

            <CopyrightSection number="1" title="Copyright ownership">
              <BulletList items={[
            "All digital templates, images, graphics, files, and content contained on Shohada Kaj are the copyrighted property of Shohada Kaj.",
            "The layout, design, logos, fonts, and other elements of free or paid templates are also copyright protected.",
            "Users may use it for personal or official purposes only; resale, distribution, or sharing with others is prohibited.",
            "The images, documents, or files you create using Shohada Kaj's AI tools are for your own use; however, the copyright of the platform's own templates, designs, icons, and other elements remains with Shohada Kaj.",
        ]}/>
            </CopyrightSection>

            <CopyrightSection number="2" title="DMCA Notices and Reports">
              <p><T>{"If you believe that your copyrighted work has been used without\r\n                permission on Easy Work, you can send us a DMCA notice.\r\n              "}</T></p>

              <div className="copyright-subsection">
                <h3><T>{"2.1 Required Items in a DMCA Notice"}</T></h3>
                <BulletList items={[
            "Description of copyrighted work",
            "Link to the page or file where the copyright infringement occurred.",
            "Your name, email, and phone number",
            "Written statement that you believe the use is illegal",
            "Signature (digital or handwritten)",
        ]}/>
              </div>

              <div className="copyright-subsection">
                <h3><T>{"2.2 Contact address"}</T></h3>
                <div className="contact-lines">
                  <div>
                    <strong><T>{"Email:"}</T></strong>{<T>{" "}</T>}
                    <a href="mailto:hello@sohozkaj.com"><T>{"hello@sohozkaj.com"}</T></a>
                  </div>
                  <div>
                    <strong><T>{"Phone:"}</T></strong>{<T>{" "}</T>}
                    <a href="tel:+8801700559595"><T>{"01700559595"}</T></a>
                  </div>
                </div>
              </div>
            </CopyrightSection>

            <CopyrightSection number="3" title="Our steps">
              <BulletList items={[
            "Every notice will be verified.",
            "If copyright infringement is confirmed, the link/file will be removed or blocked.",
            "Repeat violators may have their accounts permanently terminated.",
            "Legal action will be taken if necessary.",
        ]}/>
            </CopyrightSection>

            <CopyrightSection number="4" title="Safety and precautions">
              <BulletList items={[
            "Violating the copyright of others may result in legal liability for the user.",
            "When you use a template, make sure it is for personal or official use only.",
        ]}/>
            </CopyrightSection>

            <CopyrightSection number="5" title="Warning to copyright owners">
              <BulletList items={[
            "If you believe that copyright has been violated, please submit a DMCA notice.",
            "We will take action as per the notice received.",
        ]}/>
            </CopyrightSection>

            <CopyrightSection number="6" title="Policy change">
              <BulletList items={[
            "Easy Work may update this DMCA & Copyright Policy at any time.",
            "Once the new policy goes into effect, using the platform means you accept it.",
        ]}/>
            </CopyrightSection>

            <CopyrightSection number="7" title="Communication">
              <p><T>{"For any questions regarding copyright or DMCA, please contact:\r\n              "}</T></p>
              <div className="contact-lines">
                <div>
                  <strong><T>{"Email:"}</T></strong>{<T>{" "}</T>}
                  <a href="mailto:hello@sohozkaj.com"><T>{"hello@sohozkaj.com"}</T></a>
                </div>
                <div>
                  <strong><T>{"Phone:"}</T></strong>{<T>{" "}</T>}
                  <a href="tel:+8801700559595"><T>{"+88 01700-559595"}</T></a>
                </div>
                <div>
                  <strong><T>{"Website:"}</T></strong>{<T>{" "}</T>}
                  <a href="https://www.sohozkaj.com" target="_blank" rel="noreferrer"><T>{"www.sohozkaj.com\r\n                  "}</T></a>
                </div>
              </div>
            </CopyrightSection>

            <div className="copyright-divider"/>

            <div className="copyright-closing"><T>{"By using Easy Tasks, you will be deemed to have fully accepted all\r\n              terms of this DMCA &amp; Copyright Policy.\r\n            "}</T></div>
          </article>
        </div>
      </main>

      <Footer />
    </>);
}
