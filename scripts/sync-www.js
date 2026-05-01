/**
 * 루트의 웹 파일들을 www/ 폴더로 동기화
 * npm run sync / npm run dev / npm run build 시 자동 실행
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WWW  = path.join(ROOT, 'www');

// 복사 제외 폴더/파일
const EXCLUDE = new Set([
  'node_modules', 'android', 'android_legacy', 'www',
  'scripts', '.git', '.claude', 'package.json', 'package-lock.json',
  'capacitor.config.json', 'start-server.bat'
]);

function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const item of fs.readdirSync(src)) {
      copyRecursive(path.join(src, item), path.join(dest, item));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// www 폴더 정리 후 재생성
if (fs.existsSync(WWW)) fs.rmSync(WWW, { recursive: true });
fs.mkdirSync(WWW);

let count = 0;
for (const item of fs.readdirSync(ROOT)) {
  if (EXCLUDE.has(item)) continue;
  copyRecursive(path.join(ROOT, item), path.join(WWW, item));
  count++;
}
console.log(`✅ www/ 동기화 완료 (${count}개 항목)`);
