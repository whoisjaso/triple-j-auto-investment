/**
 * Gmail OAuth2 Token Helper
 *
 * One-time setup script to obtain a Gmail refresh token for the pipeline.
 * Run this after creating Google Cloud OAuth2 credentials.
 *
 * Prerequisites:
 *   1. Go to https://console.cloud.google.com/
 *   2. Create project + enable Gmail API
 *   3. Create OAuth2 credentials (Desktop app)
 *   4. Set GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET in .env.local
 *
 * Usage:
 *   npx tsx scripts/get-gmail-token.ts
 *   (or: npx ts-node scripts/get-gmail-token.ts)
 */

import * as readline from "readline";
import * as fs from "fs";
import * as path from "path";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const REDIRECT_URI = "http://localhost";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

function loadEnv(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), ".env.local");
  const vars: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      vars[key] = val;
    }
  }

  return vars;
}

function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n=== Gmail OAuth2 Token Helper ===\n");

  // Load credentials from .env.local or prompt
  const env = loadEnv();
  let clientId = env.GMAIL_CLIENT_ID || "";
  let clientSecret = env.GMAIL_CLIENT_SECRET || "";

  if (!clientId) {
    clientId = await ask(rl, "Enter GMAIL_CLIENT_ID: ");
  } else {
    console.log(`Using GMAIL_CLIENT_ID from .env.local: ${clientId.slice(0, 20)}...`);
  }

  if (!clientSecret) {
    clientSecret = await ask(rl, "Enter GMAIL_CLIENT_SECRET: ");
  } else {
    console.log(`Using GMAIL_CLIENT_SECRET from .env.local: ${clientSecret.slice(0, 10)}...`);
  }

  if (!clientId || !clientSecret) {
    console.error("\nError: Both GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET are required.");
    console.error("Create them at: https://console.cloud.google.com/apis/credentials");
    rl.close();
    process.exit(1);
  }

  // Build authorization URL
  const authUrl = new URL(AUTH_URL);
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPES);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");

  console.log("\n--- Step 1: Authorize ---\n");
  console.log("Visit this URL in your browser:\n");
  console.log(authUrl.toString());
  console.log(
    "\nAfter authorizing, you'll be redirected to http://localhost/?code=XXXX"
  );
  console.log("(The page won't load — that's expected. Copy the 'code' value from the URL.)\n");

  const codeInput = await ask(rl, "Paste the authorization code (or the full redirect URL): ");

  // Extract code from URL if full URL was pasted
  let code = codeInput;
  if (codeInput.includes("code=")) {
    const url = new URL(codeInput.replace("http://localhost", "http://localhost"));
    code = url.searchParams.get("code") || codeInput;
  }

  if (!code) {
    console.error("\nError: No authorization code provided.");
    rl.close();
    process.exit(1);
  }

  // Exchange code for tokens
  console.log("\n--- Step 2: Exchanging code for tokens... ---\n");

  try {
    const res = await fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Token exchange failed:", data);
      rl.close();
      process.exit(1);
    }

    if (!data.refresh_token) {
      console.error(
        "\nNo refresh_token returned. This can happen if you already authorized this app."
      );
      console.error(
        "Go to https://myaccount.google.com/permissions, revoke access for this app, and try again."
      );
      rl.close();
      process.exit(1);
    }

    console.log("Success! Here's your refresh token:\n");
    console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
    console.log("\n--- Step 3: Add to environment ---\n");
    console.log("1. Add this line to .env.local:");
    console.log(`   GMAIL_REFRESH_TOKEN=${data.refresh_token}`);
    console.log("\n2. Add to Vercel dashboard (Settings → Environment Variables):");
    console.log(`   Key:   GMAIL_REFRESH_TOKEN`);
    console.log(`   Value: ${data.refresh_token}`);
    console.log("\nDone! The pipeline sync endpoint is now ready to use.");
  } catch (err) {
    console.error("Failed to exchange code:", err);
    rl.close();
    process.exit(1);
  }

  rl.close();
}

main();
