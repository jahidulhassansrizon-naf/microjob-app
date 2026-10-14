"use client";

import Footer from "@/components/Footer";
import { useI18n } from "@/components/i18n/I18nProvider";
import { Mail, ShieldCheck, FileText, Copyright } from "lucide-react";

type LocalePair = [en: string, bn: string];
type PolicySection = {
  heading: LocalePair;
  paragraphs?: LocalePair[];
  bullets?: LocalePair[];
};
type PolicyContent = {
  eyebrow: LocalePair;
  title: LocalePair;
  intro: LocalePair;
  icon: "terms" | "privacy" | "copyright";
  sections: PolicySection[];
};

const policies: Record<"terms" | "privacy" | "copyright", PolicyContent> = {
  terms: {
    eyebrow: ["SOHOJ HUB · PLATFORM GUIDELINES", "সহজ হাব · প্ল্যাটফর্ম নির্দেশিকা"],
    title: ["Terms of Service", "ব্যবহারের শর্তাবলি"],
    intro: [
      "These terms explain how you may use Sohoj Hub, an independently developed digital-work platform offering online tools and creative utilities. By accessing or using the platform, you agree to these terms. If you do not agree, please stop using the service.",
      "এই শর্তাবলিতে সহজ হাব ব্যবহারের নিয়ম ব্যাখ্যা করা হয়েছে। সহজ হাব একটি স্বতন্ত্রভাবে তৈরি ডিজিটাল কাজের প্ল্যাটফর্ম, যেখানে অনলাইন টুল ও সৃজনশীল সুবিধা রয়েছে। প্ল্যাটফর্ম ব্যবহার করলে আপনি এই শর্তগুলোতে সম্মত হচ্ছেন। সম্মত না হলে সেবা ব্যবহার বন্ধ রাখুন।",
    ],
    icon: "terms",
    sections: [
      { heading: ["1. About Sohoj Hub", "১. সহজ হাব সম্পর্কে"], paragraphs: [[
        "Sohoj Hub is built and maintained independently. It provides digital tools that may include photo and image editing, AI-assisted features, document and PDF utilities, templates, and other productivity tools. Available features may change as development continues.",
        "সহজ হাব স্বাধীনভাবে তৈরি ও পরিচালিত হচ্ছে। এখানে ছবি সম্পাদনা, এআই-সহায়ক সুবিধা, ডকুমেন্ট ও পিডিএফ টুল, টেমপ্লেট এবং অন্যান্য কাজের টুল থাকতে পারে। উন্নয়নের সঙ্গে সুবিধাগুলো পরিবর্তিত হতে পারে।",
      ]] },
      { heading: ["2. Accounts and access", "২. অ্যাকাউন্ট ও ব্যবহার"], bullets: [
        ["Provide information that is accurate to the best of your knowledge and keep your sign-in details secure.", "আপনার জানা অনুযায়ী সঠিক তথ্য দিন এবং লগইনের তথ্য নিরাপদে রাখুন।"],
        ["You are responsible for activity carried out through your account. Contact us promptly if you suspect unauthorized access.", "আপনার অ্যাকাউন্ট থেকে হওয়া কার্যকলাপের দায়িত্ব আপনার। অননুমোদিত প্রবেশের সন্দেহ হলে দ্রুত যোগাযোগ করুন।"],
        ["Do not sell, share, or misuse account access in a way that risks other users or the platform.", "অন্য ব্যবহারকারী বা প্ল্যাটফর্মের ঝুঁকি তৈরি করে এমনভাবে অ্যাকাউন্ট বিক্রি, ভাগাভাগি বা অপব্যবহার করবেন না।"],
      ] },
      { heading: ["3. Tools, outputs and accuracy", "৩. টুল, ফলাফল ও নির্ভুলতা"], paragraphs: [[
        "Tools and AI-assisted outputs are provided to help with everyday tasks. Results may be incomplete, inaccurate, or unsuitable for a particular purpose. Review every generated or edited result before relying on it, publishing it, printing it, or submitting it to an authority.",
        "দৈনন্দিন কাজ সহজ করার জন্য টুল ও এআই-সহায়ক ফলাফল দেওয়া হয়। ফলাফল অসম্পূর্ণ, ভুল বা কোনো নির্দিষ্ট কাজের জন্য অনুপযুক্ত হতে পারে। তৈরি বা সম্পাদিত ফলাফল ব্যবহার, প্রকাশ, প্রিন্ট বা কোনো কর্তৃপক্ষের কাছে জমা দেওয়ার আগে নিজে যাচাই করুন।",
      ], [
        "Sohoj Hub does not replace professional, legal, financial, medical, government, or other official advice or decisions.",
        "সহজ হাব পেশাগত, আইনি, আর্থিক, চিকিৎসা, সরকারি বা অন্য কোনো আনুষ্ঠানিক পরামর্শ কিংবা সিদ্ধান্তের বিকল্প নয়।",
      ]] },
      { heading: ["4. Acceptable use", "৪. গ্রহণযোগ্য ব্যবহার"], bullets: [
        ["Use the platform only for lawful purposes and only with material you have the right to use.", "শুধু আইনসম্মত কাজে এবং আপনার ব্যবহারের অধিকার আছে এমন উপকরণ দিয়েই প্ল্যাটফর্ম ব্যবহার করুন।"],
        ["Do not upload or create content intended to defraud, harass, impersonate, threaten, or violate another person’s rights.", "প্রতারণা, হয়রানি, ছদ্মবেশ ধারণ, হুমকি বা অন্যের অধিকার লঙ্ঘনের উদ্দেশ্যে কনটেন্ট আপলোড বা তৈরি করবেন না।"],
        ["Do not attempt to disrupt, reverse-engineer, bypass access controls, or gain unauthorized access to the service or its systems.", "সেবা বা এর সিস্টেমে বিঘ্ন ঘটানো, অনুমতি ছাড়া প্রবেশ, নিরাপত্তা ব্যবস্থা এড়ানো বা অননুমোদিতভাবে প্রযুক্তিগত কাঠামো বিশ্লেষণের চেষ্টা করবেন না।"],
      ] },
      { heading: ["5. Your files and content", "৫. আপনার ফাইল ও কনটেন্ট"], paragraphs: [[
        "You keep the rights you already hold in the files, photos, text, and other material you submit. You give Sohoj Hub permission to process that material only as reasonably needed to provide the feature you request, maintain security, and troubleshoot the service.",
        "আপনার আপলোড করা ফাইল, ছবি, লেখা ও অন্যান্য উপকরণের ওপর আগে থেকে থাকা অধিকার আপনারই থাকবে। আপনি যে সুবিধাটি চান তা দিতে, নিরাপত্তা বজায় রাখতে এবং সমস্যা সমাধান করতে যতটুকু প্রয়োজন, ততটুকু প্রক্রিয়াকরণের অনুমতি সহজ হাবকে দিচ্ছেন।",
      ], [
        "Make sure you have permission to upload any personal information, photograph, document, or third-party work. Avoid uploading sensitive information unless the feature requires it and you are authorized to do so.",
        "ব্যক্তিগত তথ্য, ছবি, নথি বা অন্যের কাজ আপলোড করার অনুমতি আপনার আছে কি না নিশ্চিত করুন। কোনো সুবিধার জন্য প্রয়োজনীয় ও অনুমোদিত না হলে সংবেদনশীল তথ্য আপলোড করা এড়িয়ে চলুন।",
      ]] },
      { heading: ["6. Fees, credits and payments", "৬. মূল্য, ক্রেডিট ও পেমেন্ট"], paragraphs: [[
        "Some features may be free while others may require payment, credits, or a plan. Any applicable price, limits, and purchase conditions will be shown before you confirm a transaction. Check those details carefully before paying.",
        "কিছু সুবিধা বিনামূল্যে এবং কিছু সুবিধার জন্য পেমেন্ট, ক্রেডিট বা প্ল্যান লাগতে পারে। প্রযোজ্য মূল্য, সীমাবদ্ধতা ও কেনার শর্ত লেনদেন নিশ্চিত করার আগে দেখানো হবে। পেমেন্টের আগে সেগুলো ভালোভাবে যাচাই করুন।",
      ], [
        "Payments may be handled by a third-party payment provider. Their terms and privacy practices may also apply. For an incorrect or missing transaction, contact us with the transaction reference and relevant details; do not send full card credentials by email.",
        "পেমেন্ট তৃতীয় পক্ষের পেমেন্ট সেবাদাতার মাধ্যমে পরিচালিত হতে পারে। তাদের শর্ত ও গোপনীয়তার নিয়মও প্রযোজ্য হতে পারে। ভুল বা অনুপস্থিত লেনদেনের ক্ষেত্রে লেনদেনের রেফারেন্স ও প্রাসঙ্গিক তথ্যসহ যোগাযোগ করুন; ইমেইলে সম্পূর্ণ কার্ডের তথ্য পাঠাবেন না।",
      ]] },
      { heading: ["7. Platform intellectual property", "৭. প্ল্যাটফর্মের মেধাস্বত্ব"], paragraphs: [[
        "Unless stated otherwise, Sohoj Hub’s original branding, interface, written material, and platform code are owned by or used with permission by the platform operator. These terms do not transfer ownership to you. Separate licences may apply to third-party assets and open-source software.",
        "অন্যভাবে উল্লেখ না থাকলে সহজ হাবের নিজস্ব ব্র্যান্ডিং, ইন্টারফেস, লেখা ও প্ল্যাটফর্মের কোড প্ল্যাটফর্ম পরিচালকের মালিকানাধীন অথবা অনুমতিসাপেক্ষে ব্যবহৃত। এই শর্তের মাধ্যমে সেগুলোর মালিকানা আপনার কাছে হস্তান্তর হয় না। তৃতীয় পক্ষের উপকরণ ও ওপেন-সোর্স সফটওয়্যারে আলাদা লাইসেন্স প্রযোজ্য হতে পারে।",
      ]] },
      { heading: ["8. External services", "৮. বাহ্যিক সেবা"], paragraphs: [[
        "Some features may rely on external hosting, AI, payment, messaging, or other service providers. Sohoj Hub is not responsible for independent services that it does not operate, and their availability may affect the corresponding feature.",
        "কিছু সুবিধা বাহ্যিক হোস্টিং, এআই, পেমেন্ট, বার্তা পাঠানো বা অন্যান্য সেবাদাতার ওপর নির্ভর করতে পারে। সহজ হাবের নিয়ন্ত্রণে নেই এমন স্বতন্ত্র সেবার জন্য সহজ হাব দায়ী নয় এবং সেগুলোর প্রাপ্যতা সংশ্লিষ্ট সুবিধায় প্রভাব ফেলতে পারে।",
      ]] },
      { heading: ["9. Availability and liability", "৯. সেবার প্রাপ্যতা ও দায়"], paragraphs: [[
        "We aim to keep the platform useful and available, but we cannot promise uninterrupted access or that every feature will always be error-free. To the extent permitted by applicable law, the platform is provided on an “as available” basis and we are not liable for indirect loss caused by reliance on an unverified result or a temporary outage.",
        "প্ল্যাটফর্মকে কার্যকর ও সচল রাখার চেষ্টা করা হয়, তবে নিরবচ্ছিন্ন প্রবেশাধিকার বা প্রতিটি সুবিধা সব সময় ত্রুটিমুক্ত থাকার নিশ্চয়তা দেওয়া যায় না। প্রযোজ্য আইনে যতটুকু অনুমোদিত, সেবা “যেভাবে উপলভ্য” ভিত্তিতে দেওয়া হয়; যাচাই না করা ফলাফলের ওপর নির্ভরতা বা সাময়িক বিভ্রাট থেকে সৃষ্ট পরোক্ষ ক্ষতির জন্য দায় সীমিত থাকবে।",
      ]] },
      { heading: ["10. Changes and suspension", "১০. পরিবর্তন ও স্থগিতকরণ"], paragraphs: [[
        "We may update features or these terms as the platform develops. We will publish the revised terms on this page and update the date above. We may restrict access where necessary to protect users, investigate abuse, meet a legal obligation, or secure the service.",
        "প্ল্যাটফর্মের উন্নয়নের সঙ্গে আমরা সুবিধা বা শর্তাবলি পরিবর্তন করতে পারি। সংশোধিত শর্ত এই পেজে প্রকাশ করা হবে এবং ওপরের তারিখ হালনাগাদ হবে। ব্যবহারকারীর সুরক্ষা, অপব্যবহার তদন্ত, আইনি বাধ্যবাধকতা পালন বা সেবা নিরাপদ রাখতে প্রয়োজনে প্রবেশাধিকার সীমিত করা হতে পারে।",
      ]] },
      { heading: ["11. Applicable law", "১১. প্রযোজ্য আইন"], paragraphs: [[
        "These terms are intended to be interpreted under the laws applicable in Bangladesh, subject to any mandatory consumer or other rights that cannot legally be excluded.",
        "আইনগতভাবে বাদ দেওয়া যায় না এমন ভোক্তা বা অন্যান্য অধিকার সাপেক্ষে, এই শর্তাবলি বাংলাদেশের প্রযোজ্য আইন অনুযায়ী ব্যাখ্যা করার উদ্দেশ্যে তৈরি।",
      ]] },
      { heading: ["12. Contact", "১২. যোগাযোগ"], paragraphs: [[
        "For questions about these terms, contact the Sohoj Hub operator using the details below.",
        "এই শর্তাবলি সম্পর্কে প্রশ্ন থাকলে নিচের তথ্য ব্যবহার করে সহজ হাব পরিচালকের সঙ্গে যোগাযোগ করুন।",
      ]] },
    ],
  },
  privacy: {
    eyebrow: ["SOHOJ HUB · YOUR DATA", "সহজ হাব · আপনার তথ্য"],
    title: ["Privacy Policy", "গোপনীয়তা নীতি"],
    intro: [
      "This policy explains what information may be processed when you use Sohoj Hub and how it is used to operate the platform. The exact information depends on the features you choose and the details you provide.",
      "সহজ হাব ব্যবহার করার সময় কী ধরনের তথ্য প্রক্রিয়াকরণ হতে পারে এবং প্ল্যাটফর্ম চালাতে সেগুলো কীভাবে ব্যবহৃত হয়, এই নীতিতে তা ব্যাখ্যা করা হয়েছে। আপনি কোন সুবিধা ব্যবহার করছেন এবং কী তথ্য দিচ্ছেন তার ওপর তথ্যের ধরন নির্ভর করে।",
    ],
    icon: "privacy",
    sections: [
      { heading: ["1. Information you provide", "১. আপনার দেওয়া তথ্য"], bullets: [
        ["Account and contact details such as your name, email address, phone number, and profile information, where you provide them.", "আপনি দিলে আপনার নাম, ইমেইল, ফোন নম্বর ও প্রোফাইল-তথ্যের মতো অ্যাকাউন্ট ও যোগাযোগের তথ্য।"],
        ["Files, images, documents, text, prompts, or other content you choose to upload, edit, or generate with a tool.", "টুলের মাধ্যমে আপলোড, সম্পাদনা বা তৈরি করতে বেছে নেওয়া ফাইল, ছবি, নথি, লেখা, প্রম্পট বা অন্যান্য কনটেন্ট।"],
        ["Messages you send to support and details needed to investigate a request or a payment issue.", "সাপোর্টে পাঠানো বার্তা এবং কোনো অনুরোধ বা পেমেন্টের সমস্যা যাচাই করতে প্রয়োজনীয় তথ্য।"],
      ] },
      { heading: ["2. Technical and transaction information", "২. প্রযুক্তিগত ও লেনদেনের তথ্য"], paragraphs: [[
        "Depending on how the site is configured, basic technical information such as browser/device type, log events, language preference, security events, and diagnostic data may be processed to keep the service working and help identify errors.",
        "সাইটের কনফিগারেশন অনুযায়ী সেবা সচল রাখা ও ত্রুটি শনাক্ত করতে ব্রাউজার/ডিভাইসের ধরন, লগ, ভাষার পছন্দ, নিরাপত্তা-সংক্রান্ত ঘটনা ও সমস্যা নির্ণয়ের তথ্যের মতো মৌলিক প্রযুক্তিগত তথ্য প্রক্রিয়াকরণ হতে পারে।",
      ], [
        "For a payment, the platform may receive a transaction reference, amount, status, and related billing details from the payment provider. Payment providers may separately process payment credentials under their own policies.",
        "পেমেন্টের ক্ষেত্রে প্ল্যাটফর্ম পেমেন্ট সেবাদাতার কাছ থেকে লেনদেনের রেফারেন্স, পরিমাণ, অবস্থা ও সংশ্লিষ্ট বিলিং-তথ্য পেতে পারে। পেমেন্ট সেবাদাতা তাদের নিজস্ব নীতি অনুযায়ী পেমেন্টের গোপন তথ্য আলাদাভাবে প্রক্রিয়া করতে পারে।",
      ]] },
      { heading: ["3. How we use information", "৩. তথ্য কীভাবে ব্যবহার করা হয়"], bullets: [
        ["To create and manage accounts and provide the tool or feature you request.", "অ্যাকাউন্ট তৈরি ও পরিচালনা এবং আপনার চাওয়া টুল বা সুবিধা দিতে।"],
        ["To process uploads, create outputs, save items where a feature supports saving, and respond to support requests.", "আপলোড প্রক্রিয়া, ফলাফল তৈরি, কোনো সুবিধায় সংরক্ষণের ব্যবস্থা থাকলে আইটেম সংরক্ষণ এবং সাপোর্টের অনুরোধের উত্তর দিতে।"],
        ["To confirm transactions, administer paid access, prevent abuse, protect accounts, debug errors, and maintain the platform.", "লেনদেন নিশ্চিত, পেইড সুবিধা পরিচালনা, অপব্যবহার প্রতিরোধ, অ্যাকাউন্ট সুরক্ষা, ত্রুটি সমাধান ও প্ল্যাটফর্ম রক্ষণাবেক্ষণে।"],
      ] },
      { heading: ["4. How files are handled", "৪. ফাইল কীভাবে ব্যবহৃত হয়"], paragraphs: [[
        "Different tools work in different ways. Some processing may occur in your browser; other features may need to send content to our server or a relevant service provider to complete the task. Only use a feature with content you are allowed to submit, and avoid uploading sensitive personal data unless it is necessary and you have permission.",
        "বিভিন্ন টুল ভিন্নভাবে কাজ করে। কোনো কোনো প্রক্রিয়া আপনার ব্রাউজারেই হতে পারে; অন্য সুবিধায় কাজ শেষ করতে কনটেন্ট আমাদের সার্ভার বা সংশ্লিষ্ট সেবাদাতার কাছে পাঠাতে হতে পারে। কেবল অনুমোদিত কনটেন্ট ব্যবহার করুন এবং প্রয়োজনীয় ও অনুমতিপ্রাপ্ত না হলে সংবেদনশীল ব্যক্তিগত তথ্য আপলোড এড়িয়ে চলুন।",
      ]] },
      { heading: ["5. When information may be shared", "৫. কখন তথ্য ভাগ করা হতে পারে"], paragraphs: [[
        "We do not sell personal information as a business model. Information may be processed by providers that help operate the platform, such as hosting, authentication, payment, messaging, or AI providers, but only as relevant to the feature or transaction. Information may also be disclosed when required by applicable law or when needed to protect the platform and its users.",
        "ব্যক্তিগত তথ্য বিক্রি করা সহজ হাবের ব্যবসায়িক মডেল নয়। হোস্টিং, পরিচয় যাচাই, পেমেন্ট, বার্তা বা এআই সেবাদাতার মতো প্ল্যাটফর্ম পরিচালনায় সহায়তাকারী সেবাদাতারা সংশ্লিষ্ট সুবিধা বা লেনদেনের জন্য প্রয়োজনমতো তথ্য প্রক্রিয়া করতে পারে। প্রযোজ্য আইন অনুযায়ী বাধ্য হলে বা প্ল্যাটফর্ম ও ব্যবহারকারীদের সুরক্ষায় প্রয়োজন হলেও তথ্য প্রকাশ হতে পারে।",
      ]] },
      { heading: ["6. Cookies and local storage", "৬. কুকি ও স্থানীয় সংরক্ষণ"], paragraphs: [[
        "The site may use cookies, local storage, or similar technologies to remember your language or preferences, maintain sessions, and support security or essential functionality. Browser settings may allow you to clear or block some of these technologies, although parts of the platform may then not work as intended.",
        "ভাষা বা পছন্দ মনে রাখা, সেশন চালু রাখা এবং নিরাপত্তা বা জরুরি সুবিধা দিতে সাইট কুকি, লোকাল স্টোরেজ বা অনুরূপ প্রযুক্তি ব্যবহার করতে পারে। ব্রাউজারের সেটিংস থেকে এগুলো মুছতে বা বন্ধ করতে পারেন, তবে তাতে প্ল্যাটফর্মের কিছু অংশ ঠিকভাবে কাজ নাও করতে পারে।",
      ]] },
      { heading: ["7. Retention and security", "৭. তথ্য সংরক্ষণ ও নিরাপত্তা"], paragraphs: [[
        "We keep information for as long as reasonably needed to provide the service, maintain account and transaction records, resolve disputes, meet legal obligations, and protect security. Retention periods can vary by feature and information type. We use reasonable safeguards, but no online system can guarantee absolute security.",
        "সেবা দিতে, অ্যাকাউন্ট ও লেনদেনের রেকর্ড রাখতে, বিরোধ সমাধান, আইনি বাধ্যবাধকতা পালন এবং নিরাপত্তার জন্য যতদিন যুক্তিসঙ্গতভাবে প্রয়োজন, ততদিন তথ্য রাখা হতে পারে। সুবিধা ও তথ্যের ধরন অনুযায়ী সংরক্ষণের সময় আলাদা হতে পারে। যুক্তিসঙ্গত সুরক্ষা ব্যবস্থা নেওয়া হয়, তবে কোনো অনলাইন ব্যবস্থায় সম্পূর্ণ নিরাপত্তার নিশ্চয়তা দেওয়া যায় না।",
      ]] },
      { heading: ["8. Your choices and requests", "৮. আপনার পছন্দ ও অনুরোধ"], paragraphs: [[
        "You may contact us to ask what personal information you provided, request a correction, or request deletion where applicable. Some information may need to be retained for security, transaction records, legal compliance, or dispute handling. We may ask you to verify your identity before acting on a request.",
        "আপনার দেওয়া ব্যক্তিগত তথ্য সম্পর্কে জানতে, সংশোধন করতে বা প্রযোজ্য ক্ষেত্রে মুছে ফেলার অনুরোধ করতে পারেন। নিরাপত্তা, লেনদেনের রেকর্ড, আইনি বাধ্যবাধকতা বা বিরোধ নিষ্পত্তির জন্য কিছু তথ্য রাখা প্রয়োজন হতে পারে। অনুরোধে ব্যবস্থা নেওয়ার আগে পরিচয় যাচাই করতে হতে পারে।",
      ]] },
      { heading: ["9. Children’s privacy", "৯. শিশুদের গোপনীয়তা"], paragraphs: [[
        "Sohoj Hub is not designed to encourage children to submit personal information without adult guidance. If you are a parent or guardian and believe a child has provided personal information inappropriately, contact us so we can review the situation.",
        "প্রাপ্তবয়স্কের তত্ত্বাবধান ছাড়া শিশুদের ব্যক্তিগত তথ্য দিতে উৎসাহিত করার জন্য সহজ হাব তৈরি করা হয়নি। আপনি অভিভাবক হলে এবং মনে করেন কোনো শিশু অনুপযুক্তভাবে ব্যক্তিগত তথ্য দিয়েছে, তাহলে বিষয়টি যাচাইয়ের জন্য যোগাযোগ করুন।",
      ]] },
      { heading: ["10. Updates and contact", "১০. নীতির পরিবর্তন ও যোগাযোগ"], paragraphs: [[
        "We may update this policy when the platform or its practices change. The latest version will be published on this page. For privacy questions or requests, contact us using the details below.",
        "প্ল্যাটফর্ম বা এর কার্যপদ্ধতি পরিবর্তিত হলে আমরা এই নীতি হালনাগাদ করতে পারি। সর্বশেষ সংস্করণ এই পেজে প্রকাশ করা হবে। গোপনীয়তা-সংক্রান্ত প্রশ্ন বা অনুরোধের জন্য নিচের তথ্য ব্যবহার করে যোগাযোগ করুন।",
      ]] },
    ],
    },
  copyright: {
    eyebrow: ["SOHOJ HUB · ORIGINAL WORK & RIGHTS", "সহজ হাব · সৃজনশীল কাজ ও অধিকার"],
    title: ["Copyright Policy", "কপিরাইট নীতি"],
    intro: [
      "Sohoj Hub respects the rights of creators and expects users to do the same. This policy explains the general approach to original platform material, user-submitted content, and reports of possible copyright infringement.",
      "সহজ হাব স্রষ্টাদের অধিকারকে সম্মান করে এবং ব্যবহারকারীদেরও তা করতে উৎসাহিত করে। নিজস্ব প্ল্যাটফর্মের উপকরণ, ব্যবহারকারীর জমা দেওয়া কনটেন্ট এবং সম্ভাব্য কপিরাইট লঙ্ঘনের অভিযোগ সম্পর্কে এই নীতিতে ব্যাখ্যা করা হয়েছে।",
    ],
    icon: "copyright",
    sections: [
      { heading: ["1. Sohoj Hub material", "১. সহজ হাবের নিজস্ব উপকরণ"], paragraphs: [[
        "Unless a page or asset states otherwise, the Sohoj Hub name and branding, original written content, interface design, original graphics, and platform code are owned by the operator or used with permission. Third-party logos, libraries, fonts, images, and open-source components may be governed by their own licences.",
        "কোনো পেজ বা উপকরণে ভিন্নভাবে উল্লেখ না থাকলে সহজ হাবের নাম ও ব্র্যান্ডিং, নিজস্ব লেখা, ইন্টারফেস ডিজাইন, নিজস্ব গ্রাফিক্স এবং প্ল্যাটফর্ম কোড পরিচালকের মালিকানাধীন অথবা অনুমতিসাপেক্ষে ব্যবহৃত। তৃতীয় পক্ষের লোগো, লাইব্রেরি, ফন্ট, ছবি ও ওপেন-সোর্স উপাদানের ক্ষেত্রে তাদের নিজস্ব লাইসেন্স প্রযোজ্য হতে পারে।",
      ]] },
      { heading: ["2. Content you submit or create", "২. আপনার জমা দেওয়া বা তৈরি কনটেন্ট"], paragraphs: [[
        "You remain responsible for ensuring that you own or have permission to use material you upload, edit, or provide as an AI prompt. You retain any rights you hold in your own material. You allow the platform to process it only as needed to provide the requested feature, subject to the Terms of Service and the applicable feature’s operation.",
        "আপলোড, সম্পাদনা বা এআই প্রম্পট হিসেবে দেওয়া উপকরণের মালিকানা বা ব্যবহারের অনুমতি আছে কি না নিশ্চিত করার দায়িত্ব আপনার। নিজের উপকরণের ওপর আপনার বিদ্যমান অধিকার আপনার কাছেই থাকবে। ব্যবহারের শর্ত ও সংশ্লিষ্ট সুবিধার কার্যপ্রণালি অনুযায়ী অনুরোধ করা সুবিধা দিতে যতটুকু প্রয়োজন, ততটুকু প্রক্রিয়াকরণের অনুমতি আপনি প্ল্যাটফর্মকে দিচ্ছেন।",
      ]] },
      { heading: ["3. What users may not do", "৩. ব্যবহারকারীর নিষিদ্ধ কাজ"], bullets: [
        ["Do not copy, sell, republish, or distribute Sohoj Hub’s original material except where permission or an applicable licence allows it.", "অনুমতি বা প্রযোজ্য লাইসেন্স না থাকলে সহজ হাবের নিজস্ব উপকরণ কপি, বিক্রি, পুনঃপ্রকাশ বা বিতরণ করবেন না।"],
        ["Do not upload, process, or share another person’s copyrighted work in a way that infringes their rights.", "অন্যের কপিরাইট লঙ্ঘন করে এমনভাবে তার কাজ আপলোড, প্রক্রিয়াকরণ বা শেয়ার করবেন না।"],
        ["If a tool’s output resembles third-party material, check the rights and permissions before using or publishing it.", "কোনো টুলের ফলাফল তৃতীয় পক্ষের উপকরণের মতো হলে তা ব্যবহার বা প্রকাশের আগে অধিকার ও অনুমতি যাচাই করুন।"],
      ] },
      { heading: ["4. How to report a copyright concern", "৪. কপিরাইট-সংক্রান্ত অভিযোগ জানানোর নিয়ম"], paragraphs: [[
        "If you believe material available through Sohoj Hub infringes a copyright you own or are authorized to represent, email us with enough detail for us to identify and review the material.",
        "সহজ হাবের মাধ্যমে পাওয়া কোনো উপকরণ আপনার মালিকানাধীন বা আপনার প্রতিনিধিত্বের অনুমতি আছে এমন কপিরাইট লঙ্ঘন করছে বলে মনে হলে উপকরণটি শনাক্ত ও যাচাই করার মতো পর্যাপ্ত তথ্যসহ ইমেইল করুন।",
      ]], bullets: [
        ["Your name and a working contact email.", "আপনার নাম ও সচল যোগাযোগের ইমেইল।"],
        ["A description of the copyrighted work and where the original can be found, if available.", "কপিরাইটযুক্ত কাজের বিবরণ এবং সম্ভব হলে মূল কাজটি কোথায় পাওয়া যাবে।"],
        ["The exact page or URL of the material you are reporting.", "যে উপকরণ সম্পর্কে অভিযোগ করছেন তার নির্দিষ্ট পেজ বা URL।"],
        ["A statement that you believe in good faith the use is not authorized, and a statement that the information in your report is accurate and you are the owner or authorized representative.", "সৎ বিশ্বাসে আপনার মত যে ব্যবহারটি অনুমোদিত নয়—এমন বক্তব্য; পাশাপাশি তথ্য সঠিক এবং আপনি মালিক বা অনুমোদিত প্রতিনিধি—এমন ঘোষণা।"],
      ] },
      { heading: ["5. Review and response", "৫. যাচাই ও ব্যবস্থা"], paragraphs: [[
        "We will review reports in good faith and may ask for additional information. Where appropriate, we may restrict access to or remove material while the matter is reviewed. Submitting a report does not guarantee a particular outcome, and knowingly false or misleading reports may be disregarded or handled as allowed by law.",
        "আমরা সৎ বিশ্বাসে অভিযোগ যাচাই করব এবং অতিরিক্ত তথ্য চাইতে পারি। উপযুক্ত ক্ষেত্রে যাচাই চলাকালে উপকরণে প্রবেশ সীমিত বা সেটি সরানো হতে পারে। অভিযোগ জমা দিলেই নির্দিষ্ট ফলাফলের নিশ্চয়তা নেই; জেনেশুনে মিথ্যা বা বিভ্রান্তিকর অভিযোগ উপেক্ষা করা হতে পারে বা আইন অনুযায়ী ব্যবস্থা নেওয়া হতে পারে।",
      ]] },
      { heading: ["6. Changes and contact", "৬. পরিবর্তন ও যোগাযোগ"], paragraphs: [[
        "We may update this policy as Sohoj Hub develops. For copyright questions or a notice, contact the platform operator at the address below.",
        "সহজ হাবের উন্নয়নের সঙ্গে এই নীতি পরিবর্তিত হতে পারে। কপিরাইট-সংক্রান্ত প্রশ্ন বা অভিযোগের জন্য নিচের ঠিকানায় প্ল্যাটফর্ম পরিচালকের সঙ্গে যোগাযোগ করুন।",
      ]] },
    ],
  },
};

