import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type HeadConfig } from 'vitepress'
import type { Plugin } from 'vite'
import { renderLlmsTxt } from './llms'

const SITE = 'https://docs.investhub.org'
const root = fileURLToPath(new URL('..', import.meta.url))

const apiSidebar = [
  { text: 'Interactive reference (all endpoints)', link: '/api/', target: '_self' },
  { text: 'Auth', link: '/api/#api-1/tag/auth', target: '_self' },
  { text: 'Opportunities', link: '/api/#api-1/tag/opportunities', target: '_self' },
  { text: 'Investments', link: '/api/#api-1/tag/investments', target: '_self' },
  { text: 'KYC', link: '/api/#api-1/tag/kyc', target: '_self' },
  { text: 'Company', link: '/api/#api-1/tag/company', target: '_self' },
  { text: 'Incorporate', link: '/api/#api-1/tag/incorporate', target: '_self' },
  { text: 'Manage – Expenses', link: '/api/#api-1/tag/manage-expenses', target: '_self' },
  { text: 'Manage – Accounts', link: '/api/#api-1/tag/manage-accounts', target: '_self' },
  { text: 'Manage – Branches', link: '/api/#api-1/tag/manage-branches', target: '_self' },
  { text: 'Manage – Cards', link: '/api/#api-1/tag/manage-cards', target: '_self' },
  { text: 'Manage – Categories', link: '/api/#api-1/tag/manage-categories', target: '_self' },
  { text: 'Manage – Groups', link: '/api/#api-1/tag/manage-groups', target: '_self' },
  { text: 'Manage – Contacts', link: '/api/#api-1/tag/manage-contacts', target: '_self' },
  { text: 'Manage – Tax', link: '/api/#api-1/tag/manage-tax', target: '_self' },
  { text: 'Manage – Users', link: '/api/#api-1/tag/manage-users', target: '_self' },
  { text: 'Manage', link: '/api/#api-1/tag/manage', target: '_self' },
  { text: 'Manage – Xero', link: '/api/#api-1/tag/manage-xero', target: '_self' },
  { text: 'Wallets', link: '/api/#api-1/tag/wallets', target: '_self' },
  { text: 'Portfolio', link: '/api/#api-1/tag/portfolio', target: '_self' },
  { text: 'Payments', link: '/api/#api-1/tag/payments', target: '_self' },
  { text: 'Security', link: '/api/#api-1/tag/security', target: '_self' },
  { text: 'Documents', link: '/api/#api-1/tag/documents', target: '_self' },
  { text: 'Utility', link: '/api/#api-1/tag/utility', target: '_self' },
  { text: 'Tenants', link: '/api/#api-1/tag/tenants', target: '_self' },
  { text: 'Models', link: '/api/#api-1/models', target: '_self' },
]

function walkMarkdown(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === '.vitepress' || name === 'node_modules' || name === 'public' || name === '.git') continue
    const full = join(dir, name)
    if (statSync(full).isDirectory()) walkMarkdown(full, acc)
    else if (name.endsWith('.md')) acc.push(relative(root, full).split('\\').join('/'))
  }
  return acc
}

function contentPages(): string[] {
  return walkMarkdown(root)
    .filter((rel) => rel !== 'README.md')
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

/** index.md -> readme.md, guides/index.md -> guides.md, other files stay. */
export function markdownUrlPath(rel: string): string {
  if (rel === 'index.md') return 'readme.md'
  if (rel.endsWith('/index.md')) return `${rel.slice(0, -'/index.md'.length)}.md`
  return rel
}

/** Clean URL path with a trailing slash only for section indexes. */
export function pageRoute(rel: string): string {
  if (rel === 'index.md') return ''
  if (rel.endsWith('/index.md')) return rel.slice(0, -'index.md'.length)
  return rel.slice(0, -'.md'.length)
}

export function canonicalUrl(rel: string): string {
  const route = pageRoute(rel)
  return route === '' ? `${SITE}/` : `${SITE}/${route}`
}

function sourceForMarkdownUrl(urlPath: string): string | null {
  const rel = decodeURIComponent(urlPath.replace(/^\//, ''))
  if (!rel.endsWith('.md')) return null
  const direct = rel === 'readme.md' ? 'index.md' : rel
  if (existsSync(join(root, direct))) return direct
  const asIndex = rel.replace(/\.md$/, '/index.md')
  if (existsSync(join(root, asIndex))) return asIndex
  return null
}

function renderSitemap(pages: string[]): string {
  const body = pages.map((rel) => `<url><loc>${canonicalUrl(rel)}</loc></url>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">${body}</urlset>`
}

function writeGenerated(outDir: string) {
  const pages = contentPages()
  for (const rel of pages) {
    const dest = join(outDir, markdownUrlPath(rel))
    mkdirSync(dirname(dest), { recursive: true })
    copyFileSync(join(root, rel), dest)
  }
  writeFileSync(join(outDir, 'llms.txt'), renderLlmsTxt())
  writeFileSync(join(outDir, 'sitemap.xml'), renderSitemap(pages))
}

function rawMarkdownDevPlugin(): Plugin {
  return {
    name: 'investhub-raw-markdown',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = req.url?.split('?')[0] ?? ''
        const source = sourceForMarkdownUrl(path)
        if (!source) return next()
        res.statusCode = 200
        res.setHeader('Content-Type', 'text/markdown; charset=utf-8')
        res.end(readFileSync(join(root, source)))
      })
    },
  }
}

export default defineConfig({
  title: 'Investhub Docs',
  description: 'Investhub developer and product documentation',
  lang: 'en-US',
  cleanUrls: true,
  srcExclude: ['README.md'],
  // Live nav is the text title only. Theme colors are the VitePress defaults.
  themeConfig: {
    nav: [
      { text: 'Guides', link: '/guides/' },
      { text: 'API Reference', link: '/api/', target: '_self' },
      { text: 'Agents', link: '/agents/mcp' },
      { text: 'investhub.io', link: 'https://investhub.io' },
    ],
    sidebar: [
      { text: 'Welcome', link: '/', collapsed: false },
      {
        text: 'API Reference',
        link: '/overview/',
        collapsed: false,
        items: apiSidebar,
      },
      {
        text: 'Guides',
        link: '/guides/',
        collapsed: false,
        items: [
          { text: 'Investments', link: '/guides/investments' },
          { text: 'Portfolio Dashboard', link: '/guides/portfolio-dashboard' },
          { text: 'White-Label Tenants', link: '/guides/white-label' },
          { text: 'Liquidation Management', link: '/guides/liquidation' },
        ],
      },
      {
        text: 'Agents',
        collapsed: false,
        items: [
          { text: 'Agents & MCP', link: '/agents/mcp' },
          { text: 'x402 (paid agent calls)', link: '/agents/x402' },
        ],
      },
    ],
    search: { provider: 'local' },
    outline: [2, 3],
  },
  markdown: {
    config(md) {
      const fence = md.renderer.rules.fence
      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        if (token.info.trim() === 'mermaid') {
          return `<pre class="mermaid">${md.utils.escapeHtml(token.content)}</pre>`
        }
        return fence ? fence(tokens, idx, options, env, self) : self.renderToken(tokens, idx, options)
      }
    },
  },
  transformHead({ pageData }): HeadConfig[] {
    return [['link', { rel: 'canonical', href: canonicalUrl(pageData.relativePath) }]]
  },
  vite: {
    plugins: [rawMarkdownDevPlugin()],
  },
  buildEnd(siteConfig) {
    writeGenerated(siteConfig.outDir)
  },
})
