import { getPasswordRequirementResults } from "../../shared/passwordPolicy";

function PasswordRequirements({ password, confirmPassword }) {
  const requirements = getPasswordRequirementResults(password);
  const showConfirmation = typeof confirmPassword === "string";
  const passwordsMatch =
    showConfirmation &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  return (
    <div
      className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3"
      aria-live="polite"
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
        Password requirements
      </p>
      <div className="grid gap-x-4 gap-y-1.5 text-xs sm:grid-cols-2">
        {requirements.map((requirement) => (
          <p
            key={requirement.id}
            className={
              requirement.met ? "text-emerald-300" : "text-slate-400"
            }
          >
            <span aria-hidden="true">{requirement.met ? "✓" : "○"}</span>{" "}
            {requirement.label}
          </p>
        ))}
        {showConfirmation && (
          <p
            className={
              passwordsMatch ? "text-emerald-300" : "text-slate-400"
            }
          >
            <span aria-hidden="true">{passwordsMatch ? "✓" : "○"}</span>{" "}
            Passwords match
          </p>
        )}
      </div>
    </div>
  );
}

export default PasswordRequirements;
