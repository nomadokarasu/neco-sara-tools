const workspace=document.getElementById('workspace');
const workspaceScene=document.getElementById('workspaceScene');
const nodesLayer=document.getElementById('nodesLayer');
const connectionsSvg=document.getElementById('connections');

const workspaceCamera={
x:0,
y:0,
scale:1,
drag:null
};

function updateWorkspaceCamera(){
const camera=workspaceCamera;
workspaceScene.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
workspace.style.backgroundPosition=`${camera.x}px ${camera.y}px`;
workspace.style.backgroundSize=`${20*camera.scale}px ${20*camera.scale}px`;
}

function screenToWorkspace(x,y){
return{
x:(x-workspaceCamera.x)/workspaceCamera.scale,
y:(y-workspaceCamera.y)/workspaceCamera.scale
};
}

function workspaceToScreen(x,y){
return{
x:x*workspaceCamera.scale+workspaceCamera.x,
y:y*workspaceCamera.scale+workspaceCamera.y
};
}

function getWorkspaceTool(e){
if(e.button===1)return 'pan';
if(e.button!==0)return null;
if(state.pressedKeys.has(' '))return 'pan';
if(state.pressedKeys.has('z'))return 'zoom';
return null;
}

workspace.addEventListener('auxclick',e=>{
if(e.button===1)e.preventDefault();
});

workspace.addEventListener('mousedown',e=>{
if(e.button===1)e.preventDefault();
});

function finishWorkspaceCameraDrag(){
workspaceCamera.drag=null;
workspace.classList.remove('is-panning','is-zooming');
}

function startWorkspaceCameraDrag(e){
const mode=getWorkspaceTool(e);
if(!mode)return false;

workspaceCamera.drag={
mode,
pointerId:e.pointerId,
startX:e.clientX,
startY:e.clientY,
x:workspaceCamera.x,
y:workspaceCamera.y,
scale:workspaceCamera.scale
};

workspace.classList.toggle('is-panning',mode==='pan');
workspace.classList.toggle('is-zooming',mode==='zoom');

workspace.setPointerCapture(e.pointerId);
e.preventDefault();
e.stopPropagation();
return true;
}
const contextMenu=document.getElementById('contextMenu');
const materialMenu=document.getElementById('materialMenu');
const triggerMenu=document.getElementById('triggerMenu');
const effectMenu=document.getElementById('effectMenu');
const cameraMenu=document.getElementById('cameraMenu');
const panelMenu=document.getElementById('panelMenu');
const settingsPanel=document.getElementById('settingsPanel');
const worldFileInput=document.getElementById('worldFileInput');
const animationFileInput=document.getElementById('animationFileInput');
const playBtn=document.getElementById('playBtn');
const gamePreview=document.getElementById('gamePreview');
const closePreviewBtn=document.getElementById('closePreviewBtn');
const gameCanvas=document.getElementById('gameCanvas');
const previewMessage=document.getElementById('previewMessage');
const dialogueOverlay=document.getElementById('dialogueOverlay');
const dialogueText=document.getElementById('dialogueText');
const fadeOverlay=document.getElementById('fadeOverlay');
const gameViewport=document.getElementById('gameViewport');
const pcModeBtn=document.getElementById('pcModeBtn');
const mobileModeBtn=document.getElementById('mobileModeBtn');
const ratioWidthInput=document.getElementById('ratioWidthInput');
const ratioHeightInput=document.getElementById('ratioHeightInput');

const state={
nodes:[],
connections:[],
selectedNodeId:null,
selectedNodeIds:new Set(),
selectedConnectionId:null,
menuPoint:{x:0,y:0},
connecting:null,
dragging:null,
worldFileTargetId:null,
animationFileTargetId:null,
previewTimer:null,
previewNodeId:null,
previewWorldNodeId:null,
previewAnimation:null,
panVideo:null,
previewClickTriggerIds:[],
previewDialogueNodeId:null,
previewDialoguePageIndex:0,
dialogueTypeTimer:null,
effectAnimationFrame:null,
cameraAnimationFrame:null,
insertConnection:null,
pressedKeys:new Set(),
displayMode:'pc',
layouts:{
pc:{width:16,height:9},
mobile:{width:9,height:16}
}
};

