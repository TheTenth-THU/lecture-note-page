import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 目标下载地址和保存路径
const URL = 'https://cdn.jsdelivr.net/npm/mathjax@4/tex-mml-chtml.js';
const TARGET_DIR = path.join(__dirname, 'public', 'scripts');
const TARGET_FILE = path.join(TARGET_DIR, 'mathjax.js');

// 确保 public/scripts/ 目录存在
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// 检查文件是否已存在，已存在则跳过下载加速后续构建
if (fs.existsSync(TARGET_FILE)) {
  console.log('MathJax backup already exists. Skipping download.');
  process.exit(0);
}

console.log('Downloading local MathJax backup...');

https.get(URL, (response) => {
  if (response.statusCode >= 300) {
    console.error(`Failed to download MathJax. Status Code: ${response.statusCode}`);
    response.resume();
    return;
  }

  const file = fs.createWriteStream(TARGET_FILE);
  response.pipe(file);

  file.on('finish', () => {
    file.close();
    console.log('MathJax downloaded successfully to public/scripts/mathjax.js');
  });
}).on('error', (err) => {
  console.error('Error downloading MathJax:', err.message);
});