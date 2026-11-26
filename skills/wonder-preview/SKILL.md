---
name: wonder-preview
description: "Show changes for a Wonder store on the real store before they go live: uploads them to an unpublished preview copy of the theme and returns a preview link and a theme editor link. Use when the user wants to see or try a custom section, CSS or other theme change on their store, asks for a preview, draft, test or staging theme, or asks to connect their store. Needs a terminal with Shopify CLI (Claude Code, Codex, Cursor)."
---

# Preview changes on the store

Puts your changes on an **unpublished preview copy** of the store's theme and gives the user a preview link and a theme editor link. The live theme is never touched. Customers can't see the copy, and publishing it stays the merchant's decision in Shopify admin.

Many users aren't developers. **You run every command**; the user only answers questions, logs in once in the browser and opens links. Don't hand them commands to type, and explain each thing they need to do in one plain sentence.

Everything runs locally through [Shopify CLI](https://shopify.dev/docs/api/shopify-cli). The store address, theme ids and any password stay on the user's computer: in the project's `.wonder/` folder, or in Shopify CLI's own login session. They are never sent to the Wonder MCP server or written into chat.

## Safety rules (always)

- Push only to the preview theme saved in `.wonder/store.json`. Before every push, check with `shopify theme list --json` that this id exists and that its role is `unpublished`. If it's `live` or missing, stop and make a new copy.
- Every push uses `--theme <previewThemeId> --nodelete`, plus `--only` for each file you changed. Never push without `--nodelete`: the working folder holds only a few files, and a push without it **deletes every other file in the theme**.
- Never use `--live`, `--allow-live` or `--publish`. Never delete or rename themes, and never run `shopify theme publish`.
- Never print, `cat`, echo or log the Theme Access password, and never put it on a command line. If the user pastes it in chat, don't repeat it. Tell them it's now in the chat history and suggest deleting that password in the Theme Access app and creating a new one.
- Validate first. Sections go through `validate_section` (and CSS through `validate_css`) with the store's Wonder version, until VALID with no warnings, before they're uploaded.

## How to run Shopify CLI

Depends on `auth` in `.wonder/store.json`:

- `"login"` (the user's Shopify account): start every command with `env -u SHOPIFY_CLI_THEME_TOKEN`, so a Theme Access password left in their shell for another store doesn't take priority over the login. Add `--auth-alias <authAlias>` only if one is saved.
  ```bash
  env -u SHOPIFY_CLI_THEME_TOKEN shopify theme list --store "<store>" --json --no-input
  ```
- `"password"` (Theme Access): load the password from the file in the same shell command, every time.
  ```bash
  set -a; . .wonder/.env; set +a; shopify theme list --store "<store>" --json --no-input
  ```

Add `--no-input` (and `--force` for `duplicate`) so the CLI never waits for a prompt. The only exception is the login in step 1. The examples below use the login form.

## 1. Connect the store (first time only)

Skip this if `.wonder/store.json` exists.

1. **Shopify CLI.** Run `shopify version`. If it's missing, ask the user once ("I need Shopify's command-line tool to upload to your store. Install it?") and install it yourself: `npm install -g @shopify/cli` (or `brew install shopify-cli` on a Mac without Node.js).
2. **The store.** Ask for the store's address. Any address works: if they give their public domain, find the myshopify one yourself:
   ```bash
   curl -sL "https://<their-domain>" | grep -oE '[a-z0-9][a-z0-9-]*\.myshopify\.com' | head -1
   ```
   If that finds nothing (password-protected store), ask them for it: Shopify admin → **Settings → Domains**.
3. **Log in.** Ask: "Do you log in to this store's Shopify admin (as the owner, staff or a collaborator)?"
   - **Yes** (most users; agencies and freelancers with collaborator access too): run the login yourself. Leave out `--no-input`; the CLI then opens the Shopify login page in their browser and waits until they've logged in:
     ```bash
     env -u SHOPIFY_CLI_THEME_TOKEN shopify theme list --store "<store>" --json
     ```
     Tell them: "A Shopify login page just opened in your browser. Log in with the account you use for your store admin and confirm. Then come back here." It can take them a few minutes, so let the command wait (in Claude Code, run it in the background and wait for it to finish). If the browser didn't open, give them the link the CLI printed. If they're already logged in, the list comes back at once.
     If the login works but this account can't open the store's themes, the account needs the *Themes* permission, or they logged in with a different account: run `shopify auth logout`, then the command again. Save `"auth": "login"`.
   - **No**, or the merchant prefers not to give an account: use a **Theme Access password**, which can only change themes. The store owner creates it:
     1. installs Shopify's free [Theme Access](https://apps.shopify.com/theme-access) app;
     2. chooses *Create password* and enters the name and email of the person who'll use it;
     3. that person opens the link from the email. It works once, so they copy the password (`shptka_…`) right away.

     Then you create the file and open it for them, so they never paste the password into chat:
     ```bash
     mkdir -p .wonder && printf 'SHOPIFY_CLI_THEME_TOKEN=' > .wonder/.env && chmod 600 .wonder/.env && open -e .wonder/.env
     ```
     (Windows: `New-Item -ItemType Directory -Force .wonder | Out-Null; Set-Content -NoNewline .wonder/.env 'SHOPIFY_CLI_THEME_TOKEN='; notepad .wonder/.env`; Linux: `xdg-open`.) Tell them: "A small text file just opened. Paste the password right after the `=` sign, save and close it." Check it without printing it: `grep -c '^SHOPIFY_CLI_THEME_TOKEN=shptka_' .wonder/.env` must print `1`. Save `"auth": "password"`.
4. **Keep it private.** Add `.wonder/` to `.gitignore` (create the file if needed).
5. **Test the connection** with `shopify theme list --json`. An authentication error means a wrong address or password, or an account without access to this store. The live theme is the one with role `live`.
6. **Working folder and Wonder version.** Create Shopify's standard theme folders; empty is enough, but without them Shopify CLI refuses to push or pull ("must run from a theme directory"):
   ```bash
   mkdir -p .wonder/theme/{assets,blocks,config,layout,locales,sections,snippets,templates}
   ```
   (Windows: `"assets","blocks","config","layout","locales","sections","snippets","templates" | % { New-Item -ItemType Directory -Force ".wonder/theme/$_" | Out-Null }`.)
   Then pull one file of the live theme and read the Wonder version:
   ```bash
   env -u SHOPIFY_CLI_THEME_TOKEN shopify theme pull --store "<store>" --theme <liveThemeId> --only config/settings_schema.json --path .wonder/theme --no-input
   ```
   Read `theme_version` from the `theme_info` entry. Shopify's JSON files can contain comments, so search the text (`grep '"theme_version"'`) rather than parsing it as strict JSON. If `theme_name` isn't Wonder, tell the user these tools are for Wonder.
7. **Save `.wonder/store.json`** (no password in it):
   ```json
   { "store": "example.myshopify.com", "auth": "login", "liveThemeId": "123", "wonderVersion": "2.5.2", "previewThemeId": null, "previewThemeName": null }
   ```
   Tell the user in one line that the store is connected and they won't be asked again.

Pass `wonderVersion` to every Wonder MCP tool (`get_conventions`, `get_section_blueprint`, `validate_section`…) instead of asking the user for it.

Agencies working for several clients with different Shopify accounts can keep one login per account: `shopify auth login --alias <name>` (run by you, without `--no-input`), then save `"authAlias": "<name>"`.

## 2. Make or reuse the preview copy

- If `previewThemeId` is set and `shopify theme list --json` shows it with role `unpublished`, reuse it. Ask first if the user wants a fresh copy of the live theme instead (for example after they changed the live theme a lot).
- Otherwise duplicate the live theme. It copies their code, settings and content:
  ```bash
  env -u SHOPIFY_CLI_THEME_TOKEN shopify theme duplicate --store "<store>" --theme <liveThemeId> --name "Wonder preview – <short topic>" --json --force --no-input
  ```
  Save the new id and name in `.wonder/store.json`.
- A store keeps at most 20 themes; check how many `theme list` shows before duplicating. If the library is full, ask the user to delete an old draft theme in Shopify admin (Online Store → Themes). Don't delete any yourself.

## 3. Upload the changes

1. Put each changed file in `.wonder/theme/` at its theme path (`.wonder/theme/sections/custom-team.liquid`, `.wonder/theme/assets/custom-bundle.js`).
2. To change a file that already exists in the theme (a JSON template, `assets/custom.css`, a snippet), pull the preview theme's copy first and edit that, so nothing else in it is lost:
   ```bash
   env -u SHOPIFY_CLI_THEME_TOKEN shopify theme pull --store "<store>" --theme <previewThemeId> --only templates/index.json --path .wonder/theme --no-input
   ```
3. To show a new section without the merchant adding it by hand, add it to a template of the **preview** theme. JSON templates start with a `/* … auto-generated … */` comment: edit them as text and keep that comment. In `templates/<page>.json`, add an entry to `sections` (`"custom-team": { "type": "custom-team", "settings": {} }`) and its key to `order` at the right position. Ask which page if it's not obvious (home page = `templates/index.json`).
4. Check the safety rules, then push only those files:
   ```bash
   env -u SHOPIFY_CLI_THEME_TOKEN shopify theme push --store "<store>" --theme <previewThemeId> --nodelete --only sections/custom-team.liquid --only templates/index.json --path .wonder/theme --json --no-input
   ```
   If the push reports errors for a file (Shopify validates Liquid and JSON on upload), fix the file, validate again and repeat.

## 4. Give the user the links

From the push result (`previewUrl` / `editorUrl`; older CLI versions use `preview_url` / `editor_url`), or build them yourself:

- **Preview:** `https://<store>/?preview_theme_id=<previewThemeId>`. Opens the store with the preview copy, for them or anyone they send it to. For other pages add the path: `https://<store>/products/<handle>?preview_theme_id=<id>`.
- **Theme editor:** `https://<store>/admin/themes/<previewThemeId>/editor`. They can adjust the section's settings there.

Keep the message short and plain:
- the two links;
- what was uploaded, file by file;
- that the live store hasn't changed;
- how to go live when they're happy: publish the preview copy in Shopify admin → Online Store → Themes (only if nobody changed the live theme since the copy was made), or ask you to add the same change to the live theme;
- that custom files must be added again after a Wonder update (the `wonder-update` skill does this).
