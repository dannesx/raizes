import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const themePath = path.resolve(__dirname, '../src/theme/material-theme.json');
const rawData = fs.readFileSync(themePath, 'utf-8');
const theme = JSON.parse(rawData);

function camelToKebab(str) {
  return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

function generateCssVariables(schemeObj) {
  const lines = [];
  for (const [key, value] of Object.entries(schemeObj)) {
    const cssVar = `--md-sys-color-${camelToKebab(key)}`;
    lines.push(`  ${cssVar}: ${value};`);
  }
  return lines.join('\n');
}

const lightTokens = generateCssVariables(theme.schemes.light);
const darkTokens = generateCssVariables(theme.schemes.dark);

const cssContent = `/* Generated from material-theme.json - Material Design 3 Tokens */
:root {
  /* Color Scheme - Light */
${lightTokens}

  /* M3 Elevation Shadows */
  --md-sys-elevation-0: none;
  --md-sys-elevation-1: 0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  --md-sys-elevation-2: 0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30);
  --md-sys-elevation-3: 0px 1px 3px 0px rgba(0, 0, 0, 0.30), 0px 4px 8px 3px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-4: 0px 2px 3px 0px rgba(0, 0, 0, 0.30), 0px 6px 10px 4px rgba(0, 0, 0, 0.15);
  --md-sys-elevation-5: 0px 4px 4px 0px rgba(0, 0, 0, 0.30), 0px 8px 12px 6px rgba(0, 0, 0, 0.15);

  /* M3 Shape / Radii */
  --md-sys-shape-corner-none: 0px;
  --md-sys-shape-corner-extra-small: 4px;
  --md-sys-shape-corner-small: 8px;
  --md-sys-shape-corner-medium: 12px;
  --md-sys-shape-corner-large: 16px;
  --md-sys-shape-corner-extra-large: 28px;
  --md-sys-shape-corner-full: 9999px;

  /* Typography */
  --md-sys-typescale-font: 'Roboto', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root {
${darkTokens}
    color-scheme: dark;
  }
}

[data-theme="dark"] {
${darkTokens}
  color-scheme: dark;
}

[data-theme="light"] {
${lightTokens}
  color-scheme: light;
}
`;

fs.writeFileSync(path.resolve(__dirname, '../src/theme/tokens.css'), cssContent, 'utf-8');
console.log('tokens.css generated successfully!');