function uid(prefix){return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`}

function getActiveLayout(){
return state.layouts[state.displayMode];
}

function applyGameAspectRatio(){
const layout=getActiveLayout();
document.documentElement.style.setProperty('--game-aspect',`${layout.width} / ${layout.height}`);
}

function updateLayoutControls(){
const layout=getActiveLayout();

ratioWidthInput.value=layout.width;
ratioHeightInput.value=layout.height;

pcModeBtn.classList.toggle('active',state.displayMode==='pc');
mobileModeBtn.classList.toggle('active',state.displayMode==='mobile');

applyGameAspectRatio();

if(state.selectedNodeId){
renderSettings();
}

if(!gamePreview.classList.contains('hidden')){
resizeGameCanvas();
const worldNode=getNode(state.previewWorldNodeId);
if(worldNode?.type==='world'){
drawPanoramaPreview(gameCanvas,worldNode.world);
}
}
}

function setDisplayMode(mode){
if(mode!=='pc'&&mode!=='mobile')return;
state.displayMode=mode;
updateLayoutControls();
}

function updateActiveLayout(){
const width=Math.max(1,Math.min(100,Number(ratioWidthInput.value)||1));
const height=Math.max(1,Math.min(100,Number(ratioHeightInput.value)||1));

state.layouts[state.displayMode].width=width;
state.layouts[state.displayMode].height=height;

ratioWidthInput.value=width;
ratioHeightInput.value=height;

applyGameAspectRatio();

if(state.selectedNodeId){
renderSettings();
}

if(!gamePreview.classList.contains('hidden')){
resizeGameCanvas();
const worldNode=getNode(state.previewWorldNodeId);
if(worldNode?.type==='world'){
drawPanoramaPreview(gameCanvas,worldNode.world);
}
}
}

pcModeBtn.addEventListener('click',()=>{
setDisplayMode('pc');
});

mobileModeBtn.addEventListener('click',()=>{
setDisplayMode('mobile');
});

ratioWidthInput.addEventListener('change',updateActiveLayout);
ratioHeightInput.addEventListener('change',updateActiveLayout);

window.addEventListener('keydown',e=>{
const target=e.target;
const typing=target instanceof HTMLElement&&(
target.isContentEditable||
['INPUT','TEXTAREA','SELECT'].includes(target.tagName)
);

if(typing)return;

state.pressedKeys.add(e.key.toLowerCase());

if(e.code==='Space'){
e.preventDefault();
}
});

window.addEventListener('keyup',e=>{
state.pressedKeys.delete(e.key.toLowerCase());
});

window.addEventListener('blur',()=>{
state.pressedKeys.clear();
finishWorkspaceCameraDrag();
});

function addNode(type,x,y){
const editBefore=editorSnapshot();
const node={
id:uid(type),
type,
x,
y,
world:{
fileName:'',
fileType:'',
image:null,
yaw:0,
pitch:0,
zoom:1,
raw:null,
views:{
pc:{yaw:0,pitch:0,zoom:1},
mobile:{yaw:0,pitch:0,zoom:1}
}
},
timeSeconds:1,
clickTarget:{yaw:0,pitch:0,width:0.5,height:0.35,initialized:false},
clickView:{yaw:0,pitch:0,zoom:1,initialized:false},
clickInheritRegions:true,
dialoguePages:[],
dialogueEditIndex:0,
dialogueView:{yaw:0,pitch:0,zoom:1,initialized:false},
dialogueThumbnail:null,
dialogueFontSize:24,
dialogueSpeaker:'',
dialoguePanelHeights:{pc:20,mobile:20},
animation:{
fileName:'',
raw:null,
loop:false
},
effectSeconds:1,
panSeconds:3,
panPath:[],
panKeyframes:[],
cameraKeyframes:{pc:[],mobile:[]},
keyframeViews:{pc:[],mobile:[]},
worldDuration:3,
worldInfiniteLoop:false,
panView:{yaw:0,pitch:0,zoom:1,initialized:false},
panUndoStack:[],
panRedoStack:[]
};
state.nodes.push(node);
commitEditorHistory(editBefore);
renderNodes();
selectNode(node.id);
return node;
}

function addStartNode(){
const node={id:'start',type:'start',x:70,y:100};
state.nodes.push(node);
renderNodes();
}

function getNode(id){return state.nodes.find(n=>n.id===id)}

function getWorldInitialView(node){
if(!node?.world)return null;

if(!node.world.views){
node.world.views={
pc:{
yaw:node.world.yaw||0,
pitch:node.world.pitch||0,
zoom:node.world.zoom||1
},
mobile:{
yaw:node.world.yaw||0,
pitch:node.world.pitch||0,
zoom:node.world.zoom||1
}
};
}

return node.world.views[state.displayMode];
}

function applyWorldInitialView(node){
const savedView=getWorldInitialView(node);
if(!savedView)return;

const view=node.inheritCamera&&state.lastCameraView
?state.lastCameraView
:savedView;

node.world.yaw=view.yaw;
node.world.pitch=view.pitch;
node.world.zoom=view.zoom;
}

function findFirstWorldFromNode(nodeId){
let currentId=nodeId;
const visited=new Set();

while(currentId&&!visited.has(currentId)){
visited.add(currentId);

const node=getNode(currentId);
if(!node)return null;

if(node.type==='world'){
return node;
}

const next=state.connections.find(c=>c.from===currentId);
if(!next)return null;

currentId=next.to;
}

return null;
}

function renderNodes(){
nodesLayer.innerHTML='';
for(const node of state.nodes){
const el=document.createElement('div');
el.className=`node ${node.type==='start'?'start-node':''} ${(state.selectedNodeId===node.id||state.selectedNodeIds.has(node.id))?'selected':''}`;
el.dataset.id=node.id;
el.style.left=`${node.x}px`;
el.style.top=`${node.y}px`;
const title=
node.type==='start'?'START':
node.type==='media'||node.type==='world'||node.type==='animation'?'メディア':
node.type==='time'?'時間':
node.type==='click'?'クリック':
node.type==='dialogue'?'ダイアローグ':
node.type==='fadeIn'?'フェードイン':
node.type==='fadeOut'?'フェードアウト':
node.type==='pan'?'パン':
node.type==='keyframe'?'キーフレーム':
'不明';

const body=
node.type==='media'?'素材を選択してください':
node.type==='world'?(node.world.fileName||'素材未設定'):
node.type==='animation'?(node.animation.fileName||'素材未設定'):
node.type==='time'?`${node.timeSeconds} 秒`:
node.type==='click'?'範囲クリック':
node.type==='dialogue'?`${node.dialoguePages.length} ページ`:
node.type==='fadeIn'||node.type==='fadeOut'?`${node.effectSeconds} 秒`:
node.type==='pan'?`${node.panSeconds} 秒`:
node.type==='keyframe'?'カメラワーク':
'開始';
el.innerHTML=`<div class="port input" data-port="input"></div><div class="node-header">${title}</div><div class="node-body" title="ダブルクリックで文章を編集"></div><div class="port output" data-port="output"></div>`;

const bodyEl=el.querySelector('.node-body');
bodyEl.textContent=node.customBody===undefined?body:node.customBody;

attachNodeEvents(el,node);
nodesLayer.appendChild(el);
}
requestAnimationFrame(renderConnections);
}

function attachNodeBodyEditor(el,node){
const body=el.querySelector('.node-body');
if(!body)return;

body.addEventListener('dblclick',e=>{
e.preventDefault();
e.stopPropagation();

if(body.querySelector('textarea'))return;

const originalText=body.textContent;
const editor=document.createElement('textarea');

editor.className='node-body-editor';
editor.maxLength=160;
editor.value=originalText;
editor.rows=1;
editor.placeholder='文章を入力';

body.textContent='';
body.appendChild(editor);

const resize=()=>{
editor.style.height='auto';
editor.style.height=`${editor.scrollHeight}px`;
requestAnimationFrame(renderConnections);
};

let finished=false;

const finish=save=>{
if(finished)return;
finished=true;

if(save){
const value=editor.value.trim();
node.customBody=value||undefined;
}

body.textContent=save
?(node.customBody===undefined?originalText:node.customBody)
:originalText;

requestAnimationFrame(renderConnections);
};

editor.addEventListener('pointerdown',event=>{
event.stopPropagation();
});

editor.addEventListener('click',event=>{
event.stopPropagation();
});

editor.addEventListener('dblclick',event=>{
event.stopPropagation();
});

editor.addEventListener('input',resize);

editor.addEventListener('keydown',event=>{
event.stopPropagation();

if(event.key==='Escape'){
event.preventDefault();
finish(false);
return;
}

if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)){
event.preventDefault();
finish(true);
}
});

editor.addEventListener('blur',()=>{
finish(true);
});

editor.focus();
editor.select();
resize();
});
}

function attachNodeEvents(el,node){
el.addEventListener('pointerdown',e=>{
if(getWorkspaceTool(e))return;
if(e.button!==0)return;

const port=e.target.closest('.port');
if(port){
if(port.dataset.port==='output')startConnection(e,node.id,el);
return;
}

state.selectedNodeId=node.id;
state.selectedNodeIds.clear();
state.selectedConnectionId=null;

nodesLayer.querySelectorAll('.node').forEach(nodeEl=>{
nodeEl.classList.toggle('selected',nodeEl.dataset.id===node.id);
});

state.dragging={
id:node.id,
pointerId:e.pointerId,
startX:e.clientX,
startY:e.clientY,
originX:node.x,
originY:node.y
};

el.setPointerCapture(e.pointerId);
e.preventDefault();

renderConnections();
renderSettings();
});

el.addEventListener('pointermove',e=>{
if(!state.dragging||state.dragging.id!==node.id)return;

node.x=state.dragging.originX+(e.clientX-state.dragging.startX)/workspaceCamera.scale;
node.y=state.dragging.originY+(e.clientY-state.dragging.startY)/workspaceCamera.scale;

el.style.left=`${node.x}px`;
el.style.top=`${node.y}px`;

renderConnections();
});

el.addEventListener('pointerup',e=>{
if(!state.dragging||state.dragging.id!==node.id)return;

if(el.hasPointerCapture(e.pointerId)){
el.releasePointerCapture(e.pointerId);
}

state.dragging=null;
});

el.addEventListener('pointercancel',e=>{
if(!state.dragging||state.dragging.id!==node.id)return;

if(el.hasPointerCapture(e.pointerId)){
el.releasePointerCapture(e.pointerId);
}

state.dragging=null;
});
}

function selectNode(id){
state.selectedNodeId=id;
state.selectedNodeIds.clear();
state.selectedConnectionId=null;
renderNodes();
renderSettings();
}

function renderSettings(){
if(cleanupAnimationSettingsPreview){
cleanupAnimationSettingsPreview();
cleanupAnimationSettingsPreview=null;
}

const node=getNode(state.selectedNodeId);

if(node){
queueMicrotask(()=>{
if(state.selectedNodeId!==node.id)return;
if(settingsPanel.querySelector('#nodeMemoInput'))return;

const group=document.createElement('div');
group.className='setting-group';

const label=document.createElement('div');
label.className='setting-label';
label.textContent='メモ';

const textarea=document.createElement('textarea');
textarea.id='nodeMemoInput';
textarea.className='dialogue-textarea';
textarea.maxLength=160;
textarea.rows=3;
textarea.placeholder='ノードに表示する文章を入力';
textarea.value=node.customBody||'';

const counter=document.createElement('div');
counter.className='dialogue-count';
counter.textContent=`${textarea.value.length}/160`;

textarea.addEventListener('input',()=>{
node.customBody=textarea.value.length>0?textarea.value:undefined;
counter.textContent=`${textarea.value.length}/160`;

const nodeEl=Array.from(nodesLayer.querySelectorAll('.node')).find(el=>el.dataset.id===node.id);
const bodyEl=nodeEl?.querySelector('.node-body');

if(bodyEl){
if(node.customBody!==undefined){
bodyEl.textContent=node.customBody;
}else{
renderNodes();
}
}

requestAnimationFrame(renderConnections);
});

group.appendChild(label);
group.appendChild(textarea);
group.appendChild(counter);
settingsPanel.appendChild(group);
});
}

if(!node){settingsPanel.innerHTML='<div class="settings-empty">ノードを選択してください</div>';return}
if(node.type==='start'){
settingsPanel.innerHTML='<div class="settings-title">START</div><div class="settings-empty">ゲーム開始地点です。</div>';
return;
}
if(node.type==='time'){
settingsPanel.innerHTML=`<div class="settings-title">時間</div><div class="setting-group"><div class="setting-label">待機時間（秒）</div><input id="timeSecondsInput" class="number-input" type="number" min="0" step="0.1" value="${node.timeSeconds}"></div>`;
document.getElementById('timeSecondsInput').addEventListener('input',e=>{
node.timeSeconds=Math.max(0,Number(e.target.value)||0);
renderNodes();
});
return;
}

if(node.type==='fadeIn'||node.type==='fadeOut'){
const title=node.type==='fadeIn'?'フェードイン':'フェードアウト';

settingsPanel.innerHTML=`<div class="settings-title">${title}</div><div class="setting-group"><div class="setting-label">時間（秒）</div><input id="effectSecondsInput" class="number-input" type="number" min="0" step="0.1" value="${node.effectSeconds}"></div>`;

document.getElementById('effectSecondsInput').addEventListener('input',e=>{
node.effectSeconds=Math.max(0,Number(e.target.value)||0);
renderNodes();
});

return;
}

if(node.type==='pan'){
const previousWorld=findPreviousClickMediaNode(node.id);

if(!previousWorld){
settingsPanel.innerHTML='<div class="settings-title">パン</div><div class="settings-empty">このノードより前にビューまたはアニメーションノードを接続してください。</div>';
return;
}

const isVideoPan=previousWorld.type==='animation';
const duration=Math.max(0.1,Number(node.panSeconds)||3);

const timeControls=isVideoPan?`
<div class="setting-group">
<div class="setting-label">再生位置</div>
<input id="panTimeRange" type="range" min="0" max="${duration}" step="0.01" value="0" style="width:100%">
<div id="panTimeLabel" class="settings-empty">0.00 / ${duration.toFixed(2)} 秒</div>
</div>
<div class="setting-group">
<button id="panAddKeyframeBtn" class="add-world-btn" type="button" title="現在の位置にキーフレームを登録">＋</button>
<div id="panKeyframeList" class="pan-keyframe-list"></div>
</div>`:'';

settingsPanel.innerHTML=`
<div class="settings-title">パン</div>
<div class="setting-group">
<div class="setting-label">${isVideoPan?'カメラ位置':'カメラ経路'}</div>
<div class="pan-preview-wrap">
<canvas id="panPreviewCanvas" class="world-preview" width="320" height="320"></canvas>
<canvas id="panPathCanvas" class="pan-path-canvas" width="320" height="320"></canvas>
</div>
<div class="pan-help">${isVideoPan?'ドラッグ：カメラ回転 / ホイール：ズーム / ＋：現在の時刻とカメラ位置を登録':'ドラッグ：経路描画 / 中クリック＋ドラッグ：カメラ回転 / Z＋ドラッグ：ズーム / Ctrl＋Z：Undo / Ctrl＋Y：Redo'}</div>
</div>
${timeControls}
<div class="setting-group">
<div class="setting-label">移動時間（秒）</div>
<input id="panSecondsInput" class="number-input" type="number" min="0.1" step="0.1" value="${duration}">
</div>`;

const secondsInput=document.getElementById('panSecondsInput');

secondsInput.addEventListener('change',()=>{
node.panSeconds=Math.max(0.1,Number(secondsInput.value)||3);
renderNodes();
renderSettings();
});

if(isVideoPan){
setupTimedPanPreview(node,previousWorld);
}else{
setupPanPreview(node,previousWorld);
}

return;
}

if(node.type==='click'){
const sourceNode=findPreviousClickMediaNode(node.id);

if(!sourceNode){
settingsPanel.innerHTML='<div class="settings-title">クリック</div><div class="settings-empty">このノードより前にビューまたはアニメーションノードを接続してください。</div>';
return;
}

const isAnimation=sourceNode.type==='animation';
const media=isAnimation?getClickAnimationMedia(sourceNode):null;

if(isAnimation&&!media){
settingsPanel.innerHTML='<div class="settings-title">クリック</div><div class="settings-empty">アニメーションノードにMP4を設定してください。</div>';
return;
}

if(isAnimation){
if(!node.clickAnimationMode||node.clickSourceMediaId!==media.id){
node.clickAnimationMode=true;
node.clickSourceMediaId=media.id;
node.clickFrameIndex=0;
node.clickFrameFps=media.fps||8;
node.clickFrameRegions={};
node.clickPolygon=[];
node.clickRegions=[];
node.clickUndoStack=[];
node.clickRedoStack=[];
}

if(Number.isFinite(media.fps)&&media.fps>0){
node.clickFrameFps=media.fps;
}else if(!Number.isFinite(node.clickFrameFps)||node.clickFrameFps<=0){
node.clickFrameFps=8;
}
}else{
node.clickAnimationMode=false;
}

const frameCount=isAnimation
?Math.max(1,Math.ceil(media.duration*node.clickFrameFps))
:1;

node.clickFrameIndex=clamp(
node.clickFrameIndex||0,
0,
frameCount-1
);

const frameControls=isAnimation
?`<div class="setting-group"><div class="setting-label">コマ送り</div><div class="click-frame-controls"><button id="clickPreviousFrameBtn" type="button">◀ 前</button><span id="clickFrameLabel">${node.clickFrameIndex+1} / ${frameCount}</span><button id="clickNextFrameBtn" type="button">次 ▶</button></div><input id="clickFrameRange" type="range" min="0" max="${frameCount-1}" step="1" value="${node.clickFrameIndex}" style="width:100%"><div id="clickFrameTimeLabel" class="settings-empty"></div></div>`
:'';

const inheritControl=isAnimation
?`<label class="click-inherit-control"><input id="clickInheritRegionsInput" type="checkbox" ${node.clickInheritRegions!==false?'checked':''}> 選択範囲を継承</label>`
:'';

settingsPanel.innerHTML=`<div class="settings-title">クリック</div>${frameControls}<div class="setting-group"><div class="setting-label">クリック範囲を指定</div><div class="click-inherit-row">${inheritControl}</div><div class="click-preview-wrap"><canvas id="clickPreviewCanvas" class="world-preview" width="320" height="320"></canvas><canvas id="clickLassoCanvas" class="click-lasso-canvas" width="320" height="320"></canvas><div class="click-lasso-mode-buttons"><button id="clickLassoAddBtn" class="click-lasso-mode active" type="button" title="選択範囲に追加" aria-pressed="true">＋</button><button id="clickLassoSubtractBtn" class="click-lasso-mode" type="button" title="選択範囲から削除" aria-pressed="false">－</button></div></div><div class="pan-help">左ドラッグ：投げ縄 / Space＋ドラッグ・中ドラッグ：カメラ回転 / Z＋ドラッグ・ホイール：ズーム / Ctrl＋Z：戻す / Ctrl＋Y：やり直す</div></div><div class="setting-group"><button id="clearClickLassoBtn" class="add-world-btn" type="button">範囲を消去</button></div>`;

setupClickTriggerPreview(node,sourceNode);

return;
}
if(node.type==='media'){
settingsPanel.innerHTML=`<div class="settings-title">メディア</div><div class="setting-group"><div class="setting-label">メディアを選択（PNG / MP4）</div><select id="unifiedMediaSelect" class="number-input">${getMediaOptions('media',null)}</select></div>`;

document.getElementById('unifiedMediaSelect').addEventListener('change',e=>{
assignMediaToNode(node,e.target.value);
});

return;
}

if(node.type==='animation'||node.type==='world'){
renderMediaNodeSettings(node);
return;
}

if(node.type==='keyframe'){
renderKeyframeNodeSettings(node);
return;
}
if(node.type==='dialogue'){
const previousMedia=findPreviousClickMediaNode(node.id);

ensureDialogueView(node,previousMedia);

const editors=node.dialoguePages.map((text,index)=>`<div class="dialogue-editor"><div class="setting-label">ダイアローグ ${index+1}</div><textarea class="dialogue-textarea" data-dialogue-index="${index}" maxlength="60">${escapeHtml(text)}</textarea><div class="dialogue-count" data-dialogue-count="${index}">${text.length}/60</div></div>`).join('');
const hasDialogue=node.dialoguePages.length>0;
const fontSize=Number(node.dialogueFontSize)||24;
const panelHeight=getDialoguePanelHeight(node);

settingsPanel.innerHTML=`
<div class="settings-title">ダイアローグ</div>
<div class="setting-group">
<div class="setting-label">発話者</div>
<input id="dialogueSpeakerInput" class="number-input" type="text" maxlength="40" placeholder="発話者の名前" value="${escapeHtml(node.dialogueSpeaker||'').replace(/"/g,'&quot;')}">
</div>
<div class="setting-group">
<div class="setting-label">サムネイル</div>
<div class="dialogue-thumbnail-controls">
<select id="dialogueThumbnailSelect" class="number-input">${getDialogueThumbnailOptions(node.dialogueThumbnailMediaId)}</select>
<img id="dialogueThumbnailSettingsImage" class="dialogue-thumbnail-settings-image hidden" alt="サムネイル">
</div>
</div>
<div class="setting-group">
<div class="setting-label">フォントサイズ（px）</div>
<input id="dialogueFontSizeInput" class="number-input" type="number" min="10" max="36" step="1" value="${fontSize}">
</div>
<div class="setting-group">
<div class="setting-label">パネルの高さ（${state.displayMode==='pc'?'PC':'スマホ'}・画面高さの％）</div>
<input id="dialoguePanelHeightInput" class="number-input" type="number" min="10" max="60" step="1" value="${panelHeight}">
</div>
<div class="setting-group">
<div class="dialogue-preview-wrap">
<canvas id="dialoguePreviewCanvas" class="world-preview" width="320" height="320"></canvas>
<div id="dialoguePreviewBox" class="dialogue-preview-box ${hasDialogue?'':'hidden'}">
<div id="dialoguePreviewSpeaker" class="dialogue-speaker hidden"></div>
<div class="dialogue-panel-content">
<img id="dialoguePreviewThumbnail" class="dialogue-panel-thumbnail hidden" alt="">
<div id="dialoguePreviewText" class="dialogue-preview-text"></div>
</div>
<div class="dialogue-arrow">▼</div>
</div>
</div>
</div>
<div class="setting-group">
<button id="addDialogueBtn" class="add-world-btn" type="button">＋</button>
</div>
<div id="dialogueEditors">${editors}</div>`;

setupDialogueTriggerPreview(node,previousMedia);
setupDialogueAppearance(node);
return;
}
renderMediaNodeSettings(node);

}

function getKeyframeNodeFrames(node){
if(!node.keyframeViews)node.keyframeViews={pc:[],mobile:[]};
if(!Array.isArray(node.keyframeViews[state.displayMode]))node.keyframeViews[state.displayMode]=[];
return node.keyframeViews[state.displayMode];
}
function getIndependentCameraAt(node,seconds,base){
const frames=[...getKeyframeNodeFrames(node)].filter(f=>Number.isFinite(f.time)).sort((a,b)=>a.time-b.time);
if(!frames.length)return {...base};
if(seconds<=frames[0].time)return {...frames[0]};
if(seconds>=frames[frames.length-1].time)return {...frames[frames.length-1]};
for(let i=1;i<frames.length;i++){
const a=frames[i-1],b=frames[i];
if(seconds>b.time)continue;
const t=clamp((seconds-a.time)/(b.time-a.time),0,1);
return {yaw:a.yaw+angleDiff(b.yaw,a.yaw)*t,pitch:a.pitch+(b.pitch-a.pitch)*t,zoom:a.zoom+(b.zoom-a.zoom)*t};
}
return {...base};
}
function findSceneKeyframeNode(sourceNode){
if(!sourceNode)return null;
// A keyframe node on a parallel branch of a shared parent controls this media.
for(const edge of state.connections){
if(edge.to!==sourceNode.id)continue;
const parent=edge.from;
const visited=new Set();const queue=[parent];
while(queue.length){
const current=queue.shift();
if(visited.has(current))continue;visited.add(current);
for(const branch of state.connections.filter(c=>c.from===current)){
const node=getNode(branch.to);
if(node?.type==='keyframe')return node;
if(node&&node.type==='time')queue.push(node.id);
}
for(const prev of state.connections.filter(c=>c.to===current))queue.push(prev.from);
}
}
return null;
}
function renderKeyframeNodeSettings(node){
const sourceNode=findPreviousClickMediaNode(node.id);
if(!sourceNode){
settingsPanel.innerHTML='<div class="settings-title">キーフレーム</div><div class="settings-empty">参照メディアがありません。メディアと同じ分岐元に接続してください。</div>';
return;
}
const videoMode=sourceNode.type==='animation';
const media=mediaLibrary.find(m=>m.id===(videoMode?sourceNode.animation.mediaId:sourceNode.world.mediaId));
const duration=getMediaPlaybackDuration(sourceNode,media);
const fps=videoMode?Number(media?.fps):8;
const validFps=Number.isFinite(fps)&&fps>0;
const frames=getKeyframeNodeFrames(node);
const source=videoMode?media?.video:sourceNode.world.image;
settingsPanel.innerHTML=`
<div class="settings-title">キーフレーム</div>
<div class="setting-group"><div class="setting-label">参照メディア</div><div class="file-name">${escapeHtml(videoMode?sourceNode.animation.fileName:sourceNode.world.fileName)}</div></div>
<div class="setting-group"><canvas id="keyframeCameraCanvas" class="world-preview" width="320" height="320"></canvas><div class="pan-help">ドラッグ：カメラ回転 / ホイール：ズーム</div></div>
<div class="setting-group"><div class="media-camera-time-header"><div class="setting-label">再生位置</div><div class="media-camera-step-buttons"><button id="keyframePrevious" type="button">◀</button><button id="keyframeNext" type="button">▶</button></div></div><input id="keyframeTime" type="range" min="0" max="${duration}" step="0.001" value="0" style="width:100%"><div id="keyframeTimeLabel" class="settings-empty"></div></div>
<div class="setting-group"><button id="keyframeAdd" class="add-world-btn" type="button">＋ キーフレームを登録</button><div id="keyframeList" class="pan-keyframe-list"></div></div>
<div id="keyframeAngleFields" class="setting-group"></div>`;
const canvas=document.getElementById('keyframeCameraCanvas');
const range=document.getElementById('keyframeTime');
const label=document.getElementById('keyframeTimeLabel');
const list=document.getElementById('keyframeList');
const prev=document.getElementById('keyframePrevious');
const next=document.getElementById('keyframeNext');
const controller=new AbortController();const signal=controller.signal;
cleanupAnimationSettingsPreview=()=>controller.abort();
if(source?.pause)source.pause();
if(!validFps){prev.disabled=true;next.disabled=true;}
let second=0,drag=null;
const view={...getMediaCameraBase(sourceNode)};
let syncInputs=()=>{};
const draw=()=>{
if(!canvas.isConnected)return;
drawPanoramaPreview(canvas,{image:source?.readyState!==undefined&&source.readyState<2?null:source,yaw:view.yaw,pitch:view.pitch,zoom:view.zoom});
syncInputs();
};
syncInputs=setupCameraNumberInputs(canvas,view,draw);
const fields=canvas.nextElementSibling;
const target=document.getElementById('keyframeAngleFields');
if(fields&&target){target.appendChild(fields);const button=fields.querySelector('.camera-copy-view');if(button)fields.appendChild(button);}
const seek=time=>{
second=clamp(Number(time)||0,0,duration);

range.value=String(second);
label.textContent=`${second.toFixed(3)} / ${duration.toFixed(3)} 秒`;

const loopTime=getMediaCameraLoopTime(sourceNode,media,second);
const camera=getIndependentCameraAt(node,loopTime,getMediaCameraBase(sourceNode));

Object.assign(view,camera);

// 画角と数値を先に更新する
draw();

if(videoMode&&media?.duration&&source){
const videoTime=getMediaCameraVideoTime(sourceNode,media,second);

if(Math.abs(source.currentTime-videoTime)>0.001){
source.currentTime=videoTime;
}
}
};
const updateList=()=>{
list.innerHTML='';
for(const frame of [...frames].sort((a,b)=>a.time-b.time)){
const row=document.createElement('div');row.className='pan-keyframe-row';
const select=document.createElement('button');select.type='button';select.textContent=`◆ ${frame.time.toFixed(3)} 秒`;
select.addEventListener('click',()=>seek(frame.time),{signal});
const remove=document.createElement('button');remove.type='button';remove.textContent='削除';
remove.addEventListener('click',()=>{
const before=typeof editorSnapshot==='function'?editorSnapshot():null;
const index=frames.indexOf(frame);if(index>=0)frames.splice(index,1);
if(before)commitEditorHistory(before);
updateList();seek(second);
},{signal});
row.append(select,remove);list.appendChild(row);
}
};
range.addEventListener('input',()=>seek(range.value),{signal});
const step=direction=>{if(!validFps)return;seek((Math.round(second*fps)+direction)/fps);};
prev.addEventListener('click',()=>step(-1),{signal});next.addEventListener('click',()=>step(1),{signal});
if(videoMode&&source?.addEventListener){source.addEventListener('seeked',draw,{signal});source.addEventListener('loadeddata',draw,{signal});}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch};canvas.setPointerCapture(e.pointerId);},{signal});
canvas.addEventListener('pointermove',e=>{if(!drag)return;view.yaw=drag.yaw-(e.clientX-drag.x)*0.008;view.pitch=clamp(drag.pitch+(e.clientY-drag.y)*0.008,-Math.PI/2+0.02,Math.PI/2-0.02);draw();},{signal});
canvas.addEventListener('pointerup',()=>drag=null,{signal});canvas.addEventListener('pointercancel',()=>drag=null,{signal});
canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=clamp(view.zoom+(e.deltaY>0?-0.1:0.1),0.6,2.2);draw();},{signal,passive:false});
document.getElementById('keyframeAdd').addEventListener('click',()=>{
const before=typeof editorSnapshot==='function'?editorSnapshot():null;
const time=Number(second.toFixed(3));const frame={time,yaw:view.yaw,pitch:view.pitch,zoom:view.zoom};
const index=frames.findIndex(f=>Math.abs(f.time-time)<0.0005);
if(index>=0)frames[index]=frame;else frames.push(frame);
if(before)commitEditorHistory(before);
updateList();
},{signal});
updateList();seek(0);
}
function getMediaCameraFrames(node){
if(!node.cameraKeyframes)node.cameraKeyframes={pc:[],mobile:[]};
if(!Array.isArray(node.cameraKeyframes[state.displayMode]))node.cameraKeyframes[state.displayMode]=[];
return node.cameraKeyframes[state.displayMode];
}

function getMediaCameraBase(node){
if(node.type==='world')return getWorldInitialView(node)||{yaw:0,pitch:0,zoom:1};
if(!node.animation.views)node.animation.views={pc:{yaw:0,pitch:0,zoom:1},mobile:{yaw:0,pitch:0,zoom:1}};
return node.animation.views[state.displayMode]||node.animation.views.pc;
}

function getMediaCameraAt(node,seconds){
const base=getMediaCameraBase(node);
if(node.type==='world'||node.type==='animation')return {...base};
const frames=[...getMediaCameraFrames(node)].filter(f=>Number.isFinite(f.time)).sort((x,y)=>x.time-y.time);
if(!frames.length)return {...base};
if(seconds<=frames[0].time)return {...frames[0]};
if(seconds>=frames[frames.length-1].time)return {...frames[frames.length-1]};
for(let i=1;i<frames.length;i++){
const before=frames[i-1],after=frames[i];
if(seconds>after.time)continue;
const fraction=clamp((seconds-before.time)/(after.time-before.time),0,1);
return {yaw:before.yaw+angleDiff(after.yaw,before.yaw)*fraction,pitch:before.pitch+(after.pitch-before.pitch)*fraction,zoom:before.zoom+(after.zoom-before.zoom)*fraction};
}
return {...base};
}

function getMediaPlaybackDuration(node,media){
if(node.type==='world')return Math.max(0.1,Number(node.worldDuration)||3);
const mediaDuration=media?.duration||0;
return Math.max(0.1,Number(node.animation.playDuration)||(mediaDuration*(Number(node.animation.loopCount)||1))||3);
}

function getMediaCameraLoopTime(node,media,elapsed){
if(node.type!=='animation')return elapsed;

const duration=Number(media?.duration)||0;
if(duration<=0)return elapsed;

const loopCount=Number(node.animation.loopCount)||1;
const isLooping=node.animation.infiniteLoop||loopCount>1;

if(!isLooping)return elapsed;

return ((elapsed%duration)+duration)%duration;
}

function getMediaCameraVideoTime(node,media,elapsed){
const duration=media?.duration||0;
if(duration<=0)return 0;
const start=clamp(Number(node.animation.startTime)||0,0,Math.max(0,duration-0.001));
return Math.min(Math.max(0,duration-0.001),(start+elapsed)%duration);
}

function renderMediaNodeSettings(node){
const videoMode=node.type==='animation';
const media=mediaLibrary.find(m=>m.id===(videoMode?node.animation.mediaId:node.world.mediaId));
const duration=getMediaPlaybackDuration(node,media);

const collapsible=(id,label,contents)=>`<details data-media-section="${id}"><summary>${label}</summary><div class="media-section-body">${contents}</div></details>`;
const mediaSelect=`<div class="setting-group"><div class="setting-label">素材</div><select id="mediaNodeSelect" class="number-input">${getMediaOptions('media',media?.id)}</select></div>`;
const durationSettings='';
const pngSettings=videoMode?'':`
<div class="setting-group">
<div class="setting-label">表示時間（秒）</div>
<input id="mediaWorldDuration" class="number-input" type="number" min="0.1" step="0.1" value="${duration}">
</div>
<div class="setting-group">
<label>
<input id="mediaWorldInfinite" type="checkbox" ${node.worldInfiniteLoop?'checked':''}>
トリガーが発火するまで表示
</label>
</div>`;

const previewControls=`
<div class="setting-group">
<canvas id="mediaCameraCanvas" class="world-preview" width="320" height="320"></canvas>
<div class="pan-help">ドラッグ：カメラ回転 / ホイール：ズーム</div>
</div>
<div class="setting-group">
<div class="media-camera-time-header">
<div class="setting-label">再生位置</div>
<div class="media-camera-step-buttons">
<button id="mediaCameraPreviousFrame" type="button" title="1コマ戻る">◀</button>
<button id="mediaCameraNextFrame" type="button" title="1コマ進む">▶</button>
</div>
</div>
<input id="mediaCameraTime" type="range" min="0" max="${duration}" step="0.01" value="0" style="width:100%">
<div id="mediaCameraTimeLabel" class="settings-empty">0.00 / ${duration.toFixed(2)} 秒</div>
</div>`;

const inheritControl=`<div class="setting-group"><label class="media-camera-inherit"><input id="inheritCameraInput" type="checkbox" ${node.inheritCamera?'checked':''}> 画角を継承</label></div>`;
const angleInfo=`<div class="setting-group"><div class="setting-label">画角情報</div><div id="mediaCameraAngleFields"></div></div>`;
const loops=videoMode?`
<div class="setting-group">
<div class="setting-label">ループ回数</div>
<input id="mediaLoopCount" class="number-input" type="number" min="0.01" step="0.01" value="${Number(node.animation.loopCount)||1}">
</div>
<div class="setting-group">
<label>
<input id="mediaInfiniteLoop" type="checkbox" ${node.animation.infiniteLoop?'checked':''}>
無限ループ（トリガー発火まで再生）
</label>
</div>`:'';
settingsPanel.innerHTML=`
<div class="settings-title">メディア（${videoMode?'360度MP4':'360度PNG'}）</div>
${mediaSelect}
${pngSettings}
${inheritControl}
${previewControls}
<hr class="media-settings-divider">
${videoMode?loops:''}
<hr class="media-settings-divider">
${angleInfo}`;

document.getElementById('mediaNodeSelect').addEventListener('change',e=>assignMediaToNode(node,e.target.value));

if(!videoMode){
document.getElementById('mediaWorldDuration').addEventListener('change',e=>{
node.worldDuration=Math.max(0.1,Number(e.target.value)||3);
renderSettings();
});
}
if(videoMode&&media?.duration>0){
node.animation.playDuration=media.duration*(Number(node.animation.loopCount)||1);
}
if(videoMode){
node.animation.startTime=0;
document.getElementById('mediaInfiniteLoop').addEventListener('change',e=>node.animation.infiniteLoop=e.target.checked);
document.getElementById('mediaLoopCount').addEventListener('change',e=>{node.animation.loopCount=Math.max(.01,Number(e.target.value)||1);node.animation.playDuration=(media?.duration||0)*node.animation.loopCount;renderSettings();});
}else{
document.getElementById('mediaWorldInfinite').addEventListener('change',e=>node.worldInfiniteLoop=e.target.checked);
}


setupMediaCameraInheritance(node);
setupSharedMediaCamera(node,media,duration);
}

function setupSharedMediaCamera(node,media,duration){
const canvas=document.getElementById('mediaCameraCanvas');
const range=document.getElementById('mediaCameraTime');
const label=document.getElementById('mediaCameraTimeLabel');
const source=node.type==='world'?node.world.image:media?.video;
if(source?.pause)source.pause();
const controller=new AbortController();const signal=controller.signal;
cleanupAnimationSettingsPreview=()=>controller.abort();
let second=0,drag=null;
const view={...getMediaCameraBase(node)};
let syncInputs=()=>{};
const draw=()=>{
if(!canvas.isConnected)return;
drawPanoramaPreview(canvas,{image:source?.readyState!==undefined&&source.readyState<2?null:source,yaw:view.yaw,pitch:view.pitch,zoom:view.zoom});
syncInputs();
};
syncInputs=setupCameraNumberInputs(canvas,view,draw);
const fields=canvas.nextElementSibling;
const target=document.getElementById('mediaCameraAngleFields');
if(fields&&target){target.appendChild(fields);const button=fields.querySelector('.camera-copy-view');if(button)fields.appendChild(button);}
const seek=time=>{
second=clamp(Number(time)||0,0,duration);
range.value=String(second);label.textContent=`${second.toFixed(3)} / ${duration.toFixed(3)} 秒`;
Object.assign(view,getMediaCameraBase(node));
if(node.type==='animation'&&media?.duration&&source){
const videoTime=getMediaCameraVideoTime(node,media,second);
if(Math.abs(source.currentTime-videoTime)>0.001)source.currentTime=videoTime;
else draw();
}else draw();
};
range.addEventListener('input',()=>seek(range.value),{signal});
const previous=document.getElementById('mediaCameraPreviousFrame');
const next=document.getElementById('mediaCameraNextFrame');
const videoMode=node.type==='animation';
const fps=videoMode?Number(media?.fps):8;
const validFps=Number.isFinite(fps)&&fps>0;
if(!validFps){previous.disabled=true;next.disabled=true;}
const step=direction=>{if(!validFps)return;seek((Math.round(second*fps)+direction)/fps);};
previous.addEventListener('click',()=>step(-1),{signal});next.addEventListener('click',()=>step(1),{signal});
if(videoMode&&source?.addEventListener){source.addEventListener('seeked',draw,{signal});source.addEventListener('loadeddata',draw,{signal});}
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch};canvas.setPointerCapture(e.pointerId);},{signal});
canvas.addEventListener('pointermove',e=>{if(!drag)return;view.yaw=drag.yaw-(e.clientX-drag.x)*0.008;view.pitch=clamp(drag.pitch+(e.clientY-drag.y)*0.008,-Math.PI/2+0.02,Math.PI/2-0.02);draw();},{signal});
canvas.addEventListener('pointerup',()=>drag=null,{signal});canvas.addEventListener('pointercancel',()=>drag=null,{signal});
canvas.addEventListener('wheel',e=>{e.preventDefault();view.zoom=clamp(view.zoom+(e.deltaY>0?-0.1:0.1),0.6,2.2);draw();},{signal,passive:false});
// The initial camera view is stored on the media node, separately from keyframe animation.
const syncBase=()=>{
const base=getMediaCameraBase(node);
Object.assign(base,view);
if(node.type==='world')Object.assign(node.world,{yaw:view.yaw,pitch:view.pitch,zoom:view.zoom});
};
canvas.addEventListener('pointerup',syncBase,{signal});
canvas.addEventListener('wheel',syncBase,{signal});
target?.addEventListener('change',syncBase,{signal});
target?.addEventListener('paste',()=>queueMicrotask(syncBase),{signal});
seek(0);
}

const mediaLibrary=[];

const addMediaBtn=document.getElementById('addMediaBtn');
const mediaList=document.getElementById('mediaList');
const browseMediaBtn=document.getElementById('browseMediaBtn');
const mediaPanel=document.getElementById('mediaPanel');
const closeMediaPanelBtn=document.getElementById('closeMediaPanelBtn');

function setMediaPanelOpen(open){
mediaPanel.classList.toggle('hidden',!open);
browseMediaBtn.setAttribute('aria-expanded',String(open));
}

browseMediaBtn.addEventListener('click',()=>{
setMediaPanelOpen(mediaPanel.classList.contains('hidden'));
});

closeMediaPanelBtn.addEventListener('click',()=>{
setMediaPanelOpen(false);
});

document.addEventListener('pointerdown',e=>{
if(mediaPanel.classList.contains('hidden'))return;
if(mediaPanel.contains(e.target)||browseMediaBtn.contains(e.target))return;
setMediaPanelOpen(false);
});

document.addEventListener('keydown',e=>{
if(e.key==='Escape'&&!mediaPanel.classList.contains('hidden')){
setMediaPanelOpen(false);
}
});

function getMediaOptions(type,selectedId){
const available=mediaLibrary.filter(media=>{
return media.width===media.height*2&&
(media.fileType==='png'||media.fileType==='mp4');
});

const options=available.map(media=>{
const selected=media.id===selectedId?' selected':'';
return `<option value="${media.id}"${selected}>${escapeHtml(media.fileName).replace(/"/g,'&quot;')}</option>`;
}).join('');

return `<option value="">素材を選択してください</option>${options}`;
}

