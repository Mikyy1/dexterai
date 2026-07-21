const PERSONALITIES={
default:{name:'DexTer',prompt:'Kamu adalah {name}, asisten AI yang sangat membantu. Berikan jawaban lengkap, detail, dan akurat. Jika diminta kode, tulis LENGKAP tanpa placeholder. Sertakan referensi [1] https://url "Judul" untuk info faktual.'},
friendly:{name:'DexTer',prompt:'Kamu adalah {name}, teman AI yang ceria dan ramah. Gunakan bahasa santai, emoji sesekali, dan sapa pengguna dengan hangat. Tetap informatif dan helpful. Kode harus LENGKAP.'},
formal:{name:'DexTer',prompt:'Kamu adalah {name}, asisten AI profesional dan sopan. Gunakan bahasa formal, struktur rapi, dan sapa dengan "Anda". Jawaban harus terstruktur dan berbobot. Kode LENGKAP dan terdokumentasi.'},
humorous:{name:'DexTer',prompt:'Kamu adalah {name}, AI yang lucu dan receh. Selipkan humor, pun, atau lelucon di jawaban. Tetap helpful walau bercanda. Kode LENGKAP dengan komentar lucu.'},
tsundere:{name:'DexTer',prompt:'Kamu adalah {name}, AI tsundere. Awalnya dingin dan pura-pura tidak peduli ("B-bukan karena aku ingin membantumu!"), tapi akhirnya tetap memberi jawaban lengkap dan helpful. Selipkan "hmph", "b-baka" sesekali.'},
sensei:{name:'DexTer-sensei',prompt:'Kamu adalah {name}, guru AI yang bijak dan sabar. Jelaskan konsep dengan analogi, langkah demi langkah. Dorong user untuk belajar. Akhiri dengan pertanyaan reflektif atau tips belajar.'},
phantom:{name:'Joker',prompt:'Kamu adalah {name}, Phantom Thief dari Persona 5. Gunakan gaya bicara ala pencuri hati: "Mari kita curi hatimu dengan kebenaran!", "Showtime!", sebut user sebagai "Joker" atau "nakama". Selipkan referensi Metaverse, Treasure, Confidant. Tetap helpful dan beri jawaban LENGKAP. Akhiri dengan frasa ikonik seperti "Take your heart!" atau "The show must go on!"'}
};

