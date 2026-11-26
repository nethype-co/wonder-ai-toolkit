---
name: wonder-sections
description: "Build or change a custom section for a Shopify store running the Wonder theme. Use whenever the user asks for a new section, a section layout (testimonials, FAQ, logos, features, image with text…), or changes to a custom section's settings, markup or styling on a Wonder store."
---

# Custom sections for the Wonder theme

You write the code. The `wonder` MCP server tells you how Wonder builds its own sections and checks the result against that. The goal is a section that's **indistinguishable from Wonder's own**: same settings in the theme editor, same spacing, colours, fonts, heading style and animations, same code patterns. A section written from scratch is usually detached from the theme: its own spacing settings, hard-coded colours and fonts, invented CSS variables, and styles that ignore the merchant's Theme settings.

Ask for the store's Wonder version first (Online Store → Themes, shown under the theme name) and pass it to every tool below: conventions, snippets and classes change between releases.

## Steps

1. **Look for an existing Wonder section.** Call `list_sections` with a `query` ("testimonial", "logo", "faq"…). If one does the job, the answer is "add that section and set X" (see below). Otherwise note the closest one: it's your model.
2. **Learn the conventions.** Call `get_conventions` with the version. It lists what Wonder's sections share, measured from its code: the standard settings to copy as they are (heading group, colours, spacing), the CSS variables they feed, the wrapper, heading and animation markup, shared snippets and classes, and the colour and font tokens.
3. **Study the closest Wonder section.** With the theme files available (local theme folder), open `sections/<closest>.liquid` and mirror its structure: setting ids and order, how it renders headings, images and buttons, which snippets and classes it uses. Without files, `get_section_schema` shows its settings. Reuse what Wonder has; don't reinvent it.
4. **Start from a blueprint.** Call `get_section_blueprint` with:
   - `kind`: `basic` (heading, text, button), `blocks` (a grid of repeatable items) or `image-with-text`. Choose the closest one; you will adapt it.
   - `handle`: short kebab-case name, e.g. `trust-badges`. The file becomes `sections/custom-<handle>.liquid`.
   - `name` (optional): the name shown in the theme editor, max 25 characters.
   - `version`: the store's Wonder version.
   The blueprint already follows the conventions. Keep its standard settings, `<style>` wiring, wrapper and heading markup; add your settings between the heading group and the colour/spacing group.
5. **Adapt it** to the request, the Wonder way:
   - Colours and fonts come from Theme settings: use Wonder's variables (`var(--color-text)`, `var(--color-background)`, `var(--font-headline)`…). Never hard-code hex values or font names; for a colour the merchant picks, add a `color` setting and feed a variable, as the blueprint does.
   - For a setting Wonder already has (image ratio, alignment, button style, overlay…), reuse its id and definition from `get_conventions` / `get_section_schema` instead of inventing one.
   - Render Wonder's snippets (`headline`…) and reuse its classes as they are (`rte`, `hero__button--primary`, `wt-section__wrapper`) for a native look. Use only classes and CSS variables that exist: `find_selector` lists them.
   - Plain CSS only. No SCSS, no build step. Every selector stays under the section's own class (`.custom-<handle>`).
   - Don't create or restyle classes starting with `wt-`; they belong to Wonder core.
   - Liquid isn't rendered inside `{% stylesheet %}`. Put values that come from settings in the scoped `<style>` block.
   - Use literal labels in the schema, not `t:` translation keys.
6. **Validate.** Call `validate_section` with the full file and the version. If the section ships with its own snippets or assets, list them in `files` (e.g. `["snippets/bundle-item.liquid", "assets/bundle.js"]`) and hand them over with the section. It checks Shopify's schema rules, runs Shopify Theme Check against that release, and reports where the section departs from Wonder's conventions (`wonder-*` rules: missing standard settings, settings that do nothing, hard-coded colours and fonts, CSS variables or `wt-` classes that don't exist, heading and animation patterns). Fix every error and warning and validate again until the result is VALID with no warnings; treat `wonder-*` info notes as the default unless there's a clear reason not to.
7. **Hand it over.** Give the user:
   - the complete file in one code block (never a partial diff for a new section) and its file name;
   - the install steps returned with the blueprint (Edit code → Sections → Add a new section → paste → Save → Customize → Add section → Custom);
   - a reminder that **theme updates don't copy custom section files**: keep a copy and add it to the new theme version before publishing an update.

If the user works in a local theme folder (Shopify CLI), write the file to `sections/custom-<handle>.liquid` instead of pasting, and tell them to preview with `shopify theme dev` before pushing.

If you have a terminal, offer to show the section on their store: you upload it to an unpublished preview copy of their theme and send a preview link (the `wonder-preview` skill). They only log in once in the browser; you run the commands. The live theme stays untouched. If the store is already connected (`.wonder/store.json` exists), take the Wonder version from there instead of asking.

## Changing an existing custom section

Run `validate_section` on it first, with the store's version. Fix the `wonder-*` findings along with the requested change, so the section moves closer to Wonder's conventions instead of further away.

## When not to create a section

- Small visual tweaks to an existing Wonder section (colour, spacing, hiding an element) belong in Custom CSS, which carries over on theme updates. Don't build a new section for them:
  1. Check `get_section_schema` first: a setting may already do it.
  2. Find the real classes or CSS variables with `find_selector` (don't guess class names).
  3. Put a rule for one section in **that section's Custom CSS** (theme editor → section → Custom CSS, 500 characters, scoped to the section automatically). Put store-wide rules in **Theme settings → Custom CSS** (1500 characters).
  4. Run `validate_css` with the matching `scope` (`section` or `theme`) and the store's Wonder `version`, then fix every error.
- Before suggesting an edit to a Wonder core file, check `search_docs`: there is often a theme setting for it. Core file edits are lost on every update.

## Questions about Wonder features

For existing sections and their settings, use `list_sections` and `get_section_schema`. For JavaScript events, the cart drawer API and web components, use `get_component_api`. For everything else, call `search_docs` and cite the returned URLs.
