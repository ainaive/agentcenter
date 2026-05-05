import { Command } from "commander";
import { listInstalledSlugs } from "../installers";

export function makeListCommand(): Command {
  return new Command("list")
    .alias("ls")
    .description("List locally installed extensions")
    .action(() => {
      const slugs = listInstalledSlugs();
      if (slugs.length === 0) {
        console.log("No extensions installed.");
        return;
      }
      for (const slug of slugs) {
        console.log(`  ${slug}`);
      }
    });
}