class DexTerChat{
constructor(){
// DOM Elements
this.chatContainer=document.getElementById('chatContainer');
this.messageInput=document.getElementById('messageInput');
this.sendBtn=document.getElementById('sendBtn');
this.refBtn=document.getElementById('refBtn');
this.refPanel=document.getElementById('refPanel');
this.refOverlay=document.getElementById('refOverlay');
this.refList=document.getElementById('refList');
this.refBadge=document.getElementById('refBadge');
this.closeRefBtn=document.getElementById('closeRefBtn');
this.charCount=document.getElementById('charCount');
this.fileInput=document.getElementById('fileInput');
this.attachBtn=document.getElementById('attachBtn');
this.filePreviewArea=document.getElementById('filePreviewArea');
this.toast=document.getElementById('toast');
this.modelSelect=document.getElementById('modelSelect');
this.aiNameDisplay=document.getElementById('aiNameDisplay');

// Sidebar
this.sidebar=document.getElementById('sidebar');
this.sidebarOverlay=document.getElementById('sidebarOverlay');
this.menuBtn=document.getElementById('menuBtn');
this.closeSidebarBtn=document.getElementById('closeSidebarBtn');
this.chatList=document.getElementById('chatList');
this.newChatBtn=document.getElementById('newChatBtn');
this.clearAllBtn=document.getElementById('clearAllBtn');

// Settings
this.settingsBtn=document.getElementById('settingsBtn');
this.settingsModal=document.getElementById('settingsModal');
this.settingsOverlay=document.getElementById('settingsOverlay');
this.closeSettingsBtn=document.getElementById('closeSettingsBtn');
this.saveSettingsBtn=document.getElementById('saveSettingsBtn');
this.resetSettingsBtn=document.getElementById('resetSettingsBtn');
this.aiNameInput=document.getElementById('aiNameInput');
this.aiPersonalitySelect=document.getElementById('aiPersonalitySelect');
this.aiSystemPromptInput=document.getElementById('aiSystemPromptInput');
this.aiLanguageSelect=document.getElementById('aiLanguageSelect');

// Phase 2: Mic & Export
this.micBtn=document.getElementById('micBtn');
this.exportBtn=document.getElementById('exportBtn');

// State
this.chats={};
this.currentChatId=null;
this.settings={
aiName:'DexTer',
personality:'phantom',
systemPrompt:'',
language:'id',
model:'claude-sonnet-4-6'
};
this.isLoading=false;
this.pendingFiles=[];
this.typingDiv=null;
this.MAX_FILE_SIZE=4*1024*1024;

// Voice Recognition
this.recognition=null;
this.isRecording=false;

this.loadData();
this.init();
}

init(){
// Event Listeners
this.sendBtn.addEventListener('click',()=>this.sendMessage());
this.refBtn.addEventListener('click',()=>this.toggleRefPanel());
this.closeRefBtn.addEventListener('click',()=>this.closeRefPanel());
this.refOverlay.addEventListener('click',()=>this.closeRefPanel());
this.attachBtn.addEventListener('click',()=>this.fileInput.click());
this.fileInput.addEventListener('change',(e)=>this.handleFileSelect(e));
this.messageInput.addEventListener('keydown',(e)=>{
if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this.sendMessage();}
});
this.messageInput.addEventListener('input',()=>{
this.updateCharCount();
this.updateSendButton();
this.autoResize();
});
this.messageInput.addEventListener('paste',(e)=>this.handlePaste(e));
this.modelSelect.addEventListener('change',(e)=>{
this.settings.model=e.target.value;
this.saveData();
this.showToast('<i class="fas fa-robot"></i> Model: '+e.target.options[e.target.selectedIndex].text);
});

// Sidebar
this.menuBtn.addEventListener('click',()=>this.toggleSidebar());
this.closeSidebarBtn.addEventListener('click',()=>this.closeSidebar());
this.sidebarOverlay.addEventListener('click',()=>this.closeSidebar());
this.newChatBtn.addEventListener('click',()=>{this.newChat();this.closeSidebar();});
this.clearAllBtn.addEventListener('click',()=>this.clearAllChats());
this.settingsBtn.addEventListener('click',()=>{this.openSettings();this.closeSidebar();});

// Settings Modal
this.closeSettingsBtn.addEventListener('click',()=>this.closeSettings());
this.settingsOverlay.addEventListener('click',()=>this.closeSettings());
this.saveSettingsBtn.addEventListener('click',()=>this.saveSettings());
this.resetSettingsBtn.addEventListener('click',()=>this.resetSettings());
this.aiPersonalitySelect.addEventListener('change',(e)=>{
if(e.target.value!=='custom')this.aiSystemPromptInput.value='';
});

// Phase 2: Voice Input (Mic)
if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
this.recognition=new SpeechRecognition();
this.recognition.continuous=false;
this.recognition.interimResults=true;
this.recognition.lang=this.settings.language==='id'?'id-ID':(this.settings.language==='ja'?'ja-JP':'en-US');

this.recognition.onresult=(e)=>{
let transcript='';
for(let i=e.resultIndex;i<e.results.length;i++){
transcript+=e.results[i][0].transcript;
}
this.messageInput.value=transcript;
this.updateSendButton();
this.autoResize();
};

this.recognition.onend=()=>{
this.isRecording=false;
this.micBtn.classList.remove('recording');
this.micBtn.innerHTML='<i class="fas fa-microphone"></i>';
};

this.micBtn.addEventListener('click',()=>{
if(this.isRecording){
this.recognition.stop();
}else{
this.recognition.lang=this.settings.language==='id'?'id-ID':(this.settings.language==='ja'?'ja-JP':'en-US');
this.recognition.start();
this.isRecording=true;
this.micBtn.classList.add('recording');
this.micBtn.innerHTML='<i class="fas fa-stop"></i>';
this.showToast('<i class="fas fa-microphone"></i> Morgana sedang mendengarkan...');
}
});
}else{
this.micBtn.style.display='none';
}

// Phase 2: Export Mission Log
this.exportBtn.addEventListener('click',()=>{
const chat=this.chats[this.currentChatId];
if(!chat||chat.messages.length===0){
this.showToast('<i class="fas fa-exclamation-triangle"></i> Tidak ada misi untuk di-export');
return;
}

let md='# MISSION LOG: '+chat.title+'\n\n';
md+='**Tanggal:** '+new Date(chat.createdAt).toLocaleString('id-ID')+'\n\n';
md+='**Model:** '+this.settings.model+'\n\n';
md+='**Persona:** '+this.settings.aiName+' ('+this.settings.personality+')\n\n';
md+='---\n\n';

chat.messages.forEach(m=>{
const role=m.role==='user'?'**[JOKER]**':'**['+this.settings.aiName.toUpperCase()+']**';
md+=role+'\n\n';
md+=m.content+'\n\n';
md+='---\n\n';
});

const blob=new Blob([md],{type:'text/markdown;charset=utf-8'});
const url=URL.createObjectURL(blob);
const a=document.createElement('a');
a.href=url;
a.download='Mission_Log_'+chat.title.replace(/[^a-z0-9]/gi,'_')+'_'+Date.now()+'.md';
document.body.appendChild(a);
a.click();
a.remove();
URL.revokeObjectURL(url);
this.showToast('<i class="fas fa-check"></i> Mission Log diamankan!');
});

