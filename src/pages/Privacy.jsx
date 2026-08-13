import LegalPage from "./LegalPage";

const sections = [
  {
    title: "Information you provide",
    paragraphs: [
      "OrbitalAI processes the account details, prompts, conversations, project information, files, images, and voice recordings you choose to provide. Voice recordings may be transcribed before they are sent as a prompt.",
    ],
  },
  {
    title: "How information is used",
    items: [
      "To authenticate your account and maintain your workspace.",
      "To route requests, generate responses, analyze attachments, and provide requested features.",
      "To enforce usage limits, protect the service, diagnose failures, and improve reliability.",
    ],
  },
  {
    title: "AI providers",
    paragraphs: [
      "Depending on the task, relevant prompt text and attachments may be sent to OpenAI, Anthropic (Claude), or Google (Gemini). Each provider processes that information under its own applicable terms and privacy practices.",
    ],
  },
  {
    title: "Storage and security",
    paragraphs: [
      "OrbitalAI uses Firebase for authentication, Supabase for workspace persistence, and Vercel for application hosting and server functions. Provider API keys remain on the server. Reasonable safeguards are used, but no online service can guarantee absolute security.",
    ],
  },
  {
    title: "Sharing",
    paragraphs: [
      "OrbitalAI does not sell your personal information. Information may be shared with service providers needed to operate the product, or when required to protect users, enforce these terms, investigate abuse, or comply with law.",
    ],
  },
  {
    title: "Your controls",
    items: [
      "Export a JSON backup of your workspace from Settings.",
      "Archive or delete chats and projects using the workspace controls.",
      "Delete your account and associated OrbitalAI workspace data from Settings.",
    ],
    paragraphs: [
      "Deletion may not immediately remove limited information held in backups, security logs, or provider systems where retention is required for operational or legal reasons.",
    ],
  },
  {
    title: "Retention and updates",
    paragraphs: [
      "Information is retained while needed to provide the service, meet security and legal requirements, and resolve disputes. This policy may be updated as OrbitalAI changes; the effective date above will be revised when material changes are made.",
    ],
  },
  {
    title: "Questions",
    paragraphs: [
      "For privacy questions, use the support or contact details provided inside OrbitalAI. Do not send passwords, provider API keys, or other secrets in a support message.",
    ],
  },
];

function Privacy() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy policy"
      summary="This policy explains what information OrbitalAI processes, why it is needed, which services may receive it, and the controls available to you."
      sections={sections}
    />
  );
}

export default Privacy;
