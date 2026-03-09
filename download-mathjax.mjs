import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = 'https://registry.npmmirror.com';
const VERSION = '4.1.1';
const TEMP_DIR_NAME = '.mathjax-temp';

const SCRIPTS_DIR = path.join(__dirname, 'public', 'scripts');
const MATHJAX_TARGET_DIR = path.join(SCRIPTS_DIR, 'mathjax');
const TEMP_DIR = path.join(__dirname, TEMP_DIR_NAME);
const TEMP_NODE_MODULES_DIR = path.join(TEMP_DIR, 'node_modules');
const TEMP_MATHJAX_DIR = path.join(TEMP_NODE_MODULES_DIR, 'mathjax');
const TEMP_TEX_FONT_DIR = path.join(
  TEMP_NODE_MODULES_DIR,
  '@mathjax',
  'mathjax-tex-font',
);
const TEMP_FIRA_FONT_DIR = path.join(
  TEMP_NODE_MODULES_DIR,
  '@mathjax',
  'mathjax-fira-font',
);

if (!fs.existsSync(SCRIPTS_DIR)) {
  fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
}

function resetTempDir() {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }

  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function installPackages() {
  console.log('Installing MathJax packages from npmmirror...');
  execSync(
    [
      'npm install',
      `--prefix ${TEMP_DIR_NAME}`,
      '--no-save',
      '--no-package-lock',
      `--registry=${REGISTRY}`,
      `mathjax@${VERSION}`,
      `@mathjax/mathjax-tex-font@${VERSION}`,
      `@mathjax/mathjax-fira-font@${VERSION}`,
    ].join(' '),
    {
      cwd: __dirname,
      stdio: 'inherit',
    },
  );
}

function copyDirectory(source, target) {
  if (!fs.existsSync(source)) {
    throw new Error(`Missing required directory: ${source}`);
  }

  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, { recursive: true });
}

function deployMathJax() {
  console.log('Deploying MathJax components to public/scripts/mathjax...');

  copyDirectory(TEMP_MATHJAX_DIR, MATHJAX_TARGET_DIR);
  copyDirectory(
    TEMP_TEX_FONT_DIR,
    path.join(MATHJAX_TARGET_DIR, 'mathjax-tex-font'),
  );
  copyDirectory(
    TEMP_FIRA_FONT_DIR,
    path.join(MATHJAX_TARGET_DIR, 'mathjax-fira-font'),
  );

  const requiredFiles = [
    path.join(MATHJAX_TARGET_DIR, 'tex-mml-chtml-nofont.js'),
    path.join(MATHJAX_TARGET_DIR, 'input', 'tex', 'extensions', 'boldsymbol.js'),
    path.join(MATHJAX_TARGET_DIR, 'mathjax-tex-font', 'chtml.js'),
    path.join(MATHJAX_TARGET_DIR, 'mathjax-fira-font', 'chtml.js'),
  ];

  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing required MathJax asset: ${filePath}`);
    }
  }

  console.log('MathJax assets deployed successfully.');
}

try {
  resetTempDir();
  installPackages();
  deployMathJax();
} catch (error) {
  if (error instanceof Error) {
    console.error('Failed to deploy MathJax assets:', error.message);
  } else {
    console.error('Failed to deploy MathJax assets:', error);
  }

  process.exitCode = 1;
} finally {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  }
}