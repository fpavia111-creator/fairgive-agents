# MCP quality checklist for Fairgive agents

The rules below were first written for the Mythos family and are applied here to the
32 Fairgive nonprofit agents built on `fairgive-core`.

## Status for Fairgive (2026-11-18)

`npm run mcp:check` (official MCP SDK client over real stdio) was not run for Fairgive ver 1: it installs the SDK with `npm i --no-save`, which this build did not do. Every agent's own stdio test (initialize, list, refuse an unknown tool, write the audit log) passes. Run `npm i --no-save @modelcontextprotocol/sdk ajv ajv-formats && npm run mcp:check` before publishing.
