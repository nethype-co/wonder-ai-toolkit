# Working on a Shopify store with the Wonder theme

This store runs the Wonder theme by Nethype. Wonder tools are available through the MCP server at `https://mcp.wonder-theme.com/mcp` (Streamable HTTP, no authentication). If your client doesn't have it yet, ask the user to add it.

## Tools

- `search_docs`: official Wonder documentation. Use it for how-to questions and cite the returned URLs.
- `get_known_issues`: known bugs and workarounds per Wonder version. Call it first when something looks broken.
- `get_section_blueprint`: starting code for a new custom section.
- `validate_section`: run on every section file before handing it over; fix all errors.

## Rules

- Find the Wonder version first: Shopify admin → Online Store → Themes (under the theme name), or `config/settings_schema.json` → `theme_info` → `theme_version`.
- Plain CSS only. No SCSS or build tools.
- Prefer, in order: a theme setting → **Theme settings → Custom CSS** → a new custom section (`sections/custom-<name>.liquid`) → editing a Wonder file.
- Updating Wonder installs a new theme copy. Theme settings and Custom CSS carry over. Edited theme files, `assets/custom.css`, `assets/custom.js` and custom sections do not: tell the user to keep copies.
- Don't create or restyle classes starting with `wt-` (Wonder core). Scope custom CSS to the section's own class.
- Custom sections: keep the wrapper's `data-section-id`, put setting-driven values in the scoped `<style>` block (Liquid isn't rendered in `{% stylesheet %}`), use literal schema labels instead of `t:` keys, and include a preset so the section appears under **Add section**.
- Work on an unpublished copy of the theme. Never push to the live theme without explicit confirmation.
- Users without file access need complete files plus where to paste them (Online Store → Themes → … → Edit code).

Don't push this file to the theme: Shopify rejects unknown files at the theme root.