function renderMediaList(){
mediaList.innerHTML='';

if(mediaLibrary.length===0){
const empty=document.createElement('div');
empty.className='settings-empty';
empty.textContent='素材はまだありません';
mediaList.appendChild(empty);
return;
}

for(const media of mediaLibrary){
const item=document.createElement('div');
item.className='media-item';

const thumbnail=document.createElement('div');
thumbnail.className='media-thumbnail';

if(media.fileType==='mp4'){
thumbnail.classList.add('media-thumbnail--video');
}

const canvas=document.createElement('canvas');
canvas.width=320;
canvas.height=160;

const context=canvas.getContext('2d');

if(context){
context.fillStyle='#252525';
context.fillRect(0,0,canvas.width,canvas.height);

const source=media.fileType==='mp4'?media.video:media.image;

if(source){
try{
const sourceWidth=media.width;
const sourceHeight=media.height;

if(sourceWidth>0&&sourceHeight>0){
context.drawImage(source,0,0,sourceWidth,sourceHeight,0,0,320,160);
}
}catch(error){
console.warn('サムネイルの描画に失敗しました',error);
}
}
}

thumbnail.appendChild(canvas);

if(media.fileType==='mp4'){
const badge=document.createElement('span');
badge.className='media-thumbnail-badge';
badge.textContent='MP4';
thumbnail.appendChild(badge);
}

const name=document.createElement('div');
name.className='media-item-name';
name.textContent=media.fileName;
name.title=media.fileName;

const info=document.createElement('div');
info.className='media-item-info';

const count=state.nodes.filter(node=>{
return node.world?.mediaId===media.id||
node.animation?.mediaId===media.id;
}).length;

info.textContent=`${media.fileType.toUpperCase()}・使用中 ${count} ノード`;

item.appendChild(thumbnail);
item.appendChild(name);
item.appendChild(info);
mediaList.appendChild(item);
}
}

function assignMediaToNode(node,mediaId){
const media=mediaLibrary.find(item=>item.id===mediaId);

if(media&&media.width!==media.height*2){
alert('360度メディアには2:1の画像・動画を選択してください。');
return;
}

if(
media&&(
node.type==='media'||
node.type==='world'||
node.type==='animation'
)
){
node.type=media.fileType==='mp4'?'animation':'world';
}

if(node.type==='world'){
const worldMedia=media?.fileType==='png'?media:null;
node.world.mediaId=worldMedia?worldMedia.id:null;
node.world.fileName=worldMedia?worldMedia.fileName:'';
node.world.fileType=worldMedia?worldMedia.fileType:'';
node.world.image=worldMedia?worldMedia.image:null;
node.world.raw=null;
}

if(node.type==='animation'){
const animationMedia=media?.fileType==='mp4'?media:null;
node.animation.mediaId=animationMedia?animationMedia.id:null;
node.animation.fileName=animationMedia?animationMedia.fileName:'';
node.animation.raw=null;
}

renderMediaList();
renderNodes();
renderSettings();
}

async function readMp4FrameRate(file){
const buffer=await file.arrayBuffer();
const view=new DataView(buffer);
const decoder=new TextDecoder('ascii');

function boxes(start,end){
const result=[];
let position=start;

while(position+8<=end){
let size=view.getUint32(position);
const type=decoder.decode(new Uint8Array(buffer,position+4,4));
let headerSize=8;

if(size===1){
if(position+16>end)break;
const high=view.getUint32(position+8);
const low=view.getUint32(position+12);
size=high*4294967296+low;
headerSize=16;
}else if(size===0){
size=end-position;
}

if(!Number.isSafeInteger(size)||size<headerSize||position+size>end)break;

result.push({
type,
start:position+headerSize,
end:position+size
});

position+=size;
}

return result;
}

function child(parent,type){
return boxes(parent.start,parent.end).find(box=>box.type===type);
}

const moov=boxes(0,buffer.byteLength).find(box=>box.type==='moov');
if(!moov)return null;

for(const trak of boxes(moov.start,moov.end).filter(box=>box.type==='trak')){
const mdia=child(trak,'mdia');
if(!mdia)continue;

const hdlr=child(mdia,'hdlr');
if(!hdlr||hdlr.start+12>hdlr.end)continue;

const handler=decoder.decode(new Uint8Array(buffer,hdlr.start+8,4));
if(handler!=='vide')continue;

const mdhd=child(mdia,'mdhd');
if(!mdhd)continue;

const version=view.getUint8(mdhd.start);
const timescaleOffset=version===1?20:12;
if(mdhd.start+timescaleOffset+4>mdhd.end)continue;

const timescale=view.getUint32(mdhd.start+timescaleOffset);
if(!timescale)continue;

const minf=child(mdia,'minf');
const stbl=minf?child(minf,'stbl'):null;
const stts=stbl?child(stbl,'stts'):null;
if(!stts||stts.start+8>stts.end)continue;

const entryCount=view.getUint32(stts.start+4);
let sampleCount=0;
let durationTicks=0;
let offset=stts.start+8;

for(let i=0;i<entryCount;i++){
if(offset+8>stts.end)break;

const count=view.getUint32(offset);
const delta=view.getUint32(offset+4);

sampleCount+=count;
durationTicks+=count*delta;
offset+=8;
}

if(sampleCount>0&&durationTicks>0){
const fps=sampleCount*timescale/durationTicks;
if(Number.isFinite(fps)&&fps>0&&fps<=240){
return fps;
}
}
}

return null;
}

async function importMediaFile(file){
const extension=file.name.toLowerCase();
const isPng=extension.endsWith('.png');
const isJpg=extension.endsWith('.jpg')||extension.endsWith('.jpeg');
const isMp4=extension.endsWith('.mp4');
const isImage=isPng||isJpg;

if(!isImage&&!isMp4){
throw new Error('PNG、JPGまたはMP4を選択してください。');
}

const media={
id:uid('media'),
fileName:file.name,
fileType:isPng?'png':isJpg?'jpg':'mp4',
image:null,
video:null,
url:null,
raw:null,
frames:[],
duration:0,
fps:null,
width:0,
height:0
};

if(isImage){
const url=URL.createObjectURL(file);

try{
media.image=await new Promise((resolve,reject)=>{
const img=new Image();
img.onload=()=>resolve(img);
img.onerror=()=>reject(new Error('画像を読み込めませんでした。'));
img.src=url;
});

media.width=media.image.naturalWidth;
media.height=media.image.naturalHeight;
}finally{
URL.revokeObjectURL(url);
}
}

if(isMp4){
media.fps=await readMp4FrameRate(file);
const url=URL.createObjectURL(file);
const video=document.createElement('video');

video.preload='auto';
video.muted=true;
video.playsInline=true;

try{
await new Promise((resolve,reject)=>{
video.onloadeddata=resolve;
video.onerror=()=>reject(new Error('MP4を読み込めませんでした。'));
video.src=url;
video.load();
});

media.video=video;
media.url=url;
media.duration=Number.isFinite(video.duration)?video.duration:0;
media.width=video.videoWidth;
media.height=video.videoHeight;
}catch(error){
video.removeAttribute('src');
video.load();
URL.revokeObjectURL(url);
throw error;
}
}

if(media.width<=0||media.height<=0){
throw new Error('画像・動画のサイズを取得できませんでした。');
}

media.sourceFile=file;
mediaLibrary.push(media);

renderMediaList();
renderSettings();

return media;
}

addMediaBtn.addEventListener('click',()=>{
worldFileInput.value='';
worldFileInput.click();
});

worldFileInput.addEventListener('change',async e=>{
const files=Array.from(e.target.files||[]);

for(const file of files){
try{
await importMediaFile(file);
}catch(error){
console.error(error);
alert(`${file.name} の読み込みに失敗しました。\n${error.message}`);
}
}

worldFileInput.value='';
if(files.length>0)setMediaPanelOpen(false);
});

animationFileInput.addEventListener('change',async e=>{
const files=Array.from(e.target.files||[]);

for(const file of files){
try{
await importMediaFile(file);
}catch(error){
console.error(error);
alert(`${file.name} の読み込みに失敗しました。\n${error.message}`);
}
}

animationFileInput.value='';
if(files.length>0)setMediaPanelOpen(false);
});

renderMediaList();

const panoramaRenderers=new WeakMap();

let cleanupAnimationSettingsPreview=null;

function setupCameraNumberInputs(canvas,view,redraw){
const container=document.createElement('div');
container.className='camera-number-settings';

container.innerHTML=`
<div class="setting-group">
<div class="setting-label">水平角度（°）</div>
<input class="number-input" data-camera-value="yaw" type="number" min="-180" max="180" step="0.1">
<button class="camera-copy-view" type="button">画角をコピー</button>
</div>
<div class="setting-group">
<div class="setting-label">垂直角度（°）</div>
<input class="number-input" data-camera-value="pitch" type="number" min="-88.85" max="88.85" step="0.1">
</div>
<div class="setting-group">
<div class="setting-label">FOV・垂直画角（°）</div>
<input class="number-input" data-camera-value="fov" type="number" min="35" max="100" step="0.1">
</div>`;

canvas.insertAdjacentElement('afterend',container);

const inputs={
yaw:container.querySelector('[data-camera-value="yaw"]'),
pitch:container.querySelector('[data-camera-value="pitch"]'),
fov:container.querySelector('[data-camera-value="fov"]')
};

const toDegrees=radians=>radians*180/Math.PI;
const toRadians=degrees=>degrees*Math.PI/180;
const format=value=>Number(value.toFixed(2)).toString();

const sync=()=>{
const yaw=((toDegrees(view.yaw)+180)%360+360)%360-180;

inputs.yaw.value=format(yaw);
inputs.pitch.value=format(toDegrees(view.pitch));
inputs.fov.value=format(Math.max(35,Math.min(100,75/view.zoom)));
};

const copyButton=container.querySelector('.camera-copy-view');

copyButton.addEventListener('click',async()=>{
const cameraData={
yaw:Number((view.yaw*180/Math.PI).toFixed(6)),
pitch:Number((view.pitch*180/Math.PI).toFixed(6)),
fov:Number((75/view.zoom).toFixed(6))
};

const text='GURURI_CAMERA:'+JSON.stringify(cameraData);

try{
await navigator.clipboard.writeText(text);
copyButton.textContent='コピーしました';
setTimeout(()=>{
if(copyButton.isConnected){
copyButton.textContent='画角をコピー';
}
},1500);
}catch(error){
console.error('画角のコピーに失敗しました',error);
alert('クリップボードにコピーできませんでした。');
}
});

inputs.yaw.addEventListener('paste',event=>{
const text=event.clipboardData?.getData('text/plain')||'';

if(!text.startsWith('GURURI_CAMERA:'))return;

event.preventDefault();

let data;

try{
data=JSON.parse(text.slice('GURURI_CAMERA:'.length));
}catch(error){
alert('画角データを読み取れませんでした。');
return;
}

const yaw=Number(data.yaw);
const pitch=Number(data.pitch);
const fov=Number(data.fov);

if(
!Number.isFinite(yaw)||
!Number.isFinite(pitch)||
!Number.isFinite(fov)||
yaw< -180||yaw>180||
pitch< -88.85||pitch>88.85||
fov<35||fov>100
){
alert('画角データが正しくありません。');
return;
}

view.yaw=yaw*Math.PI/180;
view.pitch=pitch*Math.PI/180;
view.zoom=75/fov;

redraw();
sync();
});

for(const [type,input] of Object.entries(inputs)){
input.addEventListener('change',()=>{
const value=Number(input.value);

if(!Number.isFinite(value)||input.value.trim()===''){
sync();
return;
}

if(type==='yaw'){
view.yaw=toRadians(Math.max(-180,Math.min(180,value)));
}

if(type==='pitch'){
view.pitch=toRadians(Math.max(-88.85,Math.min(88.85,value)));
}

if(type==='fov'){
const fov=Math.max(35,Math.min(100,value));
view.zoom=75/fov;
}

redraw();
sync();
});
}

sync();
return sync;
}

function setupMediaCameraInheritance(node){
const checkbox=document.getElementById('inheritCameraInput');
if(!checkbox)return;

checkbox.checked=Boolean(node.inheritCamera);

checkbox.addEventListener('change',()=>{
node.inheritCamera=checkbox.checked;
});
}

function setupAnimationPreview(node,media){
setupMediaCameraInheritance(node);
const canvas=document.getElementById('animationPreviewCanvas');
const range=document.getElementById('animationStartRange');
const numberInput=document.getElementById('animationStartTimeInput');

if(!canvas||!range||!numberInput)return;

if(!node.animation.views){
node.animation.views={
pc:{yaw:0,pitch:0,zoom:1},
mobile:{yaw:0,pitch:0,zoom:1}
};
}

const view=node.animation.views[state.displayMode];
const video=media?.fileType==='mp4'?media.video:null;
const duration=Number(media?.duration)||0;
const maxTime=Math.max(0,duration-0.001);
const controller=new AbortController();
const signal=controller.signal;

cleanupAnimationSettingsPreview=()=>{
controller.abort();
};

let syncCameraInputs=()=>{};

const draw=()=>{
if(!canvas.isConnected)return;

drawPanoramaPreview(canvas,{
image:video&&video.readyState>=2?video:null,
yaw:view.yaw,
pitch:view.pitch,
zoom:view.zoom
});

syncCameraInputs();
};

syncCameraInputs=setupCameraNumberInputs(canvas,view,draw);

const updateStartTime=value=>{
if(!video||duration<=0)return;

const time=clamp(Number(value)||0,0,maxTime);

node.animation.startTime=time;
range.value=String(time);
numberInput.value=String(Number(time.toFixed(3)));

if(Math.abs(video.currentTime-time)<0.0005){
draw();
}else{
video.currentTime=time;
}
};

range.addEventListener('input',()=>{
updateStartTime(range.value);
},{signal});

numberInput.addEventListener('change',()=>{
updateStartTime(numberInput.value);
},{signal});

let drag=null;

canvas.addEventListener('pointerdown',e=>{
drag={
x:e.clientX,
y:e.clientY,
yaw:view.yaw,
pitch:view.pitch
};

canvas.setPointerCapture(e.pointerId);
},{signal});

canvas.addEventListener('pointermove',e=>{
if(!drag)return;

view.yaw=drag.yaw-(e.clientX-drag.x)*0.008;

view.pitch=clamp(
drag.pitch+(e.clientY-drag.y)*0.008,
-Math.PI/2+0.02,
Math.PI/2-0.02
);

draw();
},{signal});

canvas.addEventListener('pointerup',()=>{
drag=null;
},{signal});

canvas.addEventListener('pointercancel',()=>{
drag=null;
},{signal});

canvas.addEventListener('wheel',e=>{
e.preventDefault();

view.zoom=clamp(
view.zoom+(e.deltaY>0?-0.1:0.1),
0.6,
2.2
);

draw();
},{passive:false,signal});

if(video){
video.pause();

video.addEventListener('loadeddata',draw,{signal});
video.addEventListener('seeked',draw,{signal});
video.addEventListener('timeupdate',draw,{signal});

updateStartTime(node.animation.startTime||0);
}

draw();
}

function setupWorldPreview(node){
setupMediaCameraInheritance(node);

const canvas=document.getElementById('worldPreviewCanvas');
if(!canvas)return;

const view=getWorldInitialView(node);

let drag=null;

const getPreviewWorld=()=>({
image:node.world.image,
yaw:view.yaw,
pitch:view.pitch,
zoom:view.zoom
});

let syncCameraInputs=()=>{};

const draw=()=>{
drawPanoramaPreview(canvas,getPreviewWorld());
syncCameraInputs();
};

syncCameraInputs=setupCameraNumberInputs(canvas,view,draw);

canvas.addEventListener('pointerdown',e=>{
drag={
x:e.clientX,
y:e.clientY,
yaw:view.yaw,
pitch:view.pitch
};

canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove',e=>{
if(!drag)return;

view.yaw=drag.yaw-(e.clientX-drag.x)*0.008;

view.pitch=Math.max(
-Math.PI/2+.02,
Math.min(
Math.PI/2-.02,
drag.pitch+(e.clientY-drag.y)*0.008
)
);

draw();
});

canvas.addEventListener('pointerup',()=>{
drag=null;
});

canvas.addEventListener('pointercancel',()=>{
drag=null;
});

canvas.addEventListener('wheel',e=>{
e.preventDefault();

view.zoom=Math.max(
.6,
Math.min(
2.2,
view.zoom+(e.deltaY>0?-.1:.1)
)
);

draw();
},{passive:false});

draw();
}

function getCameraViewBeforeNode(nodeId){
let currentId=nodeId;
const visited=new Set();

while(currentId&&!visited.has(currentId)){
visited.add(currentId);

const incoming=state.connections.find(c=>c.to===currentId);
if(!incoming)return null;

const previous=getNode(incoming.from);
if(!previous)return null;

if(
previous.type==='click'&&
previous.clickView?.initialized
){
return{
yaw:previous.clickView.yaw,
pitch:previous.clickView.pitch,
zoom:previous.clickView.zoom
};
}

if(previous.type==='animation'){
const view=previous.animation.views?.[state.displayMode]||previous.animation.views?.pc;
if(view){
return{
yaw:view.yaw,
pitch:view.pitch,
zoom:view.zoom
};
}
}

if(previous.type==='world'){
const view=getWorldInitialView(previous);

if(view){
return{
yaw:view.yaw,
pitch:view.pitch,
zoom:view.zoom
};
}
}

currentId=previous.id;
}

return null;
}

function getCameraViewAfterNode(nodeId){
let currentId=nodeId;
const visited=new Set();

while(currentId&&!visited.has(currentId)){
visited.add(currentId);

const outgoing=
state.connections.find(c=>c.from===currentId);

if(!outgoing)return null;

const next=getNode(outgoing.to);
if(!next)return null;

if(
next.type==='click'&&
next.clickView?.initialized
){
return{
yaw:next.clickView.yaw,
pitch:next.clickView.pitch,
zoom:next.clickView.zoom
};
}

if(next.type==='world'){
const view=getWorldInitialView(next);

if(view){
return{
yaw:view.yaw,
pitch:view.pitch,
zoom:view.zoom
};
}
}

currentId=next.id;
}

return null;
}

function ensurePanView(node,worldNode){
const startView=
getCameraViewBeforeNode(node.id)||
(worldNode.type==='animation'
?(worldNode.animation.views?.[state.displayMode]||worldNode.animation.views?.pc)
:getWorldInitialView(worldNode));

if(!startView)return;

node.panView.yaw=startView.yaw;
node.panView.pitch=startView.pitch;
node.panView.zoom=startView.zoom;
node.panView.initialized=true;

const startPoint={
yaw:startView.yaw,
pitch:startView.pitch
};

if(node.panPath.length===0){
node.panPath=[
startPoint
];

return;
}

node.panPath[0]=startPoint;
}

function getPanPreviewWorld(node,worldNode){
let image=null;

if(worldNode.type==='animation'){
const media=mediaLibrary.find(item=>
item.id===worldNode.animation.mediaId&&item.fileType==='mp4'
);

image=media?.video?.readyState>=2?media.video:null;
}else{
image=worldNode.world.image;
}

return{
image,
yaw:node.panView.yaw,
pitch:node.panView.pitch,
zoom:node.panView.zoom
};
}

function getTimedPanView(node,time){
const frames=[...(node.panKeyframes||[])]
.filter(frame=>Number.isFinite(frame.time))
.sort((a,b)=>a.time-b.time);

if(frames.length===0){
return{
yaw:node.panView.yaw||0,
pitch:node.panView.pitch||0,
zoom:node.panView.zoom||1
};
}

if(time<=frames[0].time)return {...frames[0]};

const last=frames[frames.length-1];
if(time>=last.time)return {...last};

for(let i=1;i<frames.length;i++){
const a=frames[i-1];
const b=frames[i];

if(time>b.time)continue;

const t=clamp(
(time-a.time)/(b.time-a.time),
0,
1
);

return{
yaw:normalizeAngle(a.yaw+angleDiff(b.yaw,a.yaw)*t),
pitch:a.pitch+(b.pitch-a.pitch)*t,
zoom:a.zoom+(b.zoom-a.zoom)*t
};
}

return {...last};
}

function setupTimedPanPreview(node,sourceNode){
const canvas=document.getElementById('panPreviewCanvas');
const pathCanvas=document.getElementById('panPathCanvas');
const range=document.getElementById('panTimeRange');
const label=document.getElementById('panTimeLabel');
const addButton=document.getElementById('panAddKeyframeBtn');
const list=document.getElementById('panKeyframeList');

if(!canvas||!range||!label||!addButton||!list)return;

pathCanvas.style.pointerEvents='none';

const media=mediaLibrary.find(item=>
item.id===sourceNode.animation.mediaId&&item.fileType==='mp4'
);

const video=media?.video;
if(!video)return;

video.pause();

ensurePanView(node,sourceNode);

const duration=Math.max(0.1,Number(node.panSeconds)||3);

if(!Array.isArray(node.panKeyframes)){
node.panKeyframes=[];
}

if(node.panKeyframes.length===0){
node.panKeyframes.push({
time:0,
yaw:node.panView.yaw,
pitch:node.panView.pitch,
zoom:node.panView.zoom
});
}

const view={
yaw:0,
pitch:0,
zoom:1
};

const controller=new AbortController();
const signal=controller.signal;

cleanupAnimationSettingsPreview=()=>{
controller.abort();
};

let currentTime=0;
let drag=null;

const draw=()=>{
if(!canvas.isConnected)return;

drawPanoramaPreview(canvas,{
image:video.readyState>=2?video:null,
yaw:view.yaw,
pitch:view.pitch,
zoom:view.zoom
});
};

const seek=time=>{
currentTime=clamp(time,0,duration);
range.value=String(currentTime);
label.textContent=`${currentTime.toFixed(2)} / ${duration.toFixed(2)} 秒`;

Object.assign(view,getTimedPanView(node,currentTime));

const videoDuration=Number(media.duration)||0;
const startTime=getMediaCameraVideoTime(
sourceNode,media,getTriggerPreviewTime(node.id,sourceNode)
);

if(videoDuration>0){
const targetTime=Math.max(
0,
Math.min(
videoDuration-0.001,
(startTime+currentTime)%videoDuration
)
);

if(Math.abs(video.currentTime-targetTime)>0.001){
video.currentTime=targetTime;
}else{
draw();
}
}else{
draw();
}
};

const updateList=()=>{
list.innerHTML='';

const frames=[...node.panKeyframes].sort((a,b)=>a.time-b.time);

for(const frame of frames){
const row=document.createElement('div');
row.className='pan-keyframe-row';

const select=document.createElement('button');
select.type='button';
select.textContent=`◆ ${frame.time.toFixed(2)} 秒`;
select.addEventListener('click',()=>{
seek(frame.time);
});

const remove=document.createElement('button');
remove.type='button';
remove.textContent='削除';
remove.addEventListener('click',()=>{
node.panKeyframes=node.panKeyframes.filter(item=>item!==frame);
updateList();
seek(currentTime);
});

row.appendChild(select);
row.appendChild(remove);
list.appendChild(row);
}
};

range.addEventListener('input',()=>{
seek(Number(range.value));
},{signal});

video.addEventListener('seeked',draw,{signal});
video.addEventListener('loadeddata',draw,{signal});

canvas.addEventListener('pointerdown',e=>{
if(e.button!==0)return;

drag={
x:e.clientX,
y:e.clientY,
yaw:view.yaw,
pitch:view.pitch
};

canvas.setPointerCapture(e.pointerId);
},{signal});

canvas.addEventListener('pointermove',e=>{
if(!drag)return;

view.yaw=normalizeAngle(
drag.yaw-(e.clientX-drag.x)*0.008
);

view.pitch=clamp(
drag.pitch+(e.clientY-drag.y)*0.008,
-Math.PI/2+0.02,
Math.PI/2-0.02
);

draw();
},{signal});

const finishDrag=()=>{
drag=null;
};

canvas.addEventListener('pointerup',finishDrag,{signal});
canvas.addEventListener('pointercancel',finishDrag,{signal});

canvas.addEventListener('wheel',e=>{
e.preventDefault();

view.zoom=clamp(
view.zoom+(e.deltaY>0?-0.1:0.1),
0.6,
2.2
);

draw();
},{passive:false,signal});

addButton.addEventListener('click',()=>{
const time=Number(currentTime.toFixed(2));

const frame={
time,
yaw:view.yaw,
pitch:view.pitch,
zoom:view.zoom
};

const existing=node.panKeyframes.findIndex(item=>
Math.abs(item.time-time)<0.005
);

if(existing>=0){
node.panKeyframes[existing]=frame;
}else{
node.panKeyframes.push(frame);
}

node.panKeyframes.sort((a,b)=>a.time-b.time);
updateList();
},{signal});

updateList();
seek(0);
}

