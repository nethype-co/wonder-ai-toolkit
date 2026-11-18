# Wonder AI Toolkit

Plugin for AI coding agents working on Shopify stores that run the [Wonder theme](https://wonder-theme.com) by Nethype. It lets the agent:

- answer from the official [Wonder documentation](https://support.wonder-theme.com), with links;
- check **known issues** for the store's Wonder version, with workarounds and the version that fixes them;
- build **custom sections** that look native to Wonder, stay update-safe and pass validation before you paste them into your store;
- **update a customised store** to a new Wonder version: find which theme files were changed, get a copy/merge plan, and move the changes to the new theme copy;
- answer **what changed in which version** from the release notes.

The plugin contains four skills and a connection to the hosted Wonder MCP server. No account is needed; the only local code is a small file-comparison script used when updating the theme.

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

Add a remote MCP server: `https://mcp.wonder-theme.com/mcp` (Streamable HTTP, no authentication). For agents that read `AGENTS.md`, copy [`AGENTS.md`](AGENTS.md) into your working folder. Don't push it to the theme: Shopify rejects unknown files at the theme root.

## Skills

| Skill | Use it for |
|---|---|
| `wonder-sections` | New or changed custom sections: blueprint → adapt → validate → ready-to-paste file with install steps |
| `wonder-troubleshooting` | Something looks wrong: known issues for your version, then docs, then the least invasive fix |
| `wonder-update` | Moving customisations to a new Wonder version: compare with the original release, plan, port, check, publish |
| `wonder-setup` | Getting started: connection check, theme version, Shopify admin vs. Shopify CLI workflow |

In Claude Code the skills load on their own when relevant, or run them directly, e.g. `/wonder-theme:wonder-sections`.

## MCP tools

| Tool | What it does |
|---|---|
| `search_docs` | Searches the Wonder documentation |
| `get_known_issues` | Known bugs and workarounds per Wonder version |
| `get_section_blueprint` | Starting code for a Wonder-native custom section |
| `validate_section` | Checks a section file against Shopify schema rules and Wonder conventions |
| `get_changelog` | Release notes: what was added, changed or fixed in which version |
| `plan_update` | Turns a list of changed file paths into an update plan (copy, copy over, merge) |

All tools are read-only. Your model writes the code; the server never generates code or calls an AI model.

## Data and privacy

The plugin sends tool requests to `https://mcp.wonder-theme.com`, operated by Nethype on Cloudflare:

- `search_docs` and `get_known_issues`: your search text and theme version;
- `validate_section`: the section code you ask it to check. The code is validated in memory and **not stored or logged**;
- `get_changelog`: versions and search text;
- `plan_update`: theme versions and the paths of changed files (e.g. `sections/header.liquid`), never file contents.

For usage statistics the server keeps request metadata for up to 90 days: tool name, client name and version, search text (shortened), theme version, result counts, the IDs of failed validation rules, and timing. For `plan_update` this includes the list of changed file paths, which shows us which parts of Wonder merchants customise most.

No code or store data is stored. Cloudflare's standard request logs (which include the IP address) are kept for 7 days for debugging and abuse protection. The plugin has no hooks. The `wonder-update` skill includes one script, `skills/wonder-update/scripts/compare.mjs`, which the agent runs on your theme folder when you update: it reads the files locally, downloads the original release's file fingerprints from `https://mcp.wonder-theme.com/manifests/<version>.json`, and sends nothing.

## Works well with

[Shopify AI Toolkit](https://shopify.dev/docs/api/ai-toolkit) for general Shopify, Liquid and API questions.

## Support

Wonder theme support: https://support.wonder-theme.com

## License

MIT
