---
name: wonder-update
description: Update a customised Shopify store from one Wonder theme version to a newer one without losing code changes. Find which theme files were changed, plan what to copy or merge, move the changes to the new theme copy with Shopify CLI, and check it before publishing. Use when the user wants to update or upgrade Wonder, asks what they lose by updating, or needs to move customisations between theme copies.
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

Run the compare script from this skill on the **current** theme. In Claude Code:

```bash
node "${CLAUDE_PLUGIN_ROOT}/skills/wonder-update/scripts/compare.mjs" wonder-current
```

In other agents the script is `scripts/compare.mjs` next to this file.

It reads the version from `config/settings_schema.json`, downloads the original release's file fingerprints from `mcp.wonder-theme.com` and prints JSON lists of `modified`, `added` and `deleted` files. File contents never leave the machine. Settings and content JSON is skipped, because Shopify carries it over.

If the output has a `warning` (most files differ), the version is probably wrong or the files were reformatted. Fix that before going on.

## 4. Get the plan

Call `plan_update` with `from` (the current version), `to` (the new version) and the three lists from the script. **Pass paths only, never file contents.** The plan sorts files into:

| Group | What to do in `wonder-new` |
|---|---|
| Copy as is | The merchant's own files (e.g. `sections/custom-*.liquid`). Copy unchanged. |
| Copy over | Changed by the merchant, untouched by Wonder between the versions. Copy the old file over the new one. |
| Merge by hand | Changed by both. Start from the **new** file and re-apply only the merchant's changes. Never copy the old file over: it would undo Wonder's fixes. |
| Translations | Re-apply the merchant's own texts. Don't copy the old locale file. |
| Removed upstream | Wonder no longer has the file. Re-implement the change elsewhere (Custom CSS or a custom section). |
| Name clash | Wonder now ships a file with the same name. Rename the merchant's file (`custom-` prefix) and update references. |

## 5. Apply it

For each merge:
1. Find the merchant's changes. Best source: the original file of the current version (git history, or the file's Timeline view in Shopify admin → Edit code; history may not reach back that far). Otherwise compare `wonder-current/<file>` with `wonder-new/<file>` and use the changelog to tell Wonder's changes from the merchant's.
2. Re-apply them to `wonder-new/<file>` as small, targeted edits.
3. Show the user the result (`git diff` in `wonder-new`) and explain each re-applied change.

Ask the user before dropping a customisation you can't port cleanly.

Then check the code:

```bash
cd wonder-new && shopify theme check
```

Use `validate_section` on custom sections.

## 6. Upload only what you changed

Push only the ported files, so you don't overwrite settings or content in the new copy:

```bash
shopify theme push --store <store>.myshopify.com --theme <new-id> --path wonder-new --nodelete \
  --only sections/custom-faq.liquid --only snippets/cart-additional-features.liquid   # one --only per file
```

Never pass the live theme's ID here.

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
