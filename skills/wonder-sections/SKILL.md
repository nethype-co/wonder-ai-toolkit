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
3. **Validate.** Call `validate_section` with the full file. Fix every error and validate again until the result is VALID. Fix warnings unless there's a clear reason not to.
4. **Hand it over.** Give the user:
   - the complete file in one code block (never a partial diff for a new section) and its file name;
   - the install steps returned with the blueprint (Edit code → Sections → Add a new section → paste → Save → Customize → Add section → Custom);
   - a reminder that **theme updates don't copy custom section files**: keep a copy and add it to the new theme version before publishing an update.

If the user works in a local theme folder (Shopify CLI), write the file to `sections/custom-<handle>.liquid` instead of pasting, and tell them to preview with `shopify theme dev` before pushing.

## When not to create a section

- Small visual tweaks to an existing Wonder section (colour, spacing, hiding an element) belong in **Theme settings → Custom CSS**, which carries over on theme updates. Write a short CSS rule scoped to that section instead of a new section.
- Before suggesting an edit to a Wonder core file, check `search_docs`: there is often a theme setting for it. Core file edits are lost on every update.

## Questions about Wonder features

For anything about existing Wonder sections, settings, JavaScript events, the cart drawer API or CSS variables, call `search_docs` and cite the returned URLs.
