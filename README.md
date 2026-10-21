# ViralNote for n8n

Read connected social accounts, prepare drafts, schedule posts, and publish
approved content through your [ViralNote](https://www.viralnote.app) account.

This is a community node maintained by Loona Brands LLC, the operator of
ViralNote. This package has not completed n8n verification and does not claim verified
status.

## Installation

After the package is published, install `@viralnote/n8n-nodes-viralnote` from
**Settings → Community Nodes** on a self-hosted n8n instance. Availability in
n8n Cloud requires n8n's separate verification review.

## Credentials

1. Open [ViralNote developer settings](https://dashboard.viralnote.app/developers/auth).
2. Create an API key with `posts:read` for reads, `posts:write` for drafts and
   scheduling, and `posts:publish` when your workflow publishes posts.
3. Add **ViralNote API** credentials in n8n and enter the API key without the
   `Bearer` prefix. The credential test performs a read of your authorized
   brands. Keys restricted to a brand keep that restriction.

Keep credentials in n8n's credential store. Do not paste keys into workflow
parameters, shared workflow JSON, or chat.

## Operations

| Resource       | Operations                                                 |
| -------------- | ---------------------------------------------------------- |
| Brand          | Get many authorized brands                                 |
| Social Account | Get many connected accounts, optionally filtered by brand  |
| Post           | Create draft, schedule, get, get many, publish now, delete |

Post lists support status, brand, and updated-since filters. **Return All**
follows cursor pagination; **Limit** returns up to 50 posts from one page.

Draft and schedule operations accept a caption, connected platforms, and
optional brand, title, media library item, platform account IDs, and
provider-specific metadata. Platform account IDs and metadata use JSON objects
matching the [ViralNote API documentation](https://dashboard.viralnote.app/developers).

The default post operation creates a **draft**. Scheduling and publishing are
explicit operations and can send content to real social accounts. Review the
caption, target accounts, media, and time before enabling those workflow steps.
Deleting a scheduled post also cancels its schedule. Draft and schedule requests
use an idempotency key tied to the execution, node, run, and input item so a
request retry does not create a second post.

## Example workflows

- **Google Sheets → ViralNote: Create Draft**: prepare a draft for each approved
  content row. Review the drafts in ViralNote before scheduling.
- **Schedule Trigger → ViralNote: Get Many Posts**: inspect scheduled posts for
  a brand, then send an internal summary to your team.
- **Approval step → ViralNote: Publish**: publish an existing approved draft by
  its post ID. The workflow's approval step is configured by its owner.

A ViralNote account is required. Reads and drafts are available without a paid
plan; scheduling and publishing require an active publishing entitlement.
Available actions depend on social provider permissions and connection health.
The API's permission, validation, plan, and rate-limit errors are surfaced by
n8n's normal error handling.

## Development

Use Node.js 24 and install dependencies with `npm ci`.

```sh
npm run lint
npm run build
npm test
npm run dev -- --custom-user-folder /tmp/viralnote-n8n-development
```

The node uses n8n's declarative HTTP routing and has no runtime dependencies
other than the `n8n-workflow` host peer. API requests go only to
`https://dashboard.viralnote.app/api/v1`.

Releases must be built by `.github/workflows/publish.yml` with npm provenance
before submission through the [n8n Creator Portal](https://creators.n8n.io/nodes).
The repository's npm trusted publisher must be configured before release.
The workflow stages the package on npm. A maintainer reviews the staged package
and approves it with npm two-factor authentication before it is published.

## Support

- Documentation: https://www.viralnote.app/mcp
- Privacy: https://www.viralnote.app/privacy
- Email: info@viralnote.app

## License

MIT
