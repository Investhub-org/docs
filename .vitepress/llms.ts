export interface LlmsLink {
  title: string
  href: string
}

/** Curated llms.txt entries. Keep the original live-site order, then append. */
export const llmsLinks: LlmsLink[] = [
  { title: 'Welcome', href: 'https://docs.investhub.org/readme.md' },
  { title: 'Investments', href: 'https://docs.investhub.org/guides/investments.md' },
  { title: 'Liquidation Management', href: 'https://docs.investhub.org/guides/liquidation.md' },
  { title: 'Portfolio Dashboard', href: 'https://docs.investhub.org/guides/portfolio-dashboard.md' },
  { title: 'White-Label Tenants', href: 'https://docs.investhub.org/guides/white-label.md' },
  { title: 'API Reference', href: 'https://docs.investhub.org/overview.md' },
  { title: 'Guides', href: 'https://docs.investhub.org/guides.md' },
  { title: 'OpenAPI spec', href: 'https://docs.investhub.org/openapi.yaml' },
  { title: 'Agents & MCP', href: 'https://docs.investhub.org/agents/mcp.md' },
  { title: 'x402 (paid agent calls)', href: 'https://docs.investhub.org/agents/x402.md' },
  { title: 'Governance on-chain', href: 'https://docs.investhub.org/governance.md' },
]

export function renderLlmsTxt(links: LlmsLink[] = llmsLinks): string {
  const lines = ['# Investhub Docs', '', ...links.map((link) => `- [${link.title}](${link.href})`), '']
  return lines.join('\n')
}
