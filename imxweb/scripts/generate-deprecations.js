import fs from 'fs';
import path from 'path';

// === CONFIG ===
const SRC_DIR = './projects';
const OUTPUT_FILE = './DEPRECATIONS.md';

// === HEADER FOR THE MD FILE ===
const MD_HEADER = `# Deprecations Log
In accordance with JSDoc, deprecations are functions, methods, properties, components, modules, services, or directives marked with a \`@deprecated\` flag.

We will wait at least one major version before removing a deprecation. The following are marked but have not yet removed:

`;

// === HELP SECTION ===
function printHelp() {
  console.log(`
Generate Deprecations Log
=========================

Scans Angular .ts files for JSDoc @deprecated comments and outputs DEPRECATIONS.md.

USAGE:
  node scripts/generate-deprecations.js [options]

OPTIONS:
  --src <path>       Set the source directory to scan (default: ${SRC_DIR})
  --out <path>       Set the output markdown file (default: ${OUTPUT_FILE})
  --help             Show this help message

EXAMPLE: (run from root imxweb dir)
  node scripts/generate-deprecations.js --src ./projects/lib --out ./Deprecations.md

NOTES:
    - Component deprecation:
        /**
         * @deprecated since va.b.c - will be removed in vr.t.s
         * Use the YComponent instead.
         */
        @Component({
        ...
        })
        export class X implements OnInit ...

    - Method deprecation:
        /**
         * @deprecated since va.b.c
         * Use getPath() instead
         */
        public async get(...

  - Ignores *.spec.ts files
  - Captures the class, enum, function, method or property name the deprecation applies to
`);
}

// === RECURSIVE FILE WALK ===
function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walkDir(filepath, callback);
    } else if (filepath.endsWith('.ts') && !filepath.endsWith('.spec.ts')) {
      callback(filepath);
    }
  });
}

// === PARSE DEPRECATION COMMENTS + NAME ===
function extractDeprecationsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Grab all JSDoc comment blocks and filter for @deprecated
  const allMatches = [...content.matchAll(/\/\*\*[\s\S]*?\*\//g)];
  const matches = allMatches.filter(m => m[0].includes('@deprecated'));

  const deprecations = [];

  matches.forEach(match => {
    const commentBlock = match[0];
    const restOfFile = content.slice(match.index + commentBlock.length);
    
    // Get first non-empty, non-comment line after comment block
    const lines = restOfFile.split('\n');
    let declarationLine = lines.find(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && !trimmed.startsWith('//') && !trimmed.startsWith('*');
    });

    // If an Angular decorator is present, skip to the actual class line by searching for the first 'export '
    if (['Component', 'Injectable', 'NgModule', 'Directive', 'Pipe'].some(d => declarationLine?.includes(d))) {
      declarationLine = lines.find(line => line.trim().length > 0 && line.includes('export '));
    }

    declarationLine = declarationLine ? declarationLine.trim() : '';
    let type = null;
    let nameMatch = null;

    // --- Detect class ---
    nameMatch = declarationLine.match(/class\s+(\w+)/);
    if (nameMatch) type = 'class';

    // --- Detect enum ---
    if (!nameMatch) {
      nameMatch = declarationLine.match(/enum\s+(\w+)/);
      type = nameMatch ? 'enum' : type;
    }

    // --- Detect interface ---
    if (!nameMatch) {
      nameMatch = declarationLine.match(/interface\s+(\w+)/);
      type = nameMatch ? 'interface' : type;
    }

    // --- Detect exported function ---
    if (!nameMatch) {
      nameMatch = declarationLine.match(/export\s+function\s+(\w+)/);
      type = nameMatch ? 'function' : type;
    }

    // --- Detect method inside class ---
    if (!nameMatch) {
      nameMatch = declarationLine.match(/^(?:public|private|protected|abstract)?\s*(?:async\s+)?(\w+)\s*\(/);
      type = nameMatch ? 'method' : type;
    }

    // --- Detect property inside class ---
    if (!nameMatch) {
      nameMatch = declarationLine.match(/^(?:public|private|protected|abstract)?\s*(\w+)\??\s*:/);
      type = nameMatch ? 'property' : type;
    }

    const name = nameMatch ? nameMatch[1] : 'UNKNOWN';
    if (name === 'UNKNOWN') console.log('debug', filePath, commentBlock);

    // --- Clean up comment text ---
    const clean = commentBlock
      .replace(/^\/\*\*|\*\/$/g, '')
      .split('\n')
      .map(line => line.replace(/^\s*\* ?/, '').trim())
      .filter(line => line.length > 0 && !line.startsWith('@param'))
      .join(' ');

    // --- Extract version and replacement info ---
    const versionMatch = clean.match(/since\s+v?([\d.]+)/i);
    const removalMatch = clean.match(/removed\s+in\s+v?([\d.]+)/i);
    const replacementMatch = clean.match(/Use\s+(.+?)\s+instead\.?/i);

    deprecations.push({
      filePath,
      name,
      type,
      since: versionMatch ? `v${versionMatch[1]}` : null,
      removal: removalMatch ? `v${removalMatch[1]}` : null,
      replacement: replacementMatch ? replacementMatch[1] : null,
    });
  });

  return deprecations;
}

// === MAIN FUNCTION ===
function generateDeprecationsLog(srcDir = SRC_DIR, outputFile = OUTPUT_FILE) {
  const deprecations = [];

  // Walk all files in source directory
  walkDir(srcDir, file => {
    const found = extractDeprecationsFromFile(file);
    if (found.length > 0) deprecations.push(...found);
  });

  if (deprecations.length === 0) {
    console.log('No deprecations found.');
    return;
  }

  // Build Markdown content
  let md = MD_HEADER;
  deprecations.forEach(dep => {
    const nameDisplay = dep.name || dep.filePath;
    md += `- **${nameDisplay}** (${dep.type})  \n`;
    if (dep.filePath) md += `_${dep.filePath}_  \n`;
    if (dep.replacement) md += `Use ${dep.replacement} instead.  \n`;
    if (dep.since && dep.removal) {
      md += `_deprecated in ${dep.since}, will be removed in ${dep.removal}_\n`;
    } else if (dep.since) {
      md += `_deprecated in ${dep.since}, will be removed later_\n`;
    }
    md += `\n`;
  });

  fs.writeFileSync(outputFile, md, 'utf-8');
  console.log(`✅ ${outputFile} generated with ${deprecations.length} entries.`);
}

// === CLI ENTRY POINT ===
const args = process.argv.slice(2);
if (args.includes('--help')) {
  printHelp();
  process.exit(0);
}

let src = SRC_DIR;
let out = OUTPUT_FILE;
args.forEach((arg, i) => {
  if (arg === '--src' && args[i + 1]) src = args[i + 1];
  if (arg === '--out' && args[i + 1]) out = args[i + 1];
});

generateDeprecationsLog(src, out);
