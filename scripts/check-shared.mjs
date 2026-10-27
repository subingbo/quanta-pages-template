import { readFileSync, readdirSync } from 'node:fs'
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

let failures = 0
for (const template of templates) {
  for (const [source, target] of mappings) {
    const expected = readFileSync(join(root, source))
    const actual = readFileSync(join(templatesRoot, template, target))
    if (!expected.equals(actual)) {
      failures += 1
      console.error(`out of sync: templates/${template}/${target}`)
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} file(s) out of sync. Run: npm run sync`)
  process.exitCode = 1
} else {
  console.log(`all shared files are in sync across ${templates.length} templates`)
}
