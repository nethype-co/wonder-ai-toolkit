# Wonder AI Toolkit

Plugin for AI coding agents working on Shopify stores that run the [Wonder theme](https://wonder-theme.com) by Nethype. It lets the agent:

- answer from the official [Wonder documentation](https://support.wonder-theme.com), with links;
- check **known issues** for the store's Wonder version, with workarounds and the version that fixes them;
- build **custom sections** that look native to Wonder, stay update-safe and pass validation before you paste them into your store.

The plugin contains three skills and a connection to the hosted Wonder MCP server. There is nothing to run locally and no account to create.

## Install

**Claude Code**

```bash
claude plugin marketplace add nethype/wonder-ai-toolkit
claude plugin install wonder-theme@nethype
```

**Codex**

```bash
codex plugin marketplace add nethype/wonder-ai-toolkit
```

Then open the Plugins directory, choose **Nethype (Wonder theme)** and install **Wonder Theme**.

**Cursor**

Settings → Plugins → add from repository: `https://github.com/nethype/wonder-ai-toolkit`

**VS Code (Copilot agent plugins)**

Enable the Agent plugins preview, then Command Palette → **Chat: Install Plugin From Source** → `https://github.com/nethype/wonder-ai-toolkit`

**Any other MCP client** (Claude Desktop, claude.ai custom connector, ChatGPT, Windsurf…)

Add a remote MCP server: `https://mcp.wonder-theme.com/mcp` (Streamable HTTP, no authentication). For agents that read `AGENTS.md`, copy [`AGENTS.md`](AGENTS.md) into your working folder. Don't push it to the theme: Shopify rejects unknown files at the theme root.

## Skills

| Skill | Use it for |
|---|---|
| `wonder-sections` | New or changed custom sections: blueprint → adapt → validate → ready-to-paste file with install steps |
| `wonder-troubleshooting` | Something looks wrong: known issues for your version, then docs, then the least invasive fix |
| `wonder-setup` | Getting started: connection check, theme version, Shopify admin vs. Shopify CLI workflow |

In Claude Code the skills load on their own when relevant, or run them directly, e.g. `/wonder-theme:wonder-sections`.

## MCP tools

| Tool | What it does |
|---|---|
| `search_docs` | Searches the Wonder documentation |
| `get_known_issues` | Known bugs and workarounds per Wonder version |
| `get_section_blueprint` | Starting code for a Wonder-native custom section |
| `validate_section` | Checks a section file against Shopify schema rules and Wonder conventions |

All tools are read-only. Your model writes the code; the server never generates code or calls an AI model.

## Data and privacy

The plugin sends tool requests to `https://mcp.wonder-theme.com`, operated by Nethype on Cloudflare:

- `search_docs` and `get_known_issues`: your search text and theme version;
- `validate_section`: the section code you ask it to check. The code is validated in memory and **not stored or logged**.

For usage statistics the server keeps request metadata for up to 90 days: tool name, client name and version, search text (shortened), theme version, result counts, the IDs of failed validation rules, and timing. No code or store data is stored. Cloudflare's standard request logs (which include the IP address) are kept for 7 days for debugging and abuse protection. The plugin runs no local scripts or hooks.

## Works well with

[Shopify AI Toolkit](https://shopify.dev/docs/api/ai-toolkit) for general Shopify, Liquid and API questions.

## Support

Wonder theme support: https://support.wonder-theme.com

## License

MIT