this.modelSelect.value=this.settings.model;
this.updateAINameDisplay();
this.renderChatList();

if(Object.keys(this.chats).length===0){
this.newChat(false);
}else{
const lastChat=Object.values(this.chats).sort((a,b)=>b.updatedAt-a.updatedAt)[0];
this.switchChat(lastChat.id);
}

this.attachSuggestionListeners();
}

// === DATA PERSISTENCE ===
loadData(){
try{
const saved=localStorage.getItem('dexter_chats');
if(saved)this.chats=JSON.parse(saved);
const settings=localStorage.getItem('dexter_settings');
if(settings)this.settings={...this.settings,...JSON.parse(settings)};
}catch(e){console.error('Load error:',e);}
}

saveData(){
try{
localStorage.setItem('dexter_chats',JSON.stringify(this.chats));
localStorage.setItem('dexter_settings',JSON.stringify(this.settings));
}catch(e){console.error('Save error:',e);}
}

// === CHAT MANAGEMENT ===
newChat(showToast=true){
const id='chat_'+Date.now()+'_'+Math.random().toString(36).substring(2,8);
this.chats[id]={
id:id,
title:'Chat Baru',
messages:[],
references:[],
createdAt:Date.now(),
updatedAt:Date.now()
};
this.saveData();
this.renderChatList();
this.switchChat(id);
if(showToast)this.showToast('<i class="fas fa-plus"></i> Chat baru dibuat!');
}

switchChat(id){
if(!this.chats[id])return;
this.currentChatId=id;
const chat=this.chats[id];
this.chatContainer.innerHTML='';

if(chat.messages.length===0){
this.renderWelcome();
}else{
chat.messages.forEach(m=>{
if(m.role==='user'){
this.addMessage('user',m.content,m.files||[]);
}else{
const{cleanReply,references}=this.extractReferences(m.content);
this.addMessage('assistant',cleanReply,[],references);
}
});
}
this.renderChatList();
this.scrollToBottom();
}

deleteChat(id,fromEvent){
if(fromEvent)fromEvent.stopPropagation();
if(!this.chats[id])return;
const title=this.chats[id].title;
if(!confirm('Hapus "'+title+'"?'))return;
delete this.chats[id];
this.saveData();
if(this.currentChatId===id){
const remaining=Object.keys(this.chats);
if(remaining.length>0){
this.switchChat(remaining[remaining.length-1]);
}else{
this.newChat(false);
}
}
this.renderChatList();
this.showToast('<i class="fas fa-trash"></i> Chat dihapus');
}

clearAllChats(){
if(!confirm('Hapus SEMUA chat? Tindakan ini tidak bisa dibatalkan.'))return;
this.chats={};
this.saveData();
this.newChat(false);
this.showToast('<i class="fas fa-broom"></i> Semua chat dihapus');
}

renderChatList(){
const sorted=Object.values(this.chats).sort((a,b)=>b.updatedAt-a.updatedAt);
if(sorted.length===0){
this.chatList.innerHTML='<p style="text-align:center;color:var(--text-dim);padding:20px;font-family:var(--font-accent);font-size:12px">Belum ada chat</p>';
return;
}
let html='';
sorted.forEach(chat=>{
const active=chat.id===this.currentChatId?'active':'';
const date=new Date(chat.updatedAt);
const dateStr=date.toLocaleDateString('id-ID',{day:'numeric',month:'short'});
const timeStr=date.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'});
html+='<div class="chat-item '+active+'" data-id="'+chat.id+'"><i class="fas fa-masks-theater chat-item-icon"></i><div class="chat-item-info"><div class="chat-item-title">'+this.escapeHtml(chat.title)+'</div><div class="chat-item-date">'+dateStr+' · '+timeStr+'</div></div><button class="chat-item-delete" data-id="'+chat.id+'" title="Hapus"><i class="fas fa-trash"></i></button></div>';
});
this.chatList.innerHTML=html;
this.chatList.querySelectorAll('.chat-item').forEach(item=>{
item.addEventListener('click',()=>{
this.switchChat(item.dataset.id);
if(window.innerWidth<=768)this.closeSidebar();
});
});
this.chatList.querySelectorAll('.chat-item-delete').forEach(btn=>{
btn.addEventListener('click',(e)=>this.deleteChat(btn.dataset.id,e));
});
}

