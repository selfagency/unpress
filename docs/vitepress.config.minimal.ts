import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Unpress',
  description: 'Migrate your WordPress site to 11ty with one command',
  lang: 'en-US',
  base: '/',

  ignoreDeadLinks: 'localhostLinks',

  themeConfig: {
    nav: [
      { text: 'Quick Start', link: '/guide/quick-start' }
    ]
  }
})
