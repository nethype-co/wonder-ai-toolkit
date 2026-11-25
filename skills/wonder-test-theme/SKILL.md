---
name: wonder-test-theme
description: "Upload changes for a Wonder store to a test copy of its theme and return a preview link. Use when the user wants to try a custom section, CSS or other theme change on the real store before publishing, asks for a test/staging/preview theme, or asks to connect their store (myshopify domain, Shopify CLI login or Theme Access password). Needs a terminal with Shopify CLI (Claude Code, Codex, Cursor)."
---

# Test theme for a Wonder store

Puts your changes on an **unpublished copy** of the store's theme and gives the user a preview link and a theme editor link. The live theme is never touched. Customers can't see the copy, and publishing it stays the merchant's decision in Shopify admin.

Everything runs locally through [Shopify CLI](https://shopify.dev/docs/api/shopify-cli). The store domain, theme ids and any password stay on the user's computer: in the project's `.wonder/` folder, or in Shopify CLI's own login session. They are never sent to the Wonder MCP server or written into chat.

## Safety rules (always)

- Push only to the test theme saved in `.wonder/store.json`. Before every push, check with `shopify theme list --json` that this id exists and that its role is `unpublished`. If it's `live` or missing, stop and make a new copy.
- Every push uses `--theme <testThemeId> --nodelete`, plus `--only` for each file you changed. Never push without `--nodelete`: the working folder holds only a few files, and a push without it **deletes every other file in the theme**.
- Never use `--live`, `--allow-live` or `--publish`. Never delete or rename themes, and never run `shopify theme publish`.
- Never print, `cat`, echo or log the password, and never put it on a command line. It's read from `.wonder/.env` by the shell (below). If the user pastes it in chat, don't repeat it. Tell them it's now in the chat history and suggest deleting that password in the Theme Access app and creating a new one.
- Validate first. Sections go through `validate_section` (and CSS through `validate_css`) with the store's Wonder version, until VALID with no warnings, before they're uploaded.

## Running Shopify CLI with the saved settings

How to run every `shopify theme …` command depends on `auth` in `.wonder/store.json`:

- `"login"` (Shopify account): add `--auth-alias <authAlias>` when an alias is saved (without one, the CLI uses its default login). Start with `env -u SHOPIFY_CLI_THEME_TOKEN`: a Theme Access password set in the user's shell for another store would otherwise take priority over the login and be rejected.
  ```bash
  env -u SHOPIFY_CLI_THEME_TOKEN shopify theme list --store "<store>" --auth-alias "<authAlias>" --json --no-input
  ```
  If the CLI says it needs to log in (the session expired, or this account has no access to the store), ask the user to run `shopify auth login --alias <authAlias>` again in their terminal. Don't run it yourself: it opens a browser.
- `"password"` (Theme Access): load the password from the file in the same shell command, every time.
  ```bash
  set -a; . .wonder/.env; set +a; shopify theme list --store "<store>" --json --no-input
  ```
  `SHOPIFY_CLI_THEME_TOKEN` from that file is the password; Shopify CLI picks it up on its own.

Always add `--no-input` (and `--force` for `duplicate`) so the CLI doesn't wait for a prompt. The examples below use the password form. With `"login"`, replace `set -a; . .wonder/.env; set +a;` with `env -u SHOPIFY_CLI_THEME_TOKEN` and add `--auth-alias "<authAlias>"`.

## 1. Connect the store (first time only)

Skip this if `.wonder/store.json` exists.

1. Check Shopify CLI: `shopify version`. If it's missing, ask the user before installing it (`npm install -g @shopify/cli`).
2. Ask for the store's **myshopify domain** (`example.myshopify.com`; Shopify admin → Settings → Domains). The public domain doesn't work.
3. Ask how they get into the store:
   - **They log in to the store's admin** as the owner, a staff member, or a collaborator (agency or freelancer with Partner Dashboard access; development stores count too). Use **login**, step 3a. Their account needs the *Themes* permission, which owners and collaborators usually have.
   - **They don't have an account on the store**, or the merchant prefers not to give one. The merchant creates a password that can only change themes: **Theme Access**, steps 3b–4.

   **3a. Login.** If they've used Shopify CLI with this store before, they may already be logged in: try step 6 first. Otherwise the user runs this in their own terminal; it opens the browser to sign in with their Shopify account:
   ```bash
   shopify auth login --alias <short-name>
   ```
   Pick the alias with them (e.g. their name or agency). One alias keeps one account, so agencies can switch between accounts with `--auth-alias`. Save `"auth": "login", "authAlias": "<short-name>"` and go to step 5. Access follows their account: when the store removes them as staff or collaborator, it stops working.

   **3b. Theme Access password.**
   1. Install Shopify's free **Theme Access** app: https://apps.shopify.com/theme-access
   2. In the app: *Create password*, enter their name and email.
   3. Open the link from the email. It works once, so copy the password (`shptka_…`) straight into step 4.
4. The user saves the password in their own terminal, in the project folder. Don't ask for it in chat.

   macOS / Linux:
   ```bash
   mkdir -p .wonder && printf 'Theme Access password: ' && stty -echo && read t; stty echo; echo; printf 'SHOPIFY_CLI_THEME_TOKEN=%s\n' "$t" > .wonder/.env && chmod 600 .wonder/.env; unset t
   ```
   Windows (PowerShell):
   ```powershell
   New-Item -ItemType Directory -Force .wonder | Out-Null; $s = Read-Host 'Theme Access password' -AsSecureString; "SHOPIFY_CLI_THEME_TOKEN=$([Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)))" | Set-Content .wonder/.env
   ```
   In Claude Code they can't type it after the `!` prefix (no hidden input there). They use a separate terminal window in the same folder.

   Save `"auth": "password"`.
5. Make sure the folder stays private. Add `.wonder/` to `.gitignore` (create the file if needed).
6. Test the connection with `shopify theme list --json`. An authentication error means a wrong domain or password, or an account without access to this store or without the Themes permission. The live theme is the one with role `live`.
7. Create the working folder with Shopify's standard theme folders. Empty folders are enough, but without them Shopify CLI refuses to push or pull from it ("must run from a theme directory"):
   ```bash
   mkdir -p .wonder/theme/{assets,blocks,config,layout,locales,sections,snippets,templates}
   ```
   On Windows: `"assets","blocks","config","layout","locales","sections","snippets","templates" | % { New-Item -ItemType Directory -Force ".wonder/theme/$_" | Out-Null }`.

   Then read the live theme's Wonder version. Pull one file into the working folder:
   ```bash
   set -a; . .wonder/.env; set +a; shopify theme pull --store "<store>" --theme <liveThemeId> --only config/settings_schema.json --path .wonder/theme --no-input
   ```
   Then read `theme_version` from the `theme_info` entry. Shopify's JSON files can contain comments, so search the text (`grep '"theme_version"'`) rather than parsing it as strict JSON. If `theme_name` isn't Wonder, tell the user these tools are for Wonder.
8. Save `.wonder/store.json`. No password in it:
   ```json
   { "store": "example.myshopify.com", "auth": "login", "authAlias": "agency", "liveThemeId": "123", "wonderVersion": "2.5.2", "testThemeId": null, "testThemeName": null }
   ```

Pass `wonderVersion` to every Wonder MCP tool (`get_conventions`, `get_section_blueprint`, `validate_section`…) instead of asking the user for it.

## 2. Make or reuse the test copy

- If `testThemeId` is set and `shopify theme list --json` shows it with role `unpublished`, reuse it. Ask first if the user wants a fresh copy of the live theme instead (for example after they changed the live theme a lot).
- Otherwise duplicate the live theme. It copies their code, settings and content:
  ```bash
  set -a; . .wonder/.env; set +a; shopify theme duplicate --store "<store>" --theme <liveThemeId> --name "Wonder AI test – <short topic>" --json --force --no-input
  ```
  Save the new id and name in `.wonder/store.json`.
- A store keeps at most 20 themes; check how many `theme list` shows before duplicating. If duplicating fails because the library is full, tell the user to delete an old unpublished theme in Shopify admin. Don't delete any yourself.

## 3. Upload the changes

1. Put each changed file in `.wonder/theme/` at its theme path (`.wonder/theme/sections/custom-team.liquid`, `.wonder/theme/assets/custom-bundle.js`).
2. To change a file that already exists in the theme (a JSON template, `assets/custom.css`, a snippet), pull the test theme's copy first and edit that, so nothing else in it is lost:
   ```bash
   set -a; . .wonder/.env; set +a; shopify theme pull --store "<store>" --theme <testThemeId> --only templates/index.json --path .wonder/theme --no-input
   ```
3. To show a new section without the merchant adding it by hand, add it to a template of the **test** theme. JSON templates start with a `/* … auto-generated … */` comment: edit them as text and keep that comment. In `templates/<page>.json`, add an entry to `sections` (`"custom-team": { "type": "custom-team", "settings": {} }`) and its key to `order` at the right position. Ask which page, if it's not obvious (home page = `templates/index.json`).
4. Check the safety rules, then push only those files:
   ```bash
   set -a; . .wonder/.env; set +a; shopify theme push --store "<store>" --theme <testThemeId> --nodelete --only sections/custom-team.liquid --only templates/index.json --path .wonder/theme --json --no-input
   ```
   If the push reports errors for a file (Shopify validates Liquid and JSON on upload), fix the file, validate again and repeat.

## 4. Give the user the links

From the push result (`previewUrl` / `editorUrl`; older CLI versions use `preview_url` / `editor_url`), or build them yourself:

- **Preview:** `https://<store>/?preview_theme_id=<testThemeId>`. Opens the store with the test theme, for them or anyone they send it to. Add the page path for other pages: `https://<store>/products/<handle>?preview_theme_id=<id>`.
- **Theme editor:** `https://<store>/admin/themes/<testThemeId>/editor`. They can adjust the section's settings there.

Also say:
- what was uploaded, file by file;
- that the live theme hasn't changed;
- how to go live when they're happy: either publish the test theme in Shopify admin → Online Store → Themes (only if the live theme hasn't changed since the copy was made), or add the same files to the live theme;
- that custom files must be added again after a Wonder update (the `wonder-update` skill does this).
