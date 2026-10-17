'use strict';
const fs = require('fs');
const path = require('path');
const base = process.cwd();
const htmlPath = path.join(base,'src/tools/gururi-editor-dev/index.html');
const cssPath = path.join(base,'src/tools/gururi-editor-dev/style.css');
if (!fs.existsSync(htmlPath)||!fs.existsSync(cssPath)) throw new Error('プロジェクトのルートフォルダで実行してください。');
let html=fs.readFileSync(htmlPath,'utf8');
let css=fs.readFileSync(cssPath,'utf8');
const start='function renderCards(target,items){';
const end='function setLanguage(lang){';
if(html.split(start).length!==2 || html.split(end).length!==2) throw new Error('トップページの描画関数が想定と異なります。変更しません。');
const a=html.indexOf(start),b=html.indexOf(end,a);
if(b<0)throw new Error('描画関数が見つかりません。');
const render=`function renderCards(target,items){
 target.replaceChildren();
 const type=target.id==='editorHomeNoticeList'?'notice':target.id==='editorHomeLinks'?'link':'simple';
 for(const item of items){
  const card=document.createElement(item.url?'a':'div');
  card.className='editor-home__item editor-home__item--'+type+(item.url?'':' is-disabled');
  if(item.url){card.href=item.url;card.target=item.newTab?'_blank':'_self';if(item.newTab)card.rel='noopener noreferrer';}
  if(type==='link'){
   if(item.thumbnail){
    const thumb=document.createElement('span');thumb.className='editor-home__link-thumbnail';
    const img=document.createElement('img');img.src=item.thumbnail;img.alt='';img.loading='lazy';
    img.addEventListener('error',()=>thumb.remove());thumb.append(img);card.append(thumb);
   }
   const text=document.createElement('span');text.className='editor-home__link-text';
   const title=document.createElement('span');title.className='editor-home__link-title';title.textContent=item.title;
   text.append(title);
   const desc=document.createElement('span');desc.className='editor-home__link-description';desc.textContent=item.description||'';text.append(desc);
   card.append(text);
  }else if(type==='notice'){
   card.textContent=item.title;
  }else{
   const title=document.createElement('span');title.className='editor-home__simple-title';title.textContent=item.title;card.append(title);
   if(item.description){const desc=document.createElement('span');desc.className='editor-home__simple-description';desc.textContent=item.description;card.append(desc);}
  }
  target.append(card);
 }
}
`;
html=html.slice(0,a)+render+html.slice(b);
// relatedPages のデータ変換に thumbnail を渡す。既存の設定は保持。
const lm=html.match(/const managedLinks=Array\.isArray\(content\?\.relatedPages\)[\s\S]*?\:\[\];/g);
if(!lm||lm.length!==1)throw new Error('関連ページデータが想定と異なります。変更しません。');
let links=lm[0];
if(!/thumbnail\s*:/.test(links)){
 const key="url:localized.url||item.url||''";
 if(links.split(key).length!==2)throw new Error('サムネイルデータ挿入位置が見つかりません。変更しません。');
 links=links.replace(key,key+",\nthumbnail:item.thumbnail||''");
 html=html.replace(lm[0],links);
}
const marker='/* GURURI_EDITOR_HOME_MATCH_PAINT_V1 */';
const styles=`\n${marker}
/* ペイントのホーム（2026-10-17）と同じ数値・ホバー動作 */
.editor-home__section[hidden]{display:none}
#editorHomeImportantList,#editorHomeProducts,#editorHomeLinks{
 display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;
}
#editorHomeNoticeList{display:flex;flex-direction:column;gap:10px}
#editorHomeNoticeList>.editor-home__item--notice{
 display:block;width:fit-content;max-width:100%;padding:0;border:0;border-radius:0;
 background:transparent;color:#181818;font-size:15px;line-height:1.8;
 text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;
}
#editorHomeNoticeList>.editor-home__item--notice:hover{background:transparent;opacity:.6}
#editorHomeNoticeList>.editor-home__item--notice.is-disabled{text-decoration:none;cursor:default;pointer-events:none;opacity:1}
#editorHomeImportantList>.editor-home__item--simple,
#editorHomeProducts>.editor-home__item--simple{
 display:flex;flex-direction:column;gap:8px;min-width:0;padding:20px;
 border:1px solid #bcbcb7;border-radius:4px;background:transparent;color:#181818;
 text-decoration:none;line-height:normal;opacity:1;
 transition:background .15s ease,color .15s ease;
}
#editorHomeImportantList>.editor-home__item--simple:not(.is-disabled):hover,
#editorHomeProducts>.editor-home__item--simple:not(.is-disabled):hover{
 background:#181818;color:#fff;opacity:1;
}
#editorHomeImportantList>.editor-home__item--simple.is-disabled,
#editorHomeProducts>.editor-home__item--simple.is-disabled{cursor:default;opacity:.45;pointer-events:none}
#editorHomeImportantList .editor-home__simple-title,#editorHomeProducts .editor-home__simple-title{display:block;font-size:16px;font-weight:600;color:inherit}
#editorHomeImportantList .editor-home__simple-description,#editorHomeProducts .editor-home__simple-description{display:block;font-size:13px;line-height:1.6;color:inherit}
#editorHomeLinks>.editor-home__item--link{
 display:flex;flex-direction:column;min-width:0;overflow:hidden;gap:0;
 padding:0;border:1px solid #bcbcb7;border-radius:4px;background:transparent;
 color:#181818;text-decoration:none;line-height:normal;opacity:1;
 transition:background .15s ease,color .15s ease;
}
#editorHomeLinks>.editor-home__item--link:not(.is-disabled):hover{background:#181818;color:#fff;opacity:1}
#editorHomeLinks>.editor-home__item--link.is-disabled{cursor:default;opacity:.45;pointer-events:none}
#editorHomeLinks .editor-home__link-thumbnail{display:block;width:100%;aspect-ratio:16/9;overflow:hidden;border-bottom:1px solid #bcbcb7;background:#ddd}
#editorHomeLinks .editor-home__link-thumbnail img{display:block;width:100%;height:100%;object-fit:cover;transform:none;transition:transform .2s ease}
#editorHomeLinks>.editor-home__item--link:not(.is-disabled):hover .editor-home__link-thumbnail img{transform:scale(1.025)}
#editorHomeLinks .editor-home__link-text{display:flex;flex:1;flex-direction:column;gap:8px;min-height:112px;padding:20px}
#editorHomeLinks .editor-home__link-title{display:block;font-size:16px;font-weight:600;color:inherit}
#editorHomeLinks .editor-home__link-description{display:block;font-size:13px;line-height:1.6;color:inherit}
@media(max-width:700px){
 #editorHomeImportantList,#editorHomeProducts,#editorHomeLinks{grid-template-columns:1fr}
}
`;
if(css.includes(marker)) css=css.slice(0,css.indexOf(marker)).trimEnd();
css+='\n'+styles;
// すべての検査を完了してから書き込む。
fs.writeFileSync(htmlPath,html,'utf8');fs.writeFileSync(cssPath,css,'utf8');
console.log('完了: エディタの4セクションのカード構造・ホバー・2列表示をペイントに統一しました。');
console.log('変更ファイル: src/tools/gururi-editor-dev/index.html, style.css');
