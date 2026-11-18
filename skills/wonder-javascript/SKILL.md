---
name: wonder-javascript
description: "Write custom JavaScript for a Shopify store running the Wonder theme: react to cart changes or variant selection, open or refresh the cart drawer, integrate apps, analytics or page builders. Use whenever the user wants scripts that interact with Wonder's cart, product form, drawers or web components."
---

# Custom JavaScript on a Wonder store

Wonder has a documented JavaScript API: pub/sub events, DOM events, cart drawer methods and documented web components. Code built on it keeps working across theme updates. Code that reaches into Wonder's internal components, markup or private methods breaks on updates.

## Steps

1. **Look up the API.** Call `get_component_api` (pass the store's Wonder `version` if known) for the list of documented events, methods and components. Call it again with `name` (for example `cart-update`, `cart-drawer:refresh` or `<cart-drawer>`) for details and examples. Cite the docs URLs it returns.
2. **Build only on documented entries.** If the only way is an internal component (listed as "internal" by the tool), say so, explain the risk, and keep that part small and easy to remove.
3. **Write the code.**
   - Plain JavaScript, no build step, no frameworks unless the store already uses one.
   - Wait for the API before using it (for example, check the element exists or listen for the event) instead of relying on load order.
   - Guard against running twice (theme editor re-renders sections).
4. **Say where it goes.**
   - Small snippets: Online Store → Themes → Customize → Theme settings, in a custom code or custom Liquid area if the store has one, or in a custom section/block (`{% javascript %}` or a `<script>` tag in a custom section).
   - Larger code: `assets/custom.js`. Theme updates don't copy it: tell the user to keep a copy and re-add it to the new theme version (see the `wonder-update` skill).
5. **Explain how to test** in the theme preview before publishing: which action triggers the code and what should happen.
