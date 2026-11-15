import DefaultTheme from 'vitepress/theme'
import { nextTick, onMounted, watch } from 'vue'
import { useRoute } from 'vitepress'
import type { Theme } from 'vitepress'

const MERMAID_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs'

async function renderMermaid() {
  if (typeof window === 'undefined') return
  if (!document.querySelector('pre.mermaid:not([data-processed])')) return
  const { default: mermaid } = await import(/* @vite-ignore */ MERMAID_URL)
  const dark = document.documentElement.classList.contains('dark')
  mermaid.initialize({
    startOnLoad: false,
    theme: dark ? 'dark' : 'default',
    securityLevel: 'strict',
  })
  await mermaid.run({ querySelector: 'pre.mermaid:not([data-processed])' })
}

export default {
  extends: DefaultTheme,
  setup() {
    const route = useRoute()
    onMounted(() => {
      void renderMermaid()
    })
    watch(
      () => route.path,
      () => {
        void nextTick(() => renderMermaid())
      },
    )
  },
} satisfies Theme
