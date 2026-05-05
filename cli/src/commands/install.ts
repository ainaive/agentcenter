import { Command } from "commander";
import { fetchExtension, getBundleUrl, postInstallEvent } from "../api";
import { installExtension } from "../installers";

export function makeInstallCommand(): Command {
  return new Command("install")
    .description("Install an extension by slug")
    .argument("<slug>", "Extension slug (e.g. acme/my-skill)")
    .option("--dry-run", "Resolve and show what would be installed without writing files")
    .action(async (slug: string, opts: { dryRun?: boolean }) => {
      let ext;
      try {
        ext = await fetchExtension(slug);
      } catch (err) {
        console.error((err as Error).message);
        process.exit(1);
      }

      console.log(`\n${ext.name} ${ext.version}`);
      if (ext.description) console.log(`  ${ext.description}`);

      let bundleUrl: string;
      try {
        bundleUrl = await getBundleUrl(slug);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.toLowerCase().includes("not available")) {
          console.error(`Bundle not yet available for "${slug}". Check back later.`);
        } else {
          console.error(`Failed to fetch bundle: ${msg}`);
        }
        process.exit(1);
      }

      if (opts.dryRun) {
        console.log(`\n[dry-run] Would download: ${bundleUrl}`);
        console.log(`[dry-run] Category: ${ext.category}`);
        return;
      }

      process.stdout.write("Downloading...");
      let zipBuffer: ArrayBuffer;
      try {
        const res = await fetch(bundleUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        zipBuffer = await res.arrayBuffer();
        process.stdout.write(" done\n");
      } catch (err) {
        process.stdout.write("\n");
        console.error(`Download failed: ${(err as Error).message}`);
        process.exit(1);
      }

      let destDir: string;
      try {
        destDir = await installExtension(slug, ext.category, zipBuffer);
      } catch (err) {
        console.error(`Install failed: ${(err as Error).message}`);
        process.exit(1);
      }

      await postInstallEvent(slug, ext.version).catch(() => {});

      console.log(`Installed to ${destDir}`);
    });
}
