import { Command } from "commander";
import { fetchExtension } from "../api";
import { uninstallExtension } from "../installers";

export function makeUninstallCommand(): Command {
  return new Command("uninstall")
    .description("Remove an installed extension")
    .argument("<slug>", "Extension slug")
    .action(async (slug: string) => {
      let category = "skill";
      try {
        const ext = await fetchExtension(slug);
        category = ext.category;
      } catch {
        // If the registry is unreachable, still attempt local removal using default category
      }

      const removed = await uninstallExtension(slug, category);
      if (removed) {
        console.log(`Uninstalled ${slug}`);
      } else {
        console.error(`"${slug}" is not installed.`);
        process.exit(1);
      }
    });
}