updateChatTitle(content){
if(!this.currentChatId||!this.chats[this.currentChatId])return;
const chat=this.chats[this.currentChatId];
if(chat.messages.length===1){
let title=content.substring(0,40).trim();
if(content.length>40)title+='...';
chat.title=title||'Chat Baru';
this.renderChatList();
}
chat.updatedAt=Date.now();
this.saveData();
}

// === SIDEBAR ===
toggleSidebar(){
this.sidebar.classList.toggle('open');
this.sidebarOverlay.classList.toggle('open');
}
closeSidebar(){
this.sidebar.classList.remove('open');
this.sidebarOverlay.classList.remove('open');
}

// === SETTINGS ===
openSettings(){
this.aiNameInput.value=this.settings.aiName;
this.aiPersonalitySelect.value=this.settings.personality;
this.aiSystemPromptInput.value=this.settings.systemPrompt;
this.aiLanguageSelect.value=this.settings.language;
this.settingsModal.classList.add('open');
this.settingsOverlay.classList.add('open');
}

closeSettings(){
this.settingsModal.classList.remove('open');
this.settingsOverlay.classList.remove('open');
}

saveSettings(){
this.settings.aiName=this.aiNameInput.value.trim()||'DexTer';
this.settings.personality=this.aiPersonalitySelect.value;
this.settings.systemPrompt=this.aiSystemPromptInput.value.trim();
this.settings.language=this.aiLanguageSelect.value;
this.saveData();
this.updateAINameDisplay();
this.closeSettings();
this.showToast('<i class="fas fa-check"></i> Pengaturan disimpan!');
}

resetSettings(){
if(!confirm('Reset semua pengaturan ke default?'))return;
this.settings={aiName:'DexTer',personality:'phantom',systemPrompt:'',language:'id',model:this.settings.model};
this.aiNameInput.value=this.settings.aiName;
this.aiPersonalitySelect.value=this.settings.personality;
this.aiSystemPromptInput.value='';
this.aiLanguageSelect.value=this.settings.language;
this.showToast('<i class="fas fa-rotate-left"></i> Pengaturan direset');
}

updateAINameDisplay(){
this.aiNameDisplay.textContent=this.settings.aiName;
}

getSystemPrompt(){
if(this.settings.systemPrompt){
return this.settings.systemPrompt.replace(/{name}/g,this.settings.aiName);
}
const p=PERSONALITIES[this.settings.personality]||PERSONALITIES.default;
let prompt=p.prompt.replace(/{name}/g,this.settings.aiName);
if(this.settings.language==='id')prompt+='\n\nGunakan bahasa Indonesia.';
else if(this.settings.language==='en')prompt+='\n\nRespond in English.';
else if(this.settings.language==='jp')prompt+='\n\n日本語で回答してください。';
return prompt;
}

// === FILE HANDLING ===
async handlePaste(e){
const items=e.clipboardData?.items;
if(!items)return;
for(const item of items){
if(item.kind==='file'){
e.preventDefault();
const file=item.getAsFile();
if(file)await this.addFile(file);
}
}
}

async handleFileSelect(e){
const files=Array.from(e.target.files||[]);
for(const file of files)await this.addFile(file);
this.fileInput.value='';
}

async addFile(file){
if(file.size>this.MAX_FILE_SIZE){
this.showToast('❌ File terlalu besar (max 4MB)');
return;
}
if(this.pendingFiles.length>=5){
this.showToast('❌ Maksimal 5 file');
return;
}
try{
const content=await this.readFile(file);
this.pendingFiles.push({name:file.name,type:file.type||'application/octet-stream',size:file.size,content:content});
this.renderFilePreview();
this.updateSendButton();
}catch(err){this.showToast('❌ Gagal baca file');}
}

readFile(file){
return new Promise((resolve,reject)=>{
const reader=new FileReader();
reader.onload=(e)=>resolve(e.target.result);
reader.onerror=reject;
if(this.isTextFile(file.type,file.name))reader.readAsText(file);
else reader.readAsDataURL(file);
});
}

isTextFile(type,name){
const textTypes=['text/','application/json','application/xml','application/javascript','application/x-sh'];
const textExts=['.txt','.md','.js','.ts','.jsx','.tsx','.py','.html','.css','.json','.xml','.yaml','.yml','.sh','.bash','.sql','.csv','.log','.env','.cfg','.ini','.toml','.java','.c','.cpp','.h','.cs','.go','.rs','.rb','.php','.lua','.vue','.svelte'];
if(textTypes.some(t=>type.startsWith(t)))return true;
return textExts.some(ext=>name.toLowerCase().endsWith(ext));
}

