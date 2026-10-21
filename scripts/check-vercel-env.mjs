// Validate configuration without logging secrets or contacting external services.
const errors = [];
const required = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];
for (const key of required) {
  if (!process.env[key]?.trim()) errors.push(`${key} is required`);
}
if (process.env.STORAGE_DRIVER !== "cloudinary")
  errors.push("STORAGE_DRIVER must be cloudinary for this deployment");
if ((process.env.BETTER_AUTH_SECRET || "").length < 32)
  errors.push("BETTER_AUTH_SECRET must have at least 32 characters");
for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  try {
    const url = new URL(process.env[key]);
    if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error();
  } catch {
    errors.push(`${key} must be a PostgreSQL connection URL`);
  }
}
const origins = [];
for (const key of ["BETTER_AUTH_URL", "NEXT_PUBLIC_APP_URL"]) {
  try {
    const url = new URL(process.env[key]);
    if (
      url.protocol !== "https:" ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      url.username ||
      url.password
    )
      throw new Error();
    origins.push(url.origin);
  } catch {
    errors.push(`${key} must be an HTTPS origin without a path`);
  }
}
if (origins.length === 2 && origins[0] !== origins[1])
  errors.push(
    "BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL must use the same origin",
  );
if (errors.length) {
  console.error(
    "Vercel configuration is incomplete:\n" +
      errors.map((error) => `- ${error}`).join("\n"),
  );
  process.exitCode = 1;
} else {
  console.log("Vercel environment configuration passed.");
}
