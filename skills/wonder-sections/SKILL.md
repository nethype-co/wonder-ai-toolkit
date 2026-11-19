---
name: wonder-sections
description: "Build or change a custom section for a Shopify store running the Wonder theme. Use whenever the user asks for a new section, a section layout (testimonials, FAQ, logos, features, image with text…), or changes to a custom section's settings, markup or styling on a Wonder store."
---

# Custom sections for the Wonder theme

You write the code. The `wonder` MCP server gives you a Wonder-native starting point and checks the result. Always go through both tools: sections written from scratch usually break Wonder's spacing, restyle other parts of the theme, or get lost on the next theme update.

## Steps

1. **Pick a blueprint.** Call `get_section_blueprint` with:
   - `kind`: `basic` (heading, text, button), `blocks` (a grid of repeatable items) or `image-with-text`. Choose the closest one; you will adapt it.
   - `handle`: short kebab-case name, e.g. `trust-badges`. The file becomes `sections/custom-<handle>.liquid`.
   - `name` (optional): the name shown in the theme editor, max 25 characters.
2. **Adapt it** to the request. Follow the rules returned with the blueprint. The most important ones:
   - Plain CSS only. No SCSS, no build step.
   - Every selector stays under the section's own class (`.custom-<handle>`), so the section can't restyle the rest of the store.
   - Don't create or restyle classes starting with `wt-`; they belong to Wonder core. Using existing Wonder classes in markup for a native look is fine.
   - Keep the wrapper's `data-section-id` attribute; Wonder's section spacing hooks onto it.
   - Liquid isn't rendered inside `{% stylesheet %}`. Put values that come from settings in the scoped `<style>` block.
   - Use literal labels in the schema, not `t:` translation keys.
3. **Validate.** Call `validate_section` with the full file and the store's Wonder version. It also runs Shopify Theme Check against that release, so a `render` of a snippet, an asset or a translation key that the store's Wonder doesn't have is an error. Fix every error and validate again until the result is VALID. Fix warnings unless there's a clear reason not to.
4. **Hand it over.** Give the user:
   - the complete file in one code block (never a partial diff for a new section) and its file name;
   - the install steps returned with the blueprint (Edit code → Sections → Add a new section → paste → Save → Customize → Add section → Custom);
   - a reminder that **theme updates don't copy custom section files**: keep a copy and add it to the new theme version before publishing an update.

If the user works in a local theme folder (Shopify CLI), write the file to `sections/custom-<handle>.liquid` instead of pasting, and tell them to preview with `shopify theme dev` before pushing.

## Check what Wonder already has

Before building anything, call `list_sections` (with a `query` such as "testimonial" or "logo") to see whether a Wonder section already does the job, and `get_section_schema` to see its settings. Often the answer is "add the X section and turn on setting Y", which survives every theme update. When you do build a custom section, use the schema of a similar Wonder section as a model for setting names, types and ranges.

## When not to create a section

- Small visual tweaks to an existing Wonder section (colour, spacing, hiding an element) belong in Custom CSS, which carries over on theme updates. Don't build a new section for them:
  1. Check `get_section_schema` first: a setting may already do it.
  2. Find the real classes or CSS variables with `find_selector` (don't guess class names).
  3. Put a rule for one section in **that section's Custom CSS** (theme editor → section → Custom CSS, 500 characters, scoped to the section automatically). Put store-wide rules in **Theme settings → Custom CSS** (1500 characters).
  4. Run `validate_css` with the matching `scope` (`section` or `theme`) and the store's Wonder `version`, then fix every error.
- Before suggesting an edit to a Wonder core file, check `search_docs`: there is often a theme setting for it. Core file edits are lost on every update.

## Questions about Wonder features

For existing sections and their settings, use `list_sections` and `get_section_schema`. For JavaScript events, the cart drawer API and web components, use `get_component_api`. For everything else, call `search_docs` and cite the returned URLs.