function setupPanPreview(node,worldNode){
const previewCanvas=document.getElementById('panPreviewCanvas');
const pathCanvas=document.getElementById('panPathCanvas');

if(!previewCanvas||!pathCanvas)return;

ensurePanView(node,worldNode);

if(worldNode.type==='animation'){
const media=mediaLibrary.find(item=>
item.id===worldNode.animation.mediaId&&item.fileType==='mp4'
);

if(media?.video){
const video=media.video;
video.pause();

const startTime=Math.max(
0,
Math.min(media.duration-0.001,Number(worldNode.animation.startTime)||0)
);

video.addEventListener('seeked',()=>{
if(previewCanvas.isConnected){
drawPanoramaPreview(previewCanvas,getPanPreviewWorld(node,worldNode));
}
},{once:true});

video.currentTime=startTime;
}
}

let drawing=false;
let cameraDrag=null;
let zoomDrag=null;
let pathBeforeDrag=null;

const clonePath=path=>{
return path.map(point=>({
yaw:point.yaw,
pitch:point.pitch
}));
};

const resizePathCanvas=()=>{
const dpr=window.devicePixelRatio||1;
const width=Math.max(1,Math.round(pathCanvas.clientWidth*dpr));
const height=Math.max(1,Math.round(pathCanvas.clientHeight*dpr));

if(pathCanvas.width!==width||pathCanvas.height!==height){
pathCanvas.width=width;
pathCanvas.height=height;
}
};

const drawPath=()=>{
resizePathCanvas();

const ctx=pathCanvas.getContext('2d');
if(!ctx)return;

const dpr=window.devicePixelRatio||1;
const width=pathCanvas.clientWidth;
const height=pathCanvas.clientHeight;

ctx.setTransform(dpr,0,0,dpr,0,0);
ctx.clearRect(0,0,width,height);

const viewWorld=getPanPreviewWorld(node,worldNode);

if(node.panPath.length>1){
ctx.lineWidth=3;
ctx.strokeStyle='#ff8a00';
ctx.lineCap='round';
ctx.lineJoin='round';

ctx.beginPath();

let drawingSegment=false;

for(const point of node.panPath){
const projected=projectWorldAnglesToScreen(
pathCanvas,
viewWorld,
point.yaw,
point.pitch
);

if(!projected){
drawingSegment=false;
continue;
}

if(!drawingSegment){
ctx.moveTo(projected.x,projected.y);
drawingSegment=true;
}else{
ctx.lineTo(projected.x,projected.y);
}
}

ctx.stroke();
}

const startPoint=node.panPath[0];

if(startPoint){
const projected=projectWorldAnglesToScreen(
pathCanvas,
viewWorld,
startPoint.yaw,
startPoint.pitch
);

if(projected){
ctx.beginPath();
ctx.arc(projected.x,projected.y,13,0,Math.PI*2);
ctx.fillStyle='#ffffff';
ctx.fill();
ctx.lineWidth=2;
ctx.strokeStyle='#ff8a00';
ctx.stroke();

ctx.fillStyle='#222222';
ctx.font='bold 13px sans-serif';
ctx.textAlign='center';
ctx.textBaseline='middle';
ctx.fillText('S',projected.x,projected.y);
}
}

const goalPoint=
getCameraViewAfterNode(node.id);

if(goalPoint){
const projected=projectWorldAnglesToScreen(
pathCanvas,
viewWorld,
goalPoint.yaw,
goalPoint.pitch
);

if(projected){
ctx.beginPath();
ctx.arc(projected.x,projected.y,13,0,Math.PI*2);
ctx.fillStyle='#ffffff';
ctx.fill();
ctx.lineWidth=2;
ctx.strokeStyle='#ff8a00';
ctx.stroke();

ctx.fillStyle='#222222';
ctx.font='bold 13px sans-serif';
ctx.textAlign='center';
ctx.textBaseline='middle';
ctx.fillText('G',projected.x,projected.y);
}
}
};

const draw=()=>{
drawPanoramaPreview(
previewCanvas,
getPanPreviewWorld(node,worldNode)
);

drawPath();
};

const addPoint=e=>{
const viewWorld=getPanPreviewWorld(node,worldNode);

const point=screenPointToWorldAngles(
pathCanvas,
viewWorld,
e.clientX,
e.clientY
);

const last=node.panPath[node.panPath.length-1];

if(last){
const distance=Math.hypot(
angleDiff(point.yaw,last.yaw),
point.pitch-last.pitch
);

if(distance<0.002)return;
}

node.panPath.push({
yaw:point.yaw,
pitch:point.pitch
});

drawPath();
};

const isNearStart=e=>{
if(node.panPath.length===0)return false;

const viewWorld=getPanPreviewWorld(node,worldNode);
const start=node.panPath[0];

const projected=projectWorldAnglesToScreen(
pathCanvas,
viewWorld,
start.yaw,
start.pitch
);

if(!projected)return false;

const rect=pathCanvas.getBoundingClientRect();
const x=e.clientX-rect.left;
const y=e.clientY-rect.top;

return Math.hypot(
x-projected.x,
y-projected.y
)<=18;
};

pathCanvas.addEventListener('pointerdown',e=>{
if(e.button===1){
cameraDrag={
x:e.clientX,
y:e.clientY,
yaw:node.panView.yaw,
pitch:node.panView.pitch
};

drawing=false;
zoomDrag=null;
pathBeforeDrag=null;

pathCanvas.setPointerCapture(e.pointerId);
e.preventDefault();
return;
}

if(e.button!==0)return;

if(state.pressedKeys.has('z')){
zoomDrag={
y:e.clientY,
zoom:node.panView.zoom
};

pathCanvas.setPointerCapture(e.pointerId);
e.preventDefault();
return;
}

if(node.panPath.length===1&&!isNearStart(e)){
return;
}

pathBeforeDrag=clonePath(node.panPath);
drawing=true;

pathCanvas.setPointerCapture(e.pointerId);

e.preventDefault();
});

pathCanvas.addEventListener('pointermove',e=>{
if(zoomDrag){
const dy=e.clientY-zoomDrag.y;

node.panView.zoom=Math.max(
.6,
Math.min(
2.2,
zoomDrag.zoom-
dy*0.005
)
);

draw();
return;
}

if(cameraDrag){
const dx=e.clientX-cameraDrag.x;
const dy=e.clientY-cameraDrag.y;

node.panView.yaw=
cameraDrag.yaw-
dx*0.008;

node.panView.pitch=Math.max(
-Math.PI/2+.02,
Math.min(
Math.PI/2-.02,
cameraDrag.pitch+
dy*0.008
)
);

draw();
return;
}

if(!drawing)return;

addPoint(e);
});

const finishPointer=e=>{
if(pathCanvas.hasPointerCapture(e.pointerId)){
pathCanvas.releasePointerCapture(e.pointerId);
}

if(drawing&&pathBeforeDrag){
const changed=
JSON.stringify(pathBeforeDrag)!==
JSON.stringify(node.panPath);

if(changed){
node.panUndoStack.push(pathBeforeDrag);

if(node.panUndoStack.length>100){
node.panUndoStack.shift();
}

node.panRedoStack=[];
}
}

drawing=false;
cameraDrag=null;
zoomDrag=null;
pathBeforeDrag=null;

draw();
};

pathCanvas.addEventListener('pointerup',finishPointer);
pathCanvas.addEventListener('pointercancel',finishPointer);

pathCanvas.addEventListener('auxclick',e=>{
if(e.button===1){
e.preventDefault();
}
});

pathCanvas.addEventListener('wheel',e=>{
e.preventDefault();

node.panView.zoom=Math.max(
.6,
Math.min(
2.2,
node.panView.zoom+
(e.deltaY>0?-.1:.1)
)
);

draw();
},{passive:false});

draw();
}

function getPanoramaRenderer(canvas){
let renderer=panoramaRenderers.get(canvas);
if(renderer)return renderer;
const gl=canvas.getContext('webgl',{antialias:false,alpha:false,preserveDrawingBuffer:false});
if(!gl)return null;
const vertexSource=`
attribute vec2 a_position;
varying vec2 v_uv;
void main(){
v_uv=a_position*0.5+0.5;
gl_Position=vec4(a_position,0.0,1.0);
}`;
const fragmentSource=`
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_fov;
uniform float u_aspect;
const float PI=3.14159265358979323846;
mat3 rotX(float a){
float c=cos(a),s=sin(a);
return mat3(1.0,0.0,0.0,0.0,c,-s,0.0,s,c);
}
mat3 rotY(float a){
float c=cos(a),s=sin(a);
return mat3(c,0.0,s,0.0,1.0,0.0,-s,0.0,c);
}
void main(){
vec2 p=v_uv*2.0-1.0;
p.x*=u_aspect;
float t=tan(u_fov*0.5);
vec3 dir=normalize(vec3(p.x*t,-p.y*t,-1.0));
dir=rotY(u_yaw)*rotX(u_pitch)*dir;
float lon=atan(dir.x,-dir.z);
float lat=asin(clamp(dir.y,-1.0,1.0));
vec2 uv=vec2(fract(lon/(2.0*PI)+0.5),clamp(0.5-lat/PI,0.0,1.0));
gl_FragColor=texture2D(u_texture,uv);
}`;
function compile(type,source){
const shader=gl.createShader(type);
gl.shaderSource(shader,source);
gl.compileShader(shader);
if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader)||'shader compile error');
return shader;
}
const program=gl.createProgram();
gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));
gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));
gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'program link error');
const buffer=gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
const texture=gl.createTexture();
gl.bindTexture(gl.TEXTURE_2D,texture);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
renderer={
gl,
program,
buffer,
texture,
position:gl.getAttribLocation(program,'a_position'),
yaw:gl.getUniformLocation(program,'u_yaw'),
pitch:gl.getUniformLocation(program,'u_pitch'),
fov:gl.getUniformLocation(program,'u_fov'),
aspect:gl.getUniformLocation(program,'u_aspect'),
textureUniform:gl.getUniformLocation(program,'u_texture'),
image:null
};
panoramaRenderers.set(canvas,renderer);
return renderer;
}

function drawPanoramaPreview(canvas,world){
const renderer=getPanoramaRenderer(canvas);
if(!renderer){
const ctx=canvas.getContext('2d');
if(ctx){
ctx.fillStyle='#111';
ctx.fillRect(0,0,canvas.width,canvas.height);
ctx.fillStyle='#ccc';
ctx.font='14px sans-serif';
ctx.textAlign='center';
ctx.fillText('WebGLを利用できません',canvas.width/2,canvas.height/2);
}
return;
}
const gl=renderer.gl;
const displayWidth=Math.max(1,Math.round(canvas.clientWidth*(window.devicePixelRatio||1)));
const displayHeight=Math.max(1,Math.round(canvas.clientHeight*(window.devicePixelRatio||1)));
if(canvas.width!==displayWidth||canvas.height!==displayHeight){
canvas.width=displayWidth;
canvas.height=displayHeight;
}
gl.viewport(0,0,canvas.width,canvas.height);

if(world.image instanceof HTMLVideoElement&&world.image.readyState<2){
return;
}

gl.clearColor(.067,.067,.067,1);
gl.clear(gl.COLOR_BUFFER_BIT);
if(!world.image)return;
gl.useProgram(renderer.program);
gl.bindBuffer(gl.ARRAY_BUFFER,renderer.buffer);
gl.enableVertexAttribArray(renderer.position);
gl.vertexAttribPointer(renderer.position,2,gl.FLOAT,false,0,0);
gl.activeTexture(gl.TEXTURE0);
gl.bindTexture(gl.TEXTURE_2D,renderer.texture);
const isVideo=world.image instanceof HTMLVideoElement;

if(isVideo&&world.image.readyState<2)return;

if(isVideo||renderer.image!==world.image){
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,world.image);
renderer.image=world.image;
}
const fov=Math.max(35,Math.min(100,75/world.zoom))*Math.PI/180;
gl.uniform1i(renderer.textureUniform,0);
gl.uniform1f(renderer.yaw,world.yaw);
gl.uniform1f(renderer.pitch,world.pitch);
gl.uniform1f(renderer.fov,fov);
gl.uniform1f(renderer.aspect,canvas.width/canvas.height);
gl.drawArrays(gl.TRIANGLES,0,6);
}

function clamp(value,min,max){
return Math.max(min,Math.min(max,value));
}

function normalizeAngle(angle){
while(angle<=-Math.PI)angle+=Math.PI*2;
while(angle>Math.PI)angle-=Math.PI*2;
return angle;
}

function angleDiff(a,b){
return normalizeAngle(a-b);
}

function findPreviousWorldNode(nodeId){
let currentId=nodeId;
const visited=new Set();
while(currentId&&!visited.has(currentId)){
visited.add(currentId);
const incoming=state.connections.find(c=>c.to===currentId);
if(!incoming)return null;
const previous=getNode(incoming.from);
if(!previous)return null;
if(previous.type==='world')return previous;
currentId=previous.id;
}
return null;
}

function findPreviousClickMediaNode(nodeId){
// First prefer a media node on the path leading directly to this node.
// In parallel graphs, a sibling media branch from the nearest common ancestor
// supplies the background for click and dialogue editing previews.
const visited=new Set();
let frontier=[nodeId];
const mediaTypes=new Set(['world','animation']);

while(frontier.length){
const next=[];
const parents=[];

for(const id of frontier){
if(visited.has(id))continue;
visited.add(id);
for(const edge of state.connections){
if(edge.to!==id)continue;
const parent=getNode(edge.from);
if(!parent)continue;
if(mediaTypes.has(parent.type))return parent;
parents.push(parent);
}
}

// Search the media branches attached to the nearest ancestor first.
for(const parent of parents){
for(const edge of state.connections){
if(edge.from!==parent.id)continue;
const sibling=getNode(edge.to);
if(sibling&&mediaTypes.has(sibling.type))return sibling;
}
}

for(const parent of parents){
if(!visited.has(parent.id))next.push(parent.id);
}
frontier=next;
}
return null;
}

function getClickAnimationMedia(sourceNode){
if(sourceNode?.type!=='animation')return null;

return mediaLibrary.find(media=>
media.id===sourceNode.animation.mediaId&&
media.fileType==='mp4'
)||null;
}

function getClickFrameRegions(node,frameIndex){
const frames=node.clickFrameRegions||{};

if(node.clickInheritRegions===false){
return cloneClickRegions(frames[frameIndex]||[]);
}

const keys=Object.keys(frames)
.map(Number)
.filter(index=>Number.isInteger(index)&&index<=frameIndex)
.sort((a,b)=>b-a);

if(keys.length===0)return [];

return cloneClickRegions(frames[keys[0]]);
}

function saveCurrentClickFramePolygon(node){
if(!node.clickAnimationMode)return;

if(!node.clickFrameRegions){
node.clickFrameRegions={};
}

const currentIndex=node.clickFrameIndex||0;
const regions=cloneClickRegions(node.clickRegions);

node.clickFrameRegions[currentIndex]=regions;

if(node.clickInheritRegions!==false){
const media=mediaLibrary.find(m=>m.id===node.clickSourceMediaId);
const fps=Number(node.clickFrameFps)||8;
const frameCount=media?.duration
?Math.max(1,Math.ceil(media.duration*fps))
:currentIndex+1;

for(let index=currentIndex+1;index<frameCount;index++){
node.clickFrameRegions[index]=cloneClickRegions(regions);
}
}
}

function getTriggerPreviewTime(nodeId,sourceNode){
// Sum waits on the path to this trigger.  A sibling media branch starts
// at the common ancestor, so this is its elapsed playback time.
const visited=new Set();
let current=nodeId;
let elapsed=0;
while(current&&!visited.has(current)){
visited.add(current);
const currentNode=getNode(current);
if(currentNode?.type==='time')elapsed+=Math.max(0,Number(currentNode.timeSeconds)||0);
if(current===sourceNode?.id)break;
const incoming=state.connections.find(edge=>edge.to===current);
if(!incoming)break;
current=incoming.from;
}
return elapsed;
}

function getReferenceCamera(node,sourceNode,seconds){
const media=sourceNode?.type==='animation'?getClickAnimationMedia(sourceNode):null;
const time=getMediaCameraLoopTime(sourceNode,media,Math.max(0,seconds||0));
const keyframe=findSceneKeyframeNode(sourceNode);
return keyframe?getIndependentCameraAt(keyframe,time,getMediaCameraBase(sourceNode)):getMediaCameraBase(sourceNode);
}

function ensureClickView(node,sourceNode){
if(!sourceNode)return;
const time=sourceNode.type==='animation'
?(node.clickFrameIndex||0)/(Number(node.clickFrameFps)||8)
:getTriggerPreviewTime(node.id,sourceNode);
const referenceKey=`${sourceNode.id}:${state.displayMode}`;
if(node.clickView.initialized&&node.clickReferenceKey===referenceKey)return;
Object.assign(node.clickView,getReferenceCamera(node,sourceNode,time),{initialized:true});
node.clickReferenceKey=referenceKey;
}

function createClickTargetAtCenter(node,worldNode,canvas){
ensureClickView(node,worldNode);

const viewWorld=getClickViewWorld(node,worldNode);
const rect=canvas.getBoundingClientRect();

const center=screenPointToWorldAngles(
canvas,
viewWorld,
rect.left+rect.width/2,
rect.top+rect.height/2
);

node.clickTarget.yaw=center.yaw;
node.clickTarget.pitch=center.pitch;
node.clickTarget.width=0.5;
node.clickTarget.height=0.35;
node.clickTarget.initialized=true;
}

function getClickViewWorld(node,worldNode){
return{
image:worldNode.world.image,
yaw:node.clickView.yaw,
pitch:node.clickView.pitch,
zoom:node.clickView.zoom
};
}

function screenPointToWorldAngles(canvas,world,clientX,clientY){
const rect=canvas.getBoundingClientRect();
const x=clamp((clientX-rect.left)/Math.max(1,rect.width),0,1);
const y=clamp((clientY-rect.top)/Math.max(1,rect.height),0,1);
const aspect=rect.width/Math.max(1,rect.height);
const fov=Math.max(35,Math.min(100,75/world.zoom))*Math.PI/180;
const t=Math.tan(fov*0.5);
const px=x*2-1;
const py=1-y*2;
let vx=px*aspect*t;
let vy=-py*t;
let vz=-1;
const cp=Math.cos(world.pitch),sp=Math.sin(world.pitch);
const cy=Math.cos(world.yaw),sy=Math.sin(world.yaw);
const x1=vx;
const y1=cp*vy+sp*vz;
const z1=-sp*vy+cp*vz;
const x2=cy*x1-sy*z1;
const y2=y1;
const z2=sy*x1+cy*z1;
const len=Math.hypot(x2,y2,z2)||1;
return{
yaw:Math.atan2(x2,-z2),
pitch:Math.asin(clamp(y2/len,-1,1))
};
}

function projectWorldAnglesToScreen(canvas,world,yaw,pitch){
const rect=canvas.getBoundingClientRect();
const aspect=rect.width/Math.max(1,rect.height);
const fov=Math.max(35,Math.min(100,75/world.zoom))*Math.PI/180;
const t=Math.tan(fov*0.5);
const cp=Math.cos(pitch);
let vx=Math.sin(yaw)*cp;
let vy=Math.sin(pitch);
let vz=-Math.cos(yaw)*cp;
const cy=Math.cos(world.yaw),sy=Math.sin(world.yaw);
const x1=cy*vx+sy*vz;
const y1=vy;
const z1=-sy*vx+cy*vz;
const cpx=Math.cos(world.pitch),spx=Math.sin(world.pitch);
const x2=x1;
const y2=cpx*y1-spx*z1;
const z2=spx*y1+cpx*z1;
if(z2>=-0.01)return null;
const px=(x2/-z2)/(aspect*t);
const py=-(y2/-z2)/t;
return{
x:(px+1)*0.5*rect.width,
y:(1-py)*0.5*rect.height
};
}

function cloneClickPolygon(points){
return (points||[]).map(point=>({
yaw:point.yaw,
pitch:point.pitch
}));
}

function cloneClickRegions(regions){
return (regions||[]).map(region=>({
mode:region.mode==='subtract'?'subtract':'add',
points:cloneClickPolygon(region.points)
}));
}

function updateClickRegionState(node){
node.clickTarget.initialized=
node.clickRegions.some(region=>
region.mode==='add'&&region.points.length>=3
);
}

function ensureClickLassoHistory(node){
if(!Array.isArray(node.clickPolygon)){
node.clickPolygon=[];
}

if(!Array.isArray(node.clickRegions)){
node.clickRegions=[];

if(node.clickPolygon.length>=3){
node.clickRegions.push({
mode:'add',
points:cloneClickPolygon(node.clickPolygon)
});
}
}

if(!Array.isArray(node.clickUndoStack)){
node.clickUndoStack=[];
}

if(!Array.isArray(node.clickRedoStack)){
node.clickRedoStack=[];
}

if(node.clickLassoMode!=='subtract'){
node.clickLassoMode='add';
}

updateClickRegionState(node);
}

function snapshotClickLasso(node){
return{
frameIndex:node.clickFrameIndex||0,
regions:cloneClickRegions(node.clickRegions),
frameRegions:Object.fromEntries(
Object.entries(node.clickFrameRegions||{}).map(([index,regions])=>[
index,
cloneClickRegions(regions)
])
)
};
}

function restoreClickLasso(node,snapshot){
node.clickFrameIndex=snapshot.frameIndex;
node.clickFrameRegions=Object.fromEntries(
Object.entries(snapshot.frameRegions).map(([index,regions])=>[
index,
cloneClickRegions(regions)
])
);
setClickLassoRegions(node,snapshot.regions);
}

function saveClickLassoHistory(node){
ensureClickLassoHistory(node);

node.clickUndoStack.push(snapshotClickLasso(node));

if(node.clickUndoStack.length>100){
node.clickUndoStack.shift();
}

node.clickRedoStack=[];
}

function setClickLassoRegions(node,regions){
node.clickRegions=cloneClickRegions(regions);
node.clickPolygon=[];
updateClickRegionState(node);
}

function setClickLassoPolygon(node,points){
node.clickPolygon=cloneClickPolygon(points);
}

function getClickLassoWorld(node,sourceNode){
const image=sourceNode.type==='animation'
?getClickAnimationMedia(sourceNode)?.video||null
:sourceNode.world.image;

return{
image,
yaw:node.clickView.yaw,
pitch:node.clickView.pitch,
zoom:node.clickView.zoom
};
}