renderFilePreview(){
if(this.pendingFiles.length===0){
this.filePreviewArea.style.display='none';
this.filePreviewArea.innerHTML='';
return;
}
this.filePreviewArea.style.display='flex';
let html='';
this.pendingFiles.forEach((file,idx)=>{
const icon=this.getFileIcon(file.type,file.name);
html+='<div class="file-preview"><i class="'+icon+'"></i><div class="file-preview-info"><div class="file-preview-name">'+this.escapeHtml(file.name)+'</div><div class="file-preview-size">'+this.formatSize(file.size)+'</div></div><button class="file-remove" data-idx="'+idx+'"><i class="fas fa-xmark"></i></button></div>';
});
this.filePreviewArea.innerHTML=html;
this.filePreviewArea.querySelectorAll('.file-remove').forEach(btn=>{
btn.addEventListener('click',()=>{
this.pendingFiles.splice(parseInt(btn.dataset.idx),1);
this.renderFilePreview();
this.updateSendButton();
});
});
}

getFileIcon(type,name){
if(type.startsWith('image/'))return 'fas fa-image';
if(type.startsWith('video/'))return 'fas fa-video';
if(type.startsWith('audio/'))return 'fas fa-music';
if(type.includes('pdf'))return 'fas fa-file-pdf';
if(type.includes('zip')||type.includes('rar'))return 'fas fa-file-zipper';
if(this.isTextFile(type,name))return 'fas fa-file-code';
return 'fas fa-file';
}

formatSize(bytes){
if(bytes<1024)return bytes+' B';
if(bytes<1024*1024)return (bytes/1024).toFixed(1)+' KB';
return (bytes/1024/1024).toFixed(2)+' MB';
}

// === UI HELPERS ===
autoResize(){
this.messageInput.style.height='auto';
this.messageInput.style.height=Math.min(this.messageInput.scrollHeight,100)+'px';
}
updateCharCount(){this.charCount.textContent=this.messageInput.value.length+'/5000';}
updateSendButton(){this.sendBtn.disabled=(this.messageInput.value.trim()===''&&this.pendingFiles.length===0)||this.isLoading;}
toggleRefPanel(){this.refPanel.classList.toggle('open');this.refOverlay.classList.toggle('open');}
closeRefPanel(){this.refPanel.classList.remove('open');this.refOverlay.classList.remove('open');}

showToast(msg){
this.toast.innerHTML=msg;
this.toast.classList.add('show');
clearTimeout(this.toastTimer);
this.toastTimer=setTimeout(()=>this.toast.classList.remove('show'),2800);
}

scrollToBottom(){setTimeout(()=>{this.chatContainer.scrollTop=this.chatContainer.scrollHeight;},50);}

renderWelcome(){
const name=this.settings.aiName;
this.chatContainer.innerHTML='<div class="welcome-message"><div class="welcome-mask">🎭</div><div class="welcome-tag">SHOW TIME!</div><h2>'+name+' siap beraksi!</h2><p>Ketik pesan untuk memulai pencurian hati dengan jawaban</p><div class="suggestions"><button class="suggestion-btn" data-msg="Tuliskan kode Python lengkap untuk membuat web scraper dengan BeautifulSoup"><i class="fas fa-code"></i><span>Web scraper Python</span></button><button class="suggestion-btn" data-msg="Analisis file yang akan saya upload"><i class="fas fa-file-arrow-up"></i><span>Analisis file</span></button><button class="suggestion-btn" data-msg="Tulis cerita pendek sci-fi tentang AI"><i class="fas fa-pen-nib"></i><span>Cerita sci-fi</span></button><button class="suggestion-btn" data-msg="Jelaskan quantum computing dengan detail"><i class="fas fa-lightbulb"></i><span>Quantum computing</span></button></div></div>';
this.attachSuggestionListeners();
}

attachSuggestionListeners(){
document.querySelectorAll('.suggestion-btn').forEach(btn=>{
btn.addEventListener('click',()=>{
this.messageInput.value=btn.getAttribute('data-msg');
this.updateSendButton();
this.sendMessage();
});
});
}

// === MESSAGING ===
createStreamingMessage(){
const messageDiv=document.createElement('div');
messageDiv.className='message message-assistant';
const contentDiv=document.createElement('div');
contentDiv.className='message-content';
contentDiv.innerHTML='<p><span class="streaming-text"></span><span class="streaming-cursor"></span></p>';
messageDiv.appendChild(contentDiv);
this.chatContainer.appendChild(messageDiv);
return{div:messageDiv,contentDiv:contentDiv,textSpan:contentDiv.querySelector('.streaming-text')};
}

