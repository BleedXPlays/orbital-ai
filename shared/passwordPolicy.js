export const PASSWORD_REQUIREMENTS = [
  {
    id: "length",
    label: "8–128 characters",
    test: (password) => password.length >= 8 && password.length <= 128,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (password) => /[A-Z]/.test(password),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (password) => /[a-z]/.test(password),
  },
  {
    id: "number",
    label: "One number",
    test: (password) => /\d/.test(password),
  },
  {
    id: "symbol",
    label: "One special character",
    test: (password) => /[^A-Za-z0-9\s]/.test(password),
  },
  {
    id: "spaces",
    label: "No spaces",
    test: (password) => !/\s/.test(password),
  },
];

export const getPasswordRequirementResults = (password = "") =>
  PASSWORD_REQUIREMENTS.map((requirement) => ({
    ...requirement,
    met: requirement.test(String(password)),
  }));

export const isPasswordValid = (password = "") =>
  getPasswordRequirementResults(password).every(
    (requirement) => requirement.met
  );

export const getPasswordPolicyError = (password = "") => {
  const unmet = getPasswordRequirementResults(password)
    .filter((requirement) => !requirement.met)
    .map((requirement) => requirement.label.toLowerCase());

  return unmet.length
    ? `Your password needs: ${unmet.join(", ")}.`
    : "";
};