function drawClickLassoOverlay(node,worldNode){
const canvas=document.getElementById('clickLassoCanvas');
if(!canvas)return;

const rect=canvas.getBoundingClientRect();
const dpr=window.devicePixelRatio||1;
const width=Math.max(1,Math.round(rect.width*dpr));
const height=Math.max(1,Math.round(rect.height*dpr));

if(canvas.width!==width||canvas.height!==height){
canvas.width=width;
canvas.height=height;
}

const ctx=canvas.getContext('2d');
if(!ctx)return;

ctx.setTransform(dpr,0,0,dpr,0,0);
ctx.clearRect(0,0,rect.width,rect.height);

const world=getClickLassoWorld(node,worldNode);
const regions=node.clickRegions||[];

const projectPoints=points=>{
return points.map(point=>
projectWorldAnglesToScreen(
canvas,
world,
point.yaw,
point.pitch
)
);
};

const makePath=(context,points)=>{
const projected=projectPoints(points);

if(projected.length<3||projected.some(point=>!point)){
return false;
}

context.beginPath();
context.moveTo(projected[0].x,projected[0].y);

for(let i=1;i<projected.length;i++){
context.lineTo(projected[i].x,projected[i].y);
}

context.closePath();
return true;
};

const mask=document.createElement('canvas');
mask.width=width;
mask.height=height;

const maskCtx=mask.getContext('2d');
if(!maskCtx)return;

maskCtx.setTransform(dpr,0,0,dpr,0,0);

for(const region of regions){
if(!region.points||region.points.length<3)continue;
if(!makePath(maskCtx,region.points))continue;

if(region.mode==='subtract'){
maskCtx.globalCompositeOperation='destination-out';
maskCtx.fillStyle='#000';
}else{
maskCtx.globalCompositeOperation='source-over';
maskCtx.fillStyle='#fff';
}

maskCtx.fill();
}

maskCtx.globalCompositeOperation='source-over';

ctx.setTransform(1,0,0,1,0,0);

const colorCanvas=document.createElement('canvas');
colorCanvas.width=width;
colorCanvas.height=height;

const colorCtx=colorCanvas.getContext('2d');

if(colorCtx){
colorCtx.fillStyle='#ff8a00';
colorCtx.fillRect(0,0,width,height);
colorCtx.globalCompositeOperation='destination-in';
colorCtx.drawImage(mask,0,0);

ctx.globalAlpha=0.28;
ctx.drawImage(colorCanvas,0,0);
ctx.globalAlpha=1;
}

const outline=document.createElement('canvas');
outline.width=width;
outline.height=height;

const outlineCtx=outline.getContext('2d');

if(outlineCtx){
const radius=Math.max(1,Math.round(2*dpr));

for(let dy=-radius;dy<=radius;dy++){
for(let dx=-radius;dx<=radius;dx++){
if(dx*dx+dy*dy>radius*radius)continue;
outlineCtx.drawImage(mask,dx,dy);
}
}

outlineCtx.globalCompositeOperation='destination-out';
outlineCtx.drawImage(mask,0,0);
outlineCtx.globalCompositeOperation='source-in';
outlineCtx.fillStyle='#ff8a00';
outlineCtx.fillRect(0,0,width,height);

ctx.setTransform(1,0,0,1,0,0);
ctx.drawImage(outline,0,0);
}

ctx.setTransform(dpr,0,0,dpr,0,0);

const draft=node.clickPolygon||[];

if(draft.length>0){
const projected=projectPoints(draft);
const valid=projected.filter(Boolean);

if(valid.length>0){
ctx.beginPath();
ctx.moveTo(valid[0].x,valid[0].y);

for(let i=1;i<valid.length;i++){
ctx.lineTo(valid[i].x,valid[i].y);
}

if(valid.length>=3){
ctx.closePath();

if(node.clickLassoMode==='subtract'){
ctx.fillStyle='rgba(255,255,255,0.28)';
ctx.fill();
}
}

ctx.strokeStyle=node.clickLassoMode==='subtract'
?'#ffffff'
:'#ff8a00';

ctx.lineWidth=2.5;
ctx.lineCap='round';
ctx.lineJoin='round';
ctx.stroke();
}
}
}

function setupClickTriggerPreview(node,worldNode){
const previewCanvas=document.getElementById('clickPreviewCanvas');
const lassoCanvas=document.getElementById('clickLassoCanvas');
const clearButton=document.getElementById('clearClickLassoBtn');
const addModeButton=document.getElementById('clickLassoAddBtn');
const subtractModeButton=document.getElementById('clickLassoSubtractBtn');

if(!previewCanvas||!lassoCanvas||!clearButton||!addModeButton||!subtractModeButton)return;

ensureClickLassoHistory(node);

const inheritInput=document.getElementById('clickInheritRegionsInput');

if(inheritInput){
inheritInput.addEventListener('change',()=>{
saveClickLassoHistory(node);

node.clickInheritRegions=inheritInput.checked;

if(node.clickInheritRegions){
saveCurrentClickFramePolygon(node);
}

setClickLassoRegions(
node,
getClickFrameRegions(node,node.clickFrameIndex||0)
);

drawClickLassoOverlay(node,worldNode);
});
}

if(node.clickLassoMode!=='add'&&node.clickLassoMode!=='subtract'){
node.clickLassoMode='add';
}

const updateLassoModeButtons=()=>{
const isAdd=node.clickLassoMode==='add';

addModeButton.classList.toggle('active',isAdd);
subtractModeButton.classList.toggle('active',!isAdd);

addModeButton.setAttribute('aria-pressed',String(isAdd));
subtractModeButton.setAttribute('aria-pressed',String(!isAdd));
};

addModeButton.addEventListener('click',()=>{
node.clickLassoMode='add';
updateLassoModeButtons();
});

subtractModeButton.addEventListener('click',()=>{
node.clickLassoMode='subtract';
updateLassoModeButtons();
});

updateLassoModeButtons();
ensureClickView(node,worldNode);

const isAnimation=worldNode.type==='animation';
const media=isAnimation?getClickAnimationMedia(worldNode):null;
const video=media?.video||null;

if(isAnimation&&video){
const range=document.getElementById('clickFrameRange');
const previousButton=document.getElementById('clickPreviousFrameBtn');
const nextButton=document.getElementById('clickNextFrameBtn');
const label=document.getElementById('clickFrameLabel');
const timeLabel=document.getElementById('clickFrameTimeLabel');


const frameCount=()=>Math.max(
1,
Math.ceil(media.duration*node.clickFrameFps)
);

const showFrame=index=>{
const nextIndex=clamp(
Math.round(index),
0,
frameCount()-1
);

if(nextIndex!==node.clickFrameIndex){
node.clickFrameIndex=nextIndex;

setClickLassoRegions(
node,
getClickFrameRegions(node,nextIndex)
);
}

range.value=String(node.clickFrameIndex);
label.textContent=`${node.clickFrameIndex+1} / ${frameCount()}`;

const time=Math.min(
node.clickFrameIndex/node.clickFrameFps,
Math.max(0,media.duration-0.001)
);

// 画角はクリックノード内で保持する。
// 初回の画角設定は ensureClickView() に任せる。
// フレーム切り替え時には画角を上書きしない。

timeLabel.textContent=`${time.toFixed(3)} 秒`;

video.pause();
video.currentTime=time;

if(video.readyState>=2){
drawPanoramaPreview(
document.getElementById('clickPreviewCanvas'),
getClickLassoWorld(node,worldNode)
);
}

drawClickLassoOverlay(node,worldNode);
};

previousButton.addEventListener('click',()=>{
showFrame(node.clickFrameIndex-1);
});

nextButton.addEventListener('click',()=>{
showFrame(node.clickFrameIndex+1);
});

range.addEventListener('input',()=>{
showFrame(Number(range.value));
});



video.addEventListener('seeked',()=>{
if(!document.getElementById('clickPreviewCanvas'))return;

drawPanoramaPreview(
document.getElementById('clickPreviewCanvas'),
getClickLassoWorld(node,worldNode)
);

drawClickLassoOverlay(node,worldNode);
});

showFrame(node.clickFrameIndex||0);
}

let drag=null;

const draw=()=>{
drawPanoramaPreview(
previewCanvas,
getClickLassoWorld(node,worldNode)
);

drawClickLassoOverlay(node,worldNode);
};

const addPoint=e=>{
const world=getClickLassoWorld(node,worldNode);

const point=screenPointToWorldAngles(
lassoCanvas,
world,
e.clientX,
e.clientY
);

const points=node.clickPolygon;
const previous=points[points.length-1];

if(previous){
const difference=Math.hypot(
angleDiff(point.yaw,previous.yaw),
point.pitch-previous.pitch
);

if(difference<0.003)return;
}

points.push(point);
drawClickLassoOverlay(node,worldNode);
};

lassoCanvas.addEventListener('pointerdown',e=>{
const rotate=e.button===1||
(e.button===0&&state.pressedKeys.has(' '));

const zoom=e.button===0&&state.pressedKeys.has('z');

if(e.button!==0&&e.button!==1)return;

if(rotate){
drag={
mode:'rotate',
x:e.clientX,
y:e.clientY,
yaw:node.clickView.yaw,
pitch:node.clickView.pitch
};
}else if(zoom){
drag={
mode:'zoom',
y:e.clientY,
zoom:node.clickView.zoom
};
}else{
saveClickLassoHistory(node);
setClickLassoPolygon(node,[]);

drag={mode:'lasso'};
addPoint(e);
}

lassoCanvas.setPointerCapture(e.pointerId);
e.preventDefault();
});

lassoCanvas.addEventListener('pointermove',e=>{
if(!drag)return;

if(drag.mode==='rotate'){
node.clickView.yaw=drag.yaw-(e.clientX-drag.x)*0.008;

node.clickView.pitch=clamp(
drag.pitch+(e.clientY-drag.y)*0.008,
-Math.PI/2+0.02,
Math.PI/2-0.02
);

draw();
return;
}

if(drag.mode==='zoom'){
node.clickView.zoom=clamp(
drag.zoom-(e.clientY-drag.y)*0.005,
0.6,
2.2
);

draw();
return;
}

if(drag.mode==='lasso'){
addPoint(e);
}
});

const finish=e=>{
if(!drag)return;

if(drag.mode==='lasso'){
addPoint(e);

if(node.clickPolygon.length>=3){
node.clickRegions.push({
mode:node.clickLassoMode,
points:cloneClickPolygon(node.clickPolygon)
});

updateClickRegionState(node);
saveCurrentClickFramePolygon(node);
}

node.clickPolygon=[];
}

drag=null;

if(lassoCanvas.hasPointerCapture(e.pointerId)){
lassoCanvas.releasePointerCapture(e.pointerId);
}

draw();
};

lassoCanvas.addEventListener('pointerup',finish);
lassoCanvas.addEventListener('pointercancel',finish);

lassoCanvas.addEventListener('auxclick',e=>{
if(e.button===1)e.preventDefault();
});

lassoCanvas.addEventListener('wheel',e=>{
e.preventDefault();

node.clickView.zoom=clamp(
node.clickView.zoom+(e.deltaY>0?-0.1:0.1),
0.6,
2.2
);

draw();
},{passive:false});

clearButton.addEventListener('click',()=>{
ensureClickLassoHistory(node);

if(node.clickRegions.length===0)return;

saveClickLassoHistory(node);
setClickLassoRegions(node,[]);
saveCurrentClickFramePolygon(node);
draw();
});

draw();
}

function isPointInsideClickPolygon(point,polygon){
if(!Array.isArray(polygon)||polygon.length<3){
return false;
}

let inside=false;

for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
const a=polygon[i];
const b=polygon[j];

const ax=angleDiff(a.yaw,point.yaw);
const bx=angleDiff(b.yaw,point.yaw);
const ay=a.pitch;
const by=b.pitch;

if((ay>point.pitch)===(by>point.pitch)){
continue;
}

const intersectX=ax+(bx-ax)*(point.pitch-ay)/(by-ay);

if(intersectX>0){
inside=!inside;
}
}

return inside;
}

function isClickTargetHit(node,world,clientX,clientY,regions=null){
ensureClickLassoHistory(node);

const point=screenPointToWorldAngles(
gameCanvas,
world,
clientX,
clientY
);

let selected=false;

const activeRegions=regions||node.clickRegions;

for(const region of activeRegions){
if(isPointInsideClickPolygon(point,region.points)){
selected=region.mode==='add';
}
}

return selected;
}

function escapeHtml(value){
return String(value)
.replace(/&/g,'&amp;')
.replace(/</g,'&lt;')
.replace(/>/g,'&gt;');
}

function ensureDialogueView(node,sourceNode){
if(!sourceNode)return;
const seconds=getTriggerPreviewTime(node.id,sourceNode);
const view=getReferenceCamera(node,sourceNode,seconds);
const sourceKey=`${sourceNode.id}:${state.displayMode}:${seconds}`;
if(node.dialogueSourceKey!==sourceKey){
Object.assign(node.dialogueView,view,{initialized:true});
node.dialogueSourceKey=sourceKey;
}
}

function getDialogueViewWorld(node,sourceNode){
let image=null;

if(sourceNode?.type==='world'){
image=sourceNode.world.image;
}

if(sourceNode?.type==='animation'){
const media=mediaLibrary.find(item=>
item.id===sourceNode.animation.mediaId&&
item.fileType==='mp4'
);
image=media?.video||null;
}

return{
image,
yaw:node.dialogueView.yaw,
pitch:node.dialogueView.pitch,
zoom:node.dialogueView.zoom
};
}

function getDialoguePanelHeight(node){
const value=Number(node.dialoguePanelHeights?.[state.displayMode]);
return Number.isFinite(value)&&value>=10&&value<=60?value:20;
}

function applyDialoguePreviewLayout(node){
const box=document.getElementById('dialoguePreviewBox');
if(!box)return;

const layout=getActiveLayout();
const referenceWidth=layout.width>=layout.height?1280:720;
const referenceHeight=referenceWidth*layout.height/layout.width;
const previewWidth=box.parentElement.clientWidth;
const scale=previewWidth/referenceWidth;
const panelHeight=referenceHeight*getDialoguePanelHeight(node)/100;

box.style.width=`${referenceWidth}px`;
box.style.height=`${panelHeight}px`;
box.style.transform=`scale(${scale})`;
box.style.setProperty('--dialogue-thumbnail-size',`${Math.max(1,panelHeight-48)}px`);
}

function applyGameDialogueLayout(node){
const height=getDialoguePanelHeight(node);
const scale=Number.parseFloat(
gameViewport.style.getPropertyValue('--dialogue-scale')
)||1;

const panelHeight=gameViewport.clientHeight*height/100;
const thumbnailSize=Math.max(1,panelHeight-48*scale);

dialogueOverlay.style.height=`${height}%`;
dialogueOverlay.style.setProperty(
'--dialogue-thumbnail-size',
`${thumbnailSize}px`
);
}

function getDialogueThumbnailOptions(selectedId){
const options=mediaLibrary
.filter(media=>
(media.fileType==='png'||media.fileType==='jpg')&&
media.width===media.height
)
.map(media=>{
const selected=media.id===selectedId?' selected':'';
return `<option value="${media.id}"${selected}>${escapeHtml(media.fileName)}</option>`;
})
.join('');

return `<option value="">未設定</option>${options}`;
}

function getDialogueThumbnailData(node){
if(!node.dialogueThumbnailMediaId)return node.dialogueThumbnail||null;

const media=mediaLibrary.find(item=>
item.id===node.dialogueThumbnailMediaId&&
(item.fileType==='png'||item.fileType==='jpg')&&
item.width===item.height
);

if(!media?.image)return null;

const canvas=document.createElement('canvas');
canvas.width=256;
canvas.height=256;

const ctx=canvas.getContext('2d');
if(!ctx)return null;

ctx.drawImage(media.image,0,0,256,256);
return canvas.toDataURL('image/png');
}

function setupDialogueAppearance(node){
const speakerInput=document.getElementById('dialogueSpeakerInput');
const thumbnailSelect=document.getElementById('dialogueThumbnailSelect');
const settingsImage=document.getElementById('dialogueThumbnailSettingsImage');
const fontInput=document.getElementById('dialogueFontSizeInput');
const heightInput=document.getElementById('dialoguePanelHeightInput');

if(!speakerInput||!thumbnailSelect||!settingsImage||!fontInput||!heightInput)return;

const updateAppearance=()=>{
const previewImage=document.getElementById('dialoguePreviewThumbnail');
const previewText=document.getElementById('dialoguePreviewText');
const previewSpeaker=document.getElementById('dialoguePreviewSpeaker');
const fontSize=Number(node.dialogueFontSize)||24;
const thumbnailData=getDialogueThumbnailData(node);
const speaker=(node.dialogueSpeaker||'').trim();

applyDialoguePreviewLayout(node);

if(previewText){
previewText.style.fontSize=`${fontSize}px`;
}

if(previewSpeaker){
previewSpeaker.textContent=speaker;
previewSpeaker.classList.toggle('hidden',!speaker);
}

if(previewImage){
previewImage.classList.toggle('hidden',!thumbnailData);
if(thumbnailData)previewImage.src=thumbnailData;
else previewImage.removeAttribute('src');
}

settingsImage.classList.toggle('hidden',!thumbnailData);
if(thumbnailData)settingsImage.src=thumbnailData;
else settingsImage.removeAttribute('src');
};

speakerInput.addEventListener('input',()=>{
node.dialogueSpeaker=speakerInput.value.slice(0,40);
updateAppearance();
});

thumbnailSelect.addEventListener('change',()=>{
node.dialogueThumbnailMediaId=thumbnailSelect.value||null;
node.dialogueThumbnail=null;
updateAppearance();
});

fontInput.addEventListener('input',()=>{
const value=Number(fontInput.value);
if(!Number.isFinite(value)||value<10||value>36)return;
node.dialogueFontSize=value;
updateAppearance();
});

fontInput.addEventListener('change',()=>{
node.dialogueFontSize=Math.max(
10,
Math.min(36,Number(fontInput.value)||24)
);
fontInput.value=node.dialogueFontSize;
updateAppearance();
});

heightInput.addEventListener('input',()=>{
const value=Number(heightInput.value);
if(!Number.isFinite(value)||value<10||value>60)return;

if(!node.dialoguePanelHeights){
node.dialoguePanelHeights={pc:20,mobile:20};
}

node.dialoguePanelHeights[state.displayMode]=value;
updateAppearance();
});

heightInput.addEventListener('change',()=>{
const value=Math.max(10,Math.min(60,Number(heightInput.value)||20));

if(!node.dialoguePanelHeights){
node.dialoguePanelHeights={pc:20,mobile:20};
}

node.dialoguePanelHeights[state.displayMode]=value;
heightInput.value=value;
updateAppearance();
});

updateAppearance();
}
function setupDialogueTriggerPreview(node,sourceNode){
const canvas=document.getElementById('dialoguePreviewCanvas');
const addButton=document.getElementById('addDialogueBtn');
const previewBox=document.getElementById('dialoguePreviewBox');
const previewText=document.getElementById('dialoguePreviewText');
if(!canvas||!addButton)return;

let drag=null;

const draw=()=>{
drawPanoramaPreview(canvas,getDialogueViewWorld(node,sourceNode));
};

if(sourceNode?.type==='animation'){
const media=mediaLibrary.find(item=>
item.id===sourceNode.animation.mediaId&&
item.fileType==='mp4'
);

const video=media?.video;

if(video){
video.pause();

const startTime=Number(sourceNode.animation.startTime)||0;

if(video.readyState>=2){
try{
video.currentTime=startTime;
}catch(error){
console.warn(error);
}
}

video.addEventListener('seeked',draw,{once:true});
video.addEventListener('loadeddata',draw,{once:true});
}
}

const updatePreview=()=>{
if(!previewBox||!previewText)return;

applyDialoguePreviewLayout(node);

if(node.dialoguePages.length===0){
previewBox.classList.add('hidden');
previewText.textContent='';
return;
}

node.dialogueEditIndex=clamp(node.dialogueEditIndex,0,node.dialoguePages.length-1);
previewBox.classList.remove('hidden');
previewText.textContent=node.dialoguePages[node.dialogueEditIndex]||'';
};

canvas.addEventListener('pointerdown',e=>{
drag={
x:e.clientX,
y:e.clientY,
yaw:node.dialogueView.yaw,
pitch:node.dialogueView.pitch
};
canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove',e=>{
if(!drag)return;
node.dialogueView.yaw=drag.yaw-(e.clientX-drag.x)*0.008;
node.dialogueView.pitch=Math.max(-Math.PI/2+.02,Math.min(Math.PI/2-.02,drag.pitch+(e.clientY-drag.y)*0.008));
draw();
});

canvas.addEventListener('pointerup',()=>{
drag=null;
});

canvas.addEventListener('pointercancel',()=>{
drag=null;
});

canvas.addEventListener('wheel',e=>{
e.preventDefault();
node.dialogueView.zoom=Math.max(.6,Math.min(2.2,node.dialogueView.zoom+(e.deltaY>0?-.1:.1)));
draw();
},{passive:false});

addButton.addEventListener('click',()=>{
node.dialoguePages.push('');
node.dialogueEditIndex=node.dialoguePages.length-1;
renderNodes();
renderSettings();
});

document.querySelectorAll('.dialogue-textarea').forEach(textarea=>{
const index=Number(textarea.dataset.dialogueIndex);

textarea.addEventListener('focus',()=>{
node.dialogueEditIndex=index;
updatePreview();
});

textarea.addEventListener('input',()=>{
const value=textarea.value.slice(0,60);
textarea.value=value;
node.dialoguePages[index]=value;
node.dialogueEditIndex=index;

const count=document.querySelector(`[data-dialogue-count="${index}"]`);
if(count)count.textContent=`${value.length}/60`;

updatePreview();
renderNodes();
});
});

draw();
updatePreview();
}

function workspacePointFromEvent(e){
const rect=workspace.getBoundingClientRect();
return screenToWorkspace(e.clientX-rect.left,e.clientY-rect.top);
}

workspace.addEventListener('pointerdown',e=>{
if(startWorkspaceCameraDrag(e))return;

if(e.target===workspace||e.target===nodesLayer||e.target===workspaceScene){
if(e.button!==0)return;
state.selectedNodeId=null;
state.selectedNodeIds.clear();
state.selectedConnectionId=null;
renderNodes();
renderSettings();
}
});

workspace.addEventListener('wheel',e=>{
if(e.target.closest('.context-menu'))return;

e.preventDefault();

const rect=workspace.getBoundingClientRect();
const centerX=e.clientX-rect.left;
const centerY=e.clientY-rect.top;

const previousScale=workspaceCamera.scale;
const nextScale=Math.max(
0.01,
Math.min(3,previousScale*Math.exp(-e.deltaY*0.001))
);

const factor=nextScale/previousScale;

workspaceCamera.scale=nextScale;
workspaceCamera.x=centerX-(centerX-workspaceCamera.x)*factor;
workspaceCamera.y=centerY-(centerY-workspaceCamera.y)*factor;

updateWorkspaceCamera();
},{passive:false});

workspace.addEventListener('pointermove',e=>{
const drag=workspaceCamera.drag;
if(!drag||drag.pointerId!==e.pointerId)return;

if(drag.mode==='pan'){
workspaceCamera.x=drag.x+e.clientX-drag.startX;
workspaceCamera.y=drag.y+e.clientY-drag.startY;
}

if(drag.mode==='zoom'){
const nextScale=Math.max(
0.01,
Math.min(3,drag.scale*Math.exp((drag.startY-e.clientY)*0.008))
);

const rect=workspace.getBoundingClientRect();
const centerX=drag.startX-rect.left;
const centerY=drag.startY-rect.top;
const factor=nextScale/drag.scale;

workspaceCamera.scale=nextScale;
workspaceCamera.x=centerX-(centerX-drag.x)*factor;
workspaceCamera.y=centerY-(centerY-drag.y)*factor;
}

updateWorkspaceCamera();
});