export default function PolicyPage({ type }: { type: "terms" | "privacy" | "copyright" }) {
  const { locale } = useI18n();
  const isBn = String(locale).toLowerCase().startsWith("bn");
  const index = isBn ? 1 : 0;
  const policy = policies[type];
  const Icon = policy.icon === "terms" ? FileText : policy.icon === "privacy" ? ShieldCheck : Copyright;
  const pick = (pair: LocalePair) => pair[index];

  return (
    <main className="sh-policy-page">
      <style>{`
        .sh-policy-page{min-height:100vh;background:radial-gradient(ellipse at 50% 0%,rgba(99,102,241,.09),transparent 42%),#fff9df;color:#111827;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased}
        .sh-policy-page *{box-sizing:border-box}
        .sh-policy-shell{width:min(100% - 32px,980px);margin:0 auto;padding:64px 0 68px}
        .sh-policy-card{overflow:hidden;border:1px solid rgba(15,23,42,.09);border-radius:24px;background:rgba(255,255,255,.78);box-shadow:0 22px 65px rgba(15,23,42,.08);backdrop-filter:blur(12px)}
        .sh-policy-hero{padding:clamp(25px,5vw,50px);background:linear-gradient(135deg,rgba(255,255,255,.96),rgba(245,243,255,.86));border-bottom:1px solid rgba(15,23,42,.08)}
        .sh-policy-eyebrow{display:inline-flex;align-items:center;gap:9px;border:1px solid rgba(99,102,241,.18);background:#fff9e8;color:#4f46e5;border-radius:999px;padding:8px 12px;font-size:11px;font-weight:800;letter-spacing:.1em}
        .sh-policy-title{margin:19px 0 12px;font-size:clamp(30px,5vw,43px);line-height:1.1;letter-spacing:-.045em;font-weight:850;color:#111827}
        .sh-policy-intro{max-width:790px;margin:0;color:#475569;font-size:15px;line-height:1.85}
        .sh-policy-meta{margin-top:20px;color:#64748b;font-size:12px}
        .sh-policy-content{padding:clamp(24px,5vw,49px)}
        .sh-policy-section{padding:0 0 25px;margin:0 0 25px;border-bottom:1px solid #e8eaf1}
        .sh-policy-section:last-of-type{border-bottom:0;margin-bottom:0;padding-bottom:6px}
        .sh-policy-section h2{font-size:18px;line-height:1.4;letter-spacing:-.02em;margin:0 0 13px;color:#111827;font-weight:800}
        .sh-policy-section p{font-size:14px;line-height:1.9;color:#475569;margin:0 0 10px}
        .sh-policy-section ul{padding-left:23px;margin:0;color:#475569}
        .sh-policy-section li{font-size:14px;line-height:1.85;margin:0 0 8px;padding-left:3px}
        .sh-policy-section li::marker{color:#6366f1}
        .sh-policy-contact{margin-top:27px;padding:21px 22px;border:1px solid rgba(99,102,241,.18);border-radius:18px;background:linear-gradient(125deg,rgba(238,242,255,.72),rgba(255,251,235,.9));display:flex;gap:14px;align-items:flex-start}
        .sh-policy-contact-icon{width:42px;height:42px;display:grid;place-items:center;flex-shrink:0;border-radius:13px;background:linear-gradient(135deg,#3b82f6,#7c3aed);color:white}
        .sh-policy-contact h2{margin:1px 0 6px;font-size:16px;font-weight:800}
        .sh-policy-contact p{margin:0 0 7px;font-size:13px;line-height:1.6;color:#64748b}
        .sh-policy-contact a{color:#4f46e5;text-decoration:none;font-weight:700;overflow-wrap:anywhere}
        .sh-policy-contact a:hover{text-decoration:underline}
        .sh-policy-note{margin:24px 0 0;text-align:center;color:#94a3b8;font-size:11px;line-height:1.7}
        @media(max-width:600px){.sh-policy-shell{width:min(100% - 20px,980px);padding:28px 0 38px}.sh-policy-card{border-radius:18px}.sh-policy-eyebrow{font-size:9px;letter-spacing:.06em}.sh-policy-section h2{font-size:16px}.sh-policy-section p,.sh-policy-section li{font-size:13px}.sh-policy-contact{padding:17px;gap:11px}}
      `}</style>
      <div className="sh-policy-shell">
        <article className="sh-policy-card">
          <header className="sh-policy-hero">
            <div className="sh-policy-eyebrow"><Icon size={14} />{pick(policy.eyebrow)}</div>
            <h1 className="sh-policy-title">{pick(policy.title)}</h1>
            <p className="sh-policy-intro">{pick(policy.intro)}</p>
            <div className="sh-policy-meta">{isBn ? "সর্বশেষ হালনাগাদ: ১৪ অক্টোবর ২০২৬" : "Last updated: 14 October 2026"}</div>
          </header>
          <div className="sh-policy-content">
            {policy.sections.map((section) => (
              <section className="sh-policy-section" key={section.heading[0]}>
                <h2>{pick(section.heading)}</h2>
                {section.paragraphs?.map((paragraph, i) => <p key={`p-${i}`}>{pick(paragraph)}</p>)}
                {section.bullets && <ul>{section.bullets.map((bullet, i) => <li key={`b-${i}`}>{pick(bullet)}</li>)}</ul>}
              </section>
            ))}
            <div className="sh-policy-contact">
              <div className="sh-policy-contact-icon"><Mail size={19} /></div>
              <div>
                <h2>{isBn ? "যোগাযোগ" : "Contact Sohoj Hub"}</h2>
                <p>{isBn ? "এই নীতিগুলো সম্পর্কে প্রশ্ন, তথ্য সংশোধন বা কপিরাইট-সংক্রান্ত অনুরোধের জন্য যোগাযোগ করুন।" : "For policy questions, data requests, or copyright concerns, contact us."}</p>
                <a href="mailto:jahidulhassansrizon@gmail.com">jahidulhassansrizon@gmail.com</a><br />
                <a href="tel:+88017836666743">017836666743</a>
                <p style={{ marginTop: 7 }}>{isBn ? "বউ বাজার রোড, টঙ্গী, গাজীপুর ১২৩০, বাংলাদেশ" : "Bou Bazar Road, Tongi, Gazipur 1230, Bangladesh"}</p>
              </div>
            </div>
            <p className="sh-policy-note">{isBn ? "এই নীতিগুলো সহজ হাবের বর্তমান কার্যপ্রণালি সম্পর্কে সাধারণ তথ্য দেয়। প্রকাশের আগে প্রযোজ্য আইন ও বাস্তব ডেটা-প্রক্রিয়াকরণের সঙ্গে মিলিয়ে নিন।" : "These policies describe the platform’s current intended practices. They should be reviewed against applicable law and actual data-handling practices before launch."}</p>
          </div>
        </article>
      </div>
      <Footer />
    </main>
  );
}
