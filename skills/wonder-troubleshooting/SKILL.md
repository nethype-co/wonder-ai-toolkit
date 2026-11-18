---
name: wonder-troubleshooting
description: Diagnose and fix problems on a Shopify store running the Wonder theme: something looks broken, misaligned, blurred or missing, a setting doesn't work, or behaviour changed after a theme update. Use before suggesting any code change to a Wonder store.
---

# Troubleshooting a Wonder store

Many reports are known issues with a fix in a newer Wonder version or a documented workaround. Check that before writing code.

## Steps

1. **Get the Wonder version.** Ask if you don't know it: Shopify admin → Online Store → Themes, shown under the theme name. In a local theme folder, `config/settings_schema.json` lists it under `theme_info` → `theme_version`.
2. **Check known issues.** Call `get_known_issues` with the `version` and a short `query` describing the symptom (e.g. `mega menu blurred`). If it matches:
   - give the workaround;
   - say whether updating Wonder fixes it and which version does.
3. **Check the docs.** Call `search_docs` for the area involved. Many "bugs" are a setting in the theme editor. Cite the URLs you used.
4. **Only then propose a change**, in this order of preference:
   1. a theme setting;
   2. a short rule in **Theme settings → Custom CSS** (survives theme updates);
   3. a custom section (see the `wonder-sections` skill);
   4. editing a theme file, as a last resort. Say clearly that the edit is lost when the merchant updates Wonder and has to be re-applied.

## Rules

- Plain CSS only; no SCSS or build tools.
- Don't restyle classes starting with `wt-` globally. Scope overrides to the section (`#shopify-section-<id>` or the section's own class).
- Ask the user to test on an unpublished copy of the theme (Themes → … → Duplicate) before changing the live theme.
- If nothing matches and it looks like a theme bug, suggest contacting Wonder support with the version, the page URL, the device/browser and steps to reproduce.