async sendMessage(){
const message=this.messageInput.value.trim();
const files=[...this.pendingFiles];
if((!message&&files.length===0)||this.isLoading)return;

const welcome=this.chatContainer.querySelector('.welcome-message');
if(welcome)welcome.remove();

const userMsg={role:'user',content:message,files:files.map(f=>({name:f.name,type:f.type,size:f.size})),timestamp:Date.now()};
this.addMessage('user',message,files);

this.messageInput.value='';
this.pendingFiles=[];
this.renderFilePreview();
this.updateCharCount();
this.updateSendButton();
this.messageInput.style.height='auto';
this.isLoading=true;

let userContent=message||'';
if(files.length>0){
userContent+='\n\n=== FILE YANG DIUNGGAH ===\n';
files.forEach((file,idx)=>{
userContent+=`\n📎 File ${idx+1}: ${file.name} (${file.type})\n`;
if(this.isTextFile(file.type,file.name)){
const content=file.content.replace(/^data:.*?;base64,/, '');
userContent+=`--- ISI FILE ---\n${content}\n--- AKHIR FILE ---\n`;
}
});
}

const chat=this.chats[this.currentChatId];
const history=chat?chat.messages:[];

const systemPrompt=this.getSystemPrompt();
const promptMessages=[
{role:'user',content:'[SYSTEM]\n'+systemPrompt+'\n[/SYSTEM]\n\nAcknowledge.'},
{role:'assistant',content:'Dimengerti. Saya '+this.settings.aiName+', siap membantu.'},
...history.slice(-20).map(m=>({role:m.role,content:m.content})),
{role:'user',content:userContent}
];

const model=this.settings.model;
const streamingMsg=this.createStreamingMessage();

try{
const response=await puter.ai.chat(promptMessages,{model:model,stream:true});
let accumulated='';
for await(const part of response){
const text=part?.text||'';
if(text){
accumulated+=text;
streamingMsg.textSpan.textContent=accumulated;
this.scrollToBottom();
}
}

const{cleanReply,references}=this.extractReferences(accumulated);
streamingMsg.contentDiv.innerHTML=this.formatMessage(cleanReply);

if(references.length>0){
const refsDiv=document.createElement('div');
refsDiv.className='references';
let refsHTML='<div class="references-title"><i class="fas fa-book"></i> Referensi</div>';
references.forEach(ref=>{
refsHTML+='<div class="reference-item" onclick="window.open(\''+ref.url+'\',\'_blank\')"><div class="reference-number">'+ref.number+'</div><div class="reference-content"><a href="'+ref.url+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+this.escapeHtml(ref.title)+'</a><div class="ref-url">'+this.escapeHtml(this.truncateUrl(ref.url))+'</div></div></div>';
});
refsDiv.innerHTML=refsHTML;
streamingMsg.contentDiv.appendChild(refsDiv);
}

this.attachCodeBlockHandlers(streamingMsg.div);

if(this.chats[this.currentChatId]){
this.chats[this.currentChatId].messages.push(userMsg);
this.chats[this.currentChatId].messages.push({role:'assistant',content:accumulated,timestamp:Date.now()});
if(references.length>0){
if(!this.chats[this.currentChatId].references)this.chats[this.currentChatId].references=[];
references.forEach(r=>{
if(!this.chats[this.currentChatId].references.find(x=>x.number===r.number))
this.chats[this.currentChatId].references.push(r);
});
}
this.updateChatTitle(message);
this.saveData();
this.updateRefBadge();
}

this.scrollToBottom();
}catch(error){
console.error('Error:',error);
streamingMsg.div.remove();
this.addMessage('assistant','❌ Error: '+error.message+'\n\n💡 Tips: Coba model lain atau kirim pesan lebih pendek.');
}finally{
this.isLoading=false;
this.updateSendButton();
}
}

updateRefBadge(){
const chat=this.chats[this.currentChatId];
const count=chat?.references?.length||0;
this.refBadge.textContent=count;
this.refBadge.style.display=count>0?'flex':'none';
}

