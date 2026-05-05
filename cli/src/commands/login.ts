import { Command } from "commander";
import { requestDeviceCode, pollDeviceCode, fetchMe } from "../api";
import { saveCredentials } from "../auth-store";

export function makeLoginCommand(): Command {
  return new Command("login")
    .description("Sign in to AgentCenter via browser")
    .action(async () => {
      let deviceResp;
      try {
        deviceResp = await requestDeviceCode();
      } catch (err) {
        console.error(`Login failed: ${(err as Error).message}`);
        process.exit(1);
      }

      const { deviceCode, userCode, verificationUri, expiresIn } = deviceResp;

      console.log("\nOpen the following URL in your browser and enter the code below:\n");
      // verificationUri is a path; build full URL from registry config
      const { loadConfig } = await import("../config-store");
      const config = await loadConfig();
      const base = String(config.registry).replace(/\/$/, "");
      console.log(`  ${base}${verificationUri}`);
      console.log(`\n  Code: ${userCode}\n`);

      // Try to open browser (best-effort)
      try {
        const { exec } = await import("child_process");
        const url = `${base}${verificationUri}`;
        const cmd =
          process.platform === "darwin"
            ? `open "${url}"`
            : process.platform === "win32"
              ? `start "" "${url}"`
              : `xdg-open "${url}"`;
        exec(cmd);
      } catch {
        // ignore
      }

      const deadline = Date.now() + expiresIn * 1000;
      process.stdout.write("Waiting for authorization");

      let token: string | undefined;
      while (Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 5000));
        process.stdout.write(".");
        try {
          const poll = await pollDeviceCode(deviceCode);
          if (poll.status === "authorized" && poll.token) {
            token = poll.token;
            break;
          }
          if (poll.status === "expired") break;
        } catch {
          // network hiccup — keep polling
        }
      }

      process.stdout.write("\n");

      if (!token) {
        console.error("Authorization timed out or was denied. Run `agentcenter login` again.");
        process.exit(1);
      }

      let profile;
      try {
        profile = await fetchMe(token);
      } catch {
        console.error("Authorized but could not fetch user profile. Try again.");
        process.exit(1);
      }

      await saveCredentials({
        token,
        userId: profile.id,
        email: profile.email,
        name: profile.name,
      });

      console.log(`\nSigned in as ${profile.email}${profile.name ? ` (${profile.name})` : ""}`);
    });
}
