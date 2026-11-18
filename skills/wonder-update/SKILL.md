---
name: wonder-update
description: "Update a customised Shopify store from one Wonder theme version to a newer one without losing code changes. Find which theme files were changed, plan what to copy or merge, move the changes to the new theme copy with Shopify CLI, and check it before publishing. Use when the user wants to update or upgrade Wonder, asks what they lose by updating, or needs to move customisations between theme copies."
---

# Updating a customised Wonder theme

Updating Wonder in Shopify installs the new version as a **new, unpublished theme copy**. Shopify copies theme settings, section content (JSON templates) and **Theme settings → Custom CSS** into it. **Code edits are not copied**: changed theme files, `assets/custom.css`, `assets/custom.js` and custom sections stay in the old copy. This skill moves them.

Work only on unpublished copies. Never publish or push to the live theme without the merchant's explicit approval.

## 0. What's in the update

Ask for the current version if you don't know it (Online Store → Themes, under the theme name). Then:

- `get_changelog` with `from` = current version: what the update brings. Summarise the highlights for the merchant.
- `get_known_issues` with the current version: problems the update fixes.

## 1. Prepare (in Shopify admin)

1. Duplicate the live theme as a backup: Online Store → Themes → live theme → **⋯ → Duplicate**.
2. Add the update: on the Themes page, use the update notice for Wonder (**View update / Add to theme library**). Shopify adds "Wonder <new version>" as an unpublished copy, with the live theme's settings.
   - If the merchant changes settings in the live theme after this point, those changes won't be in the new copy.

If the user only works in the Shopify admin (no Shopify CLI, no files), go to [Without Shopify CLI](#without-shopify-cli).

## 2. Download both copies (Shopify CLI)

```bash
shopify theme list --store <store>.myshopify.com          # note the IDs of the live theme and the new copy
shopify theme pull --store <store>.myshopify.com --theme <live-id> --path wonder-current
shopify theme pull --store <store>.myshopify.com --theme <new-id>  --path wonder-new
```

Access needs a staff or collaborator account, or a Theme Access password (`--password`).

Make the new copy reviewable before you touch it:

```bash
cd wonder-new && git init -q && git add -A && git commit -qm "Wonder <new version> as installed" && cd ..
```

## 3. Find what was customised

Run Wonder's update tool on the **current** theme. It needs Node.js 18+, which Shopify CLI already requires:

```bash
npx -y wonder-theme-update@0.3.0 wonder-current
```

The tool is the npm package [`wonder-theme-update`](https://www.npmjs.com/package/wonder-theme-update), published by Nethype. Keep the pinned version.

It reads the version from `config/settings_schema.json` and compares every file with the original release, using fingerprints (short hashes) downloaded from `mcp.wonder-theme.com`. Your files are never uploaded, and the original Wonder code is never downloaded. Settings and content JSON is skipped, because Shopify carries it over. It prints:

- `modified`, `added` and `deleted` files;
- `changes`: for each modified code file, the merchant's own lines (`yourLines`, line numbers in their file, with a preview) and how many original lines they removed at each spot.

Summarise the customisations for the user in plain words (e.g. "bigger checkout button in the cart drawer CSS", "extra class on the background video section").

If the output has a `warning` (most files differ), the version is probably wrong or the files were reformatted. Fix that before going on.

## 4. Get the plan

Call `plan_update` with `from` (the current version), `to` (the new version) and the `modified`, `added` and `deleted` lists. **Pass paths only, never file contents.** It tells you which files are the merchant's own, which Wonder didn't touch (safe to copy over), which both sides changed (need a merge), and what Wonder removed or renamed.

## 5. Apply it

Let the tool port the changes into the new copy:

```bash
npx -y wonder-theme-update@0.3.0 wonder-current --merge wonder-new
```

It changes files in `wonder-new` only:

| Report key | What happened |
|---|---|
| `copiedOwn` | The merchant's own files, copied unchanged |
| `copiedOver` | Files Wonder didn't change between the versions: the merchant's version copied over |
| `merged` | Three-way merged: the new Wonder file with the merchant's changes applied |
| `conflicts` | Both sides changed the same lines. The file has `<<<<<<<` / `=======` / `>>>>>>>` markers showing the merchant's version and Wonder's new version |
| `manual` | Not merged automatically (translations, non-code files): handle by hand |
| `nameClash`, `removedUpstream` | As in the plan: rename the merchant's file, or re-implement the change elsewhere |

Then:
1. Resolve every conflict: keep Wonder's new code and re-apply the merchant's intent on top of it. Explain each decision. Ask the user when the intent isn't clear.
2. Check that no markers are left: `grep -rn "^<<<<<<<\|^=======\|^>>>>>>>" wonder-new/{assets,blocks,layout,sections,snippets}`.
3. Show the user `git diff` in `wonder-new`: it must contain only the merchant's customisations.
4. Check the code: `cd wonder-new && shopify theme check`. Use `validate_section` on custom sections.

Ask the user before dropping a customisation you can't port cleanly.

## 6. Upload only what you changed

Push only the ported files, so you don't overwrite settings or content in the new copy:

```bash
shopify theme push --store <store>.myshopify.com --theme <new-id> --path wonder-new --nodelete \
  --only sections/custom-faq.liquid --only snippets/cart-additional-features.liquid   # one --only per file
```

List every file from `copiedOwn`, `copiedOver`, `merged` and the resolved `conflicts`. Never pass the live theme's ID here.

## 7. Check and publish

1. Preview the new copy (Online Store → Themes → new copy → **⋯ → Preview**, or share the preview link with the merchant). Check home, collection, product, cart drawer, search, and every page that uses a ported file, on desktop and mobile.
2. Check that Theme settings → Custom CSS still matches existing elements.
3. The merchant publishes the new copy when they're happy. Keep the old copy for a few weeks as a rollback.

## Without Shopify CLI

In a chat without file access, you can't compare files automatically. Help the user:

1. Run steps 0–1 above.
2. Tell them what carries over automatically: settings, section content, Custom CSS.
3. List what they must re-add by hand in the new copy (Edit code), and give the exact steps:
   - custom sections (`sections/custom-*.liquid`): create the same file in the new copy and paste the old content;
   - `assets/custom.css` and `assets/custom.js` content.
4. Edits inside Wonder's own files can't be found reliably without the files. Recommend a developer for those. A developer can also download the theme (Themes → ⋯ → **Download theme file**), unzip it and run the compare script on it.
