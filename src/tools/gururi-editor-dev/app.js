// Preview diagnostic recorder: bounded in-memory events, exported only on user click.
const previewDiagnosticEvents=[];
const previewDiagnosticErrors=[];
function recordPreviewDiagnostic(type,details={}){
 try{
  previewDiagnosticEvents.push({time:new Date().toISOString(),type,...details});
  if(previewDiagnosticEvents.length>400)previewDiagnosticEvents.shift();
 }catch(error){console.warn('Diagnostic recorder:',error);}
}
function recordPreviewError(kind,message,stack=''){
 previewDiagnosticErrors.push({time:new Date().toISOString(),kind,message:String(message),stack:String(stack||'')});
 if(previewDiagnosticErrors.length>80)previewDiagnosticErrors.shift();
}
window.addEventListener('error',event=>{
 recordPreviewError('JavaScript',event.message||'Unknown error',event.error?.stack||`${event.filename||''}:${event.lineno||''}:${event.colno||''}`);
});
window.addEventListener('unhandledrejection',event=>{
 const reason=event.reason;
 recordPreviewError('Promise',reason?.message||String(reason),reason?.stack||'');
});
function exportPreviewDiagnostics(){
 try{
  const nodeInfo=id=>{
   const n=getNode(id);
   return n?{id:n.id,type:n.type,label:n.itemName||n.customBody||n.world?.fileName||n.animation?.fileName||'',once:!!(n.triggerOnce||n.clickBranchOnce)}:{id,missing:true};
  };
  const activeVideo=state.previewAnimation?.video;
  const report={
   exportedAt:new Date().toISOString(),
   appTitle:document.title,
   location:location.pathname,
   userAgent:navigator.userAgent,
   previewOpen:!gamePreview.classList.contains('hidden'),
   displayMode:state.displayMode,
   sceneEpoch:previewSceneEpoch,
   activeNode:nodeInfo(state.previewNodeId),
   activeWorld:nodeInfo(state.previewWorldNodeId),
   dialogueNode:nodeInfo(state.previewDialogueNodeId),
   selectedInventoryItem:nodeInfo(state.selectedInventoryItemId),
   inventory:[...state.inventory].map(nodeInfo),
   acquiredItems:[...acquiredItems].map(nodeInfo),
   completedTriggers:[...previewCompletedTriggers].map(nodeInfo),
   visitedNodes:[...previewVisited].map(nodeInfo),
   waitingClicks:state.previewClickTriggerIds.map(nodeInfo),
   waitingItemUses:state.previewItemUseTriggerIds.map(nodeInfo),
   waitingFrameIns:state.previewFrameInIds.map(nodeInfo),
   pendingTimers:previewBranchTimers.size,
   sceneVideo:activeVideo?{time:activeVideo.currentTime,duration:activeVideo.duration,paused:activeVideo.paused,ended:activeVideo.ended,readyState:activeVideo.readyState}:null,
   nodeCount:state.nodes.length,
   connectionCount:state.connections.length,
   performance:getPerformanceReport(),
   errors:previewDiagnosticErrors,
   events:previewDiagnosticEvents
  };
  const content='ぐるりエディタ 診断レポート\n'+JSON.stringify(report,null,2)+'\n';
  const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download='gururi-diagnostic-'+new Date().toISOString().replace(/[:.]/g,'-')+'.txt';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),3000);
 }catch(error){console.error('診断レポートの保存に失敗しました',error);alert('診断レポートを保存できませんでした。Consoleを確認してください。');}
}

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
const uiButtonPreviewLayer=document.createElement('div');
uiButtonPreviewLayer.className='game-ui-button-layer';
document.getElementById('gameViewport').appendChild(uiButtonPreviewLayer);
function clearUiButtonPreview(){uiButtonPreviewLayer.replaceChildren();}
const closePreviewBtn=document.getElementById('closePreviewBtn');
const gameCanvas=document.getElementById('gameCanvas');
const previewMessage=document.getElementById('previewMessage');
const dialogueOverlay=document.getElementById('dialogueOverlay');
const dialogueText=document.getElementById('dialogueText');
const optionChoicesOverlay=document.getElementById('optionChoicesOverlay');
const textAnswerOverlay=document.getElementById('textAnswerOverlay');
const inventoryOverlay=document.getElementById('inventoryOverlay');
const inventoryButton=document.getElementById('inventoryButton');
const equippedItemLabel=document.getElementById('equippedItemLabel');
const equippedItemSelect=document.getElementById('equippedItemSelect');
const fadeOverlay=document.getElementById('fadeOverlay');
const gameViewport=document.getElementById('gameViewport');
const media2DLayer=document.getElementById('media2DLayer');
const pcModeBtn=document.getElementById('pcModeBtn');
const mobileModeBtn=document.getElementById('mobileModeBtn');
const ratioWidthInput=document.getElementById('ratioWidthInput');
const ratioHeightInput=document.getElementById('ratioHeightInput');

const state={
nodes:[],
connections:[],
worldFolders:[],
activeFolderId:null,
startFolderId:null,
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
previewFrameInIds:[],
previewDialogueNodeId:null,
previewDialoguePageIndex:0,
previewTextAnswerNodeId:null,
previewItemUseTriggerIds:[],
inventory:new Set(),
selectedInventoryItemId:null,
inventoryEnabled:false,
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

function optionChoiceNodes(owner){
return state.nodes.filter(n=>n.type==='optionChoice'&&n.optionOwnerId===owner.id);
}
function addOptionChoice(owner){
if(owner.type!=='option')return;
const before=editorSnapshot();
if(!Array.isArray(owner.optionChoices))owner.optionChoices=[];
const choice={id:uid('choice'),text:''};
owner.optionChoices.push(choice);
const branch={id:uid('optionChoice'),type:'optionChoice',optionOwnerId:owner.id,optionChoiceId:choice.id,x:owner.x+250,y:owner.y+(owner.optionChoices.length-1)*95};
state.nodes.push(branch);
state.connections.push({id:uid('conn'),from:owner.id,to:branch.id});
commitEditorHistory(before);
renderNodes();renderSettings();
}
function removeOptionChoice(owner,choiceId){
const before=editorSnapshot();
owner.optionChoices=owner.optionChoices.filter(c=>c.id!==choiceId);
const removed=optionChoiceNodes(owner).filter(n=>n.optionChoiceId===choiceId);
const ids=new Set(removed.map(n=>n.id));
state.nodes=state.nodes.filter(n=>!ids.has(n.id));
state.connections=state.connections.filter(c=>!ids.has(c.from)&&!ids.has(c.to));
commitEditorHistory(before);
renderNodes();renderSettings();
}
function conditionBranches(owner){
 return state.nodes.filter(n=>n.type==='conditionBranch'&&n.conditionOwnerId===owner.id);
}
function ensureConditionBranches(owner){
 if(owner?.type!=='condition')return;
 for(const result of ['yes','no']){
  if(conditionBranches(owner).some(n=>n.conditionResult===result))continue;
  const branch={id:uid('conditionBranch'),type:'conditionBranch',conditionOwnerId:owner.id,conditionResult:result,x:owner.x+250,y:owner.y+(result==='yes'?0:100)};
  state.nodes.push(branch);
  state.connections.push({id:uid('conn'),from:owner.id,to:branch.id});
 }
}
function toggleBranches(owner){
 return state.nodes.filter(n=>n.type==='toggleBranch'&&n.toggleOwnerId===owner.id);
}
function ensureToggleBranches(owner){
 if(owner?.type!=='toggle')return;
 for(const result of ['on','off']){
  if(toggleBranches(owner).some(n=>n.toggleResult===result))continue;
  const branch={id:uid('toggleBranch'),type:'toggleBranch',folderId:owner.folderId,toggleOwnerId:owner.id,toggleResult:result,x:owner.x+250,y:owner.y+(result==='on'?0:105)};
  state.nodes.push(branch);
  state.connections.push({id:uid('conn'),from:owner.id,to:branch.id});
 }
}
function renderToggleSettings(node){
 settingsPanel.innerHTML='<div class="settings-title">トグル</div><div class="setting-group"><div class="setting-label">トグル名</div><input type="text" id="toggleName" class="number-input" placeholder="例：照明"></div><p class="settings-empty">初期状態：OFF。実行するたびに ON／OFF が切り替わり、対応する分岐へ進みます。ワールド間でも状態を保持し、ゲーム再開時にリセットします。</p>';
 const input=document.getElementById('toggleName');input.value=node.toggleName||'';
 input.addEventListener('input',()=>{node.toggleName=input.value;renderNodes();});
}
function renderToggleSetSettings(node){
 const toggles=state.nodes.filter(n=>n.type==='toggle');
 settingsPanel.innerHTML=`<div class="settings-title">トグル切り替え</div>
 <div class="setting-group"><div class="setting-label">対象のトグル</div><select id="toggleSetTarget" class="number-input"><option value="">選択してください</option>${toggles.map(n=>`<option value="${escapeHtml(n.id)}">${escapeHtml(n.toggleName||'トグル '+n.id)}</option>`).join('')}</select></div>
 <div class="setting-group"><div class="setting-label">操作</div><select id="toggleSetAction" class="number-input"><option value="on">ONにする</option><option value="off">OFFにする</option><option value="toggle">反転する（ON ↔ OFF）</option></select></div>
 <p class="settings-empty">指定したトグルの状態を変更して次のノードへ進みます。対象トグルのON／OFF分岐は実行しません。</p>`;
 const target=document.getElementById('toggleSetTarget');target.value=node.toggleSetTargetId||'';
 target.onchange=()=>{node.toggleSetTargetId=target.value;renderNodes();};
 const action=document.getElementById('toggleSetAction');action.value=['on','off','toggle'].includes(node.toggleSetAction)?node.toggleSetAction:'toggle';
 action.onchange=()=>{node.toggleSetAction=action.value;renderNodes();};
}
function renderConditionSettings(node){
 const items=state.nodes.filter(n=>n.type==='itemAcquire');
 const events=state.nodes.filter(n=>n.type==='eventRecord');
 const toggles=state.nodes.filter(n=>n.type==='toggle');
 settingsPanel.innerHTML=`<div class="settings-title">条件</div>
 <div class="setting-group"><div class="setting-label">判定方法</div><select id="conditionMode" class="number-input"><option value="acquired">アイテム取得済み</option><option value="event">イベント実行済み</option><option value="toggle">トグルON</option></select></div>
 <div class="setting-group"><div class="setting-label">対象</div><select id="conditionItem" class="number-input"></select></div>
 <div class="settings-empty">成立時は「はい」、不成立時は「いいえ」に進みます。</div>`;
 const mode=document.getElementById('conditionMode');const item=document.getElementById('conditionItem');
 const renderOptions=()=>{
  item.replaceChildren();item.add(new Option('選択してください',''));
  for(const n of (mode.value==='event'?events:mode.value==='toggle'?toggles:items))item.add(new Option(n.toggleName||n.eventName||itemDisplayName(n),n.id));
  item.value=node.conditionItemId||'';
 };
 mode.value=['event','toggle'].includes(node.conditionMode)?node.conditionMode:'acquired';renderOptions();
 mode.addEventListener('change',()=>{node.conditionMode=mode.value;node.conditionItemId='';renderOptions();renderNodes();});
 item.addEventListener('change',()=>{node.conditionItemId=item.value;renderNodes();});
}

function textAnswerBranches(owner){
 return state.nodes.filter(n=>n.type==='textAnswerBranch'&&n.textAnswerOwnerId===owner.id);
}
function ensureTextAnswerBranches(owner){
 if(owner?.type!=='textAnswer')return;
 for(const result of ['correct','incorrect']){
  if(textAnswerBranches(owner).some(n=>n.textAnswerResult===result))continue;
  const branch={id:uid('textAnswerBranch'),type:'textAnswerBranch',textAnswerOwnerId:owner.id,textAnswerResult:result,x:owner.x+250,y:owner.y+(result==='correct'?0:100)};
  state.nodes.push(branch);
  state.connections.push({id:uid('conn'),from:owner.id,to:branch.id});
 }
}
function runTextAnswerBranch(owner,result){
 const branch=textAnswerBranches(owner).find(n=>n.textAnswerResult===result);
 if(!branch)return;
 prepareExplorationBranch(owner.id);
 previewVisited.delete(branch.id);
 showPreviewNode(branch.id);
}
function closeTextAnswerPanel(){
 textAnswerOverlay.classList.add('hidden');
 textAnswerOverlay.replaceChildren();
 state.previewTextAnswerNodeId=null;
}
function showTextAnswerPanel(node){
 closeTextAnswerPanel();
 state.previewTextAnswerNodeId=node.id;
 const form=document.createElement('form');form.className='game-text-answer-form';
 const title=document.createElement('div');title.className='game-text-answer-question';title.textContent=node.textAnswerQuestion||'';
 const input=document.createElement('input');input.className='game-text-answer-field';input.type='text';input.autocomplete='off';input.spellcheck=false;
 input.inputMode=node.textAnswerMode==='number'?'numeric':'text';
 const actions=document.createElement('div');actions.className='game-text-answer-actions';
 const submit=document.createElement('button');submit.type='submit';submit.textContent='決定';
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='閉じる';cancel.addEventListener('click',closeTextAnswerPanel);
 actions.append(submit,cancel);form.append(title,input,actions);textAnswerOverlay.append(form);
 form.addEventListener('submit',event=>{
  event.preventDefault();
  if(state.previewTextAnswerNodeId!==node.id)return;
  const answer=input.value;
  const correct=String(node.textAnswerCorrect??'');
  const valid=node.textAnswerMode!=='number'||/^[0-9]*$/.test(answer);
  const result=valid&&answer===correct?'correct':'incorrect';
  closeTextAnswerPanel();
  runTextAnswerBranch(node,result);
 });
 textAnswerOverlay.classList.remove('hidden');
 input.focus({preventScroll:true});
}
function renderTextAnswerSettings(node){
 settingsPanel.innerHTML=`<div class="settings-title">テキスト入力</div>
 <div class="setting-group"><div class="setting-label">質問文</div><textarea id="textAnswerQuestion" class="dialogue-textarea" maxlength="160"></textarea></div>
 <div class="setting-group"><div class="setting-label">正解（空欄も正解として設定できます）</div><input id="textAnswerCorrect" class="number-input" type="text" autocomplete="off"></div>
 <div class="setting-group"><div class="setting-label">入力形式</div><select id="textAnswerMode" class="number-input"><option value="text">文字・数字</option><option value="number">数字のみ</option></select></div>
 <div class="setting-group"><div class="setting-label">表示プレビュー</div><div class="game-text-answer-preview"><div id="textAnswerPreviewQuestion"></div><input class="game-text-answer-field" type="text" placeholder="ここに回答を入力" disabled><button type="button" disabled>決定</button></div></div>`;
 const question=document.getElementById('textAnswerQuestion');question.value=node.textAnswerQuestion||'';
 const correct=document.getElementById('textAnswerCorrect');correct.value=String(node.textAnswerCorrect??'');
 const mode=document.getElementById('textAnswerMode');mode.value=node.textAnswerMode==='number'?'number':'text';
 const preview=document.getElementById('textAnswerPreviewQuestion');preview.textContent=question.value;
 question.addEventListener('input',()=>{node.textAnswerQuestion=question.value;preview.textContent=question.value;});
 correct.addEventListener('input',()=>{node.textAnswerCorrect=correct.value;});
 mode.addEventListener('change',()=>{node.textAnswerMode=mode.value;});
}
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
clickNormalOnce:false,
frameInMode:'contain',
frameInTool:'target',
frameInView:{yaw:0,pitch:0,zoom:1,initialized:false},
frameInReferenceKey:null,
frameInTarget:[],
frameInFrame:[],
frameInUndo:[],
frameInRedo:[],
dialoguePages:type==='dialogue'?['']:[],
dialogueEditIndex:0,
optionChoices:[],
textAnswerQuestion:'',
textAnswerCorrect:'',
textAnswerMode:'text',
uiButtonText:'ボタン',
uiButtonWidth:180,
uiButtonHeight:56,
uiButtonFontSize:20,
uiButtonPositions:{pc:{x:50,y:88},mobile:{x:50,y:88}},
conditionMode:'acquired',
conditionItemId:'',
conditionOwnerId:null,
toggleOwnerId:null,
toggleResult:null,
toggleName:'',
toggleSetTargetId:'',
toggleSetAction:'toggle',
conditionResult:null,
textAnswerOwnerId:null,
textAnswerResult:null,
clickItemBranches:[],
clickOtherBranchId:null,
clickBranchOwnerId:null,
clickBranchItemId:null,
clickBranchOnce:false,
clickBranchConsume:false,
itemName:'',
itemDescription:'',
itemRemoveOriginClick:false,
itemThumbnailMediaId:null,
itemConsumable:true,
itemUseTargetId:null,
optionOwnerId:null,
optionChoiceId:null,
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
keyframeDuration:null,
worldDuration:3,
worldInfiniteLoop:false,
panView:{yaw:0,pitch:0,zoom:1,initialized:false},
panUndoStack:[],
panRedoStack:[],
media2DId:null,
media2DLayouts:{pc:{x:30,y:25,w:40,h:40},mobile:{x:15,y:30,w:70,h:30}}
};
node.folderId=state.activeFolderId;
state.nodes.push(node);

if(type==='textAnswer')ensureTextAnswerBranches(node);
if(type==='condition')ensureConditionBranches(node);
if(type==='toggle')ensureToggleBranches(node);
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
// 旧仕様の『その他のアイテム』分岐だけを除去する。接続先ノードは残す。
removeLegacyOtherClickBranches();
for(const n of state.nodes){if(n.folderId)continue;const owner=getNode(n.clickBranchOwnerId||n.conditionOwnerId||n.toggleOwnerId||n.textAnswerOwnerId||n.optionOwnerId);if(owner)n.folderId=owner.folderId;}
nodesLayer.innerHTML='';
for(const node of state.nodes){
if(!state.activeFolderId||node.folderId!==state.activeFolderId||node.type==='world')continue;
const el=document.createElement('div');
el.className=`node ${node.type==='start'?'start-node':''} ${(state.selectedNodeId===node.id||state.selectedNodeIds.has(node.id))?'selected':''}`;
el.dataset.id=node.id;
el.style.left=`${node.x}px`;
el.style.top=`${node.y}px`;
const title=
node.type==='folderStart'?'START':
node.type==='worldDisplay'?'ワールド表示':
node.type==='worldMove'?'ワールド移動':
node.type==='eventRecord'?'イベント記録':
node.type==='gameReset'?'リセット':
node.type==='start'?'START':
node.type==='media'||node.type==='world'||node.type==='animation'?'メディア':
node.type==='time'?'時間':
node.type==='click'?'クリック':
node.type==='frameIn'?'フレームイン':
node.type==='dialogue'?'ダイアローグ':
node.type==='uiButton'?'ボタン':
node.type==='option'?'オプション':
node.type==='textAnswer'?'テキスト入力':
node.type==='condition'?'条件':
node.type==='random'?'ランダム':
node.type==='toggle'?'トグル':
node.type==='toggleSet'?'トグル切り替え':
node.type==='toggleBranch'?(node.toggleResult==='on'?'OFF→ON':'ON→OFF'):
node.type==='conditionBranch'?(node.conditionResult==='yes'?'はい':'いいえ'):
node.type==='textAnswerBranch'?(node.textAnswerResult==='correct'?'正解':'不正解'):
node.type==='itemAcquire'?'アイテム取得':
node.type==='inventory'?'インベントリ表示':
node.type==='itemUse'?'アイテム使用':
node.type==='optionChoice'?'選択肢':
node.type==='clickBranch'?'クリック分岐':
node.type==='media2d'?'2Dメディア':
node.type==='fadeIn'?'フェードイン':
node.type==='fadeOut'?'フェードアウト':
node.type==='pan'?'パン':
node.type==='keyframe'?'キーフレーム':
'不明';

const body=
node.type==='folderStart'?'ワールド開始':
node.type==='worldDisplay'?'探索を開始する':
node.type==='worldMove'?(state.worldFolders.find(w=>w.id===node.destinationFolderId)?.name||'移動先未設定'):
node.type==='eventRecord'?(node.eventName||'イベント未設定'):
node.type==='gameReset'?'ワールド1からやり直す':
node.type==='media'?'素材を選択してください':
node.type==='world'?(node.world.fileName||'素材未設定'):
node.type==='animation'?(node.animation.fileName||'素材未設定'):
node.type==='time'?`${node.timeSeconds} 秒`:
node.type==='click'?'範囲クリック':
node.type==='frameIn'?'カメラ範囲トリガー':
node.type==='dialogue'?`${node.dialoguePages.length} ページ`:
node.type==='uiButton'?(node.uiButtonText||'ボタン'):
node.type==='option'?'質問文と選択肢':
node.type==='textAnswer'?'入力した回答を判定':
node.type==='toggle'?(node.toggleName||'実行ごとにON／OFF切り替え'):
node.type==='toggleSet'?((getNode(node.toggleSetTargetId)?.toggleName||'対象未設定')+'：'+(node.toggleSetAction==='on'?'ON':node.toggleSetAction==='off'?'OFF':'反転')):
node.type==='toggleBranch'?(node.toggleResult==='on'?'ONルート':'OFFルート'):
node.type==='condition'?(node.conditionItemId?`${node.conditionMode==='event'?'イベント実行済み':'取得済み'}：${getNode(node.conditionItemId)?.eventName||itemDisplayName(getNode(node.conditionItemId))}`:'対象未設定'):
node.type==='random'?'接続先をランダムに選択':
node.type==='conditionBranch'?(node.conditionResult==='yes'?'条件成立':'条件不成立'):
node.type==='textAnswerBranch'?(node.textAnswerResult==='correct'?'正解ルート':'不正解ルート'):
node.type==='itemAcquire'?(node.itemName||'アイテム名未設定'):
node.type==='inventory'?'所持アイテム一覧':
node.type==='itemUse'?'選択アイテムを使用':
node.type==='optionChoice'?(getNode(node.optionOwnerId)?.optionChoices?.find(c=>c.id===node.optionChoiceId)?.text||'選択肢'):
node.type==='clickBranch'?(node.clickBranchItemId==='__other__'?'その他のアイテム':itemDisplayName(getNode(node.clickBranchItemId))):
node.type==='media2d'?'画像・動画を重ねて表示':
node.type==='fadeIn'||node.type==='fadeOut'?`${node.effectSeconds} 秒`:
node.type==='pan'?`${node.panSeconds} 秒`:
node.type==='keyframe'?'カメラワーク':
'開始';
el.innerHTML=`<div class="port input" data-port="input"></div><div class="node-header">${title}</div><div class="node-body" title="ダブルクリックで文章を編集"></div>${node.type==='gameReset'?'':'<div class="port output" data-port="output"></div>'}`;

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
for(const el of nodesLayer.querySelectorAll('.node')){
el.classList.toggle('selected',el.dataset.id===id);
}
renderSettings();
}

// Show the settings controls before starting expensive panorama previews.
// An old preview must not initialize after another node was selected.
let settingsPreviewGeneration=0;
function deferSelectedNodePreview(node,canvasId,setup){
const generation=++settingsPreviewGeneration;
const canvas=document.getElementById(canvasId);
requestAnimationFrame(()=>requestAnimationFrame(()=>{
if(generation!==settingsPreviewGeneration)return;
if(state.selectedNodeId!==node.id)return;
if(!canvas||!canvas.isConnected)return;
if(document.getElementById(canvasId)!==canvas)return;
setup();
}));
}

