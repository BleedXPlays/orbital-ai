import LegalPage from "./LegalPage";

const sections = [
  {
    title: "Accounts and access",
    paragraphs: [
      "You are responsible for providing accurate account information, protecting your password, and keeping access to your email account secure. You must promptly report suspected unauthorized use.",
    ],
  },
  {
    title: "Acceptable use",
    items: [
      "Do not use OrbitalAI to break the law, harm others, invade privacy, or bypass security controls.",
      "Do not upload content you do not have permission to process.",
      "Do not attempt to extract server secrets, disrupt the service, or evade account and usage limits.",
    ],
  },
  {
    title: "Your content",
    paragraphs: [
      "You retain your rights in content you submit. You give OrbitalAI the limited permission needed to store, transmit, analyze, and transform that content solely to operate the features you request.",
    ],
  },
  {
    title: "AI routing and outputs",
    paragraphs: [
      "OrbitalAI may route requests to OpenAI, Anthropic (Claude), or Google (Gemini), and may use another available provider when the preferred provider fails. AI outputs can be incomplete, inaccurate, or unsuitable for your situation.",
      "Always verify important medical, legal, financial, academic, safety, and professional decisions with a qualified source. OrbitalAI does not replace professional advice.",
    ],
  },
  {
    title: "Usage limits and availability",
    paragraphs: [
      "Message, document, and other usage limits may apply and may reset after a stated period. Features, providers, limits, and availability can change to manage cost, security, reliability, or provider restrictions.",
    ],
  },
  {
    title: "Product ownership",
    paragraphs: [
      "OrbitalAI and its interface, branding, software, and original product materials are protected by applicable intellectual-property laws. These terms do not grant permission to copy, resell, or misrepresent the service.",
    ],
  },
  {
    title: "Exports, deletion, and termination",
    paragraphs: [
      "You can export workspace data and request account deletion through Settings. Access may be suspended or ended when necessary to address abuse, security risks, legal requirements, unpaid provider costs, or serious violations of these terms.",
    ],
  },
  {
    title: "Changes and questions",
    paragraphs: [
      "These terms may be updated as OrbitalAI develops. Continued use after an update means you accept the revised terms. If you do not agree, stop using the service and use the available export and deletion controls.",
    ],
  },
];

function Terms() {
  return (
    <LegalPage
      eyebrow="Terms"
      title="Terms of use"
      summary="These terms describe the rules for using OrbitalAI, how AI providers may handle requests, and the responsibilities that come with an OrbitalAI account."
      sections={sections}
    />
  );
}

export default Terms;
