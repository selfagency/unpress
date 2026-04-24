import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Unpress',
  description: 'Migrate your WordPress site to 11ty with one command',
  lang: 'en-US',
  base: '/',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],

  ignoreDeadLinks: true,

  themeConfig: {
    nav: [
      { text: 'Quick Start', link: '/guide/quick-start' },
      { text: 'Guides', link: '/guide/installation' },
      { text: 'Reference', link: '/reference/cli-flags' },
      { text: 'Examples', link: '/examples/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Getting Started',
          items: [
            { text: 'Why Migrate?', link: '/' },
            { text: 'Quick Start', link: '/guide/quick-start' },
            { text: 'Installation', link: '/guide/installation' },
          ],
        },
        {
          text: 'Migration Guides',
          items: [
            { text: 'WordPress API', link: '/guide/migration-api' },
            { text: 'XML Export', link: '/guide/migration-xml' },
            { text: 'Media Handling', link: '/guide/media' },
            { text: 'Generated Site', link: '/guide/generated-site' },
            { text: 'Customization', link: '/guide/customization' },
            { text: 'Meilisearch', link: '/guide/meilisearch' },
          ],
        },
        {
          text: 'Deployment',
          items: [
            { text: 'Deploy Your Site', link: '/guide/deployment' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Configuration',
          items: [
            { text: 'CLI Flags', link: '/reference/cli-flags' },
            { text: 'Project Config', link: '/reference/project-config' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Example Projects',
          items: [
            { text: 'Simple Blog', link: '/examples/simple-blog/' },
            { text: 'Multi-Author Blog', link: '/examples/multi-author/' },
            { text: 'S3 Media Reupload', link: '/examples/s3-media/' },
            { text: 'Archival Migration', link: '/examples/archival/' },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/selfagency/unpress' },
    ],

    footer: {
      message: 'Released under MIT License.',
      copyright: 'Copyright © 2024-present Self Agency',
    },

    search: {
      provider: 'local',
    },
  },
})
