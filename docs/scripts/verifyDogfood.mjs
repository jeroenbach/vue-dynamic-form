#!/usr/bin/env node
// Verifies that the docs site actually consumes @bach.software/vue-dynamic-form-starter
// instead of the presentational components it used to carry locally. Plain fs/path/regex,
// no test runner, so it stays runnable without pulling the package into the pnpm workspace.
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { starterIconNames } from '@bach.software/vue-dynamic-form-starter';

const docsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const componentsDir = path.join(docsRoot, '.vitepress/theme/components');
const themeIndexPath = path.join(docsRoot, '.vitepress/theme/index.ts');
const customCssPath = path.join(docsRoot, '.vitepress/theme/custom.css');

const deletedComponents = [
  'AdvancedFormTemplate.vue',
  'ArrayField.vue',
  'ArraySectionCard.vue',
  'CheckboxField.vue',
  'ChoiceArraySectionCard.vue',
  'ChoiceCard.vue',
  'ChoiceField.vue',
  'ChoiceSectionCard.vue',
  'FormWizard.vue',
  'GroupField.vue',
  'PasswordInput.vue',
  'PasswordStrengthBar.vue',
  'RepeaterCard.vue',
  'ReviewGroup.vue',
  'SelectInput.vue',
  'Stepper.vue',
  'SubmissionSuccess.vue',
  'ToggleSwitch.vue',
  'AppButton.vue',
  'AppIcon.vue',
];

// BasicFormTemplate.vue depends on all five, directly or transitively, and stays docs-local.
const keptComponents = [
  'SectionCard.vue',
  'ErrorMessage.vue',
  'FormField.vue',
  'OptionalRequiredTag.vue',
  'TextInput.vue',
];

// Only AdvancedForm.vue is itself converted template chrome. FormExampleWizard.vue and
// FormExampleClientOnboardingPlanner.vue keep their own pre-existing page-level wrapper markup
// (the outer layout div, the debug values panel), which was never part of the ported
// AdvancedFormTemplate component set and stays Tailwind per the feature's scope limit; only
// their imports and iconName values are migrated, checked separately below.
const tailwindFreeFiles = ['AdvancedForm.vue'];

// Same bounded set @bach.software/vue-dynamic-form-starter's own noTailwind test checks for,
// copied literally since docs/ cannot import a sibling package's test helper across the
// workspace boundary.
const utilityPatterns = [
  /^(?:m|p)[xytblr]?-\d/,
  /^gap(?:-[xy])?-/,
  /^text-(?:xs|sm|base|lg|xl|\dxl)$/,
  /^font-(?:medium|semibold|bold)$/,
  /^(?:flex|grid|hidden|block|inline-flex|inline-block)$/,
  /^(?:items|justify)-/,
  /^flex-(?:wrap|col|row|1)$/,
  /^(?:ms|me|ps|pe)-\d/,
  /^border(?:-[a-z])?-\d/,
  /^(?:text|bg)-(?:red|slate|gray|indigo|blue|green)-\d/,
  /^(?:grid-cols|col-span|md:|dark:)/,
];

const failures = [];

function fail(message) {
  failures.push(message);
}

function assert(condition, message) {
  if (!condition)
    fail(message);
}

for (const name of deletedComponents) {
  const filePath = path.join(componentsDir, name);
  assert(!fileExists(filePath), `expected deleted component to be absent: ${name}`);
}

for (const name of keptComponents) {
  const filePath = path.join(componentsDir, name);
  assert(fileExists(filePath), `expected kept component to be present: ${name}`);
}

function fileExists(filePath) {
  try {
    readFileSync(filePath);
    return true;
  }
  catch {
    return false;
  }
}

// iconName migration completeness: every literal value must be a name the package registry knows.
const quotedStrings = /'([^']*)'|`([^`]*)`/g;

function splitTokens(value) {
  return value.split(/\s+/).filter(Boolean);
}

function extractClassTokens(source) {
  const tokens = [];
  for (const match of source.matchAll(/(?<![:\w-])class\s*=\s*(?:"([^"]*)"|'([^']*)')/g))
    tokens.push(...splitTokens(match[1] ?? match[2] ?? ''));

  for (const match of source.matchAll(/(?:v-bind)?:class\s*=\s*"([^"]*)"/g)) {
    for (const literal of match[1].matchAll(quotedStrings))
      tokens.push(...splitTokens(literal[1] ?? literal[2] ?? ''));
  }

  for (const match of source.matchAll(/\bclass\s*:\s*(['"`])([^'"`]*)\1/g))
    tokens.push(...splitTokens(match[2]));

  return tokens;
}

function collectVueFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory())
      files.push(...collectVueFiles(fullPath));
    else if (entry.name.endsWith('.vue'))
      files.push(fullPath);
  }
  return files;
}

const iconNameValues = [];
for (const filePath of collectVueFiles(componentsDir)) {
  const content = readFileSync(filePath, 'utf8');
  for (const match of content.matchAll(/iconName:\s*'([^']+)'/g))
    iconNameValues.push({ file: path.basename(filePath), value: match[1] });
}

for (const { file, value } of iconNameValues)
  assert(starterIconNames.includes(value), `iconName '${value}' in ${file} is not a known StarterIconName`);

assert(
  !iconNameValues.some(entry => entry.value === 'bolt'),
  `expected no leftover 'bolt' iconName value, the old AppIconName no longer exists`,
);
assert(
  iconNameValues.some(entry => entry.file === 'FormExampleClientOnboardingPlanner.vue' && entry.value === 'zap'),
  `expected FormExampleClientOnboardingPlanner.vue to use the migrated 'zap' iconName`,
);
assert(
  iconNameValues.some(entry => entry.file === 'FormExampleClientOnboardingPlanner.vue' && entry.value === 'users'),
  `expected FormExampleClientOnboardingPlanner.vue to keep the unchanged 'users' iconName`,
);

// Stylesheet imported exactly once across the theme's entry point and its stylesheet.
const stylesheetMarker = 'vue-dynamic-form-starter/style.css';
const themeIndexContent = readFileSync(themeIndexPath, 'utf8');
const customCssContent = readFileSync(customCssPath, 'utf8');
const stylesheetImportCount
  = [...themeIndexContent.matchAll(new RegExp(stylesheetMarker, 'g'))].length
    + [...customCssContent.matchAll(new RegExp(stylesheetMarker, 'g'))].length;
assert(stylesheetImportCount === 1, `expected the starter stylesheet to be imported exactly once, found ${stylesheetImportCount}`);

// The rest of the theme keeps its own Tailwind usage; only the migrated pages drop it.
assert(customCssContent.includes('@import \'tailwindcss\';'), `expected custom.css to keep importing tailwindcss for the rest of the theme`);

// No stray Tailwind utility class survives in the converted template chrome.
for (const name of tailwindFreeFiles) {
  const filePath = path.join(componentsDir, name);
  const content = readFileSync(filePath, 'utf8');
  const hits = extractClassTokens(content).filter(token => utilityPatterns.some(pattern => pattern.test(token)));
  assert(hits.length === 0, `expected no Tailwind utility classes in ${name}, found: ${hits.join(', ')}`);
}

if (failures.length > 0) {
  console.error(`verifyDogfood failed with ${failures.length} problem(s):`);
  for (const failure of failures)
    console.error(`  - ${failure}`);
  process.exitCode = 1;
}
else {
  console.log(`verifyDogfood passed (${deletedComponents.length} deletions, ${keptComponents.length} kept files, ${iconNameValues.length} iconName values, stylesheet import count 1, ${tailwindFreeFiles.length} template file(s) clean of Tailwind).`);
}
