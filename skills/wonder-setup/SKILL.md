---
name: wonder-setup
description: "Set up a working environment for customising a Shopify store that runs the Wonder theme: check the Wonder connection, find the theme version, and choose between editing in the Shopify admin and working locally with Shopify CLI. Use when the user starts working on a Wonder store or asks how to connect or set things up."
---

# Setting up work on a Wonder store

## 1. Check the connection

Call `get_known_issues` with no arguments. It returns the latest Wonder release. If the `wonder` tools are missing, the MCP server isn't connected: ask the user to reinstall the plugin or add `https://mcp.wonder-theme.com/mcp` as a remote MCP server (HTTP, no authentication).

## 2. Find the store's Wonder version

Shopify admin → Online Store → Themes, shown under the theme name. Compare it with the latest release from step 1 and mention if an update is available; updating fixes many known issues.

## 3. Choose how to work

Ask which fits the user:

**A. Shopify admin only (no tools to install).** Good for a single section or a few CSS rules.
- You produce complete files and exact paste locations: Online Store → Themes → … → Edit code, or Theme settings → Custom CSS.

**B. Local theme folder with Shopify CLI.** Good for developers and agencies doing more than a few changes.
- Install Shopify CLI: https://shopify.dev/docs/api/shopify-cli
- Access to the store: a staff or collaborator account, or a password from the **Theme Access** app (for developers without an admin account; used with `--password`).
- Always work on a copy: duplicate the live theme in Online Store → Themes, then
  - `shopify theme pull --store <store>.myshopify.com --theme <copy-id>` to download it,
  - `shopify theme dev --store <store>.myshopify.com` to preview changes locally,
  - `shopify theme push --theme <copy-id>` to upload. Never push to the live theme without the user's explicit confirmation.

For general Shopify and Liquid questions (objects, filters, APIs), the Shopify AI Toolkit plugin complements this one: https://shopify.dev/docs/api/ai-toolkit

## 4. Explain what survives a theme update

Updating Wonder installs a new copy of the theme:
- carried over: theme editor settings and **Theme settings → Custom CSS**;
- **not** carried over: edits to theme files, including `assets/custom.css`, `assets/custom.js` and custom section files. Keep copies and re-add them to the new version before publishing it.

Keep this in mind when choosing where a change goes.
