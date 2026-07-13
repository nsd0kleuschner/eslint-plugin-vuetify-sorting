import { readFile, writeFile } from 'node:fs/promises';
import { defaultGroups, defaultOrder } from '../lib/rules/sort-vuetify-classes.js';

const START = '<!-- vuetify-sorting:categories:start -->';
const END = '<!-- vuetify-sorting:categories:end -->';

function renderCategories() {
  return defaultOrder
    .map((name) => {
      const patterns = defaultGroups[name].map((re) => `\`${re.source}\``).join(', ');
      return `- \`${name}\`: matches ${patterns}`;
    })
    .join('\n');
}

const readmeUrl = new URL('../README.md', import.meta.url);
const readme = await readFile(readmeUrl, 'utf8');

const startIdx = readme.indexOf(START);
const endIdx = readme.indexOf(END);

if (startIdx === -1 || endIdx === -1) {
  console.error(`Could not find "${START}" / "${END}" markers in README.md`);
  process.exit(1);
}

const before = readme.slice(0, startIdx + START.length);
const generatedComment = '<!-- Generated from src/rules/sort-vuetify-classes.ts by `npm run docs`. Do not edit by hand. -->';
const after = readme.slice(endIdx);
const updated = `${before}\n${generatedComment}\n\n${renderCategories()}\n\n${after}`;

if (updated === readme) {
  console.log('README.md category table is up to date.');
  process.exit(0);
}

if (process.argv.includes('--check')) {
  console.error('README.md category table is out of date. Run `npm run docs` and commit the result.');
  process.exit(1);
}

await writeFile(readmeUrl, updated);
console.log('README.md category table updated.');
