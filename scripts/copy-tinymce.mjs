/** Copy the self-hosted TinyMCE bundle into /public so it loads without a
 *  cloud API key. Runs on postinstall. */
import { cpSync, existsSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "node_modules", "tinymce");
const dest = join(root, "public", "tinymce");

if (!existsSync(src)) {
  console.warn("[copy-tinymce] node_modules/tinymce not found — skipping.");
  process.exit(0);
}
mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[copy-tinymce] TinyMCE copied to public/tinymce");