workspace.addEventListener('pointerup',e=>{
if(workspaceCamera.drag?.pointerId!==e.pointerId)return;
finishWorkspaceCameraDrag();
});

workspace.addEventListener('pointercancel',e=>{
if(workspaceCamera.drag?.pointerId!==e.pointerId)return;
finishWorkspaceCameraDrag();
});

workspace.addEventListener('lostpointercapture',()=>{
finishWorkspaceCameraDrag();
});

workspace.addEventListener('contextmenu',e=>{
if(e.target.closest('.node')||e.target.closest('.context-menu'))return;
e.preventDefault();
const rect=workspace.getBoundingClientRect();
openContextMenu(e.clientX-rect.left,e.clientY-rect.top);
});

const nodeMenuCategories={
material:{label:'素材',element:materialMenu},
trigger:{label:'トリガー',element:triggerMenu},
effect:{label:'効果',element:effectMenu},
camera:{label:'カメラ',element:cameraMenu},
panel:{label:'パネル',element:panelMenu}
};

function updateNodeMenuCategories(openCategory=null){
for(const [key,category] of Object.entries(nodeMenuCategories)){
const isOpen=key===openCategory;
category.element.classList.toggle('hidden',!isOpen);

const button=contextMenu.querySelector(`[data-menu="${key}"]`);
if(button){
button.textContent=`${isOpen?'▼':'▶'} ${category.label}`;
}
}
}

function openContextMenu(x,y,connection=null){
state.menuPoint=screenToWorkspace(x,y);
state.insertConnection=connection;
contextMenu.style.left=`${x}px`;
contextMenu.style.top=`${y}px`;
contextMenu.classList.remove('hidden');
updateNodeMenuCategories();
}

contextMenu.addEventListener('click',e=>{
const parent=e.target.closest('[data-menu]');

if(parent){
const key=parent.dataset.menu;
const category=nodeMenuCategories[key];
if(!category)return;

const willOpen=category.element.classList.contains('hidden');
updateNodeMenuCategories(willOpen?key:null);
return;
}

const create=e.target.closest('[data-create]');

if(create){
const insertConnection=state.insertConnection;
const menuPoint={...state.menuPoint};
const nodeType=create.dataset.create;

contextMenu.classList.add('hidden');
state.insertConnection=null;

if(insertConnection){
insertNodeIntoConnection(
nodeType,
insertConnection,
menuPoint
);
}else{
addNode(
nodeType,
menuPoint.x,
menuPoint.y
);
}
}
});

document.addEventListener('pointerdown',e=>{
if(!contextMenu.contains(e.target)&&!workspace.contains(e.target.closest?.('.context-menu')||null))contextMenu.classList.add('hidden');
});

// Workspace and node-edit history (separate from lasso/path stroke history).
const editorHistory={undo:[],redo:[],pending:null,restoring:false,limit:80};
function cloneEditorValue(value,seen=new WeakMap()){
if(value===null||typeof value!=='object')return value;
if(value instanceof Element||value instanceof Blob||value instanceof ImageBitmap)return value;
if(seen.has(value))return seen.get(value);
if(value instanceof Set){const copy=new Set();seen.set(value,copy);for(const item of value)copy.add(cloneEditorValue(item,seen));return copy;}
if(value instanceof Map){const copy=new Map();seen.set(value,copy);for(const [key,item] of value)copy.set(key,cloneEditorValue(item,seen));return copy;}
if(Array.isArray(value)){const copy=[];seen.set(value,copy);for(const item of value)copy.push(cloneEditorValue(item,seen));return copy;}
if(Object.getPrototypeOf(value)!==Object.prototype)return value;
const copy={};seen.set(value,copy);
for(const [key,item] of Object.entries(value))copy[key]=cloneEditorValue(item,seen);
return copy;
}
function editorSnapshot(){
return {nodes:cloneEditorValue(state.nodes),connections:cloneEditorValue(state.connections),selectedNodeId:state.selectedNodeId,selectedConnectionId:state.selectedConnectionId};
}
function editorHistorySignature(snapshot){
return JSON.stringify({nodes:snapshot.nodes,connections:snapshot.connections},(key,value)=>{
if(['panUndoStack','panRedoStack','clickUndoStack','clickRedoStack','panPath'].includes(key))return undefined;
if(value instanceof Element)return '[media-element]';
if(value instanceof Blob)return '[binary-file]';
return value;
});
}
function commitEditorHistory(before){
if(!before||editorHistory.restoring)return;
if(editorHistorySignature(before)===editorHistorySignature(editorSnapshot()))return;
editorHistory.undo.push(before);
if(editorHistory.undo.length>editorHistory.limit)editorHistory.undo.shift();
editorHistory.redo=[];
}
function beginEditorHistory(){if(!editorHistory.restoring&&!editorHistory.pending)editorHistory.pending=editorSnapshot();}
function finishEditorHistory(){
if(!editorHistory.pending)return;
const before=editorHistory.pending;editorHistory.pending=null;
commitEditorHistory(before);
}
function resetEditorHistory(){editorHistory.undo=[];editorHistory.redo=[];editorHistory.pending=null;}
function applyEditorHistory(snapshot){
editorHistory.restoring=true;
if(typeof cancelPreviewScene==='function')cancelPreviewScene();
state.nodes=cloneEditorValue(snapshot.nodes);
state.connections=cloneEditorValue(snapshot.connections);
state.selectedNodeId=snapshot.selectedNodeId&&state.nodes.some(n=>n.id===snapshot.selectedNodeId)?snapshot.selectedNodeId:null;
state.selectedNodeIds.clear();
state.selectedConnectionId=snapshot.selectedConnectionId;
state.connecting=null;state.dragging=null;state.connectionAnchorDrag=null;
renderNodes();renderSettings();renderConnections();renderMediaList();
editorHistory.restoring=false;
}
function stepEditorHistory(redo){
finishEditorHistory();
const source=redo?editorHistory.redo:editorHistory.undo;
if(!source.length)return;
const current=editorSnapshot();
const next=source.pop();
const dest=redo?editorHistory.undo:editorHistory.redo;
dest.push(current);
applyEditorHistory(next);
}
// Group continuous number/text edits into one history entry per focus session.
document.addEventListener('focusin',e=>{
if(settingsPanel.contains(e.target)&&e.target.matches('input,textarea,select'))beginEditorHistory();
},true);
document.addEventListener('focusout',e=>{
if(settingsPanel.contains(e.target))setTimeout(finishEditorHistory,0);
},true);
// Capture settings button/checkbox changes, node drags, connection handles and line controls.
document.addEventListener('pointerdown',e=>{
if(e.button!==0)return;
if(settingsPanel.contains(e.target)||workspace.contains(e.target)||connectionsSvg.contains(e.target))beginEditorHistory();
},true);
window.addEventListener('pointerup',()=>setTimeout(finishEditorHistory,0));
window.addEventListener('pointercancel',()=>setTimeout(finishEditorHistory,0));
// For keyboard-based changes to select boxes / fields, commit when the field blurs.
document.addEventListener('keydown',e=>{
if(!(e.ctrlKey||e.metaKey)||e.altKey)return;
const key=e.key.toLowerCase();
if(key!=='z'&&key!=='y')return;
const selected=getNode(state.selectedNodeId);
// Existing lasso and drawn-pan histories retain their own shortcut handling.
if(selected?.type==='click')return;
if(selected?.type==='pan'&&(selected.panUndoStack?.length||selected.panRedoStack?.length))return;
const active=document.activeElement;
if(active&&active!==document.body&&active instanceof HTMLElement&&!settingsPanel.contains(active)&&['INPUT','TEXTAREA'].includes(active.tagName))return;
e.preventDefault();e.stopImmediatePropagation();
stepEditorHistory(key==='y'||(key==='z'&&e.shiftKey));
},true);

let copiedNodeData=null;
let pasteOffset=0;

function copyNodeData(node){
const copied={
...node,
world:node.world?{
...node.world,
views:node.world.views?JSON.parse(JSON.stringify(node.world.views)):undefined
}:undefined,
animation:node.animation?{
...node.animation,
views:node.animation.views?JSON.parse(JSON.stringify(node.animation.views)):undefined
}:undefined,
clickTarget:node.clickTarget?{...node.clickTarget}:undefined,
clickView:node.clickView?{...node.clickView}:undefined,
clickPolygon:[],
clickRegions:cloneClickRegions(node.clickRegions),
clickFrameRegions:node.clickFrameRegions?Object.fromEntries(
Object.entries(node.clickFrameRegions).map(([frame,regions])=>[
frame,
cloneClickRegions(regions)
])
):{},
clickUndoStack:[],
clickRedoStack:[],
dialoguePages:node.dialoguePages?[...node.dialoguePages]:undefined,
dialogueView:node.dialogueView?{...node.dialogueView}:undefined,
panView:node.panView?{...node.panView}:undefined,
panPath:node.panPath?node.panPath.map(point=>({...point})):undefined,
panUndoStack:[],
panRedoStack:[]
};

return copied;
}

document.addEventListener('keydown',e=>{
const target=e.target;

if(
target instanceof HTMLInputElement||
target instanceof HTMLTextAreaElement||
target instanceof HTMLSelectElement||
target?.isContentEditable
){
return;
}

const selectedNode=getNode(state.selectedNodeId);
const key=e.key.toLowerCase();

if((e.ctrlKey||e.metaKey)&&!e.altKey&&key==='a'){
e.preventDefault();

state.selectedNodeIds=new Set(state.nodes.map(node=>node.id));
state.selectedNodeId=null;
state.selectedConnectionId=null;

renderNodes();
renderSettings();

if(state.nodes.length===0)return;

let minX=Infinity;
let minY=Infinity;
let maxX=-Infinity;
let maxY=-Infinity;

for(const node of state.nodes){
const el=Array.from(nodesLayer.querySelectorAll('.node')).find(item=>item.dataset.id===node.id);
if(!el)continue;

minX=Math.min(minX,node.x);
minY=Math.min(minY,node.y);
maxX=Math.max(maxX,node.x+el.offsetWidth);
maxY=Math.max(maxY,node.y+el.offsetHeight);
}

for(const connection of state.connections){
if(!Array.isArray(connection.anchors))continue;

for(const anchor of connection.anchors){
minX=Math.min(minX,anchor.x);
minY=Math.min(minY,anchor.y);
maxX=Math.max(maxX,anchor.x);
maxY=Math.max(maxY,anchor.y);
}
}

if(!Number.isFinite(minX))return;

const padding=100;
const contentWidth=Math.max(1,maxX-minX);
const contentHeight=Math.max(1,maxY-minY);

const viewportWidth=workspace.clientWidth;
const viewportHeight=workspace.clientHeight;

const availableWidth=Math.max(1,viewportWidth-padding*2);
const availableHeight=Math.max(1,viewportHeight-padding*2);

const scale=Math.min(
3,
availableWidth/contentWidth,
availableHeight/contentHeight
);

workspaceCamera.scale=Math.max(0.01,scale);

workspaceCamera.x=viewportWidth/2-(minX+contentWidth/2)*workspaceCamera.scale;
workspaceCamera.y=viewportHeight/2-(minY+contentHeight/2)*workspaceCamera.scale;

updateWorkspaceCamera();
renderConnections();

return;
}

if(selectedNode?.type==='click'&&(e.ctrlKey||e.metaKey)&&!e.altKey){
if(key==='z'||key==='y'){
e.preventDefault();

ensureClickLassoHistory(selectedNode);

const undo=key==='z';
const source=undo?selectedNode.clickUndoStack:selectedNode.clickRedoStack;
const destination=undo?selectedNode.clickRedoStack:selectedNode.clickUndoStack;

if(source.length===0)return;

destination.push(snapshotClickLasso(selectedNode));
restoreClickLasso(selectedNode,source.pop());

renderSettings();
return;
}
}

if((e.ctrlKey||e.metaKey)&&!e.altKey&&key==='c'){
if(!selectedNode||selectedNode.type==='start')return;

e.preventDefault();
copiedNodeData=copyNodeData(selectedNode);
pasteOffset=0;
return;
}

if((e.ctrlKey||e.metaKey)&&!e.altKey&&key==='v'){
if(!copiedNodeData)return;

e.preventDefault();

pasteOffset+=40;

const editBefore=editorSnapshot();
const newNode=copyNodeData(copiedNodeData);
newNode.id=uid(newNode.type);
newNode.x=copiedNodeData.x+pasteOffset;
newNode.y=copiedNodeData.y+pasteOffset;

state.nodes.push(newNode);
commitEditorHistory(editBefore);
renderNodes();
selectNode(newNode.id);
return;
}

if(
selectedNode?.type==='pan'&&
(e.ctrlKey||e.metaKey)&&
key==='z'
){
e.preventDefault();

if(selectedNode.panUndoStack.length===0)return;

selectedNode.panRedoStack.push(
selectedNode.panPath.map(point=>({
yaw:point.yaw,
pitch:point.pitch
}))
);

selectedNode.panPath=
selectedNode.panUndoStack.pop();

renderSettings();
return;
}

if(
selectedNode?.type==='pan'&&
(e.ctrlKey||e.metaKey)&&
key==='y'
){
e.preventDefault();

if(selectedNode.panRedoStack.length===0)return;

selectedNode.panUndoStack.push(
selectedNode.panPath.map(point=>({
yaw:point.yaw,
pitch:point.pitch
}))
);

selectedNode.panPath=
selectedNode.panRedoStack.pop();

renderSettings();
return;
}

if(e.key!=='Delete')return;

const editBefore=editorSnapshot();
if(state.selectedConnectionId){
state.connections=
state.connections.filter(
c=>c.id!==state.selectedConnectionId
);

state.selectedConnectionId=null;
commitEditorHistory(editBefore);
renderConnections();
renderSettings();
return;
}

const id=
state.selectedNodeId;

if(!id||id==='start')return;

state.nodes=
state.nodes.filter(
n=>n.id!==id
);

state.connections=
state.connections.filter(
c=>c.from!==id&&c.to!==id
);

state.selectedNodeId=null;
commitEditorHistory(editBefore);
renderNodes();
renderSettings();
});

function startConnection(e,nodeId,nodeEl){
beginEditorHistory();
const fromPort=nodeEl.querySelector('.port.output');
if(!fromPort)return;

state.selectedConnectionId=null;

const p=getPortCenter(fromPort);
state.connecting={from:nodeId,start:p,current:p};
window.addEventListener('pointermove',onConnectionMove);
window.addEventListener('pointerup',onConnectionEnd,{once:true});
renderConnections();
}

function onConnectionMove(e){
if(!state.connecting)return;
state.connecting.current=workspacePointFromEvent(e);
renderConnections();
}

function onConnectionEnd(e){
window.removeEventListener('pointermove',onConnectionMove);
if(!state.connecting)return;
const target=document.elementFromPoint(e.clientX,e.clientY);
const input=target?.closest?.('.port.input');
if(input){
const to=input.closest('.node')?.dataset.id;
const from=state.connecting.from;
if(to&&to!==from&&getNode(from)&&getNode(to)&&!state.connections.some(c=>c.from===from&&c.to===to)){
state.connections.push({id:uid('conn'),from,to});
}
}
state.connecting=null;
finishEditorHistory();
renderConnections();
renderSettings();
}

function getPortCenter(port){
const wr=workspace.getBoundingClientRect();
const r=port.getBoundingClientRect();
return screenToWorkspace(
r.left+r.width/2-wr.left,
r.top+r.height/2-wr.top
);
}

function curvePath(a,b){
const dx=Math.max(60,Math.abs(b.x-a.x)*.45);
return `M ${a.x} ${a.y} C ${a.x+dx} ${a.y}, ${b.x-dx} ${b.y}, ${b.x} ${b.y}`;
}

function connectionCurve(points){
if(points.length===2)return curvePath(points[0],points[1]);

let d=`M ${points[0].x} ${points[0].y}`;

for(let i=0;i<points.length-1;i++){
const p0=points[Math.max(0,i-1)];
const p1=points[i];
const p2=points[i+1];
const p3=points[Math.min(points.length-1,i+2)];
const k=1/6;

const x1=p1.x+(p2.x-p0.x)*k;
const y1=p1.y+(p2.y-p0.y)*k;
const x2=p2.x-(p3.x-p1.x)*k;
const y2=p2.y-(p3.y-p1.y)*k;

d+=` C ${x1} ${y1}, ${x2} ${y2}, ${p2.x} ${p2.y}`;
}

return d;
}

function renderConnections(){
connectionsSvg.innerHTML='';

for(const c of state.connections){
const fromEl=nodesLayer.querySelector(`.node[data-id="${c.from}"] .port.output`);
const toEl=nodesLayer.querySelector(`.node[data-id="${c.to}"] .port.input`);

if(!fromEl||!toEl)continue;

const a=getPortCenter(fromEl);
const b=getPortCenter(toEl);
const anchors=Array.isArray(c.anchors)?c.anchors:[];
const points=[a,...anchors,b];
const d=connectionCurve(points);

const path=document.createElementNS('http://www.w3.org/2000/svg','path');
path.setAttribute('d',d);
const isSelectedConnection=
state.selectedConnectionId===c.id||
(
state.selectedNodeIds.has(c.from)&&
state.selectedNodeIds.has(c.to)
);

path.setAttribute(
'class',
isSelectedConnection
?'connection-path selected'
:'connection-path'
);
connectionsSvg.appendChild(path);

const hit=document.createElementNS('http://www.w3.org/2000/svg','path');
hit.setAttribute('d',d);
hit.setAttribute('class','connection-hit');

hit.addEventListener('click',e=>{
e.preventDefault();
e.stopPropagation();

const now=Date.now();
const last=state.lastConnectionClick;

const doubleClick=
last&&
last.id===c.id&&
now-last.time<400&&
Math.hypot(e.clientX-last.x,e.clientY-last.y)<12;

state.lastConnectionClick={
id:c.id,
time:now,
x:e.clientX,
y:e.clientY
};

state.selectedConnectionId=c.id;
state.selectedNodeId=null;

if(doubleClick){
const click=workspacePointFromEvent(e);
let insert=anchors.length;
let best=Infinity;

const probe=document.createElementNS('http://www.w3.org/2000/svg','path');
probe.setAttribute('d',d);

const total=probe.getTotalLength();
let nearestLength=0;

for(let j=0;j<=160;j++){
const length=total*j/160;
const p=probe.getPointAtLength(length);
const dist=Math.hypot(click.x-p.x,click.y-p.y);

if(dist<best){
best=dist;
nearestLength=length;
}
}

const lengths=[];

for(let i=1;i<points.length;i++){
const partial=connectionCurve(points.slice(0,i+1));
const part=document.createElementNS('http://www.w3.org/2000/svg','path');
part.setAttribute('d',partial);
lengths.push(part.getTotalLength());
}

insert=lengths.findIndex(length=>nearestLength<=length);

if(insert<0){
insert=anchors.length;
}

anchors.splice(insert,0,{
x:click.x,
y:click.y
});

c.anchors=anchors;
}

renderNodes();
renderSettings();
});

connectionsSvg.appendChild(hit);

if(state.selectedConnectionId===c.id){
anchors.forEach((anchor,index)=>{
const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');

dot.setAttribute('cx',anchor.x);
dot.setAttribute('cy',anchor.y);
dot.setAttribute('r','7');
dot.setAttribute('fill','#ffffff');
dot.setAttribute('stroke','#f97316');
dot.setAttribute('stroke-width','2.5');

dot.style.pointerEvents='auto';
dot.style.cursor='grab';

dot.addEventListener('pointerdown',e=>{
if(e.button!==0)return;

e.preventDefault();
e.stopPropagation();

state.connectionAnchorDrag={
id:c.id,
index
};
});

dot.addEventListener('contextmenu',e=>{
e.preventDefault();
e.stopPropagation();

c.anchors.splice(index,1);
renderConnections();
});

connectionsSvg.appendChild(dot);
});
}

const midPoint=path.getPointAtLength(path.getTotalLength()/2);
const mid={x:midPoint.x,y:midPoint.y};

const g=document.createElementNS('http://www.w3.org/2000/svg','g');
g.setAttribute('class','connection-plus');
g.setAttribute('transform',`translate(${mid.x} ${mid.y})`);

const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
circle.setAttribute('r','11');

const text=document.createElementNS('http://www.w3.org/2000/svg','text');
text.textContent='+';
text.setAttribute('y','1');

g.append(circle,text);

g.addEventListener('click',e=>{
e.preventDefault();
e.stopPropagation();

const position=workspaceToScreen(mid.x,mid.y);
openContextMenu(position.x,position.y,c);
});

connectionsSvg.appendChild(g);
}

if(state.connecting){
const p=document.createElementNS('http://www.w3.org/2000/svg','path');
p.setAttribute('d',curvePath(state.connecting.start,state.connecting.current));
p.setAttribute('class','temp-path');
connectionsSvg.appendChild(p);
}
}

window.addEventListener('pointermove',e=>{
const drag=state.connectionAnchorDrag;
if(!drag)return;

const connection=state.connections.find(c=>c.id===drag.id);

if(!connection?.anchors?.[drag.index])return;

const position=workspacePointFromEvent(e);

connection.anchors[drag.index]={
x:position.x,
y:position.y
};

renderConnections();
});

window.addEventListener('pointerup',()=>{
state.connectionAnchorDrag=null;
});

function insertNodeIntoConnection(type,connection,mid){
beginEditorHistory();
const fromId=connection.from;
const toId=connection.to;
const fromNode=getNode(fromId);
const toNode=getNode(toId);

const existingClickBranches=state.connections.filter(c=>{
if(c.from!==fromId)return false;
const target=getNode(c.to);
return target?.type==='click';
});

const shouldCreateClickBranch=
type==='click'&&
fromNode?.type==='world'&&
(
toNode?.type==='click'||
existingClickBranches.length>0
);

if(shouldCreateClickBranch){
const offsetY=50+existingClickBranches.length*45;

const newNode=addNode(
type,
mid.x-75,
mid.y+offsetY
);

const alreadyConnected=state.connections.some(c=>{
return c.from===fromId&&c.to===newNode.id;
});

if(!alreadyConnected){
state.connections.push({
id:uid('conn'),
from:fromId,
to:newNode.id
});
}

finishEditorHistory();
renderNodes();
renderSettings();
return;
}

const newNode=addNode(type,mid.x-75,mid.y-35);

state.connections=state.connections.filter(c=>c.id!==connection.id);

state.connections.push({
id:uid('conn'),
from:fromId,
to:newNode.id
});

state.connections.push({
id:uid('conn'),
from:newNode.id,
to:toId
});

finishEditorHistory();
renderNodes();
renderSettings();
}

playBtn.addEventListener('click',startPreview);
closePreviewBtn.addEventListener('click',stopPreview);

gameViewport.addEventListener('click',e=>{
if(gamePreview.classList.contains('hidden'))return;
if(!state.previewDialogueNodeId)return;
if(e.button!==0)return;

e.preventDefault();
advanceDialogue();
});