function renderSettings(){
settingsPreviewGeneration++;
if(cleanupAnimationSettingsPreview){
cleanupAnimationSettingsPreview();
cleanupAnimationSettingsPreview=null;
}

const node=getNode(state.selectedNodeId);

if(node){
queueMicrotask(()=>{
if(state.selectedNodeId!==node.id)return;

if(isPreviewOnceTarget(node)&&!settingsPanel.querySelector('#nodeExecuteOnceInput')){
const onceGroup=document.createElement('div');
onceGroup.className='setting-group';

const onceLabel=document.createElement('label');
const onceCheckbox=document.createElement('input');
onceCheckbox.type='checkbox';
onceCheckbox.id='nodeExecuteOnceInput';
onceCheckbox.checked=node.executeOnce===true;

onceLabel.append(onceCheckbox,document.createTextNode(' 一回だけ実行'));
onceGroup.appendChild(onceLabel);

onceCheckbox.addEventListener('change',()=>{
node.executeOnce=onceCheckbox.checked;
});

settingsPanel.appendChild(onceGroup);
}

if(node.type==='dialogue'||node.type==='clickBranch')return;
if(settingsPanel.querySelector('#nodeMemoInput'))return;

const group=document.createElement('div');
group.className='setting-group';

const label=document.createElement('div');
label.className=node.type==='click'?'setting-section-heading':'setting-label';
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
if(node.type==='folderStart'||node.type==='worldDisplay'){
 settingsPanel.innerHTML=`<div class="settings-title">${node.type==='folderStart'?'START':'ワールド表示'}</div><p class="settings-empty">${node.type==='folderStart'?'ここからワールドの開始演出を接続します。':'ワールドの基本メディアとレイヤーを表示して探索を開始します。'}</p>`;
 return;
}
if(node.type==='uiButton'){
 const fields=[['uiButtonWidth','ボタンの幅（px）',40,1000,180],['uiButtonHeight','ボタンの高さ（px）',24,500,56],['uiButtonFontSize','文字サイズ（px）',8,120,20]];
 node.uiButtonPositions ||= {pc:{x:50,y:88},mobile:{x:50,y:88}};
 let buttonEditorMode='pc';
 settingsPanel.innerHTML=`<div class="settings-title">ボタン</div>
 <div class="setting-group"><div class="setting-label">ボタンのテキスト</div><input id="uiButtonTextInput" class="number-input" type="text" maxlength="100" value="${escapeHtml(node.uiButtonText??'ボタン')}"></div>
 ${fields.map(([id,label,min,max,fallback])=>`<div class="setting-group"><div class="setting-label">${label}</div><input id="${id}" class="number-input" type="number" min="${min}" max="${max}" step="1" value="${Math.max(min,Math.min(max,Number(node[id])||fallback))}"></div>`).join('')}
 <div class="setting-group"><div class="setting-label">ボタンの表示位置</div>
 <div class="ui-button-mode-tabs"><button type="button" data-mode="pc" class="active">PC（16:9）</button><button type="button" data-mode="mobile">スマホ（9:16）</button></div>
 <div class="ui-button-position-preview" id="uiButtonPositionPreview"><button id="uiButtonPositionTarget" type="button"></button></div>
 <div class="pan-help">ボタンをドラッグして位置を変更します。PCとスマホの位置は別々に保存されます。</div></div>
 <p class="settings-empty">ゲーム画面でボタンを押すと、接続先のノードへ進みます。</p>`;
 const preview=settingsPanel.querySelector('#uiButtonPositionPreview');
 const target=settingsPanel.querySelector('#uiButtonPositionTarget');
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
 const redraw=()=>{
  preview.classList.toggle('mobile',buttonEditorMode==='mobile');
  settingsPanel.querySelectorAll('.ui-button-mode-tabs button').forEach(el=>el.classList.toggle('active',el.dataset.mode===buttonEditorMode));
  const pos=node.uiButtonPositions[buttonEditorMode]||{x:50,y:88};
  target.style.left=`${pos.x}%`;target.style.top=`${pos.y}%`;
  const scale=preview.clientWidth/(buttonEditorMode==='pc'?960:540);
  target.style.width=`${Math.max(40,Number(node.uiButtonWidth)||180)*scale}px`;
  target.style.height=`${Math.max(24,Number(node.uiButtonHeight)||56)*scale}px`;
  target.style.fontSize=`${Math.max(8,Number(node.uiButtonFontSize)||20)*scale}px`;
  target.textContent=node.uiButtonText??'ボタン';
 };
 settingsPanel.querySelectorAll('.ui-button-mode-tabs button').forEach(el=>el.addEventListener('click',()=>{buttonEditorMode=el.dataset.mode;redraw();}));
 // Drag the button without jumping its center to the initial pointer location.
 // Positions are stored in percentages so each device preview remains independent.
 let buttonDrag=null;
 target.addEventListener('pointerdown',e=>{
  if(e.button!==0 && e.pointerType==='mouse')return;
  e.preventDefault();
  const initial=node.uiButtonPositions[buttonEditorMode]||{x:50,y:88};
  buttonDrag={pointerId:e.pointerId,mode:buttonEditorMode,startX:e.clientX,startY:e.clientY,x:initial.x,y:initial.y};
  target.setPointerCapture(e.pointerId);
 });
 target.addEventListener('pointermove',e=>{
  if(!buttonDrag||e.pointerId!==buttonDrag.pointerId)return;
  e.preventDefault();
  const r=preview.getBoundingClientRect();
  if(!r.width||!r.height)return;
  node.uiButtonPositions[buttonDrag.mode]={
   x:clamp(buttonDrag.x+(e.clientX-buttonDrag.startX)/r.width*100,0,100),
   y:clamp(buttonDrag.y+(e.clientY-buttonDrag.startY)/r.height*100,0,100)
  };
  redraw();
 });
 const endButtonDrag=e=>{if(buttonDrag&&e.pointerId===buttonDrag.pointerId)buttonDrag=null;};
 target.addEventListener('pointerup',endButtonDrag);
 target.addEventListener('pointercancel',endButtonDrag);
 target.addEventListener('lostpointercapture',endButtonDrag);
 document.getElementById('uiButtonTextInput').addEventListener('input',e=>{node.uiButtonText=e.target.value;renderNodes();redraw();});
 for(const [id,,min,max,fallback] of fields){document.getElementById(id).addEventListener('input',e=>{node[id]=clamp(Number(e.target.value)||fallback,min,max);redraw();});}
 requestAnimationFrame(()=>{if(preview.isConnected)redraw();});
 return;
}
if(node.type==='worldMove'){
 settingsPanel.innerHTML='<div class="settings-title">ワールド移動</div><div class="setting-group"><div class="setting-label">移動先ワールド</div><select id="destinationWorld" class="number-input"></select></div>';
 const select=document.getElementById('destinationWorld');
 select.add(new Option('選択してください',''));
 for(const w of state.worldFolders)select.add(new Option(w.name,w.id));
 select.value=node.destinationFolderId||'';
 select.addEventListener('change',()=>{node.destinationFolderId=select.value;renderNodes();renderSettings();});
 return;
}
if(node.type==='gameReset'){
 settingsPanel.innerHTML='<div class="settings-title">リセット</div><p class="settings-empty">ゲームの進行状況、取得したアイテム、トグル、イベントの記録をすべて初期化し、ワールド1のSTARTからやり直します。出力接続はありません。</p>';
 return;
}
if(node.type==='eventRecord'){
 settingsPanel.innerHTML='<div class="settings-title">イベント記録</div><div class="setting-group"><div class="setting-label">イベント名</div><input id="recordEventName" class="number-input" type="text"></div><p class="settings-empty">ここを通過するとイベント実行済みになります。</p>';
 const input=document.getElementById('recordEventName');input.value=node.eventName||'';
 input.addEventListener('input',()=>{node.eventName=input.value;renderNodes();});return;
}
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

if(node.type==='optionChoice'){
const owner=getNode(node.optionOwnerId);
const choice=owner?.optionChoices?.find(c=>c.id===node.optionChoiceId);
settingsPanel.innerHTML=`<div class="settings-title">選択肢</div><div class="settings-empty">${escapeHtml(choice?.text||'選択肢')}：このノードの右端から遷移先につないでください。</div>`;
return;
}
if(node.type==='option'){renderOptionSettings(node);return;}
if(node.type==='textAnswer'){renderTextAnswerSettings(node);return;}
if(node.type==='random'){
const count=state.connections.filter(c=>c.from===node.id).length;
settingsPanel.innerHTML=`<div class="settings-title">ランダム</div><p class="settings-empty">接続先のノードから1つをランダムに選んで実行します。</p><div class="setting-group"><div class="setting-label">接続先：${count}個</div><p class="settings-empty">${count>0?`各接続先の選択確率：約${(100/count).toFixed(1)}%`:'接続先がありません。ノードの右側から接続してください。'}</p></div>`;
return;
}
if(node.type==='toggle'){renderToggleSettings(node);return;}
if(node.type==='toggleSet'){renderToggleSetSettings(node);return;}
if(node.type==='toggleBranch'){settingsPanel.innerHTML=`<div class="settings-title">${node.toggleResult==='on'?'ON':'OFF'}</div><div class="settings-empty">右端から次のノードに接続してください。</div>`;return;}
if(node.type==='condition'){renderConditionSettings(node);return;}
if(node.type==='conditionBranch'){settingsPanel.innerHTML=`<div class="settings-title">${node.conditionResult==='yes'?'はい':'いいえ'}</div><div class="settings-empty">右端から次のノードに接続してください。</div>`;return;}
if(node.type==='textAnswerBranch'){settingsPanel.innerHTML=`<div class="settings-title">${node.textAnswerResult==='correct'?'正解':'不正解'}</div><div class="settings-empty">右端から次のノードに接続してください。</div>`;return;}
if(node.type==='clickBranch'){renderClickBranchSettings(node);return;}
if(node.type==='itemAcquire'){renderItemAcquireSettings(node);return;}
if(node.type==='inventory'){settingsPanel.innerHTML='<div class="settings-title">インベントリ表示</div><div class="settings-empty">このノードを実行すると、ゲーム画面にインベントリボタンが表示されます。取得したアイテムを一覧表示できます。</div>';return;}
if(node.type==='itemUse'){renderItemUseSettings(node);return;}
if(node.type==='media2d'){
renderMedia2DNodeSettings(node);
return;
}
if(node.type==='frameIn'){
renderFrameInSettings(node);
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

settingsPanel.innerHTML=`<div class="settings-title">クリック</div>${frameControls}<div class="setting-group"><div class="setting-section-heading">範囲設定</div><div class="click-inherit-row">${inheritControl}</div><div class="click-preview-wrap"><canvas id="clickPreviewCanvas" class="world-preview" width="320" height="320"></canvas><canvas id="clickLassoCanvas" class="click-lasso-canvas" width="320" height="320"></canvas><div class="click-lasso-mode-buttons"><button id="clickLassoAddBtn" class="click-lasso-mode active" type="button" title="選択範囲に追加" aria-pressed="true">＋</button><button id="clickLassoSubtractBtn" class="click-lasso-mode" type="button" title="選択範囲から削除" aria-pressed="false">－</button></div></div><div class="pan-help">左ドラッグ：投げ縄 / Space＋ドラッグ・中ドラッグ：カメラ回転 / Z＋ドラッグ・ホイール：ズーム / Ctrl＋Z：戻す / Ctrl＋Y：やり直す</div></div><div class="setting-group"><button id="clearClickLassoBtn" class="add-world-btn" type="button">範囲を消去</button></div>`;

// クリック範囲の編集プレビュー専用。ゲーム再生時の表示条件には影響しない。
const clickLayerFolder=sourceNode.type==='world'
 ?state.worldFolders?.find(folder=>folder.backerId===sourceNode.id)
 :null;
if(clickLayerFolder?.layers?.length){
 const group=document.createElement('div');
 group.className='setting-group';
 const heading=document.createElement('div');
 heading.className='setting-section-heading';
 heading.textContent='透明レイヤー（編集画面のみ）';
 group.appendChild(heading);
 const note=document.createElement('div');note.className='settings-empty';
 note.textContent='チェックを外すとクリック範囲のプレビューから非表示になります。ゲーム再生には影響しません。';
 group.appendChild(note);
 if(!Array.isArray(node.clickHiddenLayerIds))node.clickHiddenLayerIds=[];
 for(const layer of clickLayerFolder.layers){
  const label=document.createElement('label');label.className='click-layer-visibility-row';
  const input=document.createElement('input');input.type='checkbox';
  input.checked=!node.clickHiddenLayerIds.includes(layer.id);
  const name=document.createElement('span');name.textContent=layer.name||'新規レイヤー';
  label.append(input,name);group.append(label);
  input.addEventListener('change',()=>{
   const hidden=new Set(node.clickHiddenLayerIds||[]);
   if(input.checked)hidden.delete(layer.id);else hidden.add(layer.id);
   node.clickHiddenLayerIds=[...hidden];
   const canvas=document.getElementById('clickPreviewCanvas');
   if(canvas){drawPanoramaPreview(canvas,getClickLassoWorld(node,sourceNode));drawClickLassoOverlay(node,sourceNode);}
  });
 }
 settingsPanel.appendChild(group);
}
deferSelectedNodePreview(node,'clickPreviewCanvas',()=>setupClickTriggerPreview(node,sourceNode));
const normalOnceGroup=document.createElement('div');
normalOnceGroup.className='setting-group';
normalOnceGroup.innerHTML=`<label><input id="clickNormalOnceInput" type="checkbox" ${node.clickNormalOnce===true?'checked':''}> 通常のクリックを一度だけ実行する</label>`;
settingsPanel.appendChild(normalOnceGroup);
document.getElementById('clickNormalOnceInput').addEventListener('change',e=>{
 node.clickNormalOnce=e.target.checked;
});
renderClickItemBranchSettings(node);
// クリック範囲そのものの有効条件。2条件の場合のみ AND / OR を適用する。
const enableGroup=document.createElement('div');enableGroup.className='setting-group';
enableGroup.innerHTML='<div class="setting-section-heading">クリックの有効条件</div><div class="settings-empty">この条件はゲーム再生中のクリック可否を制御します。</div><div id="clickEnablePrimary"></div><div id="clickEnableSecondaryControls" style="margin-top:10px"><button type="button" id="clickEnableAddSecond" class="secondary-button">＋ 条件を追加</button><div id="clickEnableSecond" hidden><label class="setting-label" for="clickEnableOperator">条件の組み合わせ</label><select id="clickEnableOperator" class="number-input"><option value="and">かつ（両方を満たす）</option><option value="or">または（どちらかを満たす）</option></select><div id="clickEnableSecondary"></div><button type="button" id="clickEnableRemoveSecond" class="secondary-button">2つ目の条件を削除</button></div></div>';
settingsPanel.appendChild(enableGroup);
const makeConditionControls=(container,fields,prefix)=>{
 container.innerHTML=`<select id="${prefix}Type" class="number-input"><option value="always">常時有効</option><option value="acquire">アイテム取得</option><option value="toggle">トグル</option><option value="event">イベント記録</option></select><select id="${prefix}Target" class="number-input"></select><select id="${prefix}State" class="number-input"></select>`;
 const type=container.querySelector(`#${prefix}Type`),target=container.querySelector(`#${prefix}Target`),status=container.querySelector(`#${prefix}State`);
 type.value=node[fields.type]||'always';
 const refresh=()=>{
  const kind=type.value;
  target.replaceChildren(new Option('対象を選択',''));
  const typeMap={acquire:'itemAcquire',toggle:'toggle',event:'eventRecord'};
  for(const targetNode of state.nodes.filter(n=>n.type===typeMap[kind]))target.add(new Option(targetNode.toggleName||targetNode.itemName||targetNode.eventName||targetNode.id,targetNode.id));
  target.value=node[fields.target]||'';
  status.replaceChildren(new Option(kind==='toggle'?'OFF':'前','before'),new Option(kind==='toggle'?'ON':'後','after'));
  status.value=node[fields.state]||'after';
  target.hidden=status.hidden=kind==='always';
 };
 refresh();
 type.onchange=()=>{node[fields.type]=type.value;node[fields.target]='';node[fields.state]='after';refresh();};
 target.onchange=()=>{node[fields.target]=target.value;};
 status.onchange=()=>{node[fields.state]=status.value;};
};
makeConditionControls(enableGroup.querySelector('#clickEnablePrimary'),{type:'clickEnableType',target:'clickEnableTargetId',state:'clickEnableState'},'clickEnable');
const secondWrap=enableGroup.querySelector('#clickEnableSecond');
const addSecond=enableGroup.querySelector('#clickEnableAddSecond');
const op=enableGroup.querySelector('#clickEnableOperator');
const syncSecond=()=>{const active=node.clickEnableSecondEnabled===true;secondWrap.hidden=!active;addSecond.hidden=active;};
makeConditionControls(enableGroup.querySelector('#clickEnableSecondary'),{type:'clickEnableSecondType',target:'clickEnableSecondTargetId',state:'clickEnableSecondState'},'clickEnableSecond');
op.value=node.clickEnableOperator==='or'?'or':'and';
op.onchange=()=>{node.clickEnableOperator=op.value;};
addSecond.onclick=()=>{node.clickEnableSecondEnabled=true;syncSecond();};
enableGroup.querySelector('#clickEnableRemoveSecond').onclick=()=>{node.clickEnableSecondEnabled=false;syncSecond();};
syncSecond();

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

const editors=node.dialoguePages.map((text,index)=>`
<div class="dialogue-editor">
<div class="dialogue-editor-header">
<div class="setting-label">ダイアローグ ${index+1}</div>
<button type="button" class="dialogue-delete-btn" data-dialogue-delete="${index}">削除</button>
</div>
<textarea class="dialogue-textarea" data-dialogue-index="${index}" maxlength="60">${escapeHtml(text)}</textarea>
<div class="dialogue-count" data-dialogue-count="${index}">${text.length}/60</div>
</div>`).join('');
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
<div id="dialogueEditors">${editors}</div>
<div class="setting-group">
<button id="addDialogueBtn" class="add-world-btn dialogue-add-full" type="button">ダイアローグを追加</button>
</div>`;

setupDialogueAppearance(node);
deferSelectedNodePreview(node,'dialoguePreviewCanvas',()=>setupDialogueTriggerPreview(node,previousMedia));
return;
}
renderMediaNodeSettings(node);

}

function renderOptionSettings(node){
if(!Array.isArray(node.optionChoices))node.optionChoices=[];
if(!Array.isArray(node.dialoguePages))node.dialoguePages=[];
if(node.dialoguePages.length===0)node.dialoguePages=[''];
if(node.dialoguePages.length>1)node.dialoguePages=[node.dialoguePages[0]];
const source=findPreviousClickMediaNode(node.id);
ensureDialogueView(node,source);
const text=node.dialoguePages[0]||'';
const fontSize=Number(node.dialogueFontSize)||24;
settingsPanel.innerHTML=`<div class="settings-title">オプション</div>
<div class="setting-group"><div class="setting-label">発話者</div><input id="dialogueSpeakerInput" class="number-input" type="text" maxlength="40" value="${escapeHtml(node.dialogueSpeaker||'').replace(/"/g,'&quot;')}"></div>
<div class="setting-group"><div class="setting-label">サムネイル</div><div class="dialogue-thumbnail-controls"><select id="dialogueThumbnailSelect" class="number-input">${getDialogueThumbnailOptions(node.dialogueThumbnailMediaId)}</select><img id="dialogueThumbnailSettingsImage" class="dialogue-thumbnail-settings-image hidden" alt=""></div></div>
<div class="setting-group"><div class="setting-label">フォントサイズ（px）</div><input id="dialogueFontSizeInput" class="number-input" type="number" min="10" max="36" value="${fontSize}"></div>
<div class="setting-group"><div class="setting-label">パネルの高さ（${state.displayMode==='pc'?'PC':'スマホ'}・画面高さの％）</div><input id="dialoguePanelHeightInput" class="number-input" type="number" min="10" max="60" value="${getDialoguePanelHeight(node)}"></div>
<div class="setting-group"><div class="dialogue-preview-wrap"><canvas id="dialoguePreviewCanvas" class="world-preview" width="320" height="320"></canvas><div id="dialoguePreviewBox" class="dialogue-preview-box"><div id="dialoguePreviewSpeaker" class="dialogue-speaker hidden"></div><div class="dialogue-panel-content"><img id="dialoguePreviewThumbnail" class="dialogue-panel-thumbnail hidden" alt=""><div id="dialoguePreviewText" class="dialogue-preview-text"></div></div></div></div></div>
<div class="setting-group"><div class="setting-label">質問文</div><textarea id="optionQuestion" class="dialogue-textarea" maxlength="60">${escapeHtml(text)}</textarea><div id="optionQuestionCount" class="dialogue-count">${text.length}/60</div></div>
<div class="setting-group"><div class="setting-label">選択肢</div><div id="optionChoiceRows">${node.optionChoices.map((c,i)=>`<div class="option-choice-row"><span>選択肢${i+1}</span><input class="number-input" data-choice-text="${c.id}" maxlength="60" value="${escapeHtml(c.text).replace(/"/g,'&quot;')}"><button type="button" class="dialogue-delete-btn" data-choice-delete="${c.id}">削除</button></div>`).join('')}</div><button id="optionAddChoice" class="add-world-btn" type="button">＋</button></div>`;
// ダイアローグと同じ背景・サムネイル・文字サイズ等の設定を共有
setupDialogueAppearance(node);
const originalPages=node.dialoguePages;
const addButton=document.createElement('button');addButton.id='addDialogueBtn';addButton.hidden=true;settingsPanel.appendChild(addButton);
deferSelectedNodePreview(node,'dialoguePreviewCanvas',()=>{
setupDialogueTriggerPreview(node,source);
addButton.remove();
});
const question=document.getElementById('optionQuestion');
question.addEventListener('input',()=>{
node.dialoguePages=[question.value.slice(0,60)];
const count=document.getElementById('optionQuestionCount');if(count)count.textContent=`${node.dialoguePages[0].length}/60`;
const preview=document.getElementById('dialoguePreviewText');if(preview)preview.textContent=node.dialoguePages[0];
});
document.getElementById('optionAddChoice').addEventListener('click',()=>addOptionChoice(node));
settingsPanel.querySelectorAll('[data-choice-text]').forEach(input=>input.addEventListener('input',()=>{
const choice=node.optionChoices.find(c=>c.id===input.dataset.choiceText);if(!choice)return;
choice.text=input.value.slice(0,60);renderNodes();
}));
settingsPanel.querySelectorAll('[data-choice-delete]').forEach(button=>button.addEventListener('click',()=>removeOptionChoice(node,button.dataset.choiceDelete)));
}

// Each click location owns item-specific outgoing branches.
function clickBranches(owner){
 return state.nodes.filter(n=>n.type==='clickBranch'&&n.clickBranchOwnerId===owner.id);
}
function addClickItemBranch(owner,itemId){
 if(!itemId||itemId==='__other__')return;
 if(clickBranches(owner).some(n=>n.clickBranchItemId===itemId))return;
 const before=editorSnapshot();
 const branch={folderId:owner.folderId,id:uid('clickBranch'),type:'clickBranch',clickBranchOwnerId:owner.id,clickBranchItemId:itemId,clickBranchOnce:false,clickBranchConsume:false,x:owner.x+250,y:owner.y+95*(clickBranches(owner).length+1)};
 state.nodes.push(branch);
 state.connections.push({id:uid('conn'),from:owner.id,to:branch.id});
 commitEditorHistory(before);
 renderNodes();renderSettings();
}
function deleteClickItemBranch(branch){
 const before=editorSnapshot();
 state.nodes=state.nodes.filter(n=>n.id!==branch.id);
 state.connections=state.connections.filter(c=>c.from!==branch.id&&c.to!==branch.id);
 commitEditorHistory(before);renderNodes();renderSettings();
}
function removeLegacyOtherClickBranches(){
 const legacyIds=new Set(state.nodes.filter(n=>n.type==='clickBranch'&&n.clickBranchItemId==='__other__').map(n=>n.id));
 if(!legacyIds.size)return;
 state.nodes=state.nodes.filter(n=>!legacyIds.has(n.id));
 state.connections=state.connections.filter(c=>!legacyIds.has(c.from)&&!legacyIds.has(c.to));
 if(legacyIds.has(state.selectedNodeId))state.selectedNodeId=null;
 for(const id of legacyIds)state.selectedNodeIds?.delete(id);
}
function renderClickItemBranchSettings(node){
 const group=document.createElement('div');
 group.className='setting-group click-item-branch-settings';
 const heading=document.createElement('div');
 heading.className='setting-section-heading';
 heading.textContent='アイテム設定';
 group.append(heading);

 const items=state.nodes.filter(n=>n.type==='itemAcquire');
 for(const branch of clickBranches(node).filter(b=>b.clickBranchItemId!=='__other__')){
  const row=document.createElement('div');
  row.className='click-item-branch-row';
  const select=document.createElement('select');
  select.className='number-input click-item-branch-select';
  select.setAttribute('aria-label','使用するアイテム');
  for(const item of items){
   const option=document.createElement('option');
   option.value=item.id;
   option.textContent=itemDisplayName(item);
   option.selected=branch.clickBranchItemId===item.id;
   option.disabled=clickBranches(node).some(other=>other.id!==branch.id&&other.clickBranchItemId===item.id);
   select.append(option);
  }
  if(!items.some(item=>item.id===branch.clickBranchItemId)){
   const option=document.createElement('option');
   option.value=branch.clickBranchItemId;
   option.textContent='削除されたアイテム';
   option.selected=true;
   option.disabled=true;
   select.prepend(option);
  }
  select.addEventListener('change',()=>{
   if(!select.value)return;
   if(clickBranches(node).some(other=>other.id!==branch.id&&other.clickBranchItemId===select.value))return;
   const before=editorSnapshot();
   branch.clickBranchItemId=select.value;
   commitEditorHistory(before);
   renderNodes();renderSettings();
  });
  const remove=document.createElement('button');
  remove.type='button';remove.className='click-item-branch-remove';
  remove.textContent='削除';remove.title='このアイテム分岐を削除';
  remove.addEventListener('click',()=>deleteClickItemBranch(branch));
  row.append(select,remove);group.append(row);
 }
 // メディアの素材選択と同じく、選択した時点で分岐を追加する
 const add=document.createElement('select');
 add.className='number-input click-item-branch-add-select';
 add.setAttribute('aria-label','アイテムを追加');
 const placeholder=document.createElement('option');
 placeholder.value='';
 placeholder.textContent='アイテムを選択してください';
 add.append(placeholder);

 for(const item of items){
  if(clickBranches(node).some(b=>b.clickBranchItemId===item.id))continue;
  const option=document.createElement('option');
  option.value=item.id;
  option.textContent=itemDisplayName(item);
  add.append(option);
 }
 add.disabled=add.options.length===1;
 add.value='';
 add.addEventListener('change',()=>{
  if(add.value)addClickItemBranch(node,add.value);
 });
 group.append(add);
 settingsPanel.append(group);
}

function renderClickBranchSettings(branch){
 const item=branch.clickBranchItemId==='__other__'?null:getNode(branch.clickBranchItemId);
 const label=branch.clickBranchItemId==='__other__'?'その他のアイテム':itemDisplayName(item);
 settingsPanel.innerHTML=`<div class="settings-title">クリック分岐：${escapeHtml(label)}</div><div class="setting-group"><label><input id="clickBranchOnce" type="checkbox" ${branch.clickBranchOnce?'checked':''}> 一度だけ実行する</label></div>${item?`<div class="setting-group"><label><input id="clickBranchConsume" type="checkbox" ${branch.clickBranchConsume?'checked':''}> 使用後にアイテムを消費する</label></div>`:''}${item?`<div class="setting-group"><button id="clickBranchRemove" type="button" class="add-world-btn">この分岐を削除</button></div>`:``}<div class="settings-empty">右端からダイアローグやメディアへ接続してください。</div>`;
 document.getElementById('clickBranchOnce').addEventListener('change',e=>branch.clickBranchOnce=e.target.checked);
 document.getElementById('clickBranchConsume')?.addEventListener('change',e=>branch.clickBranchConsume=e.target.checked);
 document.getElementById('clickBranchRemove')?.addEventListener('click',()=>deleteClickItemBranch(branch));
}
function runClickItemBranch(click,itemId){
 previewAcquisitionSourceClickId=click.id;
recordPreviewDiagnostic('item-click',{clickId:click.id,itemId});
 const branches=clickBranches(click);
 const branch=branches.find(n=>n.clickBranchItemId===itemId);
 if(!branch){recordPreviewDiagnostic('item-no-branch',{clickId:click.id,itemId});return;} // Unregistered item without 'other' is silent.
 if(branch.clickBranchOnce&&previewCompletedTriggers.has(branch.id)){recordPreviewDiagnostic('branch-already-completed',{branchId:branch.id});return;}
recordPreviewDiagnostic('branch-fired',{branchId:branch.id,itemId,consumed:!!(branch.clickBranchConsume&&branch.clickBranchItemId===itemId)});
 usedWorldBranches.add(branch.id);refreshWorldComposite();
 if(branch.clickBranchOnce)previewCompletedTriggers.add(branch.id);
 if(branch.clickBranchConsume&&branch.clickBranchItemId===itemId){
  state.inventory.delete(itemId);
  state.selectedInventoryItemId=null;
  refreshInventory();
 }
 prepareExplorationBranch(branch.id);
 previewVisited.delete(branch.id);
 showPreviewNode(branch.id);
}

// Items share dialogue appearance and click-region editing instead of duplicating them.
function getInventoryItem(id){return getNode(id)?.type==='itemAcquire'?getNode(id):null;}
function itemThumbnail(node){
 const media=mediaLibrary.find(
  m=>m.id===node?.itemThumbnailMediaId&&
  (m.fileType==='png'||m.fileType==='jpg')
 );

 if(!media?.image)return '';

 if(media.thumbnailDataUrl)return media.thumbnailDataUrl;

 const canvas=document.createElement('canvas');
 canvas.width=256;
 canvas.height=256;

 const ctx=canvas.getContext('2d');
 if(!ctx)return '';

 ctx.clearRect(0,0,256,256);

 const image=media.image;
 const width=image.naturalWidth||image.width;
 const height=image.naturalHeight||image.height;

 if(!width||!height)return '';

 const scale=Math.min(256/width,256/height);
 const drawWidth=width*scale;
 const drawHeight=height*scale;

 ctx.drawImage(
  image,
  (256-drawWidth)/2,
  (256-drawHeight)/2,
  drawWidth,
  drawHeight
 );

 media.thumbnailDataUrl=canvas.toDataURL('image/png');

 return media.thumbnailDataUrl;
}
function itemDisplayName(node){return node?.itemName?.trim()||'アイテム';}
function renderItemAcquireSettings(node){
 if(!Array.isArray(node.dialoguePages))node.dialoguePages=[''];
 const source=findPreviousClickMediaNode(node.id);
 ensureDialogueView(node,source);
 node.dialoguePages=[node.itemDescription||''];
 node.dialogueSpeaker=node.itemName||'';
 node.dialogueThumbnailMediaId=node.itemThumbnailMediaId||null;
 const candidates=mediaLibrary.filter(m=>['png','jpg'].includes(m.fileType)&&m.width===m.height);
 const options='<option value="">未設定</option>'+candidates.map(m=>`<option value="${m.id}" ${m.id===node.itemThumbnailMediaId?'selected':''}>${escapeHtml(m.fileName)}</option>`).join('');
 settingsPanel.innerHTML=`<div class="settings-title">アイテム取得</div>
 <div class="setting-group"><div class="setting-label">アイテム名</div><input id="itemNameInput" class="number-input" maxlength="40" value="${escapeHtml(node.itemName||'').replace(/"/g,'&quot;')}"></div>
 <div class="setting-group"><div class="setting-label">サムネイル（正方形）</div><select id="itemThumbnailInput" class="number-input">${options}</select></div>
 <div class="setting-group"><div class="setting-label">説明</div><textarea id="itemDescriptionInput" class="dialogue-textarea" maxlength="60">${escapeHtml(node.itemDescription||'')}</textarea></div>
 <div class="setting-group"><label><input id="itemRemoveOriginClick" type="checkbox" ${node.itemRemoveOriginClick?'checked':''}> 取得後にクリック範囲を削除する</label><div class="pan-help">取得に使用したクリック範囲を、ゲーム再生中だけ無効にします。</div></div>
 
 <div class="setting-group"><div class="dialogue-preview-wrap"><canvas id="dialoguePreviewCanvas" class="world-preview" width="320" height="320"></canvas><div id="dialoguePreviewBox" class="dialogue-preview-box"><div id="dialoguePreviewSpeaker" class="dialogue-speaker"></div><div class="dialogue-panel-content"><img id="dialoguePreviewThumbnail" class="dialogue-panel-thumbnail hidden" alt=""><div id="dialoguePreviewText" class="dialogue-preview-text"></div></div></div></div></div>`;
 const addButton=document.createElement('button');addButton.id='addDialogueBtn';addButton.hidden=true;settingsPanel.append(addButton);
 setupDialogueTriggerPreview(node,source);addButton.remove();
 const sync=()=>{
 node.dialoguePages=[node.itemDescription||''];node.dialogueSpeaker=node.itemName||'';
 node.dialogueThumbnailMediaId=node.itemThumbnailMediaId||null;
 document.getElementById('dialoguePreviewText').textContent=node.itemDescription||'';
 document.getElementById('dialoguePreviewSpeaker').textContent=node.itemName||'';
 const img=document.getElementById('dialoguePreviewThumbnail');const src=itemThumbnail(node);
 img.classList.toggle('hidden',!src);if(src)img.src=src;
 };
 document.getElementById('itemNameInput').addEventListener('input',e=>{node.itemName=e.target.value;sync();renderNodes();});
 document.getElementById('itemDescriptionInput').addEventListener('input',e=>{node.itemDescription=e.target.value;sync();});
 document.getElementById('itemThumbnailInput').addEventListener('change',e=>{node.itemThumbnailMediaId=e.target.value||null;sync();});
 document.getElementById('itemRemoveOriginClick').addEventListener('change',e=>{node.itemRemoveOriginClick=e.target.checked;});
 sync();
}
function renderItemUseSettings(node){
 const source=findPreviousClickMediaNode(node.id);
 const items=state.nodes.filter(n=>n.type==='itemAcquire');
 const options='<option value="">使用するアイテムを選択</option>'+items.map(n=>`<option value="${n.id}" ${node.itemUseTargetId===n.id?'selected':''}>${escapeHtml(itemDisplayName(n))}</option>`).join('');
 if(!source){settingsPanel.innerHTML='<div class="settings-title">アイテム使用</div><div class="settings-empty">使用する背景メディアを前に接続してください。</div>';return;}
 settingsPanel.innerHTML=`<div class="settings-title">アイテム使用</div><div class="setting-group"><div class="setting-label">使用するアイテム</div><select id="itemUseSelect" class="number-input">${options}</select></div>
 <div class="setting-group"><div class="setting-label">クリック範囲を指定</div><div class="click-preview-wrap"><canvas id="clickPreviewCanvas" class="world-preview" width="320" height="320"></canvas><canvas id="clickLassoCanvas" class="click-lasso-canvas" width="320" height="320"></canvas><div class="click-lasso-mode-buttons"><button id="clickLassoAddBtn" class="click-lasso-mode" type="button">＋</button><button id="clickLassoSubtractBtn" class="click-lasso-mode" type="button">－</button></div></div><div class="pan-help">左ドラッグ：投げ縄 / Space＋ドラッグ：回転 / Z＋ドラッグ：ズーム</div></div>
 <div class="setting-group"><button id="clearClickLassoBtn" class="add-world-btn" type="button">範囲を消去</button></div>`;
 document.getElementById('itemUseSelect').addEventListener('change',e=>{node.itemUseTargetId=e.target.value||null;});
 setupClickTriggerPreview(node,source);

 const onceGroup=document.createElement('div');
 onceGroup.className='setting-group';

 const onceLabel=document.createElement('label');
 const onceCheckbox=document.createElement('input');
 onceCheckbox.type='checkbox';
 onceCheckbox.checked=node.triggerOnce===true;

 onceLabel.append(
  onceCheckbox,
  document.createTextNode(' 一度だけ実行する')
 );

 onceGroup.append(onceLabel);
 settingsPanel.append(onceGroup);

 onceCheckbox.addEventListener('change',()=>{
  node.triggerOnce=onceCheckbox.checked;
 });
}
const inventoryMenu=document.getElementById('inventoryMenu');
const inventoryToolboxButton=document.getElementById('inventoryToolboxButton');

function closeInventoryMenu(){
 inventoryMenu.classList.add('hidden');
 inventoryButton.setAttribute('aria-expanded','false');
}

function refreshInventory(){
 inventoryButton.classList.remove('hidden');
 const equippedItem=state.inventory.has(state.selectedInventoryItemId)
  ?getInventoryItem(state.selectedInventoryItemId):null;
 if(!equippedItem&&state.selectedInventoryItemId!==null)state.selectedInventoryItemId=null;
 const ids=[...state.inventory].filter(id=>getInventoryItem(id));
 equippedItemSelect.replaceChildren();
 const noneOption=document.createElement('option');
 noneOption.value='';noneOption.textContent='なし';
 equippedItemSelect.append(noneOption);
 for(const id of ids){
  const item=getInventoryItem(id);
  const option=document.createElement('option');
  option.value=id;
  option.textContent=itemDisplayName(item);
  equippedItemSelect.append(option);
 }
 equippedItemSelect.value=equippedItem?.id||'';
 equippedItemLabel.classList.remove('hidden');
 inventoryOverlay.replaceChildren();
 const header=document.createElement('div');header.className='inventory-header';header.textContent='アイテム一覧';
 const close=document.createElement('button');close.textContent='×';close.type='button';close.addEventListener('click',()=>inventoryOverlay.classList.add('hidden'));header.append(close);
 inventoryOverlay.append(header);
 const grid=document.createElement('div');grid.className='inventory-grid';
 for(const id of ids){
 const item=getInventoryItem(id);const b=document.createElement('button');b.type='button';b.className='inventory-item';
 b.classList.toggle('active',state.selectedInventoryItemId===id);
 const thumb=itemThumbnail(item);
 if(thumb){const img=document.createElement('img');img.src=thumb;img.alt='';b.append(img);}
 const title=document.createElement('span');title.textContent=itemDisplayName(item);b.append(title);
 b.title=item.itemDescription||'';
 b.addEventListener('click',()=>{state.selectedInventoryItemId=state.selectedInventoryItemId===id?null:id;inventoryOverlay.classList.add('hidden');refreshInventory();});
 grid.append(b);
 }
 inventoryOverlay.append(grid);

 const instruction=document.createElement('div');
 instruction.className='inventory-instruction';
 instruction.textContent='アイテムを選択後、使う場所をクリック';
 inventoryOverlay.append(instruction);

 const details=document.createElement('div');
 details.className='inventory-details';
 const selected=getInventoryItem(state.selectedInventoryItemId);
 details.textContent=selected?(selected.itemDescription||itemDisplayName(selected)):'';
 inventoryOverlay.append(details);
}

equippedItemSelect.addEventListener('change',()=>{
 const id=equippedItemSelect.value;
 state.selectedInventoryItemId=id&&state.inventory.has(id)&&getInventoryItem(id)?id:null;
 refreshInventory();
});

inventoryButton.addEventListener('click',()=>{
 const willOpen=inventoryMenu.classList.contains('hidden');
 inventoryMenu.classList.toggle('hidden',!willOpen);
 inventoryButton.setAttribute('aria-expanded',String(willOpen));
});

inventoryToolboxButton.addEventListener('click',()=>{
 closeInventoryMenu();
 refreshInventory();
 inventoryOverlay.classList.remove('hidden');
});
// 2D media uses normalized viewport coordinates and independent PC/mobile layouts.
function getMedia2DLayout(node){
if(!node.media2DLayouts)node.media2DLayouts={pc:{x:30,y:25,w:40,h:40},mobile:{x:15,y:30,w:70,h:30}};
if(!node.media2DLayouts[state.displayMode])node.media2DLayouts[state.displayMode]={x:30,y:25,w:40,h:40};
return node.media2DLayouts[state.displayMode];
}
function media2DOptions(selected){
return `<option value="">素材を選択してください</option>`+mediaLibrary.filter(m=>['png','jpg','mp4'].includes(m.fileType)).map(m=>`<option value="${m.id}" ${m.id===selected?'selected':''}>${escapeHtml(m.fileName)}</option>`).join('');
}
function createMedia2DElement(media){
if(!media)return null;
const el=document.createElement(media.fileType==='mp4'?'video':'canvas');
el.draggable=false;
if(media.fileType==='mp4'){
el.src=media.url||'';
el.muted=true;el.playsInline=true;el.loop=true;el.autoplay=true;
}else{
el.width=media.width||1;el.height=media.height||1;
if(media.image)el.getContext('2d').drawImage(media.image,0,0,el.width,el.height);
}
el.style.cssText='width:100%;height:100%;object-fit:fill;display:block;pointer-events:none;';
return el;
}
function renderMedia2DNodeSettings(node){
const media=mediaLibrary.find(m=>m.id===node.media2DId);
settingsPanel.innerHTML=`<div class="settings-title">2Dメディア</div>
<div class="setting-group"><div class="setting-label">素材（PNG・JPG・MP4）</div><select id="media2DSelect" class="number-input">${media2DOptions(node.media2DId)}</select></div>
<div class="setting-group"><div class="setting-label">配置（${state.displayMode==='pc'?'PC':'スマホ'}）</div><div id="media2DEditor" class="media2d-editor"><canvas id="media2DBackground"></canvas><div id="media2DSelection" class="media2d-selection"><div id="media2DContent"></div>${['nw','ne','sw','se'].map(p=>`<span class="media2d-handle media2d-handle-${p}" data-corner="${p}"></span>`).join('')}</div></div><div class="pan-help">素材をドラッグ：移動 / 四隅をドラッグ：縦横比を保って拡大縮小。PC・スマホの配置はそれぞれ記憶します。</div></div>`;
const select=document.getElementById('media2DSelect');
const box=document.getElementById('media2DEditor');
const selection=document.getElementById('media2DSelection');
const content=document.getElementById('media2DContent');
const layout=getMedia2DLayout(node);
const mode=getActiveLayout();box.style.aspectRatio=`${mode.width} / ${mode.height}`;
const bg=document.getElementById('media2DBackground');
const previous=findPreviousClickMediaNode(node.id);
const source=previous?.type==='world'?previous.world.image:previous?.type==='animation'?mediaLibrary.find(m=>m.id===previous.animation.mediaId)?.video:null;
if(source){
const base=getMediaCameraBase(previous);
const drawBackground=()=>{if(!bg.isConnected)return;drawPanoramaPreview(bg,{image:source,yaw:base.yaw,pitch:base.pitch,zoom:base.zoom});};
requestAnimationFrame(drawBackground);
if(source.tagName==='VIDEO')source.addEventListener('loadeddata',drawBackground,{once:true});
}
let shownMedia=null;
function fillMedia(){
content.replaceChildren();shownMedia=mediaLibrary.find(m=>m.id===node.media2DId);
const mediaElement=createMedia2DElement(shownMedia);
if(mediaElement){content.appendChild(mediaElement);if(mediaElement.tagName==='VIDEO')mediaElement.play().catch(()=>{});}
}
function draw(){selection.style.left=`${layout.x}%`;selection.style.top=`${layout.y}%`;selection.style.width=`${layout.w}%`;selection.style.height=`${layout.h}%`;}
function fitAspectRatio(){
const selected=mediaLibrary.find(m=>m.id===node.media2DId);
if(!selected?.width||!selected?.height)return;
const rect=box.getBoundingClientRect();
if(!rect.width||!rect.height)return;
// Width stays fixed; correct height using the media's intrinsic ratio.
layout.h=layout.w*rect.width/rect.height*selected.height/selected.width;
}
select.addEventListener('change',()=>{node.media2DId=select.value||null;fillMedia();fitAspectRatio();draw();});
fillMedia();
requestAnimationFrame(()=>{if(box.isConnected){fitAspectRatio();draw();}});
draw();
let drag=null;
selection.addEventListener('pointerdown',e=>{
if(e.button!==0)return;
const corner=e.target.dataset.corner||null;
drag={id:e.pointerId,corner,x:e.clientX,y:e.clientY,start:{...layout}};
selection.setPointerCapture(e.pointerId);e.preventDefault();
});
selection.addEventListener('pointermove',e=>{
if(!drag||e.pointerId!==drag.id)return;
const r=box.getBoundingClientRect();
if(!r.width||!r.height)return;
const dx=(e.clientX-drag.x)/r.width*100;
const dy=(e.clientY-drag.y)/r.height*100;
const a=drag.start;
if(!drag.corner){layout.x=a.x+dx;layout.y=a.y+dy;}
else{
const selected=mediaLibrary.find(m=>m.id===node.media2DId);
const ratio=selected?.width&&selected?.height?selected.width/selected.height:(a.w*r.width)/(a.h*r.height);
const anchorX=drag.corner.includes('w')?a.x+a.w:a.x;
const anchorY=drag.corner.includes('n')?a.y+a.h:a.y;
const signX=drag.corner.includes('w')?-1:1;
const signY=drag.corner.includes('n')?-1:1;
const desiredW=Math.max(1,signX*(a.w*signX+dx));
const desiredH=Math.max(1,signY*(a.h*signY+dy));
const widthFromHeight=desiredH*r.height/r.width*ratio;
const newW=Math.max(1,Math.abs(desiredW-a.w)>Math.abs(widthFromHeight-a.w)?desiredW:widthFromHeight);
const newH=newW*r.width/r.height/ratio;
layout.x=signX<0?anchorX-newW:anchorX;
layout.y=signY<0?anchorY-newH:anchorY;
layout.w=newW;
layout.h=newH;
}
draw();
});
const end=e=>{if(drag?.id!==e.pointerId)return;drag=null;if(selection.hasPointerCapture(e.pointerId))selection.releasePointerCapture(e.pointerId);};
selection.addEventListener('pointerup',end);selection.addEventListener('pointercancel',end);
}
function clearMedia2DLayer(){
for(const video of media2DLayer.querySelectorAll('video')){video.pause();video.removeAttribute('src');video.load();}
media2DLayer.replaceChildren();
}
function showMedia2D(node){
const media=mediaLibrary.find(m=>m.id===node.media2DId);
if(!media)return;
const layout=getMedia2DLayout(node);
const el=createMedia2DElement(media);
if(!el)return;
const wrap=document.createElement('div');
wrap.style.cssText=`position:absolute;left:${layout.x}%;top:${layout.y}%;width:${layout.w}%;height:${layout.h}%;pointer-events:none;`;
wrap.appendChild(el);media2DLayer.appendChild(wrap);
if(el.tagName==='VIDEO')el.play().catch(error=>console.warn('2D動画を再生できませんでした',error));
}

// Frame-in: target is sphere-anchored; frame is viewport-anchored.
function frameInCopy(regions){return regions.map(r=>({mode:r.mode,points:r.points.map(p=>({...p}))}));}
function frameInHistory(node){
if(!Array.isArray(node.frameInTarget))node.frameInTarget=[];
if(!Array.isArray(node.frameInFrame))node.frameInFrame=[];
if(!Array.isArray(node.frameInUndo))node.frameInUndo=[];
if(!Array.isArray(node.frameInRedo))node.frameInRedo=[];
}
function frameInSnapshot(node){return {target:frameInCopy(node.frameInTarget),frame:frameInCopy(node.frameInFrame)};}
function frameInRestore(node,snap){node.frameInTarget=frameInCopy(snap.target);node.frameInFrame=frameInCopy(snap.frame);}
function frameInPush(node){frameInHistory(node);node.frameInUndo.push(frameInSnapshot(node));if(node.frameInUndo.length>100)node.frameInUndo.shift();node.frameInRedo=[];}
function frameInStep(node,redo){
frameInHistory(node);
const from=redo?node.frameInRedo:node.frameInUndo;
if(!from.length)return false;
const to=redo?node.frameInUndo:node.frameInRedo;
to.push(frameInSnapshot(node));frameInRestore(node,from.pop());return true;
}
function frameInView(node,source){
if(!node.frameInView)node.frameInView={yaw:0,pitch:0,zoom:1,initialized:false};
const key=`${source.id}:${state.displayMode}`;
if(!node.frameInView.initialized||node.frameInReferenceKey!==key){
Object.assign(node.frameInView,getReferenceCamera(node,source,getTriggerPreviewTime(node.id,source)),{initialized:true});
node.frameInReferenceKey=key;
}
return node.frameInView;
}
function frameInTrace(ctx,points,project){
if(points.length<3)return false;
const projected=points.map(project);
if(projected.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return false;
ctx.beginPath();ctx.moveTo(projected[0].x,projected[0].y);
for(let i=1;i<projected.length;i++)ctx.lineTo(projected[i].x,projected[i].y);
ctx.closePath();return true;
}
function paintFrameInRegions(ctx,regions,project){
for(const region of regions){
if(!frameInTrace(ctx,region.points,project))continue;
ctx.globalCompositeOperation=region.mode==='subtract'?'destination-out':'source-over';
ctx.fillStyle='#fff';ctx.fill();
}
ctx.globalCompositeOperation='source-over';
}
function frameInMasks(node,canvas,view,width,height){
frameInHistory(node);
const target=document.createElement('canvas');target.width=width;target.height=height;
const frame=document.createElement('canvas');frame.width=width;frame.height=height;
const rect=canvas.getBoundingClientRect();
const tx=target.getContext('2d',{willReadFrequently:true});
const fx=frame.getContext('2d',{willReadFrequently:true});
const projectWorld=p=>{
const q=projectWorldAnglesToScreen(canvas,view,p.yaw,p.pitch);
return q?{x:q.x/(rect.width||1)*width,y:q.y/(rect.height||1)*height}:null;
};
const projectFrame=p=>({x:p.x*width,y:p.y*height});
paintFrameInRegions(tx,node.frameInTarget,projectWorld);
paintFrameInRegions(fx,node.frameInFrame,projectFrame);
return {target:tx.getImageData(0,0,width,height).data,frame:fx.getImageData(0,0,width,height).data};
}
function isFrameInTriggered(node,canvas,view){
if(!node.frameInTarget?.some(r=>r.mode==='add'&&r.points.length>=3)||!node.frameInFrame?.some(r=>r.mode==='add'&&r.points.length>=3))return false;
const {target,frame}=frameInMasks(node,canvas,view,192,108);
let hit=false,total=0,inside=0;
for(let i=3;i<target.length;i+=4){
if(target[i]<128)continue;
total++;
if(frame[i]>=128){inside++;hit=true;}
}
if(node.frameInMode==='touch')return hit;
return total>0&&inside===total;
}
function drawFrameInOverlay(node,canvas,overlay,view,draft=[]){
const rect=canvas.getBoundingClientRect();
const w=rect.width;
const h=rect.height;
const dpr=window.devicePixelRatio||1;
const width=Math.max(1,Math.round(w*dpr));
const height=Math.max(1,Math.round(h*dpr));

if(overlay.width!==width||overlay.height!==height){
overlay.width=width;
overlay.height=height;
}

const ctx=overlay.getContext('2d');
if(!ctx)return;

ctx.setTransform(dpr,0,0,dpr,0,0);
ctx.clearRect(0,0,w,h);

const project=(type,p)=>{
if(type==='target'){
return projectWorldAnglesToScreen(
canvas,view,p.yaw,p.pitch
);
}
return{x:p.x*w,y:p.y*h};
};

for(const type of ['target','frame']){
const regions=type==='target'
?node.frameInTarget
:node.frameInFrame;

const color=type==='target'?'#ff8a00':'#39cb65';

const mask=document.createElement('canvas');
mask.width=width;
mask.height=height;

const maskCtx=mask.getContext('2d');
if(!maskCtx)continue;

maskCtx.setTransform(dpr,0,0,dpr,0,0);

paintFrameInRegions(
maskCtx,
regions,
p=>project(type,p)
);

const colorCanvas=document.createElement('canvas');
colorCanvas.width=width;
colorCanvas.height=height;

const colorCtx=colorCanvas.getContext('2d');

if(colorCtx){
colorCtx.fillStyle=color;
colorCtx.fillRect(0,0,width,height);
colorCtx.globalCompositeOperation='destination-in';
colorCtx.drawImage(mask,0,0);

ctx.setTransform(1,0,0,1,0,0);
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
outlineCtx.fillStyle=color;
outlineCtx.fillRect(0,0,width,height);

ctx.setTransform(1,0,0,1,0,0);
ctx.drawImage(outline,0,0);
}

ctx.setTransform(dpr,0,0,dpr,0,0);

if(node.frameInTool!==type||draft.length===0)continue;

const projected=draft.map(p=>project(type,p));
const valid=projected.filter(Boolean);

if(valid.length===0)continue;

ctx.beginPath();
ctx.moveTo(valid[0].x,valid[0].y);

for(let i=1;i<valid.length;i++){
ctx.lineTo(valid[i].x,valid[i].y);
}

if(valid.length>=3){
ctx.closePath();

if(node.frameInBrush==='subtract'){
ctx.fillStyle='rgba(255,255,255,0.28)';
ctx.fill();
}
}

ctx.strokeStyle=node.frameInBrush==='subtract'
?'#ffffff'
:color;

ctx.lineWidth=2.5;
ctx.lineCap='round';
ctx.lineJoin='round';
ctx.stroke();
}
}
function renderFrameInSettings(node){
const source=findPreviousClickMediaNode(node.id);
if(!source){settingsPanel.innerHTML='<div class="settings-title">フレームイン</div><div class="settings-empty">参照できる360°メディアを接続してください。</div>';return;}
frameInHistory(node);
const view=frameInView(node,source);
const media=source.type==='animation'?getClickAnimationMedia(source):null;
const image=source.type==='world'?source.world.image:media?.video;
settingsPanel.innerHTML=`<div class="settings-title">フレームイン</div>
<div class="setting-group framein-checks"><label><input id="frameInContain" type="checkbox" ${node.frameInMode!=='touch'?'checked':''}> 内包したら発火</label><label><input id="frameInTouch" type="checkbox" ${node.frameInMode==='touch'?'checked':''}> 接触したら発火</label></div>
<div class="setting-group"><div class="click-preview-wrap framein-preview-wrap"><canvas id="frameInPreview" class="world-preview" width="320" height="320"></canvas><canvas id="frameInOverlay" class="click-lasso-canvas" width="320" height="320"></canvas><div class="click-lasso-mode-buttons"><button id="frameInAdd" class="click-lasso-mode" type="button" title="選択範囲に追加">＋</button><button id="frameInSubtract" class="click-lasso-mode" type="button" title="選択範囲から削除">－</button></div></div>
<div class="pan-help">左ドラッグ：投げ縄 / Space＋ドラッグ・中ドラッグ：カメラ回転 / Z＋ドラッグ・ホイール：ズーム / Ctrl＋Z：戻す / Ctrl＋Y：やり直す</div></div>
<div class="setting-group framein-tools"><button type="button" id="frameInTargetButton">ターゲット</button><button type="button" id="frameInFrameButton">フレーム</button></div>
<div class="setting-group"><button id="clearFrameInBtn" class="add-world-btn" type="button">範囲を消去</button></div>`;
const preview=document.getElementById('frameInPreview');
const overlay=document.getElementById('frameInOverlay');
const targetBtn=document.getElementById('frameInTargetButton');
const frameBtn=document.getElementById('frameInFrameButton');
const addBtn=document.getElementById('frameInAdd');
const subBtn=document.getElementById('frameInSubtract');
node.frameInTool=node.frameInTool==='frame'?'frame':'target';
node.frameInBrush=node.frameInBrush==='subtract'?'subtract':'add';
let draft=[],drag=null;
const sync=()=>{
targetBtn.classList.toggle('active',node.frameInTool==='target');frameBtn.classList.toggle('active',node.frameInTool==='frame');
addBtn.classList.toggle('active',node.frameInBrush==='add');subBtn.classList.toggle('active',node.frameInBrush==='subtract');
};
const draw=()=>{
drawPanoramaPreview(preview,{image,yaw:view.yaw,pitch:view.pitch,zoom:view.zoom});
drawFrameInOverlay(node,preview,overlay,view,draft);
};
const switchTool=tool=>{node.frameInTool=tool;draft=[];sync();draw();};
targetBtn.addEventListener('click',()=>switchTool('target'));
frameBtn.addEventListener('click',()=>switchTool('frame'));
addBtn.addEventListener('click',()=>{node.frameInBrush='add';sync();});
subBtn.addEventListener('click',()=>{node.frameInBrush='subtract';sync();});

document.getElementById('clearFrameInBtn').addEventListener('click',()=>{
const regions=node.frameInTool==='target'
?node.frameInTarget
:node.frameInFrame;

if(regions.length===0)return;

frameInPush(node);
regions.length=0;
draft=[];
draw();
});

const setMode=mode=>{node.frameInMode=mode;document.getElementById('frameInContain').checked=mode==='contain';document.getElementById('frameInTouch').checked=mode==='touch';};
document.getElementById('frameInContain').addEventListener('change',()=>setMode('contain'));
document.getElementById('frameInTouch').addEventListener('change',()=>setMode('touch'));
const addPoint=e=>{
const rect=overlay.getBoundingClientRect();
const p=node.frameInTool==='target'
?screenPointToWorldAngles(overlay,view,e.clientX,e.clientY)
:{x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height};
if(!p)return;
const prev=draft[draft.length-1];
if(prev&&Math.hypot(...(node.frameInTool==='target'?[angleDiff(prev.yaw,p.yaw),prev.pitch-p.pitch]:[prev.x-p.x,prev.y-p.y]))<.003)return;
draft.push(p);draw();
};
overlay.addEventListener('pointerdown',e=>{
const rotate=e.button===1||(e.button===0&&state.pressedKeys.has(' '));
const zoom=e.button===0&&state.pressedKeys.has('z');
if(e.button!==0&&e.button!==1)return;
if(rotate)drag={mode:'rotate',id:e.pointerId,x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch};
else if(zoom)drag={mode:'zoom',id:e.pointerId,y:e.clientY,zoom:view.zoom};
else {frameInPush(node);draft=[];drag={mode:'lasso',id:e.pointerId};addPoint(e);}
overlay.setPointerCapture(e.pointerId);e.preventDefault();
});
overlay.addEventListener('pointermove',e=>{
if(!drag||e.pointerId!==drag.id)return;
if(drag.mode==='rotate'){
view.yaw=drag.yaw-(e.clientX-drag.x)*.008;
view.pitch=clamp(drag.pitch+(e.clientY-drag.y)*.008,-Math.PI/2+.02,Math.PI/2-.02);draw();
}else if(drag.mode==='zoom'){
view.zoom=clamp(drag.zoom-(e.clientY-drag.y)*.005,.6,2.2);draw();
}else addPoint(e);
});
const finish=e=>{
if(!drag||e.pointerId!==drag.id)return;
if(drag.mode==='lasso'){
addPoint(e);
if(draft.length>=3){const regions=node.frameInTool==='target'?node.frameInTarget:node.frameInFrame;
regions.push({mode:node.frameInBrush,points:draft.map(p=>({...p}))});}
}
draft=[];drag=null;if(overlay.hasPointerCapture(e.pointerId))overlay.releasePointerCapture(e.pointerId);draw();
};
overlay.addEventListener('pointerup',finish);
overlay.addEventListener('pointercancel',e=>{draft=[];drag=null;draw();});
overlay.addEventListener('wheel',e=>{e.preventDefault();view.zoom=clamp(view.zoom+(e.deltaY>0?-.1:.1),.6,2.2);draw();},{passive:false});
if(image?.tagName==='VIDEO'){
const listener=()=>{if(preview.isConnected)draw();};
image.addEventListener('seeked',listener);
const prior=cleanupAnimationSettingsPreview;
cleanupAnimationSettingsPreview=()=>{image.removeEventListener('seeked',listener);node.frameInUndoAction=null;node.frameInRedoAction=null;prior?.();};
}
node.frameInUndoAction=()=>{if(frameInStep(node,false))draw();};
node.frameInRedoAction=()=>{if(frameInStep(node,true))draw();};
const previousCleanup=cleanupAnimationSettingsPreview;
cleanupAnimationSettingsPreview=()=>{node.frameInUndoAction=null;node.frameInRedoAction=null;previousCleanup?.();};
sync();requestAnimationFrame(draw);
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
const sourceDuration=getMediaPlaybackDuration(sourceNode,media);
const framesForDuration=getKeyframeNodeFrames(node);
const lastFrameTime=Math.max(0,...framesForDuration.map(f=>Number(f.time)||0));
const savedDuration=Number(node.keyframeDuration);
const duration=Number.isFinite(savedDuration)&&savedDuration>0?Math.max(savedDuration,lastFrameTime):Math.max(sourceDuration,lastFrameTime);
const fps=videoMode?Number(media?.fps):8;
const validFps=Number.isFinite(fps)&&fps>0;
const frames=getKeyframeNodeFrames(node);
const source=videoMode?media?.video:sourceNode.world.image;
settingsPanel.innerHTML=`
<div class="settings-title">キーフレーム</div>
<div class="setting-group"><div class="setting-label">参照メディア</div><div class="file-name">${escapeHtml(videoMode?sourceNode.animation.fileName:sourceNode.world.fileName)}</div></div>
<div class="setting-group"><canvas id="keyframeCameraCanvas" class="world-preview" width="320" height="320"></canvas><div class="pan-help">ドラッグ：カメラ回転 / ホイール：ズーム</div></div>
<div class="setting-group"><div class="setting-label">キーフレームの再生時間（秒）</div><input id="keyframeDurationInput" class="number-input" type="number" min="0.001" max="3600" step="0.1" value="${duration.toFixed(3)}"></div>
<div class="setting-group"><div class="setting-label">現在の時間（秒）</div><input id="keyframeSecondInput" class="number-input" type="number" min="0" max="${duration}" step="0.001" value="0"></div>
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
if(fields&&target){
 const cameraSection=document.createElement('details');cameraSection.className='world-camera-section';
 cameraSection.open=Boolean(node.editorCameraOpen);
 const summary=document.createElement('summary');summary.textContent='カメラ情報';cameraSection.append(summary);
 const copyGroup=fields.querySelector('.camera-copy-view')?.closest('.setting-group');
 if(copyGroup){const button=copyGroup.querySelector('.camera-copy-view');if(button){const first=document.createElement('div');first.className='setting-group';first.append(button);fields.prepend(first);}}
 for(const [key,title] of [['yaw','水平方向（°）'],['pitch','垂直方向（°）'],['fov','FOV値（°）']]){
  const label=fields.querySelector(`[data-camera-value="${key}"]`)?.closest('.setting-group')?.querySelector('.setting-label');if(label)label.textContent=title;
 }
 cameraSection.append(fields);target.append(cameraSection);
 cameraSection.addEventListener('toggle',()=>{node.editorCameraOpen=cameraSection.open;});
}
const seek=time=>{
second=clamp(Number(time)||0,0,duration);

range.value=String(second);
const currentTimeInput=document.getElementById('keyframeSecondInput');
if(currentTimeInput&&document.activeElement!==currentTimeInput)currentTimeInput.value=second.toFixed(3);
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
document.getElementById('keyframeSecondInput').addEventListener('change',e=>seek(e.target.value),{signal});
document.getElementById('keyframeDurationInput').addEventListener('change',e=>{
const number=Number(e.target.value);
if(!Number.isFinite(number)||number<=0){e.target.value=duration.toFixed(3);return;}
node.keyframeDuration=Math.max(number,Math.max(0,...frames.map(f=>Number(f.time)||0)));
renderSettings();
},{signal});
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

function renderMediaVariantSettings(node){
 const v=mediaVariantConfig(node);
 const baseId=node.type==='world'?node.world.mediaId:node.animation.mediaId;
 const expectedType=node.type==='world'?(mediaLibrary.find(m=>m.id===baseId)?.fileType||'png'):(mediaLibrary.find(m=>m.id===baseId)?.fileType||'mp4');
 const eligible=mediaLibrary.filter(m=>m.fileType===expectedType&&m.width===m.height*2);
 const choiceOptions=selected=>'<option value="">通常の素材を使用</option>'+eligible.map(m=>`<option value="${escapeHtml(m.id)}" ${m.id===selected?'selected':''}>${escapeHtml(m.fileName)}</option>`).join('');
 const itemOptions=state.nodes.filter(n=>n.type==='itemAcquire'&&!v.itemIds.includes(n.id)).map(n=>`<option value="${escapeHtml(n.id)}">${escapeHtml(n.itemName||n.id)}</option>`).join('');
 const rows=Array.from({length:2**v.itemIds.length},(_,mask)=>{
  const label=v.itemIds.filter((_,i)=>mask&(2**i)).map(id=>getNode(id)?.itemName||'不明').join('・')||'未取得';
  return `<div class="setting-group"><div class="setting-label">${escapeHtml(label)}</div><select class="number-input media-variant-select" data-mask="${mask}">${choiceOptions(v.byMask[String(mask)])}</select></div>`;
 }).join('');
 return `<details data-media-section="variants"><summary>取得状況別メディア（${2**v.itemIds.length}通り）</summary><div class="media-section-body">
 <div class="setting-group"><div class="setting-label">判定するアイテム（取得済み）</div>${v.itemIds.map(id=>`<div class="setting-group" style="display:flex;align-items:center;gap:8px"><span style="flex:1">${escapeHtml(getNode(id)?.itemName||'不明')}</span><button type="button" class="media-variant-remove" data-id="${escapeHtml(id)}">削除</button></div>`).join('')}</div>
 <div class="setting-group"><select class="number-input" id="mediaVariantAdd"><option value="">アイテムを追加</option>${itemOptions}</select></div>
 <div class="settings-empty">各状態に同じ形式（${expectedType.toUpperCase()}）の素材を指定します。未設定時は通常の素材を使用します。</div>
 ${rows}</div></details>`;
}
function setupMediaVariantSettings(node){
 const config=mediaVariantConfig(node);
 const add=document.getElementById('mediaVariantAdd');
 add?.addEventListener('change',e=>{
  if(!e.target.value||config.itemIds.includes(e.target.value))return;
  if(config.itemIds.length>=6){alert('対象アイテムは最大6個です。');return;}
  // Preserve existing state assignments when adding a new item.
  const old={...config.byMask};
  for(const [mask,id] of Object.entries(old))config.byMask[String(Number(mask)+2**config.itemIds.length)]=id;
  config.itemIds.push(e.target.value);
  renderSettings();
 });
 document.querySelectorAll('.media-variant-remove').forEach(button=>button.addEventListener('click',()=>{
  const index=config.itemIds.indexOf(button.dataset.id);
  if(index<0)return;
  const next={};
  for(let mask=0;mask<2**(config.itemIds.length-1);mask++){
   const low=mask&((2**index)-1);
   const high=mask-low;
   const oldMask=low+high*2;
   if(config.byMask[String(oldMask)])next[String(mask)]=config.byMask[String(oldMask)];
  }
  config.itemIds.splice(index,1);
  config.byMask=next;
  renderSettings();
 }));
 document.querySelectorAll('.media-variant-select').forEach(select=>select.addEventListener('change',e=>{
  if(e.target.value)config.byMask[e.target.dataset.mask]=e.target.value;
  else delete config.byMask[e.target.dataset.mask];
 }));
}

let sequenceSelectedIndex=0;
function renderMediaNodeSettings(node){
const videoMode=node.type==='animation';
const media=mediaLibrary.find(m=>m.id===(videoMode?node.animation.mediaId:node.world.mediaId));
const duration=getMediaPlaybackDuration(node,media);
mediaVariantConfig(node);

const collapsible=(id,label,contents)=>`<details data-media-section="${id}"><summary>${label}</summary><div class="media-section-body">${contents}</div></details>`;
const mediaSelect=`<div class="setting-group"><div class="setting-label">素材</div><select id="mediaNodeSelect" class="number-input">${getMediaOptions('media',media?.id)}</select></div>`;
const sequenceFpsSettings=videoMode&&media?.fileType==='pngseq'?`<div class="setting-group"><div class="setting-label">FPS</div><input id="sequenceFpsSetting" class="number-input" type="number" min="1" max="120" step="1" value="${Number(media.fps)||8}"></div>
<div class="setting-group"><div class="setting-label">連番PNGの画像</div><div class="sequence-frame-tabs" role="tablist">${media.frameFiles.map((f,i)=>`<button type="button" class="sequence-frame-tab ${i===Math.min(sequenceSelectedIndex,media.frameFiles.length-1)?'is-active':''}" data-frame-index="${i}">${i+1}枚目</button>`).join('')}</div><div class="sequence-frame-editor"><div class="settings-empty" id="sequenceFrameName">${escapeHtml(media.frameFiles[Math.min(sequenceSelectedIndex,media.frameFiles.length-1)]?.name||'')}</div><button type="button" id="sequenceFrameReplace">画像を選択</button><input type="file" id="sequenceFrameFileInput" accept="image/png,.png" hidden></div></div>`:'';
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
<div class="settings-title">メディア（${videoMode?'360度アニメーション':'360度PNG'}）</div>
${mediaSelect}
${sequenceFpsSettings}
${pngSettings}
${inheritControl}
${previewControls}
<hr class="media-settings-divider">
${videoMode?loops:''}
<hr class="media-settings-divider">
${angleInfo}`;

document.getElementById('mediaNodeSelect').addEventListener('change',e=>assignMediaToNode(node,e.target.value));
 if(videoMode&&media?.fileType==='pngseq'){
  const tabs=Array.from(document.querySelectorAll('.sequence-frame-tab'));
  const refreshTab=()=>{sequenceSelectedIndex=Math.max(0,Math.min(sequenceSelectedIndex,media.frameFiles.length-1));tabs.forEach((b,i)=>{b.classList.toggle('is-active',i===sequenceSelectedIndex);b.setAttribute('aria-selected',String(i===sequenceSelectedIndex));});document.getElementById('sequenceFrameName').textContent=media.frameFiles[sequenceSelectedIndex]?.name||'';};
  tabs.forEach(b=>b.addEventListener('click',()=>{sequenceSelectedIndex=Number(b.dataset.frameIndex);refreshTab();}));
  const frameInput=document.getElementById('sequenceFrameFileInput');
  document.getElementById('sequenceFrameReplace').addEventListener('click',()=>frameInput.click());
  frameInput.addEventListener('change',async()=>{
   const file=frameInput.files?.[0];frameInput.value='';if(!file)return;
   try{
    if(!file.name.toLowerCase().endsWith('.png'))throw new Error('PNGを指定してください。');
    const url=URL.createObjectURL(file);
    let img;try{img=await new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('画像を読み込めません'));image.src=url;});}finally{URL.revokeObjectURL(url);}
    if(img.naturalWidth!==img.naturalHeight*2)throw new Error('2:1のPNG画像を選択してください。');
    if(img.naturalWidth!==media.width||img.naturalHeight!==media.height)throw new Error('既存フレームと同じ解像度のPNGを指定してください。');
    media.video?.pause();media.frameFiles[sequenceSelectedIndex]=file;media.frameImages[sequenceSelectedIndex]=img;
    media.video=createSequencePlayback(media);
    renderMediaList();renderSettings();
   }catch(error){alert('フレームを変更できませんでした。\n'+error.message);}
  });
  refreshTab();
 }
const sequenceFpsField=document.getElementById('sequenceFpsSetting');
 sequenceFpsField?.addEventListener('change',()=>{
  if(!media?.frameImages?.length)return;
  const fps=Number(sequenceFpsField.value);
  if(!Number.isFinite(fps)||fps<1||fps>120){sequenceFpsField.value=String(media.fps);return;}
  media.video?.pause();media.fps=fps;media.duration=media.frameImages.length/fps;
  node.animation.playDuration=media.duration*(Number(node.animation.loopCount)||1);
  renderSettings();
 });

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

// State-specific media: one base asset and optional overrides for acquired-item combinations.
function mediaVariantConfig(node){
 if(!node.mediaVariants||!Array.isArray(node.mediaVariants.itemIds))node.mediaVariants={itemIds:[],byMask:{}};
 if(!node.mediaVariants.byMask||typeof node.mediaVariants.byMask!=='object')node.mediaVariants.byMask={};
 return node.mediaVariants;
}
function mediaVariantMask(config){
 return config.itemIds.reduce((mask,id,index)=>mask|(acquiredItems.has(id)?(2**index):0),0);
}
function chosenSceneMedia(node){
 const config=mediaVariantConfig(node);
 const mask=mediaVariantMask(config);
 const baseId=node.type==='world'?node.world.mediaId:node.animation.mediaId;
 const expectedType=node.type==='world'?(mediaLibrary.find(m=>m.id===baseId)?.fileType||'png'):(mediaLibrary.find(m=>m.id===baseId)?.fileType||'mp4');
 const override=mediaLibrary.find(m=>m.id===config.byMask[String(mask)]&&m.fileType===expectedType);
 return override||mediaLibrary.find(m=>m.id===baseId&&m.fileType===expectedType)||null;
}
function refreshAcquiredMediaScene(){
 if(gamePreview.classList.contains('hidden'))return;
 const node=getNode(state.previewNodeId);
 if(!node||!['world','animation'].includes(node.type))return;
 const media=chosenSceneMedia(node);
 if(!media)return;
 if(node.type==='world'){
  if(node.world.image!==media.image){
   node.world.image=media.image;
   previewMessage.textContent=media.fileName;
   drawPanoramaPreview(gameCanvas,node.world);
   recordPreviewDiagnostic('media-variant',{nodeId:node.id,mediaId:media.id,mask:mediaVariantMask(mediaVariantConfig(node))});
  }
 }else{
  const playback=state.previewAnimation;
  if(!playback||playback.nodeId!==node.id||playback.variantMediaId===media.id)return;
  playback.variantMediaId=media.id;
  const video=playback.video;
  const resumeTime=video.currentTime||0;
  const wasPlaying=!video.paused;
  video.src=media.url;
  video.load();
  video.addEventListener('loadedmetadata',()=>{
   if(state.previewAnimation!==playback)return;
   try{video.currentTime=Math.min(resumeTime,Math.max(0,(video.duration||0)-.02));}catch(_error){}
   if(wasPlaying)video.play().catch(console.error);
  },{once:true});
  previewMessage.textContent=media.fileName;
  recordPreviewDiagnostic('media-variant',{nodeId:node.id,mediaId:media.id,mask:mediaVariantMask(mediaVariantConfig(node))});
 }
}


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
(media.fileType==='png'||isAnimationAsset(media));
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
const removeMediaButton=document.createElement('button');
removeMediaButton.type='button';
removeMediaButton.className='media-item-remove';
removeMediaButton.textContent='×';
removeMediaButton.title='素材を削除';
removeMediaButton.setAttribute('aria-label',media.fileName+'を削除');
removeMediaButton.addEventListener('click',event=>{event.stopPropagation();removeLibraryMedia(media.id);});
item.appendChild(removeMediaButton);

const thumbnail=document.createElement('div');
thumbnail.className='media-thumbnail';

if(isAnimationAsset(media)){
thumbnail.classList.add('media-thumbnail--video');
}

const canvas=document.createElement('canvas');
canvas.width=320;
canvas.height=160;

const context=canvas.getContext('2d');

if(context){
context.fillStyle='#252525';
context.fillRect(0,0,canvas.width,canvas.height);

const source=isAnimationAsset(media)?media.video:media.image;

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

if(isAnimationAsset(media)){
const badge=document.createElement('span');
badge.className='media-thumbnail-badge';
badge.textContent=media.fileType==='pngseq'?'連番PNG':'MP4';
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
node.animation?.mediaId===media.id||
Object.values(node.mediaVariants?.byMask||{}).includes(media.id);
}).length;

info.textContent=`${media.fileType.toUpperCase()}・使用中 ${count} ノード`;

item.appendChild(thumbnail);
item.appendChild(name);
item.appendChild(info);
mediaList.appendChild(item);
}
}

function removeLibraryMedia(mediaId){
 const index=mediaLibrary.findIndex(m=>m.id===mediaId);
 if(index<0)return;
 const media=mediaLibrary[index];
 if(!confirm(`素材「${media.fileName}」を削除しますか？\n使用中のワールド・レイヤー・ノードの素材指定も解除されます。`))return;
 for(const node of state.nodes){
  if(node.world?.mediaId===mediaId){
   node.world.mediaId='';node.world.fileName='';node.world.fileType='';node.world.image=null;node.world.raw=null;
  }
  if(node.animation?.mediaId===mediaId){node.animation.mediaId='';node.animation.fileName='';node.animation.raw=null;}
  if(node.media2DId===mediaId)node.media2DId='';
  if(node.clickSourceMediaId===mediaId)node.clickSourceMediaId='';
  if(node.mediaVariants?.byMask){
   for(const [mask,id] of Object.entries(node.mediaVariants.byMask))if(id===mediaId)delete node.mediaVariants.byMask[mask];
  }
 }
 for(const folder of state.worldFolders||[]){
  for(const layer of folder.layers||[])if(layer.mediaId===mediaId)layer.mediaId='';
 }
 // Rebuild world composites after any source asset is removed.
 if(typeof worldComposites!=='undefined')worldComposites.clear();
 mediaLibrary.splice(index,1);
 if(media.video){try{media.video.pause();media.video.removeAttribute('src');media.video.load();}catch(_error){}}
 if(media.url)URL.revokeObjectURL(media.url);
 renderMediaList();renderSettings();renderNodes();
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
node.type=isAnimationAsset(media)?'animation':'world';
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
const animationMedia=isAnimationAsset(media)?media:null;
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

// 連番PNGは1つの素材として管理し、フレームを共通の360度キャンバスで再生する。
function isAnimationAsset(media){return !!media&&(media.fileType==='mp4'||media.fileType==='pngseq');}
function naturalFrameOrder(a,b){return a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'});}
function createSequencePlayback(media,backgroundImage=null){
const canvas=document.createElement('canvas');canvas.width=media.width;canvas.height=media.height;
const ctx=canvas.getContext('2d');let time=0,playing=false,started=0,frameHandle=0;
const draw=()=>{
const n=media.frameImages.length;
const i=Math.min(n-1,Math.max(0,Math.floor(time*media.fps)%n));
ctx.clearRect(0,0,canvas.width,canvas.height);
if(backgroundImage){
ctx.drawImage(backgroundImage,0,0,canvas.width,canvas.height);
}
ctx.drawImage(media.frameImages[i],0,0,canvas.width,canvas.height);
};
 const advance=now=>{if(!playing)return;time=(now-started)/1000;if(time>=media.duration){if(canvas.loop){time=time%media.duration;started=now-time*1000;}else{time=media.duration;playing=false;canvas.dispatchEvent(new Event('ended'));}}draw();if(playing)frameHandle=requestAnimationFrame(advance);};
 Object.defineProperties(canvas,{
  currentTime:{get:()=>time,set:v=>{time=Math.max(0,Math.min(Number(v)||0,Math.max(0,media.duration-0.0001)));if(playing)started=performance.now()-time*1000;draw();queueMicrotask(()=>canvas.dispatchEvent(new Event('seeked')));}},
  duration:{get:()=>media.duration},videoWidth:{get:()=>media.width},videoHeight:{get:()=>media.height},readyState:{get:()=>4},paused:{get:()=>!playing},ended:{get:()=>!playing&&time>=media.duration},seeking:{get:()=>false}
 });
 canvas.loop=false;canvas.muted=true;canvas.playsInline=true;
 canvas.play=async()=>{if(playing)return;playing=true;started=performance.now()-time*1000;frameHandle=requestAnimationFrame(advance);};
 canvas.pause=()=>{playing=false;cancelAnimationFrame(frameHandle);};
 canvas.load=()=>{};
 draw();return canvas;
}
async function validateSequencePng(file,expectedWidth=null,expectedHeight=null){
 if(!file||!file.name.toLowerCase().endsWith('.png')||file.type&&file.type!=='image/png')throw new Error('PNG画像のみ選択できます。');
 const url=URL.createObjectURL(file);
 try{
  const image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(new Error('PNG画像を読み込めませんでした。'));img.src=url;});
  if(image.naturalWidth!==image.naturalHeight*2)throw new Error('2:1のPNG画像を選択してください。');
  if(expectedWidth!==null&&(image.naturalWidth!==expectedWidth||image.naturalHeight!==expectedHeight))throw new Error('連番PNGはすべて同じ解像度にしてください。');
  return image;
 }finally{URL.revokeObjectURL(url);}
}
async function importPngSequence(files,fps=8,preserveOrder=false){
 const ordered=preserveOrder?[...files]:[...files].sort(naturalFrameOrder);
 if(!ordered.length||ordered.some(file=>!file.name.toLowerCase().endsWith('.png')))throw new Error('連番PNGのみを選択してください。');
 const frames=[];const images=[];
 try{
  for(const file of ordered){
   const url=URL.createObjectURL(file);let img;
   try{img=await new Promise((resolve,reject)=>{const pic=new Image();pic.onload=()=>resolve(pic);pic.onerror=()=>reject(new Error(file.name+' を読み込めません'));pic.src=url;});}finally{URL.revokeObjectURL(url);}
   if(images.length&&(img.naturalWidth!==images[0].naturalWidth||img.naturalHeight!==images[0].naturalHeight))throw new Error('すべての画像の解像度を統一してください。');
   images.push(img);frames.push(file);
  }
  const width=images[0].naturalWidth,height=images[0].naturalHeight;
  if(width!==height*2)throw new Error('360度アニメーションは2:1のPNG画像を選択してください。');
  const media={id:uid('media'),fileName:ordered.length+'枚の連番PNG（'+ordered[0].name+'）',fileType:'pngseq',image:null,video:null,url:null,raw:null,frames:[],frameFiles:frames,frameImages:images,duration:images.length/fps,fps,width,height,sourceFile:null};
  media.video=createSequencePlayback(media);
  mediaLibrary.push(media);renderMediaList();renderSettings();return media;
 }catch(e){throw e;}
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
let sequenceInsertionNodeId=null;
function openSequenceWizard(){
 const overlay=document.createElement('div');overlay.className='sequence-wizard-overlay';
 const files=[null];let active=0;
 overlay.innerHTML=`<div class="sequence-wizard" role="dialog" aria-modal="true" aria-label="連番PNGを追加"><div class="sequence-wizard-head"><strong>アニメーション（連番PNG）</strong><button type="button" data-seq-close>×</button></div><label>FPS <input class="number-input" data-seq-fps type="number" min="1" max="120" step="1" value="8"></label><div class="sequence-frame-tabs" data-seq-tabs></div><div class="sequence-frame-editor"><div data-seq-name>画像未選択</div><button type="button" data-seq-choose>画像を選択</button><input type="file" accept="image/png,.png" data-seq-file hidden></div><div class="sequence-wizard-footer"><button type="button" data-seq-add>＋ フレームを追加</button><button type="button" data-seq-save>登録する</button></div></div>`;
 document.body.appendChild(overlay);
 const $=q=>overlay.querySelector(q);
 const refresh=()=>{$('[data-seq-tabs]').innerHTML=files.map((file,i)=>`<button type="button" class="sequence-frame-tab ${i===active?'is-active':''}" data-seq-tab="${i}">${i+1}枚目</button>`).join('');$('[data-seq-name]').textContent=files[active]?.name||'画像未選択';};
 const close=()=>{overlay.remove();sequenceInsertionNodeId=null;};
 $('[data-seq-close]').addEventListener('click',close);
 $('[data-seq-tabs]').addEventListener('click',e=>{const btn=e.target.closest('[data-seq-tab]');if(!btn)return;active=Number(btn.dataset.seqTab);refresh();});
 $('[data-seq-add]').addEventListener('click',()=>{files.push(null);active=files.length-1;refresh();});
 $('[data-seq-choose]').addEventListener('click',()=>$('[data-seq-file]').click());
 $('[data-seq-file]').addEventListener('change',async e=>{
  const file=e.target.files?.[0];e.target.value='';if(!file)return;
  try{
   const first=files.find((f,i)=>i!==active&&f);
   const reference=first?await validateSequencePng(first):null;
   await validateSequencePng(file,reference?.naturalWidth??null,reference?.naturalHeight??null);
   files[active]=file;refresh();
  }catch(error){alert('この画像は選択できません。\n'+error.message);}
 });
 $('[data-seq-save]').addEventListener('click',async()=>{
  const fps=Number($('[data-seq-fps]').value);
  if(!Number.isFinite(fps)||fps<1||fps>120){alert('FPSは1～120で指定してください。');return;}
  if(files.some(f=>!f)){alert('すべてのフレームにPNG画像を選択してください。');return;}
  if(files.some(f=>!f.name.toLowerCase().endsWith('.png'))){alert('PNG画像だけを指定してください。');return;}
  const button=$('[data-seq-save]');button.disabled=true;
  try{const media=await importPngSequence(files,fps,true);if(sequenceInsertionNodeId){const node=getNode(sequenceInsertionNodeId);if(node?.type==='animation')assignMediaToNode(node,media.id);}setMediaPanelOpen(false);close();}catch(error){console.error(error);alert('連番PNGを登録できませんでした。\n'+error.message);button.disabled=false;}
 });
 refresh();
}



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
item.id===worldNode.animation.mediaId&&isAnimationAsset(item)
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
item.id===sourceNode.animation.mediaId&&isAnimationAsset(item)
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
item.id===worldNode.animation.mediaId&&isAnimationAsset(item)
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

const lastPanoramaPreviewWorld=new WeakMap();
function drawPanoramaPreview(canvas,world){
lastPanoramaPreviewWorld.set(canvas,world);
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

const compositeVersion=world.image instanceof HTMLCanvasElement
?clickEditorCompositeVersions.get(world.image)
:undefined;
if(isVideo||renderer.image!==world.image||
(compositeVersion===undefined&&world.image instanceof HTMLCanvasElement)||
(compositeVersion!==undefined&&renderer.compositeVersion!==compositeVersion)){
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,world.image);
renderer.image=world.image;
renderer.compositeVersion=compositeVersion;
}
const fov=Math.max(35,Math.min(100,75/world.zoom))*Math.PI/180;
gl.uniform1i(renderer.textureUniform,0);
gl.uniform1f(renderer.yaw,world.yaw);
gl.uniform1f(renderer.pitch,world.pitch);
gl.uniform1f(renderer.fov,fov);
gl.uniform1f(renderer.aspect,canvas.width/canvas.height);
gl.drawArrays(gl.TRIANGLES,0,6);
if(canvas===gameCanvas)checkActiveFrameInTriggers();
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
const origin=getNode(nodeId);
const folder=state.worldFolders.find(w=>w.id===origin?.folderId);
return folder?getNode(folder.backerId):null;
}

function getClickAnimationMedia(sourceNode){
if(sourceNode?.type!=='animation')return null;

return mediaLibrary.find(media=>
media.id===sourceNode.animation.mediaId&&
isAnimationAsset(media)
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

// 編集時はワールドの基本画像に、登録済みの透明PNGを全て重ねる。
// ゲーム内の表示条件は無視し、投げ縄の位置合わせをしやすくする。
// Static click-editor panoramas are composited once per visible layer combination.
// Dynamic video is deliberately not cached.
const clickEditorCompositeCanvases=new Map();
const clickEditorCompositeVersions=new WeakMap();
let clickEditorCompositeVersion=0;
function getClickEditorComposite(sourceNode,clickNode=null){
const folder=state.worldFolders?.find(f=>f.backerId===sourceNode?.id);
if(!folder)return sourceNode?.world?.image||null;
const media=getFolderMedia(folder);
const base=media?.image||media?.video||sourceNode.world?.image;
if(!base)return null;
const rawWidth=media?.width||base.videoWidth||base.naturalWidth||base.width||2048;
const rawHeight=media?.height||base.videoHeight||base.naturalHeight||base.height||1024;
const scale=Math.min(1,2048/Math.max(1,rawWidth));
const width=Math.max(1,Math.round(rawWidth*scale));
const height=Math.max(1,Math.round(rawHeight*scale));
const hidden=new Set(clickNode?.clickHiddenLayerIds||[]);
const layers=(folder.layers||[]).filter(layer=>!hidden.has(layer.id)).map(layer=>({
id:layer.id,
mediaId:layer.mediaId,
image:mediaLibrary.find(m=>m.id===layer.mediaId&&m.fileType==='png')?.image||null
}));
const key=folder.id+'|'+[...hidden].sort().join(',');
let entry=clickEditorCompositeCanvases.get(key);
if(!entry){entry={canvas:document.createElement('canvas'),signature:[]};clickEditorCompositeCanvases.set(key,entry);}
const signature=[base,width,height,base.complete,base.naturalWidth,base.naturalHeight,
...layers.flatMap(l=>[l.id,l.mediaId,l.image,l.image?.complete,l.image?.naturalWidth,l.image?.naturalHeight])];
const dynamic=base instanceof HTMLVideoElement;
const changed=dynamic||entry.signature.length!==signature.length||signature.some((value,i)=>value!==entry.signature[i]);
if(!changed)return entry.canvas;
const canvas=entry.canvas;
if(canvas.width!==width)canvas.width=width;
if(canvas.height!==height)canvas.height=height;
const ctx=canvas.getContext('2d');
if(!ctx)return base;
ctx.clearRect(0,0,width,height);
try{ctx.drawImage(base,0,0,width,height);}catch(_e){return base;}
for(const layer of layers){
if(layer.image){try{ctx.drawImage(layer.image,0,0,width,height);}catch(_e){}}
}
entry.signature=signature;
clickEditorCompositeVersions.set(canvas,++clickEditorCompositeVersion);
// Bound retained composites when many layer visibility combinations are used.
if(clickEditorCompositeCanvases.size>12){
const oldest=clickEditorCompositeCanvases.keys().next().value;
if(oldest!==key)clickEditorCompositeCanvases.delete(oldest);
}
return canvas;
}
function getClickLassoWorld(node,sourceNode){
 const image=sourceNode.type==='animation'
 ?getClickAnimationMedia(sourceNode)?.video||null
 :sourceNode.type==='world'
 ?getClickEditorComposite(sourceNode,node)
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

const world=node.clickView;
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

if(isAnimation&&video&&document.getElementById('clickFrameRange')){
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
}else if(isAnimation&&video){

video.pause();

const redraw=()=>{
if(!previewCanvas.isConnected)return;

drawPanoramaPreview(
previewCanvas,
getClickLassoWorld(node,worldNode)
);

drawClickLassoOverlay(node,worldNode);
};

video.addEventListener('loadeddata',redraw,{once:true});
video.addEventListener('seeked',redraw,{once:true});

if(video.readyState>=2){
video.currentTime=0;
redraw();
}else{
video.currentTime=0;
}
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
const world=node.clickView;

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
if(!Array.isArray(polygon)||polygon.length<3)return false;

// Unwrap each vertex relative to the PREVIOUS vertex, rather than
// wrapping every vertex relative to the clicked point. The latter
// can produce a false positive on the opposite side of the sphere.
const points=[{x:0,y:polygon[0].pitch}];
let minX=0,maxX=0;
for(let i=1;i<polygon.length;i++){
 const x=points[i-1].x+angleDiff(polygon[i].yaw,polygon[i-1].yaw);
 points.push({x,y:polygon[i].pitch});
 minX=Math.min(minX,x);
 maxX=Math.max(maxX,x);
}

// A normal screen-drawn lasso never covers more than half the sphere
// horizontally. Ignore ambiguous polygons instead of treating their
// antipodal counterpart as part of the selection.
if(maxX-minX>=Math.PI)return false;

let x=angleDiff(point.yaw,polygon[0].yaw);
const center=(minX+maxX)/2;
x+=Math.round((center-x)/(Math.PI*2))*Math.PI*2;
if(x<minX||x>maxX)return false;

let inside=false;
for(let i=0,j=points.length-1;i<points.length;j=i++){
 const a=points[i],b=points[j];
 if((a.y>point.pitch)===(b.y>point.pitch))continue;
 const intersectX=a.x+(b.x-a.x)*(point.pitch-a.y)/(b.y-a.y);
 if(intersectX>x)inside=!inside;
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

// Compare the effective 360-degree lasso area (add/subtract included).
// Cache each scene/frame so overlapping targets do not slow repeated clicks.
const previewClickAreaCache=new Map();
function getEffectiveClickArea(node,regions,frameKey='static'){
 const key=`${node.id}:${frameKey}`;
 if(previewClickAreaCache.has(key))return previewClickAreaCache.get(key);
 const active=regions||node.clickRegions||[];
 const width=360,height=180;
 let area=0;
 for(let y=0;y<height;y++){
  const pitch=Math.PI/2-(y+0.5)*Math.PI/height;
  const weight=Math.cos(pitch);
  for(let x=0;x<width;x++){
   const point={yaw:(x+0.5)*2*Math.PI/width-Math.PI,pitch};
   let selected=false;
   for(const region of active){
    if(isPointInsideClickPolygon(point,region.points))selected=region.mode==='add';
   }
   if(selected)area+=weight;
  }
 }
 previewClickAreaCache.set(key,area);
 return area;
}

// Determine which action is available at a location before comparing overlapping hit regions.
// A specifically registered equipped item takes priority; other clicks use the normal path.
function resolvePreviewClickAction(node,itemId){
 const branches=clickBranches(node);
 const specific=itemId?branches.find(b=>b.clickBranchItemId===itemId):null;
 if(specific){
  if(specific.clickBranchOnce&&previewCompletedTriggers.has(specific.id))return null;
  return {kind:'item',branch:specific};
 }
 // The regular click path remains available even while an unrelated item is equipped.
 const hasNormalPath=state.connections.some(c=>c.from===node.id&&getNode(c.to)?.type!=='clickBranch');
 const normalAlreadyDone=node.clickNormalOnce===true&&previewCompletedTriggers.has(`normal:${node.id}`);
 if(hasNormalPath){
  return normalAlreadyDone?null:{kind:'normal'};
 }
 return normalAlreadyDone?null:{kind:'normal'};
}

// ワールドのクリック判定だけに適用する有効条件（設定プレビューは常時表示）。
function isClickConditionActive(node){
 const check=(mode,target,stateValue)=>{
  if((mode||'always')==='always')return true;
  if(!target)return false;
  const yes=mode==='toggle'?toggleWorldStates.has(target):mode==='acquire'?acquiredItems.has(target):mode==='event'?recordedWorldEvents.has(target):false;
  return stateValue==='before'?!yes:yes;
 };
 const first=check(node.clickEnableType,node.clickEnableTargetId,node.clickEnableState);
 if(node.clickEnableSecondEnabled!==true)return first;
 const second=check(node.clickEnableSecondType,node.clickEnableSecondTargetId,node.clickEnableSecondState);
 return node.clickEnableOperator==='or'?(first||second):(first&&second);
}

function findBestPreviewClick(clientX,clientY,world,animation,itemId){
 const matches=[];
 for(const id of state.previewClickTriggerIds){
  const node=getNode(id);
  if(!node||previewRemovedClickIds.has(node.id)||!canFireExplorationTrigger(node)||!isClickConditionActive(node))continue;
  let regions=null;
  let frameKey='static';
  if(animation&&node.clickAnimationMode){
   const fps=Math.max(1,Number(node.clickFrameFps)||8);
   const frame=Math.max(0,Math.floor(animation.video.currentTime*fps));
   frameKey=`frame:${frame}`;
   regions=getClickFrameRegions(node,frame);
  }
  if(!isClickTargetHit(node,world,clientX,clientY,regions))continue;
  const action=resolvePreviewClickAction(node,itemId);
  if(!action)continue;
  matches.push({node,action,area:getEffectiveClickArea(node,regions,frameKey)});
 }
 // An explicitly registered equipped item wins over normal clicks in overlapping regions.
 // Within the same priority group, keep the existing smallest-effective-area rule.
 matches.sort((a,b)=>{
  const pa=itemId&&a.action.kind==='item'&&a.action.branch.clickBranchItemId===itemId?0:1;
  const pb=itemId&&b.action.kind==='item'&&b.action.branch.clickBranchItemId===itemId?0:1;
  return pa-pb||a.area-b.area;
 });
 recordPreviewDiagnostic('click-candidates',{
  x:clientX,y:clientY,selectedItem:itemId||null,
  candidates:matches.map(m=>({clickId:m.node.id,area:m.area,action:m.action.kind,branchId:m.action.branch?.id||null})),
  chosen:matches[0]?.node.id||null
 });
 return matches[0]||null;
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
// 編集時は表示条件に関係なく全ての透明PNGレイヤーを表示する。
// クリック範囲プレビューと同じ合成処理を利用する。
image=getClickEditorComposite(sourceNode);
}

if(sourceNode?.type==='animation'){
const media=mediaLibrary.find(item=>
item.id===sourceNode.animation.mediaId&&
isAnimationAsset(item)
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
isAnimationAsset(item)
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

settingsPanel.querySelectorAll('[data-dialogue-delete]').forEach(button=>{
button.addEventListener('click',()=>{
const index=Number(button.dataset.dialogueDelete);

if(!Number.isInteger(index))return;
if(index<0||index>=node.dialoguePages.length)return;

node.dialoguePages.splice(index,1);

if(node.dialoguePages.length===0){
node.dialoguePages=[''];
node.dialogueEditIndex=0;
}else if(node.dialogueEditIndex>index){
node.dialogueEditIndex--;
}else if(node.dialogueEditIndex>=node.dialoguePages.length){
node.dialogueEditIndex=node.dialoguePages.length-1;
}

renderNodes();
renderSettings();
});
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
event:{label:'イベント',element:document.getElementById('eventMenu')},
branch:{label:'分岐',element:document.getElementById('branchMenu')},
panel:{label:'UI',element:panelMenu}
};

function updateNodeMenuCategories(openCategory=null){
const nestedMenu=document.getElementById('uiPanelMenu');
const nestedButton=contextMenu.querySelector('[data-submenu="uiPanel"]');

if(nestedMenu){
nestedMenu.classList.add('hidden');
}

if(nestedButton){
nestedButton.textContent='▶ パネル';
}

for(const [key,category] of Object.entries(nodeMenuCategories)){
const isOpen=key===openCategory;
category.element.classList.toggle('hidden',!isOpen);

const button=contextMenu.querySelector(`[data-menu="${key}"]`);
if(button){
button.textContent=`${isOpen?'▼':'▶'} ${key==='panel'?'UI':category.label}`;
}
}
}

function openContextMenu(x,y,connection=null){
state.menuPoint=screenToWorkspace(x,y);
state.insertConnection=connection;
contextMenu.style.left=`${x}px`;
const menuTop=Math.min(Math.max(8,y),Math.max(8,workspace.clientHeight-160));
contextMenu.style.top=`${menuTop}px`;
contextMenu.style.maxHeight=`${Math.max(48,workspace.clientHeight-menuTop-8)}px`;
contextMenu.scrollTop=0;
contextMenu.classList.remove('hidden');
updateNodeMenuCategories();
}

contextMenu.addEventListener('click',e=>{
const nested=e.target.closest('[data-submenu="uiPanel"]');

if(nested){
const submenu=document.getElementById('uiPanelMenu');
if(!submenu)return;

const willOpen=submenu.classList.contains('hidden');
submenu.classList.toggle('hidden',!willOpen);
nested.textContent=`${willOpen?'▼':'▶'} パネル`;
return;
}

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
const sequenceNode=create.dataset.create==='animationSeq';
const nodeType=sequenceNode?'animation':create.dataset.create;
if(!state.activeFolderId){alert('ワールドのタブを開いてからノードを追加してください。');return;}

contextMenu.classList.add('hidden');
state.insertConnection=null;

let created=null;
if(insertConnection&&nodeType!=='gameReset'){
created=insertNodeIntoConnection(nodeType,insertConnection,menuPoint);
}else{
created=addNode(nodeType,menuPoint.x,menuPoint.y);
}
if(sequenceNode){
 sequenceInsertionNodeId=created?.id||state.selectedNodeId;
 openSequenceWizard();
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
if(['panUndoStack','panRedoStack','clickUndoStack','clickRedoStack','frameInUndo','frameInRedo','panPath'].includes(key))return undefined;
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
if(selected?.type==='click'||selected?.type==='frameIn')return;
if(selected?.type==='pan'&&(selected.panUndoStack?.length||selected.panRedoStack?.length))return;
const active=document.activeElement;
if(active&&active!==document.body&&active instanceof HTMLElement&&!settingsPanel.contains(active)&&['INPUT','TEXTAREA'].includes(active.tagName))return;
e.preventDefault();e.stopImmediatePropagation();
stepEditorHistory(key==='y'||(key==='z'&&e.shiftKey));
},true);

let copiedNodeData=null;
let copiedNodeGroup=null;
let pasteOffset=0;

function copySelectedNodeGroup(){
const selectedIds=state.selectedNodeIds.size>0
?new Set(state.selectedNodeIds)
:new Set(state.selectedNodeId?[state.selectedNodeId]:[]);

const excludedTypes=new Set(['start','folderStart','worldDisplay']);
const nodes=state.nodes.filter(node=>selectedIds.has(node.id)&&!excludedTypes.has(node.type));

if(nodes.length===0)return null;

const nodeIds=new Set(nodes.map(node=>node.id));
const connections=state.connections.filter(connection=>nodeIds.has(connection.from)&&nodeIds.has(connection.to));

return{
nodes:cloneEditorValue(nodes),
connections:cloneEditorValue(connections)
};
}

function pasteSelectedNodeGroup(group,offset){
if(!group?.nodes?.length)return;

const before=editorSnapshot();
const idMap=new Map();
const choiceIdMap=new Map();

for(const node of group.nodes){
idMap.set(node.id,uid(node.type));
if(Array.isArray(node.optionChoices)){
for(const choice of node.optionChoices){
choiceIdMap.set(choice.id,uid('choice'));
}
}
}

const clonedNodes=cloneEditorValue(group.nodes);
const clonedConnections=cloneEditorValue(group.connections);

const remapReferences=(value)=>{
if(!value||typeof value!=='object')return;

if(Array.isArray(value)){
for(const item of value)remapReferences(item);
return;
}

if(value instanceof Set||value instanceof Map||value instanceof Blob||value instanceof Element)return;
if(Object.getPrototypeOf(value)!==Object.prototype)return;

for(const [key,item] of Object.entries(value)){
if(key==='folderId'||key==='destinationFolderId'||key==='optionOwnerId'&&item===null)continue;

if(typeof item==='string'){
if(idMap.has(item)){
value[key]=idMap.get(item);
}else if(choiceIdMap.has(item)){
value[key]=choiceIdMap.get(item);
}
}else if(item&&typeof item==='object'){
remapReferences(item);
}
}
};

for(const node of clonedNodes){
const originalId=node.id;
node.id=idMap.get(originalId);
node.x=(Number(node.x)||0)+offset;
node.y=(Number(node.y)||0)+offset;

if(node.folderId!==undefined)node.folderId=state.activeFolderId;

remapReferences(node);

if(Array.isArray(node.optionChoices)){
for(const choice of node.optionChoices){
const original=group.nodes.find(n=>n.id===originalId)?.optionChoices?.find(c=>c.text===choice.text);
if(original&&choiceIdMap.has(original.id))choice.id=choiceIdMap.get(original.id);
}
}

if('clickUndoStack'in node)node.clickUndoStack=[];
if('clickRedoStack'in node)node.clickRedoStack=[];
if('panUndoStack'in node)node.panUndoStack=[];
if('panRedoStack'in node)node.panRedoStack=[];
if('frameInUndo'in node)node.frameInUndo=[];
if('frameInRedo'in node)node.frameInRedo=[];
}

for(const connection of clonedConnections){
connection.id=uid('conn');
connection.from=idMap.get(connection.from);
connection.to=idMap.get(connection.to);

if(Array.isArray(connection.anchors)){
connection.anchors=connection.anchors.map(anchor=>({
...anchor,
x:anchor.x+offset,
y:anchor.y+offset
}));
}
}

state.nodes.push(...clonedNodes);
state.connections.push(...clonedConnections);

const copiedIds=new Set(clonedNodes.map(node=>node.id));

for(const node of clonedNodes){
if(node.type==='condition'&&!clonedNodes.some(n=>n.conditionOwnerId===node.id))ensureConditionBranches(node);
if(node.type==='toggle'&&!clonedNodes.some(n=>n.toggleOwnerId===node.id))ensureToggleBranches(node);
if(node.type==='textAnswer'&&!clonedNodes.some(n=>n.textAnswerOwnerId===node.id))ensureTextAnswerBranches(node);
}

state.selectedNodeIds=new Set([...copiedIds]);
state.selectedNodeId=null;
state.selectedConnectionId=null;

commitEditorHistory(before);
renderNodes();
renderSettings();
renderConnections();
}

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

if(selectedNode?.type==='frameIn'&&(e.ctrlKey||e.metaKey)&&!e.altKey&&(key==='z'||key==='y')){
e.preventDefault();
if(key==='y'||(key==='z'&&e.shiftKey))selectedNode.frameInRedoAction?.();
else selectedNode.frameInUndoAction?.();
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
const group=copySelectedNodeGroup();
if(!group)return;

e.preventDefault();
copiedNodeGroup=group;
copiedNodeData=null;
pasteOffset=0;
return;
}

if((e.ctrlKey||e.metaKey)&&!e.altKey&&key==='v'){
if(!copiedNodeGroup)return;

e.preventDefault();
pasteOffset+=40;
pasteSelectedNodeGroup(copiedNodeGroup,pasteOffset);
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
const selectedConnection=state.connections.find(c=>c.id===state.selectedConnectionId);
if(selectedConnection&&getNode(selectedConnection.from)?.type==='folderStart'&&!state.connections.some(c=>c.from===selectedConnection.from&&c.id!==selectedConnection.id)){
  // START must always retain an outgoing path. It may be reconnected before the old link is removed.
}
state.connections=state.connections.filter(c=>c.id!==state.selectedConnectionId);

state.selectedConnectionId=null;
commitEditorHistory(editBefore);
renderConnections();
renderSettings();
return;
}

const id=
state.selectedNodeId;

if(!id||id==='start')return;
if(['folderStart','worldDisplay'].includes(getNode(id)?.type))return;
const removedNode=getNode(id);
if(removedNode?.type==='textAnswerBranch'||removedNode?.type==='conditionBranch'||removedNode?.type==='toggleBranch')return;
if(removedNode?.type==='optionChoice'){
const owner=getNode(removedNode.optionOwnerId);
if(owner){removeOptionChoice(owner,removedNode.optionChoiceId);state.selectedNodeId=null;return;}
}
const attached=new Set(removedNode?.type==='option'?optionChoiceNodes(removedNode).map(n=>n.id):removedNode?.type==='textAnswer'?textAnswerBranches(removedNode).map(n=>n.id):removedNode?.type==='condition'?conditionBranches(removedNode).map(n=>n.id):removedNode?.type==='toggle'?toggleBranches(removedNode).map(n=>n.id):[]);
attached.add(id);

state.nodes=
state.nodes.filter(
n=>!attached.has(n.id)
);

state.connections=
state.connections.filter(
c=>!attached.has(c.from)&&!attached.has(c.to)
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
return newNode;
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
return newNode;
}

document.getElementById('exportPreviewDiagnosticBtn').addEventListener('click',exportPreviewDiagnostics);
playBtn.addEventListener('click',()=>startPreview());
closePreviewBtn.addEventListener('click',stopPreview);

gameViewport.addEventListener('click',e=>{
if(!window.matchMedia('(pointer: coarse)').matches)return;
if(!e.target.closest('#dialogueOverlay'))return;
if(gamePreview.classList.contains('hidden'))return;
if(!state.previewDialogueNodeId)return;
if(getNode(state.previewDialogueNodeId)?.type==='option')return;
if(e.button!==0)return;

e.preventDefault();
advanceDialogue();
});

document.addEventListener('keydown',e=>{
if(window.matchMedia('(pointer: coarse)').matches)return;
if(gamePreview.classList.contains('hidden'))return;
if(!state.previewDialogueNodeId)return;
if(getNode(state.previewDialogueNodeId)?.type==='option')return;
if(e.isComposing||e.key==='Process'||e.keyCode===229)return;
if(e.repeat||e.ctrlKey||e.altKey||e.metaKey)return;

const target=e.target;

if(target instanceof HTMLElement&&(
target.isContentEditable||
['INPUT','TEXTAREA','SELECT'].includes(target.tagName)
)){
return;
}

if(e.code!=='Space')return;

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
if(previewKeyframeBusy)return;
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

const dx=e.clientX-gamePreviewDrag.x;
const dy=e.clientY-gamePreviewDrag.y;

if(Math.hypot(dx,dy)>4){
gamePreviewDrag.moved=true;
}

if(isPreviewCameraLocked())return;

const world=getActivePreviewWorld();
if(!world)return;

world.yaw=gamePreviewDrag.yaw-dx*0.008;

world.pitch=clamp(
gamePreviewDrag.pitch+dy*0.008,
-Math.PI/2+0.02,
Math.PI/2-0.02
);

drawPanoramaPreview(gameCanvas,world);
});

gameCanvas.addEventListener('pointerup',e=>{
if(previewKeyframeBusy){gamePreviewDrag=null;return;}
if(!gamePreviewDrag)return;

const moved=gamePreviewDrag.moved;

if(gameCanvas.hasPointerCapture(e.pointerId)){
gameCanvas.releasePointerCapture(e.pointerId);
}

gamePreviewDrag=null;

if(moved)return;
recordPreviewDiagnostic('canvas-click',{x:e.clientX,y:e.clientY,selectedItem:state.selectedInventoryItemId,waitingClicks:[...state.previewClickTriggerIds]});

const world=getActivePreviewWorld();
if(!world)return;

const animation=state.previewAnimation;
const picked=findBestPreviewClick(
 e.clientX,e.clientY,world,animation,state.selectedInventoryItemId
);
if(!picked)return;
const {node:trigger,action}=picked;
recordPreviewDiagnostic('click-hit',{
 clickId:trigger.id,x:e.clientX,y:e.clientY,
 selectedItem:state.selectedInventoryItemId,action:action.kind
});
if(action.kind==='item'){
 runClickItemBranch(trigger,state.selectedInventoryItemId);
 return;
}
previewAcquisitionSourceClickId=trigger.id;
if(trigger.clickNormalOnce===true){
 previewCompletedTriggers.add(`normal:${trigger.id}`);
 recordPreviewDiagnostic('normal-click-once',{clickId:trigger.id});
}
fireExplorationTrigger(trigger);
if(!state.connections.some(c=>c.from===trigger.id&&getNode(c.to)?.type!=='clickBranch')){
 previewMessage.textContent='クリック発火・接続先なし';
}
});
gameCanvas.addEventListener('pointercancel',e=>{
if(gameCanvas.hasPointerCapture(e.pointerId))gameCanvas.releasePointerCapture(e.pointerId);
gamePreviewDrag=null;
});
gameCanvas.addEventListener('wheel',e=>{
if(gamePreview.classList.contains('hidden'))return;
if(previewKeyframeBusy){e.preventDefault();return;}

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
let previewKeyframeBusy=false;
const previewBranchTimers=new Set();
const previewVisited=new Set();

// 一回だけ実行するノードの実行履歴
const previewExecutedOnceNodes=new Set();

function isPreviewOnceTarget(node){
return Boolean(node&&!['start','folderStart','worldDisplay','gameReset','world'].includes(node.type));
}

function isPreviewOnceCompleted(node){
return Boolean(isPreviewOnceTarget(node)&&node.executeOnce===true&&previewExecutedOnceNodes.has(node.id));
}

function markPreviewOnceExecuted(node){
if(isPreviewOnceTarget(node)&&node.executeOnce===true){
previewExecutedOnceNodes.add(node.id);
recordPreviewDiagnostic('node-execute-once',{nodeId:node.id,nodeType:node.type});
}
}

// ゲーム中に一度でも取得したアイテム
const acquiredItems=new Set();
const previewCompletedTriggers=new Set();
// Acquiring an item can disable the click region that led to it for this playthrough.
const previewRemovedClickIds=new Set();
let previewAcquisitionSourceClickId=null;

// 一度だけ実行するトリガーかどうか
function canFireExplorationTrigger(node){
 if(!node)return false;
 return !node.triggerOnce||!previewCompletedTriggers.has(node.id);
}

// 接続先の処理を再実行できる状態にする
function prepareExplorationBranch(nodeId){
 const visited=new Set();

 function visit(id){
  if(visited.has(id))return;
  visited.add(id);

  const node=getNode(id);
  if(!node)return;

  // メディアや別の待機トリガーは初期化しない
  if(
   node.type==='world'||
   node.type==='animation'||
   node.type==='start'||
   node.type==='click'||
   node.type==='frameIn'||
   node.type==='itemUse'
  )return;

  previewVisited.delete(id);

  for(const connection of state.connections){
   if(connection.from===id)visit(connection.to);
  }
 }

 for(const connection of state.connections){
  if(connection.from===nodeId)visit(connection.to);
 }
}

function fireExplorationTrigger(node){
if(!canFireExplorationTrigger(node))return;
if(isPreviewOnceCompleted(node))return;

markPreviewOnceExecuted(node);

if(node.triggerOnce){
previewCompletedTriggers.add(node.id);
}

prepareExplorationBranch(node.id);
previewOutgoing(node.id);
}

function clearPreviewBranchTimers(){
for(const timer of previewBranchTimers)clearTimeout(timer);
previewBranchTimers.clear();
if(state.previewTimer){clearTimeout(state.previewTimer);state.previewTimer=null;}
}
function cancelPreviewScene(){
activeIndependentKeyframe=null;
previewKeyframeBusy=false;
previewSceneEpoch++;
clearPreviewBranchTimers();
previewVisited.clear();
state.previewClickTriggerIds=[];
state.previewItemUseTriggerIds=[];
state.previewFrameInIds=[];
state.previewDialogueNodeId=null;
optionChoicesOverlay.classList.add('hidden');
optionChoicesOverlay.replaceChildren();
clearUiButtonPreview();
closeTextAnswerPanel();
inventoryOverlay.classList.add('hidden');
clearMedia2DLayer();
stopDialogueTyping();
dialogueOverlay.classList.add('hidden');
stopCameraAnimation();
stopPreviewAnimation();
state.previewWorldNodeId=null;
}
function previewOutgoing(nodeId,phase='start'){
recordPreviewDiagnostic('node-outgoing',{nodeId,phase,targets:state.connections.filter(c=>c.from===nodeId).map(c=>c.to)});
const source=getNode(nodeId);
const sourceIsMedia=source?.type==='world';
if(source?.type==='world'&&state.worldFolders.some(w=>w.backerId===source.id)){
 if(phase==='end'||worldEntryFadeActive)return;
 for(const target of state.nodes.filter(n=>n.folderId===source.folderId&&['click','frameIn','time'].includes(n.type)))showPreviewNode(target.id);
 return;
}

const targets=state.connections
.filter(c=>c.from===nodeId)
.map(c=>getNode(c.to))
.filter(Boolean)
.filter(target=>{
if(!sourceIsMedia)return !(source?.type==='click'&&target.type==='clickBranch')&&!(source?.type==='condition'&&target.type==='conditionBranch')&&!(source?.type==='toggle'&&target.type==='toggleBranch');

const targetEndsScene=target.type==='world'||target.type==='animation'||target.type==='start';

if(phase==='end')return targetEndsScene;

return !targetEndsScene;
});

for(const target of targets){
if(sourceIsMedia&&phase==='end'&&target.type==='start'){startPreview(true);return;}
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
let checkingFrameIn=false;
function checkActiveFrameInTriggers(){
if(checkingFrameIn||!state.previewFrameInIds?.length)return;
if(gamePreview.classList.contains('hidden'))return;
const view=getActivePreviewWorld();if(!view)return;
checkingFrameIn=true;
try{
for(const id of [...state.previewFrameInIds]){
const node=getNode(id);if(!node)continue;
if(isPreviewOnceCompleted(node))continue;
if(!isFrameInTriggered(node,gameCanvas,view))continue;
state.previewFrameInIds=[];
clearPreviewBranchTimers();
markPreviewOnceExecuted(node);
previewOutgoing(id);
if(!state.connections.some(c=>c.from===id))previewMessage.textContent='フレームイン発火・接続先なし';
break;
}
}finally{checkingFrameIn=false;}
}
function canUsePreviewClick(node){
return Boolean(node.clickTarget?.initialized||Object.values(node.clickFrameRegions||{}).some(regions=>Array.isArray(regions)&&regions.some(r=>r.mode==='add'&&r.points?.length>=3)));
}

function startPreview(preserveInventory=false,resetToInitial=false){
recordPreviewDiagnostic('preview-start',{preserveInventory});
previewClickAreaCache.clear();
if(!preserveInventory){
previewRemovedClickIds.clear();
state.inventory=new Set();
state.selectedInventoryItemId=null;
state.inventoryEnabled=false;
previewCompletedTriggers.clear();
previewExecutedOnceNodes.clear();
acquiredItems.clear();
recordedWorldEvents.clear();usedWorldBranches.clear();toggleWorldStates.clear();
}
cancelPreviewScene();
previewAcquisitionSourceClickId=null;
refreshInventory();
stopEffectAnimation();
state.previewNodeId=null;
state.lastCameraView=null;
state.pendingAnimationFade=null;
fadeOverlay.style.opacity=0;
fadeOverlay.style.pointerEvents='none';
pendingWorldEntryFade=null;worldEntryFadeActive=false;
if(!state.startFolderId){alert('開始ワールドを選択してください。');return;}
gamePreview.classList.remove('hidden');
resizeGameCanvas();

refreshInventory();
inventoryButton.classList.remove('hidden');

drawPanoramaPreview(gameCanvas,{image:null,yaw:0,pitch:0,zoom:1});
enterWorldFolder(state.worldFolders[0]?.id||state.startFolderId,resetToInitial);
}


function stopPreview(){
recordPreviewDiagnostic('preview-stop');
state.inventoryEnabled=false;
refreshInventory();
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
const media=chosenSceneMedia(node);

if(!media||!(media.fileType==='pngseq'||media.url)||!(media.duration>0)){
previewMessage.textContent='MP4素材を選択してください';
return;
}

const backgroundWorldNode=getNode(state.previewWorldNodeId||currentWorldBackerId);
const backgroundImage=backgroundWorldNode?.world?.image||null;
const video=media.fileType==='pngseq'?createSequencePlayback(media,backgroundImage):document.createElement('video');

video.muted=true;
video.playsInline=true;
video.preload='auto';
video.loop=false;
if(media.fileType==='mp4')video.src=media.url;

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

const currentWorld=getNode(currentWorldBackerId)?.world;
const effectiveView=currentWorld||state.previewAnimation?.world||selectedView;

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
baseWorldNodeId:state.previewWorldNodeId||currentWorldBackerId,
video,
world,
frameId:null,
nodeId:node.id,
variantMediaId:media.id,
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

// Return to the same world, preserving its waiting click/area triggers.
stopPreviewAnimation();
if(playback.baseWorldNodeId&&getNode(playback.baseWorldNodeId)){
 state.previewWorldNodeId=playback.baseWorldNodeId;
 const underlying=getNode(playback.baseWorldNodeId)?.world;
 if(underlying){underlying.yaw=playback.world.yaw;underlying.pitch=playback.world.pitch;underlying.zoom=playback.world.zoom;}
 refreshWorldComposite();
}
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
const elapsed=activeIndependentKeyframe?.startedAt===undefined
?(now-playback.startedAt)/1000
:Math.max(0,(now-activeIndependentKeyframe.startedAt)/1000);
const cameraTime=activeIndependentKeyframe?.duration===undefined
?getMediaCameraLoopTime(node,media,elapsed)
:Math.min(activeIndependentKeyframe.duration,elapsed);
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
if(media.fileType==='pngseq')queueMicrotask(()=>video.dispatchEvent(new Event('loadeddata')));

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

// STARTへ戻る接続がある場合は、再生状態を初期化する
const returnToStart=state.connections.some(
c=>c.from===node.id&&c.to==='start'
);

if(returnToStart){
startPreview(true);
return;
}

// 通常の接続先へ進む
previewOutgoing(node.id);
}
function showPreviewNode(nodeId){
recordPreviewDiagnostic('node-enter',{nodeId,nodeType:getNode(nodeId)?.type||'missing',alreadyVisited:previewVisited.has(nodeId)});
const node=getNode(nodeId);
if(!node||gamePreview.classList.contains('hidden'))return;

// 一回だけ実行したノードへの再到達を処理する
if(isPreviewOnceCompleted(node)){
recordPreviewDiagnostic('node-once-skipped',{nodeId:node.id,nodeType:node.type});

const blockingTypes=new Set([
'click',
'frameIn',
'itemUse',
'condition',
'random',
'toggle',
'textAnswer',
'option',
'optionChoice',
'conditionBranch',
'toggleBranch',
'textAnswerBranch',
'clickBranch'
]);

if(!blockingTypes.has(node.type)){
previewOutgoing(node.id);
}
return;
}

// A branch converging on an already-active node is executed only once per scene.
if(previewVisited.has(node.id))return;
previewVisited.add(node.id);

// 待機型トリガーは発火時に実行済みとする
if(!['click','frameIn','itemUse'].includes(node.type)){
markPreviewOnceExecuted(node);
}

if(node.type==='folderStart'){previewOutgoing(node.id);return;}
if(node.type==='worldDisplay'){
  const folder=state.worldFolders.find(w=>w.id===node.folderId);
  if(folder){const backer=folderBacker(folder);if(backer){
    const seconds=pendingWorldEntryFade;pendingWorldEntryFade=null;
    worldEntryFadeActive=seconds!==null;
    showPreviewNode(backer.id);
    if(worldEntryFadeActive){
      runFadeEffect({effectSeconds:seconds},1,0,()=>{worldEntryFadeActive=false;previewOutgoing(backer.id);});
    }
  }}
  return;
}
if(node.type==='start'){previewOutgoing(node.id);return;}
if(node.type==='world'||node.type==='animation'){
// An animation is a temporary overlay; world triggers stay active.
if(node.type==='world')cancelPreviewScene();
else stopPreviewAnimation();
previewVisited.add(node.id);
state.previewNodeId=node.id;
if(node.type==='animation'){
playPreviewAnimation(node);
}else{
state.previewWorldNodeId=node.id;
applyWorldInitialView(node);
const initialVariant=chosenSceneMedia(node);
node.world.image=recompositeFolder(state.worldFolders.find(w=>w.backerId===node.id))||initialVariant?.image||initialVariant?.video||null;
previewMessage.textContent=initialVariant?.fileName||node.world.fileName||'ビュー素材未設定';
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

if(node.type==='world'){
previewOutgoing(node.id,'start');
}
return;
}
if(node.type==='keyframe'){
const source=findPreviousClickMediaNode(node.id);
const frames=getKeyframeNodeFrames(node).filter(frame=>Number.isFinite(frame.time));
const lastKeyframeTime=frames.length?Math.max(0,...frames.map(frame=>frame.time)):0;
const configuredDuration=Number(node.keyframeDuration);
const duration=Math.max(lastKeyframeTime,Number.isFinite(configuredDuration)&&configuredDuration>0?configuredDuration:0);
if(!source||duration<=0){previewOutgoing(node.id);return;}
const epoch=previewSceneEpoch;
const start=performance.now();
previewKeyframeBusy=true;
activeIndependentKeyframe={node,sourceId:source.id,offset:0,startedAt:start,duration};
recordPreviewDiagnostic('keyframe-start',{nodeId:node.id,duration});
// The preview waits until the last keyframe has finished before continuing.
if(source.type==='world'&&state.previewWorldNodeId===source.id){
if(state.cameraAnimationFrame){cancelAnimationFrame(state.cameraAnimationFrame);state.cameraAnimationFrame=null;}
const tick=now=>{
if(epoch!==previewSceneEpoch||gamePreview.classList.contains('hidden'))return;
const elapsed=Math.min(duration,(now-start)/1000);
Object.assign(source.world,getIndependentCameraAt(node,elapsed,getMediaCameraBase(source)));
drawPanoramaPreview(gameCanvas,source.world);
if(elapsed<duration)state.cameraAnimationFrame=requestAnimationFrame(tick);
else state.cameraAnimationFrame=null;
};
state.cameraAnimationFrame=requestAnimationFrame(tick);
}
schedulePreviewBranch(duration,()=>{
if(epoch!==previewSceneEpoch)return;
previewKeyframeBusy=false;
recordPreviewDiagnostic('keyframe-end',{nodeId:node.id,duration});
previewOutgoing(node.id);
});
return;
}
if(node.type==='media2d'){
showMedia2D(node);
previewOutgoing(node.id);
return;
}
if(node.type==='uiButton'){
 clearUiButtonPreview();
 const button=document.createElement('button');
 button.type='button';button.className='game-ui-button';
 button.textContent=node.uiButtonText??'ボタン';
 button.style.width=`min(${Math.max(40,Number(node.uiButtonWidth)||180)}px, 90%)`;
 button.style.height=`${Math.max(24,Number(node.uiButtonHeight)||56)}px`;
 button.style.fontSize=`${Math.max(8,Number(node.uiButtonFontSize)||20)}px`;
 const pos=(node.uiButtonPositions||{})[state.displayMode]||{x:50,y:88};
 button.style.position='absolute';
 button.style.left=`${Math.max(0,Math.min(100,Number(pos.x)??50))}%`;
 button.style.top=`${Math.max(0,Math.min(100,Number(pos.y)??88))}%`;
 button.style.transform='translate(-50%, -50%)';
 button.addEventListener('click',event=>{
  event.preventDefault();event.stopPropagation();
  if(gamePreview.classList.contains('hidden')||!button.isConnected)return;
  clearUiButtonPreview();
  previewOutgoing(node.id);
 });
 uiButtonPreviewLayer.appendChild(button);
 return;
}
if(node.type==='frameIn'){
if(!state.previewFrameInIds.includes(node.id))state.previewFrameInIds.push(node.id);
checkActiveFrameInTriggers();
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
if(node.type==='random'){
const targets=state.connections
.filter(c=>c.from===node.id)
.map(c=>getNode(c.to))
.filter(Boolean);

if(targets.length===0){
recordPreviewDiagnostic('random-no-target',{nodeId:node.id});
return;
}

const index=Math.floor(Math.random()*targets.length);
const target=targets[index];

recordPreviewDiagnostic('random-selected',{
nodeId:node.id,
targetId:target.id,
targetCount:targets.length,
selectedIndex:index
});

showPreviewNode(target.id);
return;
}
if(node.type==='worldMove'){if(node.destinationFolderId)enterWorldFolder(node.destinationFolderId);return;}
if(node.type==='gameReset'){
 recordPreviewDiagnostic('game-reset',{nodeId:node.id});
 startPreview(false,true);
 return;
}
if(node.type==='toggle'){
 const nextOn=!toggleWorldStates.has(node.id);
 if(nextOn)toggleWorldStates.add(node.id);else toggleWorldStates.delete(node.id);
 recordPreviewDiagnostic('toggle-switched',{nodeId:node.id,state:nextOn?'on':'off'});
 refreshWorldComposite();
 const branch=toggleBranches(node).find(n=>n.toggleResult===(nextOn?'on':'off'));
 if(branch)previewOutgoing(branch.id);
 return;
}
if(node.type==='toggleSet'){
 const target=getNode(node.toggleSetTargetId);
 if(target?.type==='toggle'){
  const wasOn=toggleWorldStates.has(target.id);
  const action=['on','off','toggle'].includes(node.toggleSetAction)?node.toggleSetAction:'toggle';
  const nextOn=action==='on'?true:action==='off'?false:!wasOn;
  if(nextOn)toggleWorldStates.add(target.id);else toggleWorldStates.delete(target.id);
  recordPreviewDiagnostic('toggle-set',{nodeId:node.id,targetId:target.id,state:nextOn?'on':'off'});
  refreshWorldComposite();
 }else{
  recordPreviewDiagnostic('toggle-set-no-target',{nodeId:node.id,targetId:node.toggleSetTargetId});
 }
 previewOutgoing(node.id);
 return;
}
if(node.type==='toggleBranch'){previewOutgoing(node.id);return;}
if(node.type==='eventRecord'){recordedWorldEvents.add(node.id);refreshWorldComposite();previewOutgoing(node.id);return;}
if(node.type==='itemAcquire'){
 if(state.inventory.has(node.id)){previewOutgoing(node.id);return;}
 acquiredItems.add(node.id);
 refreshWorldComposite();
 if(node.itemRemoveOriginClick&&previewAcquisitionSourceClickId){
  previewRemovedClickIds.add(previewAcquisitionSourceClickId);
  state.previewClickTriggerIds=state.previewClickTriggerIds.filter(id=>id!==previewAcquisitionSourceClickId);
  recordPreviewDiagnostic('item-click-region-disabled',{itemId:node.id,clickId:previewAcquisitionSourceClickId});
 }
 refreshAcquiredMediaScene();
 if(!state.inventory.has(node.id))state.inventory.add(node.id);
 refreshInventory();
 node.dialoguePages=[node.itemDescription||''];node.dialogueSpeaker=node.itemName||'';
 node.dialogueThumbnailMediaId=node.itemThumbnailMediaId||null;
 state.previewDialogueNodeId=node.id;
 showDialoguePage(node,0);
 return;
}
// 旧インベントリ表示ノードとの互換性を維持
if(node.type==='inventory'){
 previewOutgoing(node.id);
 return;
}
if(node.type==='itemUse'){
 if(!node.itemUseTargetId){return;}
 if(!state.previewItemUseTriggerIds.includes(node.id))state.previewItemUseTriggerIds.push(node.id);
 return;
}
if(node.type==='clickBranch'){previewOutgoing(node.id);return;}
if(node.type==='textAnswerBranch'){previewOutgoing(node.id);return;}
if(node.type==='conditionBranch'){previewOutgoing(node.id);return;}
if(node.type==='condition'){
 const meets=!!node.conditionItemId&&(node.conditionMode==='event'?recordedWorldEvents.has(node.conditionItemId):node.conditionMode==='toggle'?toggleWorldStates.has(node.conditionItemId):acquiredItems.has(node.conditionItemId));
 recordPreviewDiagnostic('condition-evaluated',{nodeId:node.id,mode:node.conditionMode,itemId:node.conditionItemId,result:meets?'yes':'no'});
 const branch=conditionBranches(node).find(n=>n.conditionResult===(meets?'yes':'no'));
 if(branch)showPreviewNode(branch.id);
 return;
}
if(node.type==='textAnswer'){showTextAnswerPanel(node);return;}
if(node.type==='optionChoice'){previewOutgoing(node.id);return;}
if(node.type==='option'){
if(!node.optionChoices?.length){previewOutgoing(node.id);return;}
state.previewDialogueNodeId=node.id;
showDialoguePage(node,0);
optionChoicesOverlay.replaceChildren();
node.optionChoices.forEach((choice,i)=>{
const button=document.createElement('button');button.type='button';
button.className='option-choice-button';
button.textContent=choice.text||`選択肢${i+1}`;
button.addEventListener('click',event=>{
event.preventDefault();event.stopPropagation();
if(state.previewDialogueNodeId!==node.id)return;
stopDialogueTyping();
dialogueOverlay.classList.add('hidden');
optionChoicesOverlay.classList.add('hidden');
state.previewDialogueNodeId=null;
const branch=optionChoiceNodes(node).find(n=>n.optionChoiceId===choice.id);
if(branch){previewVisited.delete(branch.id);showPreviewNode(branch.id);}
});
optionChoicesOverlay.appendChild(button);
});
optionChoicesOverlay.classList.remove('hidden');
return;
}
if(node.type==='dialogue'){
if(node.dialoguePages.length===0){previewOutgoing(node.id);return;}
state.previewDialogueNodeId=node.id;
showDialoguePage(node,0);
return;
}
if(node.type==='fadeIn'){
 if(!state.previewWorldNodeId){
   pendingWorldEntryFade=Math.max(0,Number(node.effectSeconds)||0);
   fadeOverlay.classList.remove('hidden');fadeOverlay.style.opacity='1';fadeOverlay.style.pointerEvents='none';
   previewOutgoing(node.id);return;
 }
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

const saveProgressUI=()=>({root:document.getElementById('saveProgressOverlay'),bar:document.getElementById('saveProgressBar'),message:document.getElementById('saveProgressMessage')});
function setSaveProgress(percent,message){const ui=saveProgressUI();if(!ui.root)return;ui.root.hidden=false;ui.bar.value=percent;ui.message.textContent=message;}
function endSaveProgress(){const ui=saveProgressUI();if(ui.root)ui.root.hidden=true;}

async function setOpenProgress(percent,message){
setSaveProgress(percent,message);
const title=saveProgressUI().root?.querySelector('.save-progress-dialog strong');
if(title)title.textContent='作品データを開いています';
await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
}
let currentGartSaveHandle=null;
async function writeProjectFile(blob,saveAs=false){
 if(currentGartSaveHandle){const stream=await currentGartSaveHandle.createWritable();setSaveProgress(92,'上書き保存しています…');await stream.write(blob);await stream.close();return true;}
 const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='project.gart';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);return true;
}
async function saveGartProject(saveAs=false){
const button=document.getElementById('saveGartBtn');
button.disabled=true;
try{
if(typeof window.showSaveFilePicker==='function'&&window.isSecureContext&&(saveAs||!currentGartSaveHandle)){
 try{currentGartSaveHandle=await window.showSaveFilePicker({suggestedName:'project.gart',types:[{description:'ぐるりエディタ データ',accept:{'application/octet-stream':['.gart']}}]});}
 catch(error){if(error?.name==='AbortError')return;console.warn('保存先の選択を利用できませんでした',error);}
}
setSaveProgress(5,'保存データを準備しています…');
const metadata={
format:'gururi-editor-project',
version:2,
worldFolders:state.worldFolders,
startFolderId:state.startFolderId,
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
path:media.fileType==='pngseq'?`assets/${index}/`:`assets/${index}.${media.fileType}`,fps:media.fps||null,frameNames:media.fileType==='pngseq'?media.frameFiles.map(f=>f.name):undefined
}))
};
const entries=[{name:'project.json',data:gartEncoder.encode(JSON.stringify(metadata))}];setSaveProgress(20,'素材をまとめています…');
for(const item of metadata.media){
const media=mediaLibrary.find(candidate=>candidate.id===item.id);
if(item.fileType==='pngseq'){
 if(!media?.frameFiles?.length)throw new Error(item.fileName+' の連番PNGがありません。');
 media.frameFiles.forEach((file,index)=>entries.push({name:item.path+String(index).padStart(5,'0')+'.png',data:file}));
 continue;
}
if(!media?.sourceFile)throw new Error(`${item.fileName} の元ファイルがありません。再度読み込んでください。`);
entries.push({name:item.path,data:media.sourceFile});
}
setSaveProgress(65,'プロジェクトを圧縮しています…');
await new Promise(requestAnimationFrame);
const blob=await gartCreateZip(entries);
setSaveProgress(90,'保存先を選択してください…');
const saved=await writeProjectFile(blob,saveAs);if(saved)setSaveProgress(100,'保存処理が完了しました');
}catch(error){
console.error(error);
alert(`プロジェクトを保存できませんでした。\n${error.message}`);
}finally{
button.disabled=false;endSaveProgress();
}
}

async function openGartProject(file){
const button=document.getElementById('openGartBtn');
button.disabled=true;
const previousMedia=[...mediaLibrary];
try{
await setOpenProgress(5,'ファイルを確認しています…');
const entries=await gartReadZip(file);
await setOpenProgress(15,'プロジェクト情報を確認しています…');
const json=entries.get('project.json');
if(!json)throw new Error('project.jsonがありません。');
const data=JSON.parse(await json.text());
if(data.format!=='gururi-editor-project'||data.version!==2)throw new Error('対応していない.gart形式です。');
if(!Array.isArray(data.nodes)||!Array.isArray(data.connections)||!Array.isArray(data.media)||!Array.isArray(data.worldFolders))throw new Error('プロジェクトの構造が不正です。');
if(!data.nodes.some(node=>node.id==='start'&&node.type==='start'))throw new Error('STARTノードがありません。');
const nodeIds=new Set(data.nodes.map(node=>node.id));
if(nodeIds.size!==data.nodes.length||data.connections.some(c=>!nodeIds.has(c.from)||!nodeIds.has(c.to)))throw new Error('ノードの接続情報が不正です。');
for(const item of data.media){
if(!item||!['png','jpg','mp4','pngseq'].includes(item.fileType))throw new Error('素材が不足しています。');
 if(item.fileType==='pngseq'){
  if(!Array.isArray(item.frameNames)||!item.frameNames.length||item.frameNames.some((_,i)=>!entries.has(item.path+String(i).padStart(5,'0')+'.png')))throw new Error('連番PNGが不足しています。');
 }else if(!entries.has(item.path))throw new Error('素材が不足しています。');
}
let loadedMediaCount=0;
const totalMediaCount=data.media.length;

for(const item of data.media){
await setOpenProgress(
20+Math.round(65*loadedMediaCount/Math.max(1,totalMediaCount)),
`素材を読み込んでいます…（${loadedMediaCount+1} / ${totalMediaCount}）`
);

if(item.fileType==='pngseq'){
const files=item.frameNames.map((name,i)=>new File([entries.get(item.path+String(i).padStart(5,'0')+'.png')],name,{type:'image/png'}));
const imported=await importPngSequence(files,Number(item.fps)||8);
imported.id=item.id;
imported.fileName=item.fileName;
}else{
const blob=entries.get(item.path);
const mimeType=item.fileType==='png'?'image/png':item.fileType==='jpg'?'image/jpeg':'video/mp4';
const assetFile=new File([blob],item.fileName,{type:mimeType});
const imported=await importMediaFile(assetFile);
imported.id=item.id;
}

loadedMediaCount++;
}

await setOpenProgress(85,'編集画面を復元しています…');
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
state.worldFolders=data.worldFolders||[];
currentGartSaveHandle=null;
state.startFolderId=data.startFolderId||state.worldFolders[0]?.id||null;
state.startFolderId=state.worldFolders[0]?.id||null;
state.activeFolderId=state.startFolderId;
worldComposites.clear();
for(const n of [...state.nodes])if(n.type==='textAnswer')ensureTextAnswerBranches(n);else if(n.type==='condition')ensureConditionBranches(n);else if(n.type==='toggle')ensureToggleBranches(n);
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
updateWorldTabs();renderNodes();
renderSettings();renderFolderSettings();
await setOpenProgress(100,'読み込みが完了しました');
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
endSaveProgress();
button.disabled=false;
}
}

document.getElementById('saveGartBtn').addEventListener('click',()=>saveGartProject(false));
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
const confirmButton=document.getElementById('exportConfirmBtn');
button.disabled=true;
try{
const title=document.getElementById('exportTitle').value.trim();
const author=document.getElementById('exportAuthor').value.trim();
const coverImage=exportCoverDataUrl;
if(!title||!author)throw new Error('作品タイトルと作者名を入力してください。');
if(!coverImage)throw new Error('トップページの背景画像を撮影して「決定」を押してください。');
if(!state.worldFolders.length||!state.worldFolders[0]?.id)throw new Error('開始ワールドがありません。');
setSaveProgress(5,'作品データを準備しています…');
const metadata={
format:'gururi-exported-work',version:2,
title,author,coverImage,
startFolderId:state.worldFolders[0].id,
worldFolders:structuredClone(state.worldFolders),
displayMode:state.displayMode,
layouts:structuredClone(state.layouts),
nodes:state.nodes.map(node=>({...node,world:node.world?{...node.world,image:null,raw:null}:undefined,animation:node.animation?{...node.animation,raw:null}:undefined})),
connections:structuredClone(state.connections),
media:mediaLibrary.map((media,index)=>({id:media.id,fileName:media.fileName,fileType:media.fileType,path:media.fileType==='pngseq'?`assets/${index}/`:`assets/${index}.${media.fileType}`,fps:media.fps||null,frameNames:media.fileType==='pngseq'?media.frameFiles.map(f=>f.name):undefined}))
};
const nodeIds=new Set(metadata.nodes.map(n=>n.id));
if(metadata.connections.some(c=>!nodeIds.has(c.from)||!nodeIds.has(c.to)))throw new Error('ノードの接続情報が不正です。');
const scriptElement=Array.from(document.scripts).find(s=>/\/app\.js(?:\?|$)/.test(s.src));
const baseUrl=new URL('./',scriptElement?.src||new URL('app.js',document.baseURI));
const sourceFiles={};
for(const name of ['index.html','app.js','style.css']){
const response=await fetch(new URL(name,baseUrl),{cache:'no-store'});
if(!response.ok)throw new Error(name+' を読み込めませんでした。');
sourceFiles[name]=await response.text();
}
setSaveProgress(20,'素材をまとめています…');
const embeddedMedia=[];
const entries=[];
async function toBase64(blob){return new Promise((resolve,reject)=>{
const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('素材を変換できませんでした。'));reader.readAsDataURL(blob);
});}
for(let i=0;i<metadata.media.length;i++){
const item=metadata.media[i];
const media=mediaLibrary.find(m=>m.id===item.id);
if(item.fileType==='pngseq'){
if(!media?.frameFiles?.length)throw new Error(item.fileName+' の連番PNGがありません。');
const frames=[];
for(let j=0;j<media.frameFiles.length;j++){
const f=media.frameFiles[j];frames.push(await toBase64(f));
entries.push({name:item.path+String(j).padStart(5,'0')+'.png',data:f});
}
embeddedMedia.push({id:item.id,frames});
}else{
if(!media?.sourceFile)throw new Error(item.fileName+' の元ファイルがありません。');
embeddedMedia.push({id:item.id,base64:await toBase64(media.sourceFile)});
entries.push({name:item.path,data:media.sourceFile});
}
setSaveProgress(20+Math.round((i+1)/Math.max(1,metadata.media.length)*45),'素材をまとめています…');
}
const playerStyle=`
html,body{margin:0!important;background:#000!important}
body.gururi-player #editorHomePage,body.gururi-player .editor-home,body.gururi-player .topbar,body.gururi-player .main-layout,body.gururi-player .media-popup,body.gururi-player #exportPreviewDiagnosticBtn{display:none!important}
body.gururi-player #gamePreview{position:fixed!important;inset:0!important;width:100vw!important;height:100dvh!important;z-index:20!important;background:#000!important}
body.gururi-player #closePreviewBtn{display:none!important}
#gururiLaunch{position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;gap:15px;align-items:center;justify-content:center;background-color:#080808;background-size:cover;background-position:center;color:#fff;font-family:sans-serif;text-align:center;padding:20px;box-sizing:border-box}
#gururiLaunch::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.48),rgba(0,0,0,.68));pointer-events:none}
#gururiLaunch>*{position:relative;z-index:1;text-shadow:0 2px 10px #000,0 1px 3px #000}
#gururiLaunch h1{font-size:clamp(24px,4vw,44px);max-width:94vw;overflow-wrap:anywhere}
#gururiLaunch button{background:rgba(28,28,28,.78)!important;backdrop-filter:blur(7px);border:1px solid rgba(255,255,255,.7)!important;text-shadow:none;min-width:180px}
#gururiLaunch button{padding:17px 40px;border:1px solid #888;border-radius:9px;background:#242424;color:#fff;font-size:20px;cursor:pointer}
#gururiLoading{width:min(340px,80vw);display:flex;flex-direction:column;gap:8px;align-items:stretch}
#gururiLoadingTrack{height:8px;border-radius:99px;background:rgba(255,255,255,.25);overflow:hidden}
#gururiLoadingFill{height:100%;width:0;background:#fff;border-radius:99px;transition:width .15s ease}
#gururiLoadingLabel{font-size:13px;color:#fff;text-align:center}
#gururiLaunch button:disabled{cursor:default;opacity:.6}
`;
const playerBootstrap=String.raw`
(async()=>{
const launch=document.getElementById('gururiLaunch');
// The player has its own landing screen, independent of the editor home.
const editorHome=document.getElementById('editorHomePage');
if(editorHome)editorHome.style.display='none';
try{
const data=window.GURURI_EXPORTED_WORK;
const encoded=window.GURURI_EMBEDDED_MEDIA;
launch.replaceChildren();
if(data?.coverImage){launch.style.backgroundImage='url("'+data.coverImage+'")';}
const launchTitle=document.createElement('h1');launchTitle.textContent=data?.title||'ぐるり作品';launchTitle.style.margin='0';
const launchAuthor=document.createElement('div');launchAuthor.textContent='作者：'+(data?.author||'');
const launchButton=document.createElement('button');launchButton.type='button';launchButton.textContent='スタート';launchButton.disabled=true;
launchButton.style.opacity='.6';
const loading=document.createElement('div');loading.id='gururiLoading';
const loadingTrack=document.createElement('div');loadingTrack.id='gururiLoadingTrack';
const loadingFill=document.createElement('div');loadingFill.id='gururiLoadingFill';
const loadingLabel=document.createElement('div');loadingLabel.id='gururiLoadingLabel';loadingLabel.textContent='作品を準備しています… 0%';
loadingTrack.appendChild(loadingFill);loading.append(loadingTrack,loadingLabel);
launch.append(launchTitle,launchAuthor,launchButton,loading);
const updateLoading=(percent,label)=>{
const amount=Math.max(0,Math.min(100,Math.round(percent)));
loadingFill.style.width=amount+'%';
loadingLabel.textContent=label+' '+amount+'%';
};
const yieldToBrowser=()=>new Promise(resolve=>setTimeout(resolve,0));
await yieldToBrowser();
if(!data||data.format!=='gururi-exported-work'||data.version!==2)throw new Error('作品データが不正です。');
if(!Array.isArray(data.nodes)||!Array.isArray(data.connections)||!Array.isArray(data.worldFolders)||!Array.isArray(data.media))throw new Error('作品の構造が不正です。');
const nodeIds=new Set(data.nodes.map(n=>n.id));
if(data.connections.some(c=>!nodeIds.has(c.from)||!nodeIds.has(c.to)))throw new Error('ノードの接続情報が不正です。');
updateLoading(5,'作品データを確認しました');
function fromBase64(text,type,name){
const parts=[];
for(let i=0;i<text.length;i+=32768){const binary=atob(text.slice(i,i+32768));const bytes=new Uint8Array(binary.length);for(let j=0;j<bytes.length;j++)bytes[j]=binary.charCodeAt(j);parts.push(bytes);}
return new File(parts,name,{type});
}
for(let mediaIndex=0;mediaIndex<data.media.length;mediaIndex++){
const item=data.media[mediaIndex];
updateLoading(10+80*mediaIndex/Math.max(1,data.media.length),'素材を読み込んでいます…');
await yieldToBrowser();
const entry=encoded.find(e=>e.id===item.id);
if(!entry)throw new Error(item.fileName+' が見つかりません。');
if(item.fileType==='pngseq'){
if(!Array.isArray(entry.frames)||entry.frames.length!==item.frameNames?.length)throw new Error('連番PNGが不足しています。');
const frames=entry.frames.map((value,i)=>fromBase64(value,'image/png',item.frameNames[i]));
const imported=await importPngSequence(frames,Number(item.fps)||8,true);
imported.id=item.id;imported.fileName=item.fileName;
}else{
const mime=item.fileType==='png'?'image/png':item.fileType==='jpg'?'image/jpeg':'video/mp4';
const file=fromBase64(entry.base64,mime,item.fileName);
const imported=await importMediaFile(file);
imported.id=item.id;
}
updateLoading(10+80*(mediaIndex+1)/Math.max(1,data.media.length),'素材を読み込んでいます…');
await yieldToBrowser();
}
updateLoading(92,'作品を初期化しています…');
await yieldToBrowser();
for(const node of data.nodes){
if(node.world){node.world.image=mediaLibrary.find(m=>m.id===node.world.mediaId&&m.fileType==='png')?.image||null;node.world.raw=null;}
if(node.animation)node.animation.raw=null;
}
state.nodes=data.nodes;
state.connections=data.connections;
state.worldFolders=data.worldFolders;
state.startFolderId=data.startFolderId||data.worldFolders[0]?.id||null;
state.activeFolderId=state.startFolderId;
for(const n of [...state.nodes])if(n.type==='textAnswer')ensureTextAnswerBranches(n);else if(n.type==='condition')ensureConditionBranches(n);else if(n.type==='toggle')ensureToggleBranches(n);
state.selectedNodeId=null;
state.selectedConnectionId=null;
// Choose the layout on the viewing device rather than on the exporting device.
if(data.layouts?.pc&&data.layouts?.mobile)state.layouts=data.layouts;
const selectPlayerDevice=()=>window.matchMedia('(max-width: 767px)').matches?'mobile':'pc';
state.displayMode=selectPlayerDevice();
updateLayoutControls();
window.addEventListener('resize',()=>{
const next=selectPlayerDevice();
if(state.displayMode===next)return;
state.displayMode=next;
updateLayoutControls();
if(!gamePreview.classList.contains('hidden'))resizeGameCanvas();
});
renderNodes();renderSettings();
updateLoading(100,'準備が完了しました');
await yieldToBrowser();
const begin=()=>{launch.style.display='none';startPreview(false,true);};
launchButton.disabled=false;launchButton.style.opacity='1';launchButton.addEventListener('click',begin);
loading.remove();
}catch(error){console.error(error);launch.textContent='作品を開けませんでした：'+error.message;}
})();
`;
const escapeInline=code=>code.replace(/<\/script/gi,'<\\/script');
const baseHtml=sourceFiles['index.html'];
if(!baseHtml.includes('<script src="app.js"></script>')||!baseHtml.includes('<link rel="stylesheet" href="style.css">'))throw new Error('HTML構造が想定と異なります。');
const json=JSON.stringify(metadata).replace(/</g,'\\u003c');
const embedded=JSON.stringify(embeddedMedia).replace(/</g,'\\u003c');
const launchHtml='<div id="gururiLaunch">作品を準備しています…</div>';
const viewerHtml=baseHtml
.replace('<title>ぐるりエディタ</title>','<title>'+title.replace(/[&<>"']/g,'')+'</title>')
.replace('<link rel="stylesheet" href="style.css">','<style>'+sourceFiles['style.css']+'\n'+playerStyle+'</style>')
.replace('<body>','<body class="gururi-player">'+launchHtml)
.replace('<script src="app.js"></script>','<script>'+escapeInline(sourceFiles['app.js'])+'</script>')
.replace(/<\/body>(?=\s*<\/html>\s*$)/i,'<script>window.GURURI_EXPORTED_WORK='+json+';window.GURURI_EMBEDDED_MEDIA='+embedded+';</script><script>'+escapeInline(playerBootstrap)+'</script></body>');
if(!viewerHtml.includes('GURURI_EMBEDDED_MEDIA'))throw new Error('作品HTMLを生成できませんでした。');
const htmlName=title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/[. ]+$/g,'').slice(0,120)||'作品';
entries.unshift({name:htmlName+'.html',data:gartEncoder.encode(viewerHtml)});
entries.push({name:'manifest.json',data:gartEncoder.encode(JSON.stringify({...metadata,format:'gururi-editor-art'},null,2))});
// The thumbnail must match the photographed landing-screen background.
const coverResponse=await fetch(coverImage);
const coverBlob=await coverResponse.blob();
const coverBitmap=await createImageBitmap(coverBlob);
const coverCanvas=document.createElement('canvas');
coverCanvas.width=coverBitmap.width;coverCanvas.height=coverBitmap.height;
coverCanvas.getContext('2d').drawImage(coverBitmap,0,0);
if(typeof coverBitmap.close==='function')coverBitmap.close();
const thumbnailBlob=await new Promise(resolve=>coverCanvas.toBlob(resolve,'image/png'));
if(!thumbnailBlob)throw new Error('サムネイル画像を生成できませんでした。');
entries.push({name:'thumbnail.png',data:thumbnailBlob});
setSaveProgress(85,'ZIPを作成しています…');
await new Promise(requestAnimationFrame);
const archive=await gartCreateZip(entries);
setSaveProgress(95,'作品を書き出しています…');
if(saveHandle){const stream=await saveHandle.createWritable();await stream.write(archive);await stream.close();}
else{const url=URL.createObjectURL(archive);const link=document.createElement('a');link.href=url;link.download=fileName;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
setSaveProgress(100,'書き出しが完了しました');
document.getElementById('exportSettingsModal').classList.add('hidden');
}catch(error){console.error(error);alert('作品を書き出せませんでした。\\n'+error.message);}
finally{button.disabled=false;endSaveProgress();}
}

const exportSettingsModal=document.getElementById('exportSettingsModal');
const exportFileNameInput=document.getElementById('exportFileName');
const exportSettingsForm=document.getElementById('exportSettingsForm');
const exportConfirmBtn=document.getElementById('exportConfirmBtn');

// Export-cover camera: capture the starting world at an arbitrary view.
let exportCoverDataUrl=null;
let exportCoverView={yaw:0,pitch:0,zoom:1};
let exportCoverImage=null;
let exportCoverDrag=null;
const exportCoverCanvas=document.getElementById('exportCoverCamera');
const exportCoverPhoto=document.getElementById('exportCoverPhoto');
const exportCoverEmpty=document.getElementById('exportCoverEmpty');
const exportCoverShoot=document.getElementById('exportCoverShoot');
const exportCoverClear=document.getElementById('exportCoverClear');
function drawExportCoverCamera(){
if(!exportCoverImage||!exportCoverCanvas.isConnected)return;
drawPanoramaPreview(exportCoverCanvas,{image:exportCoverImage,...exportCoverView});
}
function openExportCoverCamera(){
const folder=state.worldFolders[0];
const backer=folder&&folderBacker(folder);
const view=backer?getWorldInitialView(backer):null;
exportCoverView={yaw:Number(view?.yaw)||0,pitch:Number(view?.pitch)||0,zoom:Number(view?.zoom)||1};
exportCoverImage=null;
if(folder){
const composite=document.createElement('canvas');
if(composeAllWorldLayers(folder,composite))exportCoverImage=composite;
else exportCoverImage=getFolderMedia(folder)?.image||null;
}
exportCoverPhoto.hidden=!exportCoverDataUrl;
exportCoverPhoto.src=exportCoverDataUrl||'';
exportCoverCanvas.hidden=!!exportCoverDataUrl;
exportCoverEmpty.hidden=!!exportCoverDataUrl||!!exportCoverImage;
requestAnimationFrame(drawExportCoverCamera);
}
exportCoverCanvas.addEventListener('pointerdown',e=>{
if(e.button!==0)return;
exportCoverDrag={id:e.pointerId,x:e.clientX,y:e.clientY,yaw:exportCoverView.yaw,pitch:exportCoverView.pitch};
exportCoverCanvas.setPointerCapture(e.pointerId);
});
exportCoverCanvas.addEventListener('pointermove',e=>{
if(!exportCoverDrag||exportCoverDrag.id!==e.pointerId)return;
exportCoverView.yaw=exportCoverDrag.yaw-(e.clientX-exportCoverDrag.x)*.008;
exportCoverView.pitch=clamp(exportCoverDrag.pitch+(e.clientY-exportCoverDrag.y)*.008,-Math.PI/2+.02,Math.PI/2-.02);
drawExportCoverCamera();
});
const endExportCoverDrag=e=>{if(exportCoverDrag?.id===e.pointerId)exportCoverDrag=null;};
exportCoverCanvas.addEventListener('pointerup',endExportCoverDrag);
exportCoverCanvas.addEventListener('pointercancel',endExportCoverDrag);
exportCoverCanvas.addEventListener('wheel',e=>{
e.preventDefault();exportCoverView.zoom=clamp(exportCoverView.zoom+(e.deltaY>0?-.1:.1),.6,2.2);drawExportCoverCamera();
},{passive:false});
exportCoverShoot.addEventListener('click',()=>{
if(!exportCoverImage){alert('開始ワールドの画像がありません。');return;}
// Capture WebGL pixels directly in the same call as the draw (no preserveDrawingBuffer required).
const w=1280,h=720;
const capture=document.createElement('canvas');capture.width=w;capture.height=h;
Object.defineProperties(capture,{clientWidth:{get:()=>w/(window.devicePixelRatio||1)},clientHeight:{get:()=>h/(window.devicePixelRatio||1)}});
drawPanoramaPreview(capture,{image:exportCoverImage,...exportCoverView});
const gl=capture.getContext('webgl');
if(!gl){alert('撮影できませんでした。WebGLを確認してください。');return;}
const pixels=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
const flip=document.createElement('canvas');flip.width=w;flip.height=h;
const ctx=flip.getContext('2d');const image=ctx.createImageData(w,h);
for(let y=0;y<h;y++)image.data.set(pixels.subarray((h-y-1)*w*4,(h-y)*w*4),y*w*4);
ctx.putImageData(image,0,0);
exportCoverDataUrl=flip.toDataURL('image/jpeg',.88);
exportCoverPhoto.src=exportCoverDataUrl;exportCoverPhoto.hidden=false;exportCoverCanvas.hidden=true;exportCoverEmpty.hidden=true;
});
exportCoverClear.addEventListener('click',()=>{
exportCoverDataUrl=null;exportCoverPhoto.hidden=true;exportCoverPhoto.removeAttribute('src');exportCoverCanvas.hidden=false;
exportCoverEmpty.hidden=!!exportCoverImage;requestAnimationFrame(drawExportCoverCamera);
});


document.getElementById('exportWorkBtn').addEventListener('click',()=>{
exportSettingsModal.classList.remove('hidden');
exportFileNameInput.focus();
exportFileNameInput.select();
openExportCoverCamera();
});
document.getElementById('exportCancelBtn').addEventListener('click',()=>{
exportSettingsModal.classList.add('hidden');
});
exportSettingsForm.addEventListener('submit',async event=>{
event.preventDefault();
let name=exportFileNameInput.value.trim().replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').replace(/[. ]+$/g,'');
if(name.toLowerCase().endsWith('.zip'))name=name.slice(0,-4);
if(!name){alert('ファイル名を入力してください。');return;}
if(!exportCoverDataUrl){alert('トップページの背景画像を撮影して「決定」を押してください。');return;}
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


// ===============================================================
// World folders v2: independent graph editing per world.
// ===============================================================
const worldTabs=document.getElementById('worldTabs');
const worldFolderPanel=document.createElement('section');
worldFolderPanel.id='worldFolderPanel';worldFolderPanel.className='world-folder-panel hidden';
workspace.appendChild(worldFolderPanel);
const recordedWorldEvents=new Set();
const toggleWorldStates=new Set();
let currentWorldBackerId=null;
let pendingWorldEntryFade=null;
let worldEntryFadeActive=false;
const usedWorldBranches=new Set();
let worldCompositeFrame=0;
const worldComposites=new Map();
function activeFolder(){return state.worldFolders.find(w=>w.id===state.activeFolderId)||null;}
function makeWorldFolder(name){
 const id=uid('folder');
 const backer={id:uid('world'),type:'world',folderId:id,x:0,y:0,world:{fileName:'',fileType:'png',mediaId:null,image:null,yaw:0,pitch:0,zoom:1,views:{pc:{yaw:0,pitch:0,zoom:1},mobile:{yaw:0,pitch:0,zoom:1}}},worldInfiniteLoop:true};
 state.nodes.push(backer);
 const folder={id,name,backerId:backer.id,layers:[]};state.worldFolders.push(folder);
 const start={id:uid('folderStart'),type:'folderStart',folderId:id,x:70,y:120};
 const display={id:uid('worldDisplay'),type:'worldDisplay',folderId:id,x:380,y:120};
 state.nodes.push(start,display);
 state.connections.push({id:uid('connection'),from:start.id,to:display.id});
 if(!state.startFolderId)state.startFolderId=id;
 return folder;
}
function folderBacker(folder){return getNode(folder?.backerId);}
function assignFolderTab(folderId){
 folderId=folderId||state.worldFolders[0]?.id||null;
 state.activeFolderId=folderId;
 state.selectedNodeId=null;state.selectedNodeIds.clear();state.selectedConnectionId=null;
 worldTabs.querySelectorAll('button[data-folder-tab]').forEach(button=>button.classList.toggle('active',button.dataset.folderTab===(folderId||'__all__')));
 renderNodes();renderSettings();renderFolderSettings();
}
function deleteWorldFolder(folder){
 const index=state.worldFolders.findIndex(w=>w.id===folder?.id);
 if(index<=0){alert('ワールド1は削除できません。');return;}
 const references=state.nodes.filter(n=>n.type==='worldMove'&&n.destinationFolderId===folder.id).length;
 const message=folder.name+' を削除しますか？\nこのワールド内のノード・接続・透明PNGレイヤーも削除されます。'+(references?'\nこのワールドを参照するワールド移動ノード：'+references+'件（移動先は未設定になります）':'');
 if(!window.confirm(message))return;
 const ids=new Set(state.nodes.filter(n=>n.folderId===folder.id).map(n=>n.id));
 ids.add(folder.backerId);
 state.nodes=state.nodes.filter(n=>!ids.has(n.id));
 state.connections=state.connections.filter(c=>!ids.has(c.from)&&!ids.has(c.to));
 for(const node of state.nodes){if(node.type==='worldMove'&&node.destinationFolderId===folder.id)node.destinationFolderId='';}
 state.worldFolders.splice(index,1);
 state.startFolderId=state.worldFolders[0].id;
 state.selectedNodeId=null;state.selectedNodeIds.clear();state.selectedConnectionId=null;
 worldComposites.delete(folder.id);
 if(state.activeFolderId===folder.id)state.activeFolderId=state.worldFolders[0].id;
 updateWorldTabs();renderNodes();renderSettings();renderFolderSettings();
}
function updateWorldTabs(){
 worldTabs.replaceChildren();
 const add=(label,id,fn)=>{const b=document.createElement('button');b.type='button';b.dataset.folderTab=id||'__all__';b.textContent=label;b.className=id===state.activeFolderId?'active':'';b.addEventListener('click',fn);worldTabs.appendChild(b);};
 for(const folder of state.worldFolders){
  const b=document.createElement('button');b.type='button';b.dataset.folderTab=folder.id;b.textContent=folder.name;b.className=folder.id===state.activeFolderId?'active':'';
  b.onclick=()=>assignFolderTab(folder.id);
  b.ondblclick=e=>{e.preventDefault();e.stopPropagation();
    const input=document.createElement('input');input.className='world-tab-rename';input.value=folder.name;
    b.replaceWith(input);input.focus();input.select();
    const save=()=>{folder.name=input.value.trim()||folder.name;updateWorldTabs();renderFolderSettings();renderSettings();};
    input.onkeydown=ev=>{if(ev.key==='Enter')save();if(ev.key==='Escape')updateWorldTabs();};
    input.onblur=save;
  };
  const tabWrap=document.createElement('div');
  tabWrap.className='world-tab-wrap';
  tabWrap.appendChild(b);
  if(folder!==state.worldFolders[0]){
   const remove=document.createElement('button');remove.type='button';remove.className='world-tab-remove';remove.textContent='×';remove.title=folder.name+'を削除';remove.setAttribute('aria-label',folder.name+'を削除');
   remove.onclick=e=>{e.preventDefault();e.stopPropagation();deleteWorldFolder(folder);};
   tabWrap.appendChild(remove);
  }
  worldTabs.appendChild(tabWrap);
 }
 const plus=document.createElement('button');plus.textContent='＋';plus.title='ワールドを追加';plus.addEventListener('click',()=>{const folder=makeWorldFolder('ワールド'+(state.worldFolders.length+1));updateWorldTabs();assignFolderTab(folder.id);});worldTabs.appendChild(plus);
}
function layerConditionMatches(layer){
 const matches=(eventType,targetId,mode)=>{
  if(mode==='always'||!mode)return true;
  if(!targetId)return false;
  const has=eventType==='toggle'?toggleWorldStates.has(targetId):eventType==='acquire'?acquiredItems.has(targetId):eventType==='use'?usedWorldBranches.has(targetId):recordedWorldEvents.has(targetId);
  return mode==='after'?has:!has;
 };
 const first=matches(layer.eventType,layer.targetId,layer.mode);
 if(layer.secondConditionEnabled!==true)return first;
 const second=matches(layer.secondEventType,layer.secondTargetId,layer.secondMode);
 return layer.conditionOperator==='or'?(first||second):(first&&second);
}
function getFolderMedia(folder){return mediaLibrary.find(m=>m.id===folderBacker(folder)?.world?.mediaId)||null;}
function recompositeFolder(folder){
 const base=getFolderMedia(folder);if(!base)return null;
 const source=base.image||base.video;if(!source)return null;
 const width=base.width||2048,height=base.height||1024;
 let comp=worldComposites.get(folder.id);
 if(!comp){const canvas=document.createElement('canvas');comp={canvas,ctx:canvas.getContext('2d')};worldComposites.set(folder.id,comp);}
 if(comp.canvas.width!==width||comp.canvas.height!==height){comp.canvas.width=width;comp.canvas.height=height;}
 const ctx=comp.ctx;ctx.clearRect(0,0,width,height);
 try{ctx.drawImage(source,0,0,width,height);}catch(e){return null;}
 for(const layer of folder.layers||[]){if(!layerConditionMatches(layer))continue;
  const media=mediaLibrary.find(m=>m.id===layer.mediaId&&m.fileType==='png');
  if(media?.image)ctx.drawImage(media.image,0,0,width,height);
 }
 return comp.canvas;
}
function refreshWorldComposite(){
 const folder=state.worldFolders.find(w=>w.backerId===state.previewWorldNodeId);if(!folder)return;
 const backer=folderBacker(folder);const image=recompositeFolder(folder);
 if(image){backer.world.image=image;drawPanoramaPreview(gameCanvas,backer.world);}
}
function worldCompositeTick(){
 refreshWorldSettingsPreview();
 if(!gamePreview.classList.contains('hidden')&&state.previewWorldNodeId)refreshWorldComposite();
 worldCompositeFrame=requestAnimationFrame(worldCompositeTick);
}
function addFolderRow(parent,label,element){const group=document.createElement('div');group.className='setting-group';const cap=document.createElement('div');cap.className='setting-label';cap.textContent=label;group.append(cap,element);parent.append(group);}
function folderMediaSelect(value,types,onchange){const sel=document.createElement('select');sel.className='number-input';sel.add(new Option('素材未設定',''));for(const m of mediaLibrary.filter(m=>types.includes(m.fileType)))sel.add(new Option(m.fileName,m.id));sel.value=value||'';sel.onchange=()=>onchange(sel.value);return sel;}
function folderEventSelect(layer,render){
 const sel=document.createElement('select');sel.className='number-input';sel.add(new Option('対象を選択',''));
 const types={acquire:'itemAcquire',use:'clickBranch',event:'eventRecord',toggle:'toggle'};
 for(const n of state.nodes.filter(n=>n.type===types[layer.eventType]&&(n.type!=='clickBranch'||n.clickBranchItemId!=='__other__'))){
  const label=n.toggleName||n.itemName||n.eventName||n.customBody||n.clickBranchItemId||n.id;
  sel.add(new Option(label+' ('+(state.worldFolders.find(w=>w.id===n.folderId)?.name||'')+')',n.id));
 }
 sel.value=layer.targetId||'';sel.onchange=()=>{layer.targetId=sel.value;render();};return sel;
}
function renderFolderSettings(){
 worldFolderPanel.classList.toggle('hidden',!!state.activeFolderId);
 if(state.activeFolderId)return;
 worldFolderPanel.replaceChildren();
 const heading=document.createElement('h2');heading.textContent='ワールド一覧';worldFolderPanel.append(heading);
 const intro=document.createElement('p');intro.textContent='各ワールドを選択して基本メディア・透明PNGレイヤー・ノードを編集します。移動先はワールド内部の「ワールド移動」ノードから指定します。';worldFolderPanel.append(intro);
 for(const folder of state.worldFolders){
 const row=document.createElement('div');row.className='world-folder-card';
 const open=document.createElement('button');open.type='button';open.className='world-folder-open';open.textContent='📁 '+folder.name;open.onclick=()=>assignFolderTab(folder.id);row.append(open);
 const move=document.createElement('button');move.type='button';move.textContent='↑';move.title='並べ替え';move.onclick=()=>{const i=state.worldFolders.indexOf(folder);if(i>1){state.worldFolders.splice(i,1);state.worldFolders.splice(i-1,0,folder);updateWorldTabs();renderFolderSettings();}};row.append(move);
 if(folder!==state.worldFolders[0]){
  const del=document.createElement('button');del.type='button';del.textContent='削除';del.title='ワールドを削除';del.onclick=()=>deleteWorldFolder(folder);row.append(del);
 }
 worldFolderPanel.append(row);
}
}
function renderWorldFolderEditor(){
 const folder=activeFolder();if(!folder)return;
 const title=document.createElement('div');title.className='setting-group';title.innerHTML='<div class="settings-title">ワールド設定</div>';
 settingsPanel.prepend(title);
 const section=document.createElement('div');section.className='world-folder-settings';title.after(section);
 
 const media=folderMediaSelect(folderBacker(folder)?.world?.mediaId,['png','jpg','mp4'],id=>{const b=folderBacker(folder);const m=mediaLibrary.find(m=>m.id===id);b.world.mediaId=id;b.world.fileName=m?.fileName||'';b.world.fileType=m?.fileType||'';b.world.image=m?.image||m?.video||null;worldComposites.delete(folder.id);});addFolderRow(section,'基本360度PNG / MP4',media);
 const inheritGroup=document.createElement('div');inheritGroup.className='setting-group';
 const inheritLabel=document.createElement('label');inheritLabel.className='media-camera-inherit';
 const inheritCheckbox=document.createElement('input');inheritCheckbox.type='checkbox';inheritCheckbox.checked=Boolean(folderBacker(folder)?.inheritCamera);
 inheritCheckbox.addEventListener('change',()=>{const backer=folderBacker(folder);if(backer)backer.inheritCamera=inheritCheckbox.checked;});
 inheritLabel.append(inheritCheckbox,document.createTextNode(' 直前の画角を継承する'));inheritGroup.append(inheritLabel);section.append(inheritGroup);
 const previewGroup=document.createElement('div');previewGroup.className='setting-group';
 const previewHeading=document.createElement('div');previewHeading.className='setting-label';previewHeading.textContent='ワールドプレビュー（全レイヤー表示）';
 const previewCanvas=document.createElement('canvas');previewCanvas.className='world-settings-preview world-preview';previewCanvas.width=320;previewCanvas.height=Math.round(320*getActiveLayout().height/getActiveLayout().width);
 previewCanvas.dataset.folderId=folder.id;
 const previewNote=document.createElement('div');previewNote.className='world-settings-preview-note';previewNote.textContent='ドラッグ：カメラ回転 / ホイール：ズーム。現在の方向と画角がゲーム開始時の初期表示位置になります。透明PNGレイヤーはすべて表示します。';
 previewGroup.append(previewHeading,previewCanvas,previewNote);section.append(previewGroup);
 setupWorldSettingsCameraPreview(previewCanvas,folder);
 const cameraInputs=previewCanvas.nextElementSibling;
 if(cameraInputs?.classList.contains('camera-number-settings')){
  const cameraSection=document.createElement('details');
  cameraSection.className='world-camera-section';
  cameraSection.open=Boolean(folder.editorCameraOpen);
  const cameraSummary=document.createElement('summary');cameraSummary.textContent='カメラ情報';
  cameraSection.append(cameraSummary);
  cameraSection.append(cameraInputs);
  cameraSection.addEventListener('toggle',()=>{folder.editorCameraOpen=cameraSection.open;});
  // The camera controls are placed below the layer add button.
  section.dataset.hasCameraSection='true';
  section._cameraSection=cameraSection;
  const copyGroup=cameraInputs.querySelector('.camera-copy-view')?.closest('.setting-group');
  if(copyGroup){
   const copyButton=copyGroup.querySelector('.camera-copy-view');
   const newCopyGroup=document.createElement('div');newCopyGroup.className='setting-group';
   if(copyButton)newCopyGroup.append(copyButton);
   cameraInputs.prepend(newCopyGroup);
  }
  const yawLabel=cameraInputs.querySelector('[data-camera-value="yaw"]')?.closest('.setting-group')?.querySelector('.setting-label');
  if(yawLabel)yawLabel.textContent='水平方向（°）';
  const pitchLabel=cameraInputs.querySelector('[data-camera-value="pitch"]')?.closest('.setting-group')?.querySelector('.setting-label');
  if(pitchLabel)pitchLabel.textContent='垂直方向（°）';
  const fovLabel=cameraInputs.querySelector('[data-camera-value="fov"]')?.closest('.setting-group')?.querySelector('.setting-label');
  if(fovLabel)fovLabel.textContent='FOV値（°）';
 }
 const heading=document.createElement('h3');heading.textContent='透明PNGレイヤー';section.append(heading);
 for(const layer of folder.layers){
  const details=document.createElement('details');details.className='world-layer-entry';
  details.open=!!layer.editorOpen;
  const summary=document.createElement('summary');
  const layerName=document.createElement('span');layerName.textContent=layer.name||'名称未設定レイヤー';summary.append(layerName);
  const remove=document.createElement('button');remove.type='button';remove.className='world-layer-remove';remove.textContent='削除';remove.setAttribute('aria-label',`${layer.name||'レイヤー'}を削除`);
  remove.addEventListener('click',event=>{event.preventDefault();event.stopPropagation();folder.layers=folder.layers.filter(l=>l!==layer);worldComposites.delete(folder.id);renderSettings();});
  summary.append(remove);details.append(summary);section.append(details);
  details.addEventListener('toggle',()=>{layer.editorOpen=details.open;});
  const panel=document.createElement('div');panel.className='world-layer-fields';details.append(panel);
  const label=document.createElement('input');label.className='number-input';label.placeholder='レイヤー名';label.value=layer.name||'';
  label.oninput=()=>{layer.name=label.value;layerName.textContent=label.value||'名称未設定レイヤー';};addFolderRow(panel,'レイヤー名',label);
  addFolderRow(panel,'画像',folderMediaSelect(layer.mediaId,['png'],id=>layer.mediaId=id));
  const heading=document.createElement('div');heading.className='setting-label';heading.textContent='このレイヤーをいつ表示しますか？';panel.append(heading);
  const eventOptions=[['acquire','アイテム取得'],['use','アイテム使用'],['event','イベント終了'],['toggle','トグル']];
  const renderLayerCondition=(container,keys,label)=>{
   const cap=document.createElement('div');cap.className='setting-label';cap.textContent=label;container.append(cap);
   const eventType=document.createElement('select');eventType.className='number-input';
   for(const [value,text] of eventOptions)eventType.add(new Option(text,value));
   eventType.value=layer[keys.eventType]||'acquire';addFolderRow(container,'表示条件',eventType);
   const timing=document.createElement('select');timing.className='number-input';addFolderRow(container,'前/後',timing);
   const timingLabel=timing.parentElement.querySelector('.setting-label');
   const targetContainer=document.createElement('div');container.append(targetContainer);
   const explanation=document.createElement('p');explanation.className='world-layer-explanation';container.append(explanation);
   const updateExplanation=()=>{
    const target=getNode(layer[keys.targetId]);
    const name=(target?.type==='toggle'?(target.toggleName||'トグル '+target.id):null)||target?.itemName||target?.eventName||target?.customBody||(target?.clickBranchItemId?itemDisplayName(getNode(target.clickBranchItemId)):null);
    const type=layer[keys.eventType];const after=layer[keys.mode]==='after';
    if(type==='toggle'){explanation.textContent=name?`「${name}」が${after?'ON':'OFF'}の間に表示`:'対象のトグルを選択してください。';return;}
    const action=type==='acquire'?'取得':type==='use'?'使用':'終了';
    explanation.textContent=name?`「${name}」の${action}${after?'後':'前'}に表示`:'対象を選ぶと表示条件がここに表示されます。';
   };
   const drawTarget=()=>{
    targetContainer.replaceChildren();
    const adapter={eventType:layer[keys.eventType],targetId:layer[keys.targetId]};
    addFolderRow(targetContainer,'対象',folderEventSelect(adapter,()=>{layer[keys.targetId]=adapter.targetId;updateExplanation();}));
    updateExplanation();
   };
   const updateTimingLabels=()=>{
    const toggle=layer[keys.eventType]==='toggle';
    timingLabel.textContent=toggle?'ON/OFF':'前/後';
    timing.replaceChildren(new Option(toggle?'OFF':'前','before'),new Option(toggle?'ON':'後','after'));
    timing.value=layer[keys.mode]==='after'?'after':'before';
   };
   if(layer[keys.mode]==='always')layer[keys.mode]='before';
   updateTimingLabels();drawTarget();
   eventType.onchange=()=>{layer[keys.eventType]=eventType.value;layer[keys.targetId]='';updateTimingLabels();drawTarget();};
   timing.onchange=()=>{layer[keys.mode]=timing.value;updateExplanation();};
  };
  renderLayerCondition(panel,{eventType:'eventType',targetId:'targetId',mode:'mode'},'条件1');
  const additional=document.createElement('div');additional.className='world-layer-extra-condition';panel.append(additional);
  const renderAdditional=()=>{
   additional.replaceChildren();
   if(layer.secondConditionEnabled!==true){
    const addSecond=document.createElement('button');addSecond.type='button';addSecond.className='secondary-button';addSecond.textContent='＋ 条件を追加';
    addSecond.onclick=()=>{layer.secondConditionEnabled=true;layer.secondEventType=layer.secondEventType||'acquire';layer.secondMode=layer.secondMode||'before';renderAdditional();};
    additional.append(addSecond);return;
   }
   const operator=document.createElement('select');operator.className='number-input';
   operator.add(new Option('かつ（両方を満たす）','and'));operator.add(new Option('または（どちらかを満たす）','or'));
   operator.value=layer.conditionOperator==='or'?'or':'and';
   operator.onchange=()=>{layer.conditionOperator=operator.value;};
   addFolderRow(additional,'条件の組み合わせ',operator);
   renderLayerCondition(additional,{eventType:'secondEventType',targetId:'secondTargetId',mode:'secondMode'},'条件2');
   const removeSecond=document.createElement('button');removeSecond.type='button';removeSecond.className='secondary-button';removeSecond.textContent='2つ目の条件を削除';
   removeSecond.onclick=()=>{layer.secondConditionEnabled=false;renderAdditional();};additional.append(removeSecond);
  };
  renderAdditional();
  
 }
 const add=document.createElement('button');add.className='add-world-btn';add.textContent='レイヤー追加';add.onclick=()=>{folder.layers.push({id:uid('layer'),name:'新規レイヤー',mediaId:'',mode:'before',eventType:'acquire',targetId:'',editorOpen:true});renderSettings();};section.append(add);if(section._cameraSection)section.append(section._cameraSection);
}
const originalRenderSettings=renderSettings;
renderSettings=function(){
 if(state.activeFolderId&&(!state.selectedNodeId||getNode(state.selectedNodeId)?.type==='worldDisplay')){
  if(cleanupAnimationSettingsPreview){cleanupAnimationSettingsPreview();cleanupAnimationSettingsPreview=null;}
  settingsPanel.replaceChildren();
  renderWorldFolderEditor();
 }else{
  originalRenderSettings();
 }
};
// The editor preview is intentionally independent of the game-state visibility rules.
// It always shows every registered layer, including event-gated layers.
// A panoramic editor preview with all layers, irrespective of runtime visibility rules.
// Use the exact same panorama renderer and camera model as the legacy media-node preview.
const worldSettingsCameraPreviews=new WeakMap();
// Keep completed world preview composites when the settings panel is recreated.
const worldSettingsCompositeCache=new WeakMap();
function composeAllWorldLayers(folder,canvas){
 const base=getFolderMedia(folder);
 const source=base?.image||base?.video;
 const ctx=canvas.getContext('2d');
 if(!ctx)return false;
 const width=1024,height=512;
 if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 ctx.clearRect(0,0,width,height);
 if(!source||source instanceof HTMLVideoElement&&source.readyState<2)return false;
 try{ctx.drawImage(source,0,0,width,height);}catch(_error){return false;}
 for(const layer of folder.layers||[]){
  const media=mediaLibrary.find(m=>m.id===layer.mediaId&&m.fileType==='png');
  if(media?.image){try{ctx.drawImage(media.image,0,0,width,height);}catch(_error){}}
 }
 return true;
}
function setupWorldSettingsCameraPreview(canvas,folder){
const backer=folderBacker(folder);
if(!backer)return;

const saved=getWorldInitialView(backer);
const view={yaw:Number(saved.yaw)||0,pitch:Number(saved.pitch)||0,zoom:Number(saved.zoom)||1};
// Reuse the panorama composite across repeated openings of the same world.
let compositeCache=worldSettingsCompositeCache.get(folder);
if(!compositeCache){
compositeCache={canvas:document.createElement('canvas'),signature:null,sources:[],valid:false};
worldSettingsCompositeCache.set(folder,compositeCache);
}
const composite=compositeCache.canvas;
let syncInputs=()=>{};

const getCompositionState=()=>{
const base=getFolderMedia(folder);
const source=base?.image||base?.video||null;
const sources=[source];
const signatureParts=[base?.id||'',base?.width||0,base?.height||0];

for(const layer of folder.layers||[]){
const media=mediaLibrary.find(m=>m.id===layer.mediaId&&m.fileType==='png');
const image=media?.image||null;

sources.push(image);
signatureParts.push(layer.id,layer.mediaId||'');
}

for(const sourceItem of sources){
if(sourceItem instanceof HTMLImageElement){
signatureParts.push(sourceItem.naturalWidth,sourceItem.naturalHeight,sourceItem.complete?1:0);
}else if(sourceItem instanceof HTMLVideoElement){
signatureParts.push(sourceItem.videoWidth,sourceItem.videoHeight,sourceItem.readyState>=2?1:0);
}else{
signatureParts.push(0,0,0);
}
}

return{
signature:JSON.stringify(signatureParts),
sources,
dynamic:source instanceof HTMLVideoElement
};
};

const compositionChanged=status=>{
if(status.signature!==compositeCache.signature)return true;
if(status.sources.length!==compositeCache.sources.length)return true;

for(let i=0;i<status.sources.length;i++){
if(status.sources[i]!==compositeCache.sources[i])return true;
}

return false;
};

const updateComposite=(status,force=false)=>{
if(!force&&!status.dynamic&&!compositionChanged(status))return false;

compositeCache.valid=composeAllWorldLayers(folder,composite);
compositeCache.signature=status.signature;
compositeCache.sources=status.sources.slice();

return true;
};

const persist=()=>{
const target=getWorldInitialView(backer);
Object.assign(target,view);
backer.world.yaw=view.yaw;
backer.world.pitch=view.pitch;
backer.world.zoom=view.zoom;
};

const draw=()=>{
if(!canvas.isConnected)return;

const status=getCompositionState();
updateComposite(status);

drawPanoramaPreview(canvas,{
image:compositeCache.valid?composite:null,
...view
});

syncInputs();
};

const refresh=()=>{
if(!canvas.isConnected)return;

const status=getCompositionState();

if(!status.dynamic&&!compositionChanged(status))return;

updateComposite(status);

drawPanoramaPreview(canvas,{
image:compositeCache.valid?composite:null,
...view
});
};

syncInputs=setupCameraNumberInputs(canvas,view,()=>{
persist();
draw();
});

let drag=null;

canvas.addEventListener('pointerdown',e=>{
if(e.button!==0)return;
drag={x:e.clientX,y:e.clientY,yaw:view.yaw,pitch:view.pitch,pointerId:e.pointerId};
canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener('pointermove',e=>{
if(!drag||e.pointerId!==drag.pointerId)return;

view.yaw=drag.yaw-(e.clientX-drag.x)*0.008;
view.pitch=clamp(drag.pitch+(e.clientY-drag.y)*0.008,-Math.PI/2+.02,Math.PI/2-.02);

persist();
draw();
});

canvas.addEventListener('pointerup',()=>drag=null);
canvas.addEventListener('pointercancel',()=>drag=null);

canvas.addEventListener('wheel',e=>{
e.preventDefault();

view.zoom=clamp(view.zoom+(e.deltaY>0?-0.1:0.1),0.75,75/35);

persist();
draw();
},{passive:false});

worldSettingsCameraPreviews.set(canvas,{folder,draw,refresh});
draw();
}
let worldSettingsPreviewFrames=0;
function refreshWorldSettingsPreview(){
if(++worldSettingsPreviewFrames%6!==0)return;

const canvas=settingsPanel.querySelector('canvas.world-settings-preview');
if(!canvas)return;

const controller=worldSettingsCameraPreviews.get(canvas);

if(controller&&controller.folder===activeFolder()){
controller.refresh();
}
}
function enterWorldFolder(folderId,resetToInitial=false){
 const folder=state.worldFolders.find(w=>w.id===folderId);if(!folder)return;
 const previousWorld=getNode(currentWorldBackerId)?.world;
 const inheritedView=resetToInitial?null:(previousWorld?{yaw:previousWorld.yaw,pitch:previousWorld.pitch,zoom:previousWorld.zoom}:(state.lastCameraView?{...state.lastCameraView}:null));
 currentWorldBackerId=folder.backerId;
 const media=getFolderMedia(folder);
 if(media?.video){try{media.video.loop=true;media.video.currentTime=0;media.video.play().catch(()=>{});}catch(_e){}}
 const backer=folderBacker(folder);if(!backer)return;
 cancelPreviewScene();pendingWorldEntryFade=null;worldEntryFadeActive=false;
 if(resetToInitial){state.lastCameraView=null;applyWorldInitialView(backer);}
 else if(inheritedView)state.lastCameraView=inheritedView;
 const start=state.nodes.find(n=>n.type==='folderStart'&&n.folderId===folder.id);
 if(start)showPreviewNode(start.id);else showPreviewNode(backer.id);
}
applyGameAspectRatio();
updateLayoutControls();
addStartNode();
const firstFolder=makeWorldFolder('ワールド1');
updateWorldTabs();
assignFolderTab(firstFolder.id);
requestAnimationFrame(worldCompositeTick);

// パフォーマンス診断
const performanceDiagnostics={
startedAt:new Date().toISOString(),
metrics:{},
frames:[],
frameCount:0
};

function measurePerformanceFunction(name,original){
return function(...args){
const start=performance.now();
try{
return original.apply(this,args);
}finally{
const elapsed=performance.now()-start;
const metric=performanceDiagnostics.metrics[name]||{
count:0,
totalMs:0,
maxMs:0
};
metric.count++;
metric.totalMs+=elapsed;
metric.maxMs=Math.max(metric.maxMs,elapsed);
performanceDiagnostics.metrics[name]=metric;
}
};
}

function getPerformanceReport(){
const metrics={};

for(const [name,value] of Object.entries(performanceDiagnostics.metrics)){
metrics[name]={
calls:value.count,
totalMs:Number(value.totalMs.toFixed(3)),
averageMs:Number((value.totalMs/value.count).toFixed(4)),
maxMs:Number(value.maxMs.toFixed(3))
};
}

const frames=performanceDiagnostics.frames;
const intervals=[];

for(let i=1;i<frames.length;i++){
const delta=frames[i]-frames[i-1];
if(delta>0)intervals.push(delta);
}

const averageInterval=intervals.length
?intervals.reduce((a,b)=>a+b,0)/intervals.length
:0;

return{
startedAt:performanceDiagnostics.startedAt,
measuredAt:new Date().toISOString(),
nodeCount:state.nodes.length,
connectionCount:state.connections.length,
fps:{
average:averageInterval?Number((1000/averageInterval).toFixed(2)):null,
minimumApprox:intervals.length?Number((1000/Math.max(...intervals)).toFixed(2)):null,
frameCount:performanceDiagnostics.frameCount,
sampleCount:frames.length
},
functions:metrics
};
}

getNode=measurePerformanceFunction('getNode',getNode);
previewOutgoing=measurePerformanceFunction('previewOutgoing',previewOutgoing);
renderConnections=measurePerformanceFunction('renderConnections',renderConnections);
refreshWorldComposite=measurePerformanceFunction('refreshWorldComposite',refreshWorldComposite);

const originalWorldCompositeTick=worldCompositeTick;
worldCompositeTick=function(...args){
const now=performance.now();
if(!gamePreview.classList.contains('hidden')){
performanceDiagnostics.frameCount++;
performanceDiagnostics.frames.push(now);
if(performanceDiagnostics.frames.length>300){
performanceDiagnostics.frames.shift();
}
}else{
performanceDiagnostics.frames.length=0;
}
return originalWorldCompositeTick.apply(this,args);
};

const saveAsGartButton=document.getElementById('saveAsGartBtn');
if(saveAsGartButton)saveAsGartButton.addEventListener('click',()=>saveGartProject(true));

// Resizable editor boundary; project camera coordinates remain unchanged.
const editorPanelResizer=document.getElementById('editorPanelResizer');
const editorMainLayout=document.querySelector('.main-layout');
let editorResizePointer=null;
function setEditorSidebarWidth(width){
const total=editorMainLayout.clientWidth;
const max=Math.max(240,total-240);
const next=Math.max(240,Math.min(max,width));
editorMainLayout.style.setProperty('--editor-sidebar-width',next+'px');
}
editorPanelResizer.addEventListener('pointerdown',e=>{
if(e.button!==0)return;
editorResizePointer=e.pointerId;
editorPanelResizer.setPointerCapture(e.pointerId);
document.body.classList.add('is-resizing-editor');
e.preventDefault();
});
editorPanelResizer.addEventListener('pointermove',e=>{
if(editorResizePointer!==e.pointerId)return;
const rect=editorMainLayout.getBoundingClientRect();
setEditorSidebarWidth(rect.right-e.clientX);
});
const finishEditorResize=e=>{
if(editorResizePointer!==e.pointerId)return;
editorResizePointer=null;
document.body.classList.remove('is-resizing-editor');
};
editorPanelResizer.addEventListener('pointerup',finishEditorResize);
editorPanelResizer.addEventListener('pointercancel',finishEditorResize);
editorPanelResizer.addEventListener('lostpointercapture',finishEditorResize);
editorPanelResizer.addEventListener('keydown',e=>{
if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
e.preventDefault();
const current=settingsPanel.closest('.editor-sidebar').getBoundingClientRect().width;
setEditorSidebarWidth(current+(e.key==='ArrowLeft'?24:-24));
});
// All existing setting previews expand with their containing panel.
// Redraw the camera at the new pixel dimensions, keeping its view angles.
let editorResizeFrame=0;
const editorSettingsResizeObserver=new ResizeObserver(()=>{
cancelAnimationFrame(editorResizeFrame);
editorResizeFrame=requestAnimationFrame(()=>{
const worldCanvas=settingsPanel.querySelector('canvas.world-settings-preview');
if(worldCanvas){
const controller=worldSettingsCameraPreviews.get(worldCanvas);
if(controller)controller.draw();
}
for(const canvas of settingsPanel.querySelectorAll('canvas.world-preview:not(.world-settings-preview)')){
const world=lastPanoramaPreviewWorld.get(canvas);
if(world)drawPanoramaPreview(canvas,world);
}
const clickNode=getNode(state.selectedNodeId);
if(clickNode?.type==='click'){
const source=findPreviousClickMediaNode(clickNode.id);
if(source)drawClickLassoOverlay(clickNode,source);
}
});
});
editorSettingsResizeObserver.observe(settingsPanel);
