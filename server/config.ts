const DEFAULT_OR_WEAK_VALUES = new Set([
  "changeme",
  "changeme_ballot_salt",
  "change-me-in-production",
  "change-this-database-password",
  "change-this-jwt-secret-32-plus-chars",
  "change-this-session-secret-32-plus-chars",
  "change-this-ballot-salt-32-plus-chars",
  "demo-secret",
  "demo-session-secret",
  "CHANGE_ME_IN_PRODUCTION_abc123xyz",
]);

function isProductionLike() {
  return process.env.APP_ENV === "production";
}

function requireStrongSecret(name: string, minLength = 32) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  if (isProductionLike() && (value.length < minLength || DEFAULT_OR_WEAK_VALUES.has(value))) {
    throw new Error(`${name} must be a non-default secret with at least ${minLength} characters in production`);
  }
}

export function validateRuntimeConfig() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  requireStrongSecret("SESSION_SECRET");

  if (process.env.JWT_SECRET) {
    requireStrongSecret("JWT_SECRET");
  }

  if (isProductionLike() && process.env.DEMO_MODE === "true") {
    throw new Error("DEMO_MODE=true is not allowed when APP_ENV=production");
  }
}