extractReferences(text){
const referenceRegex=/$$(\d+)$$\s*(https?:\/\/[^\s"'<>]+)\s*"?([^"\n]*)"?/g;
let references=[];
let cleanText=text;
let match;
while((match=referenceRegex.exec(text))!==null){
const[,number,url,title]=match;
const cleanTitle=(title||url).replace(/["']/g,'').trim();
references.push({number:parseInt(number),url:url,title:cleanTitle||url});
cleanText=cleanText.replace(match[0],' [REF'+number+'] ');
}
cleanText=cleanText.replace(/$$REF(\d+)$$/g,(m,num)=>{
const ref=references.find(r=>r.number===parseInt(num));
if(ref)return ' <a href="'+ref.url+'" target="_blank" class="inline-ref" onclick="event.stopPropagation()">'+num+'</a> ';
return m;
});
cleanText=cleanText.replace(/$$(\d+)$$/g,(m,num)=>{
const ref=references.find(r=>r.number===parseInt(num));
if(ref)return ' <a href="'+ref.url+'" target="_blank" class="inline-ref" onclick="event.stopPropagation()">'+num+'</a> ';
return m;
});
return{cleanReply:cleanText.trim(),references};
}

addMessage(role,content,files=[],references=[]){
const messageDiv=document.createElement('div');
messageDiv.className='message message-'+role;
const contentDiv=document.createElement('div');
contentDiv.className='message-content';
contentDiv.innerHTML=this.formatMessage(content);
if(files&&files.length>0){
const filesDiv=document.createElement('div');
filesDiv.className='file-attachments';
files.forEach(f=>{
const chip=document.createElement('div');
chip.className='file-chip';
chip.innerHTML='<i class="'+this.getFileIcon(f.type||'',f.name)+'"></i><span>'+this.escapeHtml(f.name)+'</span>';
filesDiv.appendChild(chip);
});
contentDiv.appendChild(filesDiv);
}
if(references.length>0){
const refsDiv=document.createElement('div');
refsDiv.className='references';
let refsHTML='<div class="references-title"><i class="fas fa-book"></i> Referensi</div>';
references.forEach(ref=>{
refsHTML+='<div class="reference-item" onclick="window.open(\''+ref.url+'\',\'_blank\')"><div class="reference-number">'+ref.number+'</div><div class="reference-content"><a href="'+ref.url+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+this.escapeHtml(ref.title)+'</a><div class="ref-url">'+this.escapeHtml(this.truncateUrl(ref.url))+'</div></div></div>';
});
refsDiv.innerHTML=refsHTML;
contentDiv.appendChild(refsDiv);
}
messageDiv.appendChild(contentDiv);
this.chatContainer.appendChild(messageDiv);
this.attachCodeBlockHandlers(messageDiv);
this.scrollToBottom();
}

truncateUrl(url){
try{const u=new URL(url);return u.hostname+(u.pathname.length>1?u.pathname.substring(0,25)+'...':'');}
catch(e){return url.substring(0,35);}
}

escapeHtml(text){const div=document.createElement('div');div.textContent=text;return div.innerHTML;}

formatMessage(text){
const codeBlocks=[];
let idx=0;
text=text.replace(/```(\w+)?\n?([\s\S]*?)```/g,(match,lang,code)=>{
const langName=(lang||'code').toLowerCase();
const placeholder='%%CODE_BLOCK_'+idx+'%%';
codeBlocks.push({lang:langName,code:code.trim(),idx:idx});
idx++;
return placeholder;
});
text=text.replace(/`([^`\n]+)`/g,'<code>$1</code>');
text=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
text=text.replace(/\*(.*?)\*/g,'<em>$1</em>');
text=text.replace(/\n/g,'<br>');
let result='<p>'+text+'</p>';
codeBlocks.forEach(block=>{
const placeholder='%%CODE_BLOCK_'+block.idx+'%%';
const blockId='code_'+block.idx+'_'+Date.now()+'_'+Math.random().toString(36).substring(2,6);
const ext=this.getExtension(block.lang);
const replacement='<div class="code-block-wrapper" data-lang="'+block.lang+'" data-ext="'+ext+'"><div class="code-block-header"><div class="code-lang"><i class="fas fa-code"></i> '+this.escapeHtml(block.lang)+'</div><div class="code-actions"><button class="code-btn btn-copy" data-block="'+blockId+'"><i class="fas fa-copy"></i> Copy</button><button class="code-btn btn-download" data-block="'+blockId+'"><i class="fas fa-download"></i> Download</button></div></div><pre><code id="'+blockId+'">'+this.escapeHtml(block.code)+'</code></pre></div>';
result=result.replace('<p>'+placeholder+'</p>',replacement);
result=result.replace(placeholder,replacement);
});
return result;
}

getExtension(lang){
const map={javascript:'js',typescript:'ts',python:'py',java:'java',c:'c',cpp:'cpp','c++':'cpp',csharp:'cs','c#':'cs',go:'go',rust:'rs',ruby:'rb',php:'php',swift:'swift',kotlin:'kt',html:'html',css:'css',json:'json',xml:'xml',yaml:'yml',sql:'sql',bash:'sh',shell:'sh',markdown:'md',lua:'lua',r:'r',dart:'dart',vue:'vue',svelte:'svelte',jsx:'jsx',tsx:'tsx'};
return map[lang]||'txt';
}

attachCodeBlockHandlers(container){
container.querySelectorAll('.code-block-wrapper').forEach(wrapper=>{
const ext=wrapper.dataset.ext;
const codeEl=wrapper.querySelector('code');
const copyBtn=wrapper.querySelector('.btn-copy');
const dlBtn=wrapper.querySelector('.btn-download');
if(copyBtn&&!copyBtn.dataset.bound){
copyBtn.dataset.bound='1';
copyBtn.addEventListener('click',async()=>{
try{
await navigator.clipboard.writeText(codeEl.textContent);
copyBtn.innerHTML='<i class="fas fa-check"></i> Copied';
copyBtn.classList.add('copied');
this.showToast('<i class="fas fa-check"></i> Kode berhasil dicopy!');
setTimeout(()=>{copyBtn.innerHTML='<i class="fas fa-copy"></i> Copy';copyBtn.classList.remove('copied');},2000);
}catch(err){
const ta=document.createElement('textarea');
ta.value=codeEl.textContent;
document.body.appendChild(ta);
ta.select();
document.execCommand('copy');
ta.remove();
this.showToast('<i class="fas fa-check"></i> Kode berhasil dicopy!');
}
});
}
if(dlBtn&&!dlBtn.dataset.bound){
dlBtn.dataset.bound='1';
dlBtn.addEventListener('click',()=>{
const content=codeEl.textContent;
const blob=new Blob([content],{type:'text/plain;charset=utf-8'});
const url=URL.createObjectURL(blob);
const a=document.createElement('a');
a.href=url;
a.download='dexter_code_'+Date.now()+'.'+ext;
document.body.appendChild(a);
a.click();
document.body.removeChild(a);
URL.revokeObjectURL(url);
this.showToast('<i class="fas fa-download"></i> File didownload: '+a.download);
});
}
});
}
}

// === VOICE INPUT (MIC) ===
this.micBtn=document.getElementById("micBtn");
this.recognition=null;
this.isRecording=false;
if("webkitSpeechRecognition" in window || "SpeechRecognition" in window){
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
this.recognition=new SpeechRecognition();
this.recognition.continuous=false;
this.recognition.interimResults=true;
this.recognition.lang=this.persona.defaultLang==="id"?"id-ID":(this.persona.defaultLang==="ja"?"ja-JP":"en-US");
this.recognition.onresult=(e)=>{let t="";for(let i=e.resultIndex;i<e.results.length;i++)t+=e.results[i][0].transcript;this.messageInput.value=t;this.updateSendButton();this.autoResize();};
this.recognition.onend=()=>{this.isRecording=false;this.micBtn.classList.remove("recording");this.micBtn.innerHTML="<i class=\x27fas fa-microphone\x27></i>";};
this.micBtn.addEventListener("click",()=>{if(this.isRecording){this.recognition.stop();}else{this.recognition.lang=this.persona.defaultLang==="id"?"id-ID":(this.persona.defaultLang==="ja"?"ja-JP":"en-US");this.recognition.start();this.isRecording=true;this.micBtn.classList.add("recording");this.micBtn.innerHTML="<i class=\x27fas fa-stop\x27></i>";this.showToast("<i class=\x27fas fa-microphone\x27></i> Morgana sedang mendengarkan...");}});
}else{this.micBtn.style.display="none";}

// === EXPORT MISSION LOG ===
this.exportBtn=document.getElementById("exportBtn");
this.exportBtn.addEventListener("click",()=>{const chat=this.getActiveChat();if(!chat||chat.messages.length===0){this.showToast("<i class=\x27fas fa-exclamation-triangle\x27></i> Tidak ada misi untuk di-export");return;}let md="# MISSION LOG: "+chat.title+"\n\n";chat.messages.forEach(m=>{const role=m.role==="user"?"**[JOKER]**":"**[DEXTHER AI]**";md+=role+"\n"+m.content+"\n\n---\n\n";});const blob=new Blob([md],{type:"text/markdown;charset=utf-8"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="Mission_Log_"+Date.now()+".md";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);this.showToast("<i class=\x27fas fa-check\x27></i> Mission Log diamankan!");});

document.addEventListener('DOMContentLoaded',()=>{new DexTerChat();});