document.addEventListener('keydown',e=>{
if(gamePreview.classList.contains('hidden'))return;
if(!state.previewDialogueNodeId)return;
if(e.isComposing||e.key==='Process'||e.keyCode===229)return;
if(e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;

const target=e.target;

if(target instanceof HTMLElement&&(
target.isContentEditable||
['INPUT','TEXTAREA','SELECT'].includes(target.tagName)
)){
return;
}

if(!['Enter','Space','KeyZ'].includes(e.code))return;

e.preventDefault();
e.stopImmediatePropagation();
advanceDialogue();
},true);

let gamePreviewDrag=null;

function getActivePreviewWorld(){
const animation=state.previewAnimation;

if(animation?.world){
return animation.world;
}

const worldNode=getNode(state.previewWorldNodeId);

return worldNode?.type==='world'
?worldNode.world
:null;
}

function isPreviewCameraLocked(){
const animation=state.previewAnimation;
const controller=activeIndependentKeyframe;

if(!animation||!controller)return false;
if(controller.sourceId!==animation.nodeId)return false;

return getKeyframeNodeFrames(controller.node).length>0;
}

gameCanvas.addEventListener('pointerdown',e=>{
if(isPreviewCameraLocked())return;
if(state.previewDialogueNodeId)return;
if(e.button!==0)return;

const world=getActivePreviewWorld();
if(!world)return;

gamePreviewDrag={
x:e.clientX,
y:e.clientY,
yaw:world.yaw,
pitch:world.pitch,
moved:false,
pointerId:e.pointerId
};

gameCanvas.setPointerCapture(e.pointerId);
});

gameCanvas.addEventListener('pointermove',e=>{
if(!gamePreviewDrag)return;

if(isPreviewCameraLocked()){
gamePreviewDrag=null;
return;
}

const world=getActivePreviewWorld();
if(!world)return;

const dx=e.clientX-gamePreviewDrag.x;
const dy=e.clientY-gamePreviewDrag.y;

if(Math.hypot(dx,dy)>4){
gamePreviewDrag.moved=true;
}

world.yaw=gamePreviewDrag.yaw-dx*0.008;

world.pitch=clamp(
gamePreviewDrag.pitch+dy*0.008,
-Math.PI/2+0.02,
Math.PI/2-0.02
);

drawPanoramaPreview(gameCanvas,world);
});

gameCanvas.addEventListener('pointerup',e=>{
if(!gamePreviewDrag)return;

const moved=gamePreviewDrag.moved;

if(gameCanvas.hasPointerCapture(e.pointerId)){
gameCanvas.releasePointerCapture(e.pointerId);
}

gamePreviewDrag=null;

if(moved||state.previewClickTriggerIds.length===0)return;

const world=getActivePreviewWorld();
if(!world)return;

const animation=state.previewAnimation;

for(const triggerId of state.previewClickTriggerIds){
const trigger=getNode(triggerId);
if(!trigger)continue;

let regions=null;

if(animation&&trigger.clickAnimationMode){
const fps=Math.max(1,Number(trigger.clickFrameFps)||8);
const frame=Math.max(
0,
Math.floor(animation.video.currentTime*fps)
);

regions=getClickFrameRegions(trigger,frame);
}

if(!isClickTargetHit(trigger,world,e.clientX,e.clientY,regions)){
continue;
}

clearPreviewBranchTimers();
state.previewClickTriggerIds=[];
previewOutgoing(trigger.id);
if(!state.connections.some(c=>c.from===trigger.id)){
previewMessage.textContent='クリック発火・接続先なし';
}

break;
}
});
gameCanvas.addEventListener('pointercancel',e=>{
if(gameCanvas.hasPointerCapture(e.pointerId))gameCanvas.releasePointerCapture(e.pointerId);
gamePreviewDrag=null;
});
gameCanvas.addEventListener('wheel',e=>{
if(gamePreview.classList.contains('hidden'))return;

const world=getActivePreviewWorld();
if(!world)return;

e.preventDefault();

if(state.previewDialogueNodeId)return;
if(isPreviewCameraLocked())return;

world.zoom=clamp(
world.zoom+(e.deltaY>0?-0.1:0.1),
0.6,
2.2
);

drawPanoramaPreview(gameCanvas,world);
},{passive:false});

// Parallel preview: media owns the background; triggers run independently.
let previewSceneEpoch=0;
let activeIndependentKeyframe=null;
const previewBranchTimers=new Set();
const previewVisited=new Set();
function clearPreviewBranchTimers(){
for(const timer of previewBranchTimers)clearTimeout(timer);
previewBranchTimers.clear();
if(state.previewTimer){clearTimeout(state.previewTimer);state.previewTimer=null;}
}
function cancelPreviewScene(){
activeIndependentKeyframe=null;
previewSceneEpoch++;
clearPreviewBranchTimers();
previewVisited.clear();
state.previewClickTriggerIds=[];
state.previewDialogueNodeId=null;
stopDialogueTyping();
dialogueOverlay.classList.add('hidden');
stopCameraAnimation();
stopPreviewAnimation();
state.previewWorldNodeId=null;
}
function previewOutgoing(nodeId,phase='start'){
const source=getNode(nodeId);
const sourceIsMedia=source?.type==='world'||source?.type==='animation';

const targets=state.connections
.filter(c=>c.from===nodeId)
.map(c=>getNode(c.to))
.filter(Boolean)
.filter(target=>{
if(!sourceIsMedia)return true;

const targetIsMedia=target.type==='world'||target.type==='animation';

if(phase==='end')return targetIsMedia;

return !targetIsMedia;
});

for(const target of targets){
showPreviewNode(target.id);
}
}
function schedulePreviewBranch(seconds,callback){
const epoch=previewSceneEpoch;
const timer=setTimeout(()=>{
previewBranchTimers.delete(timer);
if(epoch===previewSceneEpoch&&!gamePreview.classList.contains('hidden'))callback();
},Math.max(0,seconds)*1000);
previewBranchTimers.add(timer);
}
function canUsePreviewClick(node){
return Boolean(node.clickTarget?.initialized||Object.values(node.clickFrameRegions||{}).some(regions=>Array.isArray(regions)&&regions.some(r=>r.mode==='add'&&r.points?.length>=3)));
}

function startPreview(){
cancelPreviewScene();
stopEffectAnimation();
state.previewNodeId=null;
state.lastCameraView=null;
state.pendingAnimationFade=null;
fadeOverlay.style.opacity=0;
fadeOverlay.style.pointerEvents='none';
if(!state.connections.some(c=>c.from==='start')){
alert('STARTからノードへ接続してください。');return;
}
gamePreview.classList.remove('hidden');
resizeGameCanvas();
drawPanoramaPreview(gameCanvas,{image:null,yaw:0,pitch:0,zoom:1});
previewOutgoing('start');
}


function stopPreview(){
cancelPreviewScene();
stopEffectAnimation();
state.previewNodeId=null;
fadeOverlay.style.opacity=0;
fadeOverlay.style.pointerEvents='none';
gamePreview.classList.add('hidden');
}


function stopPreviewTimer(){
if(state.previewTimer){
clearTimeout(state.previewTimer);
state.previewTimer=null;
}

if(!state.previewAnimation&&state.previewNodeId!==null){
const previousWorld=getNode(state.previewWorldNodeId);

if(previousWorld?.type==='world'){
state.lastCameraView={
yaw:previousWorld.world.yaw,
pitch:previousWorld.world.pitch,
zoom:previousWorld.world.zoom
};
}
}

stopPreviewAnimation();
}

function stopPreviewAnimation(){
const playback=state.previewAnimation;
if(!playback)return;

state.lastCameraView={
yaw:playback.world.yaw,
pitch:playback.world.pitch,
zoom:playback.world.zoom
};

state.previewAnimation=null;

if(playback.frameId){
cancelAnimationFrame(playback.frameId);
}

playback.video.pause();
playback.video.removeAttribute('src');
playback.video.load();
}

function playPreviewAnimation(node){
const media=mediaLibrary.find(item=>{
return item.id===node.animation.mediaId&&item.fileType==='mp4';
});

if(!media||!media.url||!(media.duration>0)){
previewMessage.textContent='MP4素材を選択してください';
return;
}

const video=document.createElement('video');

video.muted=true;
video.playsInline=true;
video.preload='auto';
video.loop=false;
video.src=media.url;

video.addEventListener('ended',()=>{
if(state.previewAnimation?.video!==video||state.previewAnimation.finished)return;

video.currentTime=0;

const resume=()=>{
if(state.previewAnimation?.video!==video)return;
video.play().catch(error=>{
console.error(error);
previewMessage.textContent='MP4のループ再生に失敗しました';
stopPreviewAnimation();
});
};

if(video.seeking){
video.addEventListener('seeked',resume,{once:true});
}else{
resume();
}
});

const views=node.animation.views||{
pc:{yaw:0,pitch:0,zoom:1},
mobile:{yaw:0,pitch:0,zoom:1}
};

const selectedView=views[state.displayMode]||views.pc;

const effectiveView=node.inheritCamera&&state.lastCameraView
?state.lastCameraView
:selectedView;

const world={
image:video,
yaw:Number(effectiveView.yaw)||0,
pitch:Number(effectiveView.pitch)||0,
zoom:Number(effectiveView.zoom)||1
};

const duration=media.duration;

const requestedDuration=Number(node.animation.playDuration);
const loopCount=Number(node.animation.loopCount);

const playDuration=requestedDuration>0
?requestedDuration
:duration*(loopCount>0?loopCount:1);

const startTime=Math.max(
0,
Math.min(duration-0.001,Number(node.animation.startTime)||0)
);

const playback={
video,
world,
frameId:null,
nodeId:node.id,
startedAt:null
};

state.previewAnimation=playback;
state.previewWorldNodeId=null;

previewMessage.textContent=media.fileName;

const finish=()=>{
if(state.previewAnimation!==playback||playback.finished)return;

playback.finished=true;
video.pause();

try{
video.currentTime=Math.max(0,media.duration-0.001);
}catch(error){
console.warn('最終フレームへの移動に失敗しました',error);
}

drawPanoramaPreview(gameCanvas,world);

// 再生終了時に接続先のメディアを開始する
previewOutgoing(node.id,'end');
};

const draw=now=>{
if(state.previewAnimation!==playback)return;

if(gamePreview.classList.contains('hidden')){
stopPreviewAnimation();
return;
}

if(!node.animation.infiniteLoop&&playback.startedAt!==null&&!playback.finished){
if(now-playback.startedAt>=playDuration*1000)finish();
}

if(playback.startedAt!==null&&!playback.finished){
const cameraNode=activeIndependentKeyframe?.sourceId===node.id
?activeIndependentKeyframe.node
:null;

if(cameraNode&&getKeyframeNodeFrames(cameraNode).length>0){
const elapsed=(now-playback.startedAt)/1000;
const cameraTime=getMediaCameraLoopTime(node,media,elapsed);
const camera=getIndependentCameraAt(cameraNode,cameraTime,getMediaCameraBase(node));

world.yaw=camera.yaw;
world.pitch=camera.pitch;
world.zoom=camera.zoom;
}
}

drawPanoramaPreview(gameCanvas,world);
if(playback.finished)return;

const pendingFade=state.pendingAnimationFade;

if(pendingFade?.nodeId===node.id){
state.pendingAnimationFade=null;

runFadeEffect(
{effectSeconds:pendingFade.seconds},
1,
0,
()=>{}
);
}

playback.frameId=requestAnimationFrame(draw);
};

video.addEventListener('error',()=>{
if(state.previewAnimation!==playback)return;
previewMessage.textContent='MP4の再生に失敗しました';
stopPreviewAnimation();
});

video.addEventListener('loadeddata',async()=>{
if(state.previewAnimation!==playback)return;

try{
if(startTime>0){
video.currentTime=startTime;

await new Promise((resolve,reject)=>{
const onSeeked=()=>{cleanup();resolve()};
const onError=()=>{cleanup();reject(new Error('シークに失敗しました'))};
const cleanup=()=>{
video.removeEventListener('seeked',onSeeked);
video.removeEventListener('error',onError);
};
video.addEventListener('seeked',onSeeked);
video.addEventListener('error',onError);
});
}

if(state.previewAnimation!==playback)return;

await video.play();

if(state.previewAnimation!==playback)return;

playback.startedAt=performance.now();
playback.frameId=requestAnimationFrame(draw);
}catch(error){
if(state.previewAnimation!==playback)return;
console.error(error);
previewMessage.textContent='MP4を再生できませんでした';
stopPreviewAnimation();
}
},{once:true});

video.load();
}

function stopDialogueTyping(){
if(state.dialogueTypeTimer){
clearInterval(state.dialogueTypeTimer);
state.dialogueTypeTimer=null;
}
}

function stopEffectAnimation(){
if(state.effectAnimationFrame){
cancelAnimationFrame(state.effectAnimationFrame);
state.effectAnimationFrame=null;
}
}

function stopCameraAnimation(){
if(state.cameraAnimationFrame){
cancelAnimationFrame(state.cameraAnimationFrame);
state.cameraAnimationFrame=null;
}

if(state.panVideo){
state.panVideo.pause();
state.panVideo.removeAttribute('src');
state.panVideo.load();
state.panVideo=null;
}
}

function runTimedPan(node,worldNode,video,onComplete){
const duration=Math.max(0.1,Number(node.panSeconds)||3);
const durationMs=duration*1000;

const frames=node.panKeyframes||[];

if(frames.length===0){
onComplete();
return;
}

const start=performance.now();

const animate=now=>{
if(state.panVideo!==video)return;

const elapsed=Math.min(
duration,
(now-start)/1000
);

const view=getTimedPanView(node,elapsed);

worldNode.world.yaw=view.yaw;
worldNode.world.pitch=view.pitch;
worldNode.world.zoom=view.zoom;

drawPanoramaPreview(
gameCanvas,
worldNode.world
);

if((now-start)<durationMs){
state.cameraAnimationFrame=requestAnimationFrame(animate);
}else{
state.cameraAnimationFrame=null;
onComplete();
}
};

state.cameraAnimationFrame=requestAnimationFrame(animate);
}

function runPan(node,worldNode,onComplete){
stopCameraAnimation();

if(!worldNode){
onComplete();
return;
}

const startView=
getCameraViewBeforeNode(node.id);

const goalView=
getCameraViewAfterNode(node.id);

if(!startView||!goalView){
onComplete();
return;
}

const startPoint={
yaw:startView.yaw,
pitch:startView.pitch
};

const goalPoint={
yaw:goalView.yaw,
pitch:goalView.pitch
};

const middlePoints=
node.panPath.length>1
?node.panPath.slice(1).map(point=>({
yaw:point.yaw,
pitch:-point.pitch
}))
:[];

const path=[
startPoint,
...middlePoints,
goalPoint
];

const startZoom=
startView.zoom;

const endZoom=
goalView.zoom;

const segments=[];
let totalLength=0;

for(let i=1;i<path.length;i++){
const from=path[i-1];
const to=path[i];

const dyaw=
angleDiff(
to.yaw,
from.yaw
);

const dpitch=
to.pitch-
from.pitch;

const length=
Math.hypot(
dyaw,
dpitch
);

segments.push({
from,
to,
length,
start:totalLength
});

totalLength+=length;
}

const duration=
Math.max(
0,
node.panSeconds
)*1000;

if(duration===0){
worldNode.world.yaw=
goalView.yaw;

worldNode.world.pitch=
goalView.pitch;

worldNode.world.zoom=
goalView.zoom;

drawPanoramaPreview(
gameCanvas,
worldNode.world
);

onComplete();
return;
}

worldNode.world.yaw=
startView.yaw;

worldNode.world.pitch=
startView.pitch;

worldNode.world.zoom=
startView.zoom;

drawPanoramaPreview(
gameCanvas,
worldNode.world
);

const start=
performance.now();

const animate=now=>{
const progress=
Math.min(
1,
(now-start)/duration
);

if(totalLength>0){
const distance=
totalLength*progress;

let segment=
segments[
segments.length-1
];

for(const candidate of segments){
if(
distance<=
candidate.start+
candidate.length
){
segment=candidate;
break;
}
}

const localDistance=
distance-
segment.start;

const t=
segment.length>0
?clamp(
localDistance/
segment.length,
0,
1
)
:1;

worldNode.world.yaw=
normalizeAngle(
segment.from.yaw+
angleDiff(
segment.to.yaw,
segment.from.yaw
)*t
);

worldNode.world.pitch=
segment.from.pitch+
(
segment.to.pitch-
segment.from.pitch
)*t;
}else{
worldNode.world.yaw=
startView.yaw;

worldNode.world.pitch=
startView.pitch;
}

worldNode.world.zoom=
startZoom+
(
endZoom-
startZoom
)*progress;

drawPanoramaPreview(
gameCanvas,
worldNode.world
);

if(progress<1){
state.cameraAnimationFrame=
requestAnimationFrame(
animate
);

return;
}

worldNode.world.yaw=
goalView.yaw;

worldNode.world.pitch=
goalView.pitch;

worldNode.world.zoom=
goalView.zoom;

state.cameraAnimationFrame=null;
onComplete();
};

state.cameraAnimationFrame=
requestAnimationFrame(
animate
);
}

function runFadeEffect(node,fromOpacity,toOpacity,onComplete){
stopEffectAnimation();

const duration=Math.max(0,node.effectSeconds)*1000;

fadeOverlay.classList.remove('hidden');
fadeOverlay.style.opacity=fromOpacity;

if(duration===0){
fadeOverlay.style.opacity=toOpacity;

if(toOpacity===0){
fadeOverlay.style.pointerEvents='none';
}else{
fadeOverlay.style.pointerEvents='auto';
}

onComplete();
return;
}

const start=performance.now();

const animate=now=>{
const progress=Math.min(1,(now-start)/duration);
const opacity=fromOpacity+(toOpacity-fromOpacity)*progress;

fadeOverlay.style.opacity=opacity;

if(progress<1){
state.effectAnimationFrame=requestAnimationFrame(animate);
return;
}

state.effectAnimationFrame=null;

if(toOpacity===0){
fadeOverlay.style.pointerEvents='none';
}else{
fadeOverlay.style.pointerEvents='auto';
}

onComplete();
};

state.effectAnimationFrame=requestAnimationFrame(animate);
}

function showDialoguePage(node,index){
stopDialogueTyping();

applyGameDialogueLayout(node);

let speaker=dialogueOverlay.querySelector('#gameDialogueSpeaker');

if(!speaker){
speaker=document.createElement('div');
speaker.id='gameDialogueSpeaker';
speaker.className='dialogue-speaker';
dialogueOverlay.insertBefore(speaker,dialogueOverlay.firstChild);
}

const speakerName=(node.dialogueSpeaker||'').trim();
speaker.textContent=speakerName;
speaker.classList.toggle('hidden',!speakerName);

const fontSize=Math.max(
10,
Math.min(36,Number(node.dialogueFontSize)||24)
);

dialogueText.style.fontSize=`calc(${fontSize}px * var(--dialogue-scale,1))`;

let thumbnail=dialogueOverlay.querySelector('#gameDialogueThumbnail');

if(!thumbnail){
const content=document.createElement('div');
content.className='dialogue-panel-content';

thumbnail=document.createElement('img');
thumbnail.id='gameDialogueThumbnail';
thumbnail.className='dialogue-panel-thumbnail hidden';
thumbnail.alt='';

dialogueText.parentNode.insertBefore(content,dialogueText);
content.appendChild(thumbnail);
content.appendChild(dialogueText);
}

const thumbnailData=getDialogueThumbnailData(node);

thumbnail.classList.toggle('hidden',!thumbnailData);

if(thumbnailData){
thumbnail.src=thumbnailData;
}else{
thumbnail.removeAttribute('src');
}

const text=node.dialoguePages[index]||'';
const characters=[...text];

state.previewDialoguePageIndex=index;
dialogueText.textContent='';
dialogueOverlay.classList.remove('hidden');

let position=0;

state.dialogueTypeTimer=setInterval(()=>{
if(position>=characters.length){
stopDialogueTyping();
return;
}
dialogueText.textContent+=characters[position];
position++;
},35);
}

function advanceDialogue(){
const node=getNode(state.previewDialogueNodeId);
if(!node)return;

if(state.dialogueTypeTimer){
stopDialogueTyping();

dialogueText.textContent=
node.dialoguePages[
state.previewDialoguePageIndex
]||'';

return;
}

const nextIndex=
state.previewDialoguePageIndex+1;

if(nextIndex<node.dialoguePages.length){
showDialoguePage(node,nextIndex);
return;
}

dialogueOverlay.classList.add('hidden');
state.previewDialogueNodeId=null;

previewOutgoing(node.id);
}
function showPreviewNode(nodeId){
const node=getNode(nodeId);
if(!node||gamePreview.classList.contains('hidden'))return;
// A branch converging on an already-active node is executed only once per scene.
if(previewVisited.has(node.id))return;
previewVisited.add(node.id);
if(node.type==='start'){previewOutgoing(node.id);return;}
if(node.type==='world'||node.type==='animation'){
// Only one 360-degree scene is shown at a time.
cancelPreviewScene();
previewVisited.add(node.id);
state.previewNodeId=node.id;
if(node.type==='animation'){
playPreviewAnimation(node);
}else{
state.previewWorldNodeId=node.id;
applyWorldInitialView(node);
previewMessage.textContent=node.world.fileName||'ビュー素材未設定';
drawPanoramaPreview(gameCanvas,node.world);
const epoch=previewSceneEpoch;
const duration=getMediaPlaybackDuration(node,null);
const hasFrames=Boolean(findSceneKeyframeNode(node));
if(hasFrames){
const started=performance.now();
const tick=now=>{
if(epoch!==previewSceneEpoch||gamePreview.classList.contains('hidden'))return;
const elapsed=Math.min(duration,(now-started)/1000);
const animation=activeIndependentKeyframe;
const camera=animation?.sourceId===node.id
?getIndependentCameraAt(animation.node,Math.max(0,elapsed-animation.offset),getMediaCameraBase(node))
:getMediaCameraBase(node);
Object.assign(node.world,camera);
drawPanoramaPreview(gameCanvas,node.world);
if(elapsed<duration)state.cameraAnimationFrame=requestAnimationFrame(tick);
else state.cameraAnimationFrame=null;
};
state.cameraAnimationFrame=requestAnimationFrame(tick);
}
}

if(node.type==='world'&&!node.worldInfiniteLoop){
const duration=getMediaPlaybackDuration(node,null);

schedulePreviewBranch(duration,()=>{
if(state.previewWorldNodeId!==node.id)return;
previewOutgoing(node.id,'end');
});
}

previewOutgoing(node.id,'start');
return;
}
if(node.type==='keyframe'){
const source=findPreviousClickMediaNode(node.id);
if(source){
const media=source.type==='animation'?getClickAnimationMedia(source):null;
activeIndependentKeyframe={node,sourceId:source.id,offset:getTriggerPreviewTime(node.id,source)};
// If this keyframe is started after a wait, its timeline begins at this moment.
if(source.type==='world'&&state.previewWorldNodeId===source.id&&!state.cameraAnimationFrame){
const epoch=previewSceneEpoch;
const duration=getMediaPlaybackDuration(source,null);
const start=performance.now();
const tick=now=>{
if(epoch!==previewSceneEpoch)return;
const elapsed=(now-start)/1000;
const camera=getIndependentCameraAt(node,Math.min(duration,elapsed),getMediaCameraBase(source));
Object.assign(source.world,camera);drawPanoramaPreview(gameCanvas,source.world);
if(elapsed<duration)state.cameraAnimationFrame=requestAnimationFrame(tick);
else state.cameraAnimationFrame=null;
};
state.cameraAnimationFrame=requestAnimationFrame(tick);
}
}
previewOutgoing(node.id);
return;
}
if(node.type==='click'){
if(!canUsePreviewClick(node)){previewOutgoing(node.id);return;}
if(!state.previewClickTriggerIds.includes(node.id))state.previewClickTriggerIds.push(node.id);
previewMessage.textContent='クリック待ち';
return;
}
if(node.type==='time'){
schedulePreviewBranch(Number(node.timeSeconds)||0,()=>previewOutgoing(node.id));
return;
}
if(node.type==='dialogue'){
if(node.dialoguePages.length===0){previewOutgoing(node.id);return;}
state.previewDialogueNodeId=node.id;
showDialoguePage(node,0);
return;
}
if(node.type==='fadeIn'){
stopEffectAnimation();

fadeOverlay.classList.remove('hidden');
fadeOverlay.style.opacity='1';
fadeOverlay.style.pointerEvents='none';

const nextNodes=state.connections
.filter(c=>c.from===node.id)
.map(c=>getNode(c.to))
.filter(Boolean);

const nextVideo=nextNodes.find(n=>n.type==='animation');

if(nextVideo){
state.pendingAnimationFade={
nodeId:nextVideo.id,
seconds:Math.max(0,Number(node.effectSeconds)||0)
};
}

previewOutgoing(node.id);

if(!nextVideo){
runFadeEffect(node,1,0,()=>{});
}

return;
}

if(node.type==='fadeOut'){
runFadeEffect(node,0,1,()=>previewOutgoing(node.id));
return;
}
if(node.type==='pan'){
const sourceNode=getNode(state.previewWorldNodeId)||findPreviousClickMediaNode(node.id);
if(sourceNode?.type==='world')runPan(node,sourceNode,()=>previewOutgoing(node.id));
else previewOutgoing(node.id);
return;
}
previewOutgoing(node.id);
}


function resizeGameCanvas(){
const rect=gamePreview.getBoundingClientRect();
const layout=getActiveLayout();
const aspect=layout.width/layout.height;

let width=rect.width;
let height=width/aspect;

if(height>rect.height){
height=rect.height;
width=height*aspect;
}

gameViewport.style.width=`${Math.max(1,width)}px`;
gameViewport.style.height=`${Math.max(1,height)}px`;

const referenceWidth=layout.width>=layout.height?1280:720;
const dialogueScale=width/referenceWidth;
gameViewport.style.setProperty('--dialogue-scale',String(dialogueScale));

gameCanvas.width=Math.max(1,Math.floor(width));
gameCanvas.height=Math.max(1,Math.floor(height));
}

window.addEventListener('resize',()=>{
renderConnections();
if(!gamePreview.classList.contains('hidden')){
resizeGameCanvas();
const n=getNode(state.previewWorldNodeId);
if(n?.type==='world')drawPanoramaPreview(gameCanvas,n.world);
}
});

const gartEncoder=new TextEncoder();
const gartDecoder=new TextDecoder('utf-8',{fatal:true});

function gartCrc32(bytes){
let crc=0xffffffff;
for(const byte of bytes){
crc^=byte;
for(let bit=0;bit<8;bit++){
crc=(crc>>>1)^((crc&1)?0xedb88320:0);
}
}
return (crc^0xffffffff)>>>0;
}

async function gartCreateZip(entries){
const pieces=[];
const directory=[];
let offset=0;
for(const entry of entries){
const name=gartEncoder.encode(entry.name);
const data=entry.data instanceof Uint8Array?entry.data:new Uint8Array(await entry.data.arrayBuffer());
if(name.length>65535||data.length>0xffffffff)throw new Error('素材がZIPの上限を超えました。');
const crc=gartCrc32(data);
const local=new Uint8Array(30+name.length);
const a=new DataView(local.buffer);
a.setUint32(0,0x04034b50,true);
a.setUint16(4,20,true);
a.setUint16(6,0x0800,true);
a.setUint16(8,0,true);
a.setUint32(14,crc,true);
a.setUint32(18,data.length,true);
a.setUint32(22,data.length,true);
a.setUint16(26,name.length,true);
local.set(name,30);
pieces.push(local,data);
const central=new Uint8Array(46+name.length);
const b=new DataView(central.buffer);
b.setUint32(0,0x02014b50,true);
b.setUint16(4,20,true);
b.setUint16(6,20,true);
b.setUint16(8,0x0800,true);
b.setUint32(16,crc,true);
b.setUint32(20,data.length,true);
b.setUint32(24,data.length,true);
b.setUint16(28,name.length,true);
b.setUint32(42,offset,true);
central.set(name,46);
directory.push(central);
offset+=local.length+data.length;
if(offset>0xffffffff)throw new Error('ファイルサイズがZIPの上限を超えました。');
}
if(entries.length>65535)throw new Error('ファイル数が多すぎます。');
const directorySize=directory.reduce((sum,part)=>sum+part.length,0);
const end=new Uint8Array(22);
const view=new DataView(end.buffer);
view.setUint32(0,0x06054b50,true);
view.setUint16(8,entries.length,true);
view.setUint16(10,entries.length,true);
view.setUint32(12,directorySize,true);
view.setUint32(16,offset,true);
return new Blob([...pieces,...directory,end],{type:'application/zip'});
}

async function gartReadZip(file){
const buffer=await file.arrayBuffer();
const view=new DataView(buffer);
const bytes=new Uint8Array(buffer);
const result=new Map();
let end=-1;
for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
if(view.getUint32(i,true)===0x06054b50&&i+22+view.getUint16(i+20,true)===bytes.length){end=i;break;}
}
if(end<0)throw new Error('ZIPの終端が見つかりません。');
const count=view.getUint16(end+10,true);
const dirSize=view.getUint32(end+12,true);
let pos=view.getUint32(end+16,true);
if(pos+dirSize>end)throw new Error('ZIPの目次が破損しています。');
for(let i=0;i<count;i++){
if(pos+46>bytes.length||view.getUint32(pos,true)!==0x02014b50)throw new Error('ZIPの目次が不正です。');
const method=view.getUint16(pos+10,true);
const crc=view.getUint32(pos+16,true);
const size=view.getUint32(pos+20,true);
const unpacked=view.getUint32(pos+24,true);
const nameLength=view.getUint16(pos+28,true);
const extraLength=view.getUint16(pos+30,true);
const commentLength=view.getUint16(pos+32,true);
const localPos=view.getUint32(pos+42,true);
if(method!==0||size!==unpacked)throw new Error('未対応の圧縮形式です。');
if(pos+46+nameLength+extraLength+commentLength>bytes.length)throw new Error('ZIPのファイル名が不正です。');
const name=gartDecoder.decode(bytes.subarray(pos+46,pos+46+nameLength));
if(result.has(name)||name.includes('..')||name.startsWith('/'))throw new Error('ZIPのパスが不正です。');
if(localPos+30>bytes.length||view.getUint32(localPos,true)!==0x04034b50)throw new Error('ZIPのデータが不正です。');
const begin=localPos+30+view.getUint16(localPos+26,true)+view.getUint16(localPos+28,true);
if(begin+size>bytes.length)throw new Error('素材データが途中で切れています。');
const data=bytes.subarray(begin,begin+size);
if(gartCrc32(data)!==crc)throw new Error(`${name} のチェックサムが一致しません。`);
result.set(name,new Blob([data]));
pos+=46+nameLength+extraLength+commentLength;
}
return result;
}

