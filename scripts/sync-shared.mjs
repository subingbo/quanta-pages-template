import { cpSync, mkdirSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const templatesRoot = join(root, 'templates')

const mappings = [
  ['shared/layout/index.html', 'index.html'],
  ['shared/layout/blog.html', 'blog.html'],
  ['shared/layout/article.html', 'article.html'],
  ['shared/layout/about.html', 'about.html'],
  ['shared/site-core.js', 'assets/site-core.js'],
  ['shared/site-core.css', 'assets/site-core.css'],
  ['shared/app.js', 'assets/app.js'],
  ['shared/markdown-it.min.js', 'vendor/markdown-it.min.js'],
]

const templates = readdirSync(templatesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)

for (const template of templates) {
  for (const [source, target] of mappings) {
    const destination = join(templatesRoot, template, target)
    mkdirSync(dirname(destination), { recursive: true })
    cpSync(join(root, source), destination)
  }
  console.log(`synced templates/${template}`)
}
