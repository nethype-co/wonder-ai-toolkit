# Wonder AI Toolkit

Plugin for AI coding agents working on Shopify stores that run the [Wonder theme](https://wonder-theme.com) by Nethype. It lets the agent:

- answer from the official [Wonder documentation](https://support.wonder-theme.com), with links;
- check **known issues** for the store's Wonder version, with workarounds and the version that fixes them;
- build **custom sections** that look native to Wonder, stay update-safe and pass validation before you paste them into your store;
- **update a customised store** to a new Wonder version: find exactly which lines were changed, merge them into the new theme copy automatically, and flag real conflicts;
- answer **what changed in which version** from the release notes.

The plugin contains five skills and a connection to the hosted Wonder MCP server. No account is needed, and the plugin itself contains no code: only instructions (skills) and the server address.

## Install

**Claude Code**

```bash
claude plugin marketplace add nethype-co/wonder-ai-toolkit
claude plugin install wonder-theme@nethype
```

**Codex**

```bash
codex plugin marketplace add nethype-co/wonder-ai-toolkit
```

Then open the Plugins directory, choose **Nethype (Wonder theme)** and install **Wonder Theme**.

**Cursor**

Settings → Plugins → add from repository: `https://github.com/nethype-co/wonder-ai-toolkit`

**VS Code (Copilot agent plugins)**

Enable the Agent plugins preview, then Command Palette → **Chat: Install Plugin From Source** → `https://github.com/nethype-co/wonder-ai-toolkit`

**Any other MCP client** (Claude Desktop, claude.ai custom connector, ChatGPT, Windsurf…)

Add a remote MCP server: `https://mcp.wonder-theme.com/mcp` (Streamable HTTP, no authentication). For agents that read `AGENTS.md`, save the [Wonder `AGENTS.md`](https://support.wonder-theme.com/ai-agents/setup#agents-md) in your working folder. Don't push it to the theme: Shopify rejects unknown files at the theme root.

## Skills

| Skill | Use it for |
|---|---|
| `wonder-sections` | New or changed custom sections: blueprint → adapt → validate → ready-to-paste file with install steps |
| `wonder-troubleshooting` | Something looks wrong: known issues for your version, then docs, then the least invasive fix |
| `wonder-update` | Moving customisations to a new Wonder version: finds your exact changes, merges them into the new version (three-way), flags conflicts, then check and publish |
| `wonder-preview` | See changes on the real store before they go live: the agent connects the store once (you log in in the browser, or paste a Theme Access password into a local file), uploads to an unpublished preview copy of the theme and returns preview and theme editor links |
| `wonder-javascript` | Custom JavaScript built on Wonder's documented events, cart drawer API and web components |
| `wonder-setup` | Getting started: connection check, theme version, Shopify admin vs. Shopify CLI workflow |

In Claude Code the skills load on their own when relevant, or run them directly, e.g. `/wonder-theme:wonder-sections`.

## MCP tools

| Tool | What it does |
|---|---|
| `search_docs` | Searches the Wonder documentation |
| `get_known_issues` | Known bugs and workarounds per Wonder version |
| `get_conventions` | How Wonder builds its sections, measured from its code: standard settings, CSS wiring, snippets, classes, colour and font tokens |
| `get_section_blueprint` | Starting code for a custom section that follows those conventions |
| `validate_section` | Checks a section file against Shopify schema rules and the store's Wonder release: consistency with Wonder's conventions and Shopify Theme Check |
| `get_changelog` | Release notes: what was added, changed or fixed in which version |
| `list_sections` | Sections and theme blocks of a Wonder version, with settings counts, block types and limits |
| `get_section_schema` | Every setting of one section or block, with the labels merchants see in the theme editor |
| `get_component_api` | Documented JavaScript API: events, cart drawer methods, web components |
| `find_selector` | Real CSS classes and variables for an element in your Wonder version |
| `validate_css` | Checks Custom CSS against Shopify's rules and your Wonder version |
| `plan_update` | Turns a list of changed file paths into an update plan (copy, copy over, merge) |

All tools are read-only. Your model writes the code; the server never generates code or calls an AI model.

## Data and privacy

Full privacy notice: https://support.wonder-theme.com/ai-agents/privacy

The plugin sends tool requests to `https://mcp.wonder-theme.com`, operated by Nethype on Cloudflare:

- `search_docs` and `get_known_issues`: your search text and theme version;
- `validate_section`: the section code you ask it to check. The code is validated in memory and **not stored or logged**;
- `get_changelog`: versions and search text;
- `list_sections`, `get_section_schema`, `get_component_api`, `find_selector`, `get_conventions`: versions, section or block names and search text;
- `validate_css`: the CSS you ask it to check, processed in memory and not stored;
- `plan_update`: theme versions and the paths of changed files (e.g. `sections/header.liquid`), never file contents.

For usage statistics the server keeps request metadata for up to 90 days: tool name, client name and version, theme version, result counts, the IDs of failed validation rules, and timing. **What you type (search text, section names, file paths) is not kept** unless you opt in: set `WONDER_SHARE_QUERIES=1` in your environment before starting your agent to share it with us for improving the docs and tools. Sharing is off by default.

No code or store data is stored. Cloudflare's standard request logs (which include the IP address) are kept for 7 days for debugging and abuse protection. The plugin has no hooks or scripts. When you update the theme, the `wonder-update` skill runs the npm package [`wonder-theme-update`](https://www.npmjs.com/package/wonder-theme-update) (pinned version, published by Nethype) on your theme folders. It downloads fingerprints (short hashes) of the original release's files and lines from `https://mcp.wonder-theme.com`, then finds your changes and merges them into the new version locally. It never uploads your files.

The `wonder-preview` skill uploads changes to an unpublished preview copy of your theme with Shopify CLI, signed in with your own Shopify account (staff or collaborator) or with a Theme Access password you create. The store domain, theme ids and password stay on your computer (`.wonder/` folder, Shopify CLI's login session). They never reach the Wonder MCP server, and the skill never pushes to the live theme or publishes a theme.

## Works well with

[Shopify AI Toolkit](https://shopify.dev/docs/api/ai-toolkit) for general Shopify, Liquid and API questions.

## Support

Wonder theme support: https://support.wonder-theme.com

## License

MIT