async function saveGartProject(){
const button=document.getElementById('saveGartBtn');
button.disabled=true;
try{
const metadata={
format:'gururi-editor-project',
version:1,
displayMode:state.displayMode,
layouts:structuredClone(state.layouts),
nodes:state.nodes.map(node=>({
...node,
world:node.world?{...node.world,image:null,raw:null}:undefined,
animation:node.animation?{...node.animation,raw:null}:undefined
})),
connections:structuredClone(state.connections),
media:mediaLibrary.map((media,index)=>({
id:media.id,
fileName:media.fileName,
fileType:media.fileType,
path:`assets/${index}.${media.fileType}`
}))
};
const entries=[{name:'project.json',data:gartEncoder.encode(JSON.stringify(metadata))}];
for(const item of metadata.media){
const media=mediaLibrary.find(candidate=>candidate.id===item.id);
if(!media?.sourceFile)throw new Error(`${item.fileName} の元ファイルがありません。再度読み込んでください。`);
entries.push({name:item.path,data:media.sourceFile});
}
const blob=await gartCreateZip(entries);
const url=URL.createObjectURL(blob);
const link=document.createElement('a');
link.href=url;
link.download='project.gart';
document.body.appendChild(link);
link.click();
link.remove();
setTimeout(()=>URL.revokeObjectURL(url),60000);
}catch(error){
console.error(error);
alert(`プロジェクトを保存できませんでした。\n${error.message}`);
}finally{
button.disabled=false;
}
}

async function openGartProject(file){
const button=document.getElementById('openGartBtn');
button.disabled=true;
const previousMedia=[...mediaLibrary];
try{
const entries=await gartReadZip(file);
const json=entries.get('project.json');
if(!json)throw new Error('project.jsonがありません。');
const data=JSON.parse(await json.text());
if(data.format!=='gururi-editor-project'||data.version!==1)throw new Error('対応していない.gart形式です。');
if(!Array.isArray(data.nodes)||!Array.isArray(data.connections)||!Array.isArray(data.media))throw new Error('プロジェクトの構造が不正です。');
if(!data.nodes.some(node=>node.id==='start'&&node.type==='start'))throw new Error('STARTノードがありません。');
const nodeIds=new Set(data.nodes.map(node=>node.id));
if(nodeIds.size!==data.nodes.length||data.connections.some(c=>!nodeIds.has(c.from)||!nodeIds.has(c.to)))throw new Error('ノードの接続情報が不正です。');
for(const item of data.media){
if(!item||!['png','jpg','mp4'].includes(item.fileType)||!entries.has(item.path))throw new Error('素材が不足しています。');
}
for(const item of data.media){
const blob=entries.get(item.path);
const mimeType=item.fileType==='png'?'image/png':item.fileType==='jpg'?'image/jpeg':'video/mp4';
const assetFile=new File([blob],item.fileName,{type:mimeType});
const imported=await importMediaFile(assetFile);
imported.id=item.id;
}
const restoredMedia=mediaLibrary.slice(previousMedia.length);
for(const node of data.nodes){
if(node.world){
const media=restoredMedia.find(item=>item.id===node.world.mediaId&&item.fileType==='png');
node.world.image=media?.image||null;
node.world.raw=null;
}
if(node.animation)node.animation.raw=null;
}
cancelPreviewScene();
state.nodes=data.nodes;
state.connections=data.connections;
resetEditorHistory();
state.selectedNodeId=null;
state.selectedConnectionId=null;
state.displayMode=['pc','mobile'].includes(data.displayMode)?data.displayMode:'pc';
if(data.layouts?.pc&&data.layouts?.mobile){
state.layouts=structuredClone(data.layouts);
}
mediaLibrary.splice(0,previousMedia.length);
updateLayoutControls();
renderMediaList();
renderNodes();
renderSettings();
}catch(error){
console.error(error);
for(const media of mediaLibrary.slice(previousMedia.length)){
if(media.url)URL.revokeObjectURL(media.url);
}
mediaLibrary.splice(0,mediaLibrary.length,...previousMedia);
renderMediaList();
renderSettings();
alert(`プロジェクトを開けませんでした。現在の編集内容は維持されています。\n${error.message}`);
}finally{
button.disabled=false;
}
}

document.getElementById('saveGartBtn').addEventListener('click',saveGartProject);
document.getElementById('openGartBtn').addEventListener('click',()=>document.getElementById('gartFileInput').click());
document.getElementById('gartFileInput').addEventListener('change',async e=>{
const file=e.target.files?.[0];
e.target.value='';
if(!file)return;
if(!confirm('現在の編集内容を読み込んだプロジェクトで置き換えますか？'))return;
await openGartProject(file);
});

async function exportPlayableWork(fileName,saveHandle=null){
const button=document.getElementById('exportWorkBtn');
button.disabled=true;
try{
const metadata={
format:'gururi-exported-work',
version:1,
displayMode:state.displayMode,
layouts:structuredClone(state.layouts),
nodes:state.nodes.map(node=>({
...node,
world:node.world?{...node.world,image:null,raw:null}:undefined,
animation:node.animation?{...node.animation,raw:null}:undefined
})),
connections:structuredClone(state.connections),
media:mediaLibrary.map((media,index)=>({
id:media.id,
fileName:media.fileName,
fileType:media.fileType,
path:`assets/${index}.${media.fileType}`
}))
};
if(!metadata.connections.some(c=>c.from==='start')){
throw new Error('STARTからノードを接続してください。');
}
const scriptElement=Array.from(document.scripts).find(s=>/\/app\.js(?:\?|$)/.test(s.src));
const scriptUrl=scriptElement?.src||new URL('app.js',document.baseURI).href;
const baseUrl=new URL('./',scriptUrl);
const assetUrls={
'index.html':new URL('index.html',baseUrl),
'app.js':new URL('app.js',baseUrl),
'style.css':new URL('style.css',baseUrl)
};
const sourceFiles={};
if(location.protocol==='file:'){
const folderFiles=await new Promise((resolve,reject)=>{
const input=document.createElement('input');
input.type='file';
input.multiple=true;
input.setAttribute('webkitdirectory','');
input.style.display='none';
document.body.appendChild(input);
let completed=false;
const finish=(files,error)=>{
if(completed)return;
completed=true;
input.remove();
if(error)reject(error);
else resolve(files);
};
input.addEventListener('change',()=>finish(Array.from(input.files||[])),{once:true});
input.addEventListener('cancel',()=>finish(null,new Error('フォルダの選択がキャンセルされました。')),{once:true});
input.click();
});
for(const name of Object.keys(assetUrls)){
const file=folderFiles.find(file=>{
const parts=(file.webkitRelativePath||'').split('/');
return parts.length===2&&parts[1]===name;
});
if(!file)throw new Error(`選択したフォルダの直下に ${name} がありません。`);
sourceFiles[name]=await file.text();
}
}else{
for(const [name,url] of Object.entries(assetUrls)){
const response=await fetch(url,{cache:'no-store'});
if(!response.ok)throw new Error(`${name}を読み込めませんでした。`);
sourceFiles[name]=await response.text();
}
}
const playerStyle=`
html,body{margin:0!important;background:#000!important}
body.gururi-player .topbar,body.gururi-player .main-layout,body.gururi-player .media-popup{display:none!important}
body.gururi-player #gamePreview{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:20!important;background:#000!important}
body.gururi-player #closePreviewBtn{display:none!important}
#gururiLaunch{position:fixed;inset:0;z-index:100;display:flex;align-items:center;justify-content:center;background:#080808;color:#fff;font-family:sans-serif;text-align:center;padding:20px;box-sizing:border-box}
#gururiLaunch button{padding:17px 40px;border:1px solid #888;border-radius:9px;background:#242424;color:#fff;font-size:20px;cursor:pointer}
#gururiRestart{position:fixed;top:12px;right:12px;z-index:80;border:0;border-radius:7px;padding:9px 12px;background:#111b;color:#fff;cursor:pointer}
`;
const mediaEncoded=[];
for(const item of metadata.media){
const media=mediaLibrary.find(m=>m.id===item.id);
if(!media?.sourceFile)throw new Error(item.fileName+' の元ファイルがありません。');
const base64=await new Promise((resolve,reject)=>{
const reader=new FileReader();
reader.onload=()=>resolve(String(reader.result).split(',')[1]);
reader.onerror=()=>reject(new Error(item.fileName+' の変換に失敗しました。'));
reader.readAsDataURL(media.sourceFile);
});
mediaEncoded.push({id:item.id,base64});
}
const playerBootstrap=`
(async()=>{
const launch=document.getElementById('gururiLaunch');
const createdUrls=[];
try{
const data=window.GURURI_EXPORTED_WORK;
const encodedMedia=window.GURURI_EMBEDDED_MEDIA;
if(!data||data.format!=='gururi-exported-work'||data.version!==1)throw new Error('作品データが不正です。');
if(!Array.isArray(data.nodes)||!Array.isArray(data.connections)||!Array.isArray(data.media))throw new Error('ノードデータが不正です。');
const nodeIds=new Set(data.nodes.map(n=>n.id));
if(!nodeIds.has('start')||data.connections.some(c=>!nodeIds.has(c.from)||!nodeIds.has(c.to)))throw new Error('ノード構成が不正です。');
const loaded=[];
for(const item of data.media){
const entry=encodedMedia.find(m=>m.id===item.id);
if(!entry)throw new Error(item.fileName+' が見つかりません。');
const chunks=[];
const text=entry.base64;
for(let i=0;i<text.length;i+=32768){
const binary=atob(text.slice(i,i+32768));
const chunk=new Uint8Array(binary.length);
for(let j=0;j<binary.length;j++)chunk[j]=binary.charCodeAt(j);
chunks.push(chunk);
}
const mimeType=item.fileType==='png'?'image/png':item.fileType==='jpg'?'image/jpeg':'video/mp4';
const blob=new Blob(chunks,{type:mimeType});
const url=URL.createObjectURL(blob);
createdUrls.push(url);
if(item.fileType==='png'||item.fileType==='jpg'){
const picture=new Image();
await new Promise((resolve,reject)=>{picture.onload=resolve;picture.onerror=()=>reject(new Error(item.fileName+' を開けません'));picture.src=url;});
loaded.push({id:item.id,fileName:item.fileName,fileType:item.fileType,image:picture,video:null,url,width:picture.naturalWidth,height:picture.naturalHeight,duration:0});
}else if(item.fileType==='mp4'){
const video=document.createElement('video');
video.preload='auto';video.playsInline=true;video.muted=true;
await new Promise((resolve,reject)=>{video.onloadeddata=resolve;video.onerror=()=>reject(new Error(item.fileName+' を開けません'));video.src=url;video.load();});
loaded.push({id:item.id,fileName:item.fileName,fileType:'mp4',image:null,video,url,width:video.videoWidth,height:video.videoHeight,duration:video.duration});
}else throw new Error('非対応のメディアです。');
}
for(const node of data.nodes){
if(node.world){node.world.image=loaded.find(m=>m.id===node.world.mediaId&&m.fileType==='png')?.image||null;node.world.raw=null;}
if(node.animation)node.animation.raw=null;
}
mediaLibrary.splice(0,mediaLibrary.length,...loaded);
state.nodes=data.nodes;
state.connections=data.connections;
state.selectedNodeId=null;
state.selectedConnectionId=null;
state.displayMode=['pc','mobile'].includes(data.displayMode)?data.displayMode:'pc';
if(data.layouts?.pc&&data.layouts?.mobile)state.layouts=data.layouts;
updateLayoutControls();
renderNodes();
renderSettings();
const begin=()=>{launch.style.display='none';startPreview();};
launch.innerHTML='<button type="button">▶ 作品を開始</button>';
launch.querySelector('button').addEventListener('click',begin);
document.getElementById('gururiRestart').addEventListener('click',begin);
}catch(error){
console.error(error);
launch.textContent='作品を開けませんでした: '+error.message;
}
})();
`;
const escapeInlineScript=code=>code.replace(/<\/script/gi,'<\\/script');
const baseHtml=sourceFiles['index.html'];
if(!baseHtml.includes('<script src="app.js"></script>')||!baseHtml.includes('<link rel="stylesheet" href="style.css">')||!baseHtml.includes('</body>')){
throw new Error('エディタのHTML構造が想定と異なります。');
}
const encoded=JSON.stringify(metadata).replace(/</g,'\\u003c');
const embedded=JSON.stringify(mediaEncoded);
const launchHtml='<div id="gururiLaunch">作品を準備しています...</div><button id="gururiRestart" type="button">↻ 最初から</button>';
const viewerHtml=baseHtml
.replace('<title>ぐるりエディタ</title>','<title>ぐるり作品</title>')
.replace('<link rel="stylesheet" href="style.css">','<style>'+sourceFiles['style.css']+'\n'+playerStyle+'</style>')
.replace('<body>','<body class="gururi-player">')
.replace('<script src="app.js"></script>',
'<script>'+escapeInlineScript(sourceFiles['app.js'])+'</script>')
.replace(/<\/body>(?=\s*<\/html>\s*$)/i,launchHtml+'<script>window.GURURI_EXPORTED_WORK='+encoded+';window.GURURI_EMBEDDED_MEDIA='+embedded+';</script><script>'+escapeInlineScript(playerBootstrap)+'</script></body>');
const entries=[
{name:'ぐるり作品.html',data:gartEncoder.encode(viewerHtml)},
{name:'manifest.json',data:gartEncoder.encode(JSON.stringify({...metadata,format:'gururi-editor-art',version:1},null,2))}
];
for(const item of metadata.media){
const media=mediaLibrary.find(m=>m.id===item.id);
entries.push({name:item.path,data:media.sourceFile});
}
const thumbnailSource=mediaLibrary.find(m=>m.fileType==='png'&&m.image)||mediaLibrary.find(m=>m.fileType==='mp4'&&m.video);
if(thumbnailSource){
const canvas=document.createElement('canvas');
canvas.width=512;
canvas.height=256;
const ctx=canvas.getContext('2d');
if(ctx){
ctx.fillStyle='#111';
ctx.fillRect(0,0,512,256);
try{ctx.drawImage(thumbnailSource.image||thumbnailSource.video,0,0,512,256);}catch(error){console.warn('サムネイルを生成できませんでした',error);}
const thumbnail=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
if(thumbnail)entries.push({name:'thumbnail.png',data:thumbnail});
}
}
const archive=await gartCreateZip(entries);
if(saveHandle){
const writable=await saveHandle.createWritable();
await writable.write(archive);
await writable.close();
}else{
const url=URL.createObjectURL(archive);
const link=document.createElement('a');
link.href=url;
link.download=fileName;
document.body.appendChild(link);
link.click();
link.remove();
setTimeout(()=>URL.revokeObjectURL(url),60000);
}
document.getElementById('exportSettingsModal').classList.add('hidden');
}catch(error){
console.error(error);
alert('作品を書き出せませんでした。\\n'+error.message);
}finally{
button.disabled=false;
}
}

const exportSettingsModal=document.getElementById('exportSettingsModal');
const exportFileNameInput=document.getElementById('exportFileName');
const exportSettingsForm=document.getElementById('exportSettingsForm');
const exportConfirmBtn=document.getElementById('exportConfirmBtn');

document.getElementById('exportWorkBtn').addEventListener('click',()=>{
exportSettingsModal.classList.remove('hidden');
exportFileNameInput.focus();
exportFileNameInput.select();
});
document.getElementById('exportCancelBtn').addEventListener('click',()=>{
exportSettingsModal.classList.add('hidden');
});
exportSettingsModal.addEventListener('click',event=>{
if(event.target===exportSettingsModal)exportSettingsModal.classList.add('hidden');
});
exportSettingsForm.addEventListener('submit',async event=>{
event.preventDefault();
let name=exportFileNameInput.value.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/[. ]+$/g,'');
if(name.toLowerCase().endsWith('.zip'))name=name.slice(0,-4);
if(!name){alert('ファイル名を入力してください。');return;}
const fileName=name+'.zip';
let handle=null;
if(typeof window.showSaveFilePicker==='function'&&window.isSecureContext){
try{
handle=await window.showSaveFilePicker({suggestedName:fileName,types:[{description:'ZIPファイル',accept:{'application/zip':['.zip']}}]});
}catch(error){
if(error.name==='AbortError')return;
console.warn('保存場所の選択を利用できませんでした。通常のダウンロードに切り替えます。',error);
}
}
exportConfirmBtn.disabled=true;
try{
await exportPlayableWork(fileName,handle);
}finally{
exportConfirmBtn.disabled=false;
}
});

applyGameAspectRatio();
updateLayoutControls();
addStartNode();
renderSettings();
