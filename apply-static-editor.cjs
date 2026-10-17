const fs = require('fs');
const path = require('path');
const root = process.cwd();
const editorPath = path.join(root, 'src/tools/gururi-editor-dev/index.html');
const cssPath = path.join(root, 'src/tools/gururi-editor-dev/style.css');
const adminPath = path.join(root, 'src/tools/gururi-paint-dev/admin.php');
const files = [editorPath, cssPath, adminPath];
for(const file of files) if(!fs.existsSync(file)) throw new Error('ファイルがありません: '+file);
let html = fs.readFileSync(editorPath,'utf8');
let css = fs.readFileSync(cssPath,'utf8');
let admin = fs.readFileSync(adminPath,'utf8');
function replaceOne(source, re, replacement, label) {
  const all = [...source.matchAll(new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags+'g'))];
  if(all.length !== 1) throw new Error(`${label}: 一致${all.length}件のため中止しました。最新版コードをご共有ください。`);
  return source.replace(re,replacement);
}
// Static hero: no admin supplied path or hidden-state toggling.
html=replaceOne(html, /<div id="editorHomeHero" class="editor-home__hero"(?: hidden)?>\s*<img id="editorHomeHeroImage"[^>]*>\s*<\/div>/,
`<div id="editorHomeHero" class="editor-home__hero">
<img id="editorHomeHeroImage" src="./images/gururi-editor-hero.png" alt="">
</div>`, 'トップ画像HTML');
html=replaceOne(html, /<h1 class="editor-home__title" id="editorHomeTitle"[^>]*>[\s\S]*?<\/h1>/,
`<h1 class="editor-home__title has-logo" id="editorHomeTitle" aria-label="ぐるりエディタ">
<img id="editorHomeLogoJa" class="editor-home__title-image" src="./images/home-title-ja.png" alt="" aria-hidden="true">
<img id="editorHomeLogoEn" class="editor-home__title-image" src="./images/home-title-en.png" alt="" aria-hidden="true">
</h1>`, 'ロゴHTML');
html=replaceOne(html,
/const title=document\.getElementById\('editorHomeTitle'\);[\s\S]*?document\.getElementById\('editorHomeDescription'\)\.textContent=texts\.description\|\|t\.description;/,
`document.documentElement.lang=lang;
document.getElementById('editorHomeTitle').setAttribute('aria-label',texts.title||t.title);
document.getElementById('editorHomeDescription').textContent=texts.description||t.description;`, 'ロゴJS');
html=replaceOne(html,
/const hero=document\.getElementById\('editorHomeHero'\);[\s\S]*?start\.textContent=texts\.startButton\|\|t\.start;/,
`start.textContent=texts.startButton||t.start;`, 'トップ画像JS');
css += `\n/* 管理画面から切り離したエディタの固定ロゴ */\nhtml[lang="ja"] #editorHomeLogoEn,\nhtml[lang="en"] #editorHomeLogoJa { display: none !important; }\n`;
// Remove controls only; retain content data model and admin save for other fields.
admin=replaceOne(admin, /<div class="admin__language-grid" style="margin-top:24px">[\s\S]*?<\/div>\s*<\/section>/,
`</section>`, '管理画面の画像設定欄');
// Write only after every precondition has passed.
fs.writeFileSync(editorPath,html);
fs.writeFileSync(cssPath,css);
fs.writeFileSync(adminPath,admin);
console.log('完了：エディタHTML/CSSの固定画像化、管理画面の画像・ロゴ設定欄の除去');
