import { Command } from "commander";
import { loadCredentials, clearCredentials } from "../auth-store";

export function makeWhoamiCommand(): Command {
  return new Command("whoami")
    .description("Show the currently signed-in user")
    .action(async () => {
      const creds = await loadCredentials();
      if (!creds || !creds.token) {
        console.log("Not signed in. Run `agentcenter login`.");
        return;
      }
      console.log(`Signed in as ${creds.email}${creds.name ? ` (${creds.name})` : ""}`);
    });
}

export function makeLogoutCommand(): Command {
  return new Command("logout")
    .description("Sign out and remove stored credentials")
    .action(async () => {
      await clearCredentials();
      console.log("Signed out.");
    });
}
