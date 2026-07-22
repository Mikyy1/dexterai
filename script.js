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
console.log('🎭 DexTer AI initializing...');
this.initDOM();
this.initState();
this.initEvents();
this.loadData();
this.initUI();
console.log('✅ DexTer AI ready!');
}

initDOM(){
this.chatContainer=document.getElementById('chatContainer');
this.messageInput=document.getElementById('messageInput');
this.sendBtn=document.getElementById('sendBtn');
this.charCount=document.getElementById('charCount');
this.fileInput=document.getElementById('fileInput');
this.attachBtn=document.getElementById('attachBtn');
this.filePreviewArea=document.getElementById('filePreviewArea');
this.toast=document.getElementById('toast');
this.modelSelect=document.getElementById('modelSelect');

this.refBtn=document.getElementById('refBtn');
this.refPanel=document.getElementById('refPanel');
this.refOverlay=document.getElementById('refOverlay');
this.refList=document.getElementById('refList');
this.refBadge=document.getElementById('refBadge');
this.closeRefBtn=document.getElementById('closeRefBtn');

this.sidebar=document.getElementById('sidebar');
this.sidebarOverlay=document.getElementById('sidebarOverlay');
this.menuBtn=document.getElementById('menuBtn');
this.closeSidebarBtn=document.getElementById('closeSidebarBtn');
this.chatList=document.getElementById('chatList');
this.newChatBtn=document.getElementById('newChatBtn');
this.clearAllBtn=document.getElementById('clearAllBtn');

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
this.aiNameDisplay=document.getElementById('aiNameDisplay');

// Phase 2 + Memory buttons
this.micBtn=document.getElementById('micBtn');
this.exportBtn=document.getElementById('exportBtn');
this.saveMemoryBtn=document.getElementById('saveMemoryBtn');

// Memory tabs & list
this.settingsTabs=document.querySelectorAll('.settings-tab');
this.settingsPanels=document.querySelectorAll('.settings-panel');
this.memoryList=document.getElementById('memoryList');
this.memoryCount=document.getElementById('memoryCount');
this.autoMemoryToggle=document.getElementById('autoMemoryToggle');
this.clearAllMemoryBtn=document.getElementById('clearAllMemoryBtn');
}

initState(){
this.chats={};
this.memories=[];
this.currentChatId=null;
this.settings={
aiName:'DexTer',
personality:'phantom',
systemPrompt:'',
language:'id',
model:'claude-sonnet-4-6',
autoMemory:true
};
this.isLoading=false;
this.isExtractingMemory=false;
this.pendingFiles=[];
this.MAX_FILE_SIZE=4*1024*1024;
this.MAX_MEMORIES=30;
this.recognition=null;
this.isRecording=false;
}

initEvents(){
// Send
if(this.sendBtn)this.sendBtn.addEventListener('click',()=>this.sendMessage());
if(this.messageInput){
this.messageInput.addEventListener('keydown',(e)=>{
if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this.sendMessage();}
});
this.messageInput.addEventListener('input',()=>{
this.updateCharCount();
this.updateSendButton();
this.autoResize();
});
this.messageInput.addEventListener('paste',(e)=>this.handlePaste(e));
}

// File
if(this.attachBtn&&this.fileInput)this.attachBtn.addEventListener('click',()=>this.fileInput.click());
if(this.fileInput)this.fileInput.addEventListener('change',(e)=>this.handleFileSelect(e));

// Model
if(this.modelSelect)this.modelSelect.addEventListener('change',(e)=>{
this.settings.model=e.target.value;
this.saveData();
this.showToast('<i class="fas fa-robot"></i> Model: '+e.target.options[e.target.selectedIndex].text);
});

// Ref panel
if(this.refBtn)this.refBtn.addEventListener('click',()=>this.toggleRefPanel());
if(this.closeRefBtn)this.closeRefBtn.addEventListener('click',()=>this.closeRefPanel());
if(this.refOverlay)this.refOverlay.addEventListener('click',()=>this.closeRefPanel());

// Sidebar
if(this.menuBtn)this.menuBtn.addEventListener('click',()=>this.toggleSidebar());
if(this.closeSidebarBtn)this.closeSidebarBtn.addEventListener('click',()=>this.closeSidebar());
if(this.sidebarOverlay)this.sidebarOverlay.addEventListener('click',()=>this.closeSidebar());
if(this.newChatBtn)this.newChatBtn.addEventListener('click',()=>{this.newChat();this.closeSidebar();});
if(this.clearAllBtn)this.clearAllBtn.addEventListener('click',()=>this.clearAllChats());
if(this.settingsBtn)this.settingsBtn.addEventListener('click',()=>{this.openSettings();this.closeSidebar();});

// Settings modal
if(this.closeSettingsBtn)this.closeSettingsBtn.addEventListener('click',()=>this.closeSettings());
if(this.settingsOverlay)this.settingsOverlay.addEventListener('click',()=>this.closeSettings());
if(this.saveSettingsBtn)this.saveSettingsBtn.addEventListener('click',()=>this.saveSettings());
if(this.resetSettingsBtn)this.resetSettingsBtn.addEventListener('click',()=>this.resetSettings());
if(this.aiPersonalitySelect)this.aiPersonalitySelect.addEventListener('change',(e)=>{
if(e.target.value!=='custom'&&this.aiSystemPromptInput)this.aiSystemPromptInput.value='';
});

// Settings tabs
if(this.settingsTabs){
this.settingsTabs.forEach(tab=>{
tab.addEventListener('click',()=>{
this.settingsTabs.forEach(t=>t.classList.remove('active'));
this.settingsPanels.forEach(p=>p.classList.remove('active'));
tab.classList.add('active');
const panel=document.getElementById(tab.dataset.panel);
if(panel)panel.classList.add('active');
});
});
}

// Memory controls
if(this.autoMemoryToggle){
this.autoMemoryToggle.addEventListener('change',(e)=>{
this.settings.autoMemory=e.target.checked;
this.saveData();
this.showToast('<i class="fas fa-brain"></i> Auto-memory: '+(e.target.checked?'ON':'OFF'));
});
}
if(this.clearAllMemoryBtn){
this.clearAllMemoryBtn.addEventListener('click',()=>{
if(!confirm('Hapus SEMUA memory? AI akan lupa semua yang pernah diingat.'))return;
this.memories=[];
this.saveData();
this.renderMemoryList();
this.showToast('<i class="fas fa-brain"></i> Semua memory dihapus');
});
}

// Save Memory button (manual)
if(this.saveMemoryBtn){
this.saveMemoryBtn.addEventListener('click',()=>this.manualSaveMemory());
}

// Voice
if(this.micBtn && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)){
try{
const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
this.recognition=new SpeechRecognition();
this.recognition.continuous=false;
this.recognition.interimResults=true;

this.recognition.onresult=(e)=>{
let transcript='';
for(let i=e.resultIndex;i<e.results.length;i++)transcript+=e.results[i][0].transcript;
if(this.messageInput){this.messageInput.value=transcript;this.updateSendButton();this.autoResize();}
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
this.showToast('<i class="fas fa-microphone"></i> Mendengarkan...');
}
});
}catch(err){console.warn('Voice not available:',err);this.micBtn.style.display='none';}
}else if(this.micBtn){this.micBtn.style.display='none';}

// Export
if(this.exportBtn){
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
if(!m||!m.content)return;
const role=m.role==='user'?'**[JOKER]**':'**['+this.settings.aiName.toUpperCase()+']**';
md+=role+'\n\n'+m.content+'\n\n---\n\n';
});
const blob=new Blob([md],{type:'text/markdown;charset=utf-8'});
const url=URL.createObjectURL(blob);
const a=document.createElement('a');
a.href=url;
a.download='Mission_Log_'+chat.title.replace(/[^a-z0-9]/gi,'_')+'_'+Date.now()+'.md';
document.body.appendChild(a);a.click();a.remove();
URL.revokeObjectURL(url);
this.showToast('<i class="fas fa-check"></i> Mission Log diamankan!');
});
}
}

initUI(){
if(this.modelSelect)this.modelSelect.value=this.settings.model;
this.updateAINameDisplay();
this.renderChatList();
this.renderMemoryList();

if(Object.keys(this.chats).length===0){
this.newChat(false);
}else{
const lastChat=Object.values(this.chats).sort((a,b)=>b.updatedAt-a.updatedAt)[0];
if(lastChat)this.switchChat(lastChat.id);
}
this.attachSuggestionListeners();
}

loadData(){
try{
const saved=localStorage.getItem('dexter_chats');
if(saved)this.chats=JSON.parse(saved)||{};
const memSaved=localStorage.getItem('dexter_memories');
if(memSaved)this.memories=JSON.parse(memSaved)||[];
const settings=localStorage.getItem('dexter_settings');
if(settings)this.settings={...this.settings,...JSON.parse(settings)};
}catch(e){console.error('Load error:',e);}
}

saveData(){
try{
localStorage.setItem('dexter_chats',JSON.stringify(this.chats));
localStorage.setItem('dexter_memories',JSON.stringify(this.memories));
localStorage.setItem('dexter_settings',JSON.stringify(this.settings));
}catch(e){console.error('Save error:',e);}
}

// === CHAT MANAGEMENT ===
newChat(showToast=true){
const id='chat_'+Date.now()+'_'+Math.random().toString(36).substring(2,8);
this.chats[id]={id:id,title:'Chat Baru',messages:[],references:[],createdAt:Date.now(),updatedAt:Date.now()};
this.saveData();
this.renderChatList();
this.switchChat(id);
if(showToast)this.showToast('<i class="fas fa-plus"></i> Chat baru dibuat!');
}

switchChat(id){
if(!this.chats[id])return;
this.currentChatId=id;
const chat=this.chats[id];
if(!this.chatContainer)return;
this.chatContainer.innerHTML='';
if(chat.messages.length===0){
this.renderWelcome();
}else{
chat.messages.forEach(m=>{
if(!m||!m.content)return;
if(m.role==='user'){this.addMessage('user',m.content,m.files||[]);}
else{const{cleanReply,references}=this.extractReferences(m.content);this.addMessage('assistant',cleanReply,[],references);}
});
}
this.renderChatList();
this.scrollToBottom();
}

deleteChat(id,fromEvent){
if(fromEvent)fromEvent.stopPropagation();
if(!this.chats[id])return;
if(!confirm('Hapus "'+this.chats[id].title+'"?'))return;
delete this.chats[id];
this.saveData();
if(this.currentChatId===id){
const remaining=Object.keys(this.chats);
if(remaining.length>0)this.switchChat(remaining[remaining.length-1]);
else this.newChat(false);
}
this.renderChatList();
this.showToast('<i class="fas fa-trash"></i> Chat dihapus');
}

clearAllChats(){
if(!confirm('Hapus SEMUA chat?'))return;
this.chats={};
this.saveData();
this.newChat(false);
this.showToast('<i class="fas fa-broom"></i> Semua chat dihapus');
}

renderChatList(){
if(!this.chatList)return;
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
item.addEventListener('click',()=>{this.switchChat(item.dataset.id);if(window.innerWidth<=768)this.closeSidebar();});
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

toggleSidebar(){if(this.sidebar)this.sidebar.classList.toggle('open');if(this.sidebarOverlay)this.sidebarOverlay.classList.toggle('open');}
closeSidebar(){if(this.sidebar)this.sidebar.classList.remove('open');if(this.sidebarOverlay)this.sidebarOverlay.classList.remove('open');}

// === SETTINGS ===
openSettings(){
if(this.aiNameInput)this.aiNameInput.value=this.settings.aiName;
if(this.aiPersonalitySelect)this.aiPersonalitySelect.value=this.settings.personality;
if(this.aiSystemPromptInput)this.aiSystemPromptInput.value=this.settings.systemPrompt;
if(this.aiLanguageSelect)this.aiLanguageSelect.value=this.settings.language;
if(this.autoMemoryToggle)this.autoMemoryToggle.checked=this.settings.autoMemory!==false;
this.renderMemoryList();
if(this.settingsModal)this.settingsModal.classList.add('open');
if(this.settingsOverlay)this.settingsOverlay.classList.add('open');
}
closeSettings(){if(this.settingsModal)this.settingsModal.classList.remove('open');if(this.settingsOverlay)this.settingsOverlay.classList.remove('open');}

saveSettings(){
if(this.aiNameInput)this.settings.aiName=this.aiNameInput.value.trim()||'DexTer';
if(this.aiPersonalitySelect)this.settings.personality=this.aiPersonalitySelect.value;
if(this.aiSystemPromptInput)this.settings.systemPrompt=this.aiSystemPromptInput.value.trim();
if(this.aiLanguageSelect)this.settings.language=this.aiLanguageSelect.value;
this.saveData();
this.updateAINameDisplay();
this.closeSettings();
this.showToast('<i class="fas fa-check"></i> Pengaturan disimpan!');
}

resetSettings(){
if(!confirm('Reset semua pengaturan ke default?'))return;
this.settings={aiName:'DexTer',personality:'phantom',systemPrompt:'',language:'id',model:this.settings.model,autoMemory:true};
if(this.aiNameInput)this.aiNameInput.value=this.settings.aiName;
if(this.aiPersonalitySelect)this.aiPersonalitySelect.value=this.settings.personality;
if(this.aiSystemPromptInput)this.aiSystemPromptInput.value='';
if(this.aiLanguageSelect)this.aiLanguageSelect.value=this.settings.language;
this.showToast('<i class="fas fa-rotate-left"></i> Pengaturan direset');
}

updateAINameDisplay(){if(this.aiNameDisplay)this.aiNameDisplay.textContent=this.settings.aiName;}

// === MEMORY SYSTEM ===
renderMemoryList(){
if(!this.memoryList)return;
if(this.memoryCount)this.memoryCount.textContent=this.memories.length+'/'+this.MAX_MEMORIES;

if(this.memories.length===0){
this.memoryList.innerHTML='<div class="memory-empty"><i class="fas fa-brain"></i><p>Belum ada memory.</p><small>AI akan otomatis mengingat info penting dari percakapan, atau klik tombol 🧠 di header untuk simpan manual.</small></div>';
return;
}

let html='';
this.memories.slice().reverse().forEach(mem=>{
const date=new Date(mem.createdAt);
const dateStr=date.toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'});
html+='<div class="memory-item" data-id="'+mem.id+'"><div class="memory-item-header"><span class="memory-date"><i class="fas fa-calendar"></i> '+dateStr+'</span><button class="memory-delete" data-id="'+mem.id+'" title="Hapus"><i class="fas fa-trash"></i></button></div><div class="memory-content" contenteditable="true" data-id="'+mem.id+'">'+this.escapeHtml(mem.content)+'</div></div>';
});
this.memoryList.innerHTML=html;

// Edit on blur
this.memoryList.querySelectorAll('.memory-content').forEach(el=>{
el.addEventListener('blur',()=>{
const mem=this.memories.find(m=>m.id===el.dataset.id);
if(mem){
const newContent=el.textContent.trim();
if(newContent){mem.content=newContent;this.saveData();}
else{el.textContent=mem.content;}
}
});
});

// Delete
this.memoryList.querySelectorAll('.memory-delete').forEach(btn=>{
btn.addEventListener('click',(e)=>{
e.stopPropagation();
const id=btn.dataset.id;
this.memories=this.memories.filter(m=>m.id!==id);
this.saveData();
this.renderMemoryList();
this.showToast('<i class="fas fa-trash"></i> Memory dihapus');
});
});
}

addMemory(content,source='manual'){
if(!content||content.trim().length<5)return false;
if(this.memories.length>=this.MAX_MEMORIES){
this.memories.shift(); // hapus memory terlama
}
this.memories.push({
id:'mem_'+Date.now()+'_'+Math.random().toString(36).substring(2,6),
content:content.trim(),
source:source,
createdAt:Date.now()
});
this.saveData();
return true;
}

async manualSaveMemory(){
const chat=this.chats[this.currentChatId];
if(!chat||chat.messages.length<2){
this.showToast('<i class="fas fa-exclamation-triangle"></i> Chat terlalu pendek untuk diingat');
return;
}
this.showToast('<i class="fas fa-brain"></i> Extracting memory...');
await this.extractMemoryFromChat(chat);
}

async extractMemoryFromChat(chat){
if(this.isExtractingMemory)return;
if(!chat||chat.messages.length<4)return;
this.isExtractingMemory=true;

try{
// Build conversation summary
const convoText=chat.messages.slice(0,10).map(m=>{
if(!m||!m.content)return '';
return (m.role==='user'?'User: ':'AI: ')+m.content.substring(0,300);
}).filter(x=>x).join('\n');

const extractionPrompt=`Analisis percakapan berikut dan ekstrak INFORMASI PENTING tentang user yang layak diingat untuk percakapan masa depan.

ATURAN:
- Hanya ekstrak fakta objektif (nama, preferensi, pekerjaan, hobi, skill, goals, dll)
- JANGAN ekstrak pertanyaan atau permintaan spesifik
- Buat 1-3 poin memory, masing-masing max 100 karakter
- Format: satu baris per memory, tanpa bullet/number
- Jika tidak ada info penting yang layak diingat, balas dengan kata "NONE"

PERCAKAPAN:
${convoText}

MEMORY (tulis langsung, tanpa label):`;

const response=await puter.ai.chat([
{role:'user',content:extractionPrompt}
],{model:'claude-haiku-4-5',stream:false});

let result='';
if(response?.message?.content){
result=typeof response.message.content==='string'?response.message.content:(response.message.content[0]?.text||'');
}else if(response?.text){
result=response.text;
}

result=(result||'').trim();

if(!result||result.toUpperCase().includes('NONE')||result.length<5){
this.showToast('<i class="fas fa-brain"></i> Tidak ada info penting untuk diingat');
}else{
const lines=result.split('\n').map(l=>l.trim()).filter(l=>l&&l.length>=5&&l.length<=200);
let added=0;
lines.slice(0,3).forEach(line=>{
// Hapus bullet/number prefix
const clean=line.replace(/^[-*•\d.)]+\s*/,'').trim();
if(clean&&this.addMemory(clean,'auto-'+chat.id))added++;
});
if(added>0){
this.showToast('<i class="fas fa-brain"></i> '+added+' memory baru disimpan!');
this.renderMemoryList();
}
}
}catch(err){
console.error('Memory extraction error:',err);
}finally{
this.isExtractingMemory=false;
}
}

getMemoryContext(){
if(this.memories.length===0)return '';
const recent=this.memories.slice(-15);
let ctx='\n\n=== INGATAN TENTANG USER (gunakan jika relevan) ===\n';
recent.forEach((m,i)=>{ctx+=(i+1)+'. '+m.content+'\n';});
ctx+='=== AKHIR INGATAN ===\n';
return ctx;
}

getSystemPrompt(){
let prompt='';
if(this.settings.systemPrompt){
prompt=this.settings.systemPrompt.replace(/{name}/g,this.settings.aiName);
}else{
const p=PERSONALITIES[this.settings.personality]||PERSONALITIES.default;
prompt=p.prompt.replace(/{name}/g,this.settings.aiName);
}
if(this.settings.language==='id')prompt+='\n\nGunakan bahasa Indonesia.';
else if(this.settings.language==='en')prompt+='\n\nRespond in English.';
else if(this.settings.language==='jp')prompt+='\n\n日本語で回答してください。';

// Inject memory
prompt+=this.getMemoryContext();
return prompt;
}

// === FILE HANDLING ===
async handlePaste(e){
const items=e.clipboardData?.items;
if(!items)return;
for(const item of items){
if(item.kind==='file'){e.preventDefault();const file=item.getAsFile();if(file)await this.addFile(file);}
}
}
async handleFileSelect(e){
const files=Array.from(e.target.files||[]);
for(const file of files)await this.addFile(file);
if(this.fileInput)this.fileInput.value='';
}
async addFile(file){
if(file.size>this.MAX_FILE_SIZE){this.showToast('❌ File terlalu besar (max 4MB)');return;}
if(this.pendingFiles.length>=5){this.showToast('❌ Maksimal 5 file');return;}
try{
const content=await this.readFile(file);
this.pendingFiles.push({name:file.name,type:file.type||'application/octet-stream',size:file.size,content:content});
this.renderFilePreview();this.updateSendButton();
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
if(!this.filePreviewArea)return;
if(this.pendingFiles.length===0){this.filePreviewArea.style.display='none';this.filePreviewArea.innerHTML='';return;}
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
this.renderFilePreview();this.updateSendButton();
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

// === UI ===
autoResize(){if(!this.messageInput)return;this.messageInput.style.height='auto';this.messageInput.style.height=Math.min(this.messageInput.scrollHeight,100)+'px';}
updateCharCount(){if(this.charCount&&this.messageInput)this.charCount.textContent=this.messageInput.value.length+'/5000';}
updateSendButton(){if(this.sendBtn&&this.messageInput)this.sendBtn.disabled=(this.messageInput.value.trim()===''&&this.pendingFiles.length===0)||this.isLoading;}
toggleRefPanel(){if(this.refPanel)this.refPanel.classList.toggle('open');if(this.refOverlay)this.refOverlay.classList.toggle('open');}
closeRefPanel(){if(this.refPanel)this.refPanel.classList.remove('open');if(this.refOverlay)this.refOverlay.classList.remove('open');}

showToast(msg){
if(!this.toast)return;
this.toast.innerHTML=msg;
this.toast.classList.add('show');
clearTimeout(this.toastTimer);
this.toastTimer=setTimeout(()=>{if(this.toast)this.toast.classList.remove('show');},2800);
}
scrollToBottom(){if(!this.chatContainer)return;setTimeout(()=>{this.chatContainer.scrollTop=this.chatContainer.scrollHeight;},50);}

renderWelcome(){
if(!this.chatContainer)return;
const name=this.settings.aiName;
const memCount=this.memories.length;
const memInfo=memCount>0?'<div style="margin-top:10px;font-size:12px;color:var(--p5-gold)"><i class="fas fa-brain"></i> '+name+' mengingat '+memCount+' hal tentangmu</div>':'';
this.chatContainer.innerHTML='<div class="welcome-message"><div class="welcome-mask">🎭</div><div class="welcome-tag">SHOW TIME!</div><h2>'+name+' siap beraksi!</h2><p>Ketik pesan untuk memulai pencurian hati dengan jawaban'+memInfo+'</p><div class="suggestions"><button class="suggestion-btn" data-msg="Tuliskan kode Python lengkap untuk membuat web scraper dengan BeautifulSoup"><i class="fas fa-code"></i><span>Web scraper Python</span></button><button class="suggestion-btn" data-msg="Analisis file yang akan saya upload"><i class="fas fa-file-arrow-up"></i><span>Analisis file</span></button><button class="suggestion-btn" data-msg="Tulis cerita pendek sci-fi tentang AI"><i class="fas fa-pen-nib"></i><span>Cerita sci-fi</span></button><button class="suggestion-btn" data-msg="Jelaskan quantum computing dengan detail"><i class="fas fa-lightbulb"></i><span>Quantum computing</span></button></div></div>';
this.attachSuggestionListeners();
}

attachSuggestionListeners(){
document.querySelectorAll('.suggestion-btn').forEach(btn=>{
btn.addEventListener('click',()=>{
const msg=btn.getAttribute('data-msg');
if(this.messageInput&&msg){this.messageInput.value=msg;this.updateSendButton();this.sendMessage();}
});
});
}

createStreamingMessage(){
if(!this.chatContainer)return null;
const messageDiv=document.createElement('div');
messageDiv.className='message message-assistant';
const contentDiv=document.createElement('div');
contentDiv.className='message-content';
contentDiv.innerHTML='<p><span class="streaming-text"></span><span class="streaming-cursor"></span></p>';
messageDiv.appendChild(contentDiv);
this.chatContainer.appendChild(messageDiv);
return{div:messageDiv,contentDiv:contentDiv,textSpan:contentDiv.querySelector('.streaming-text')};
}

// === SEND MESSAGE (FIXED) ===
async sendMessage(){
if(!this.messageInput)return;
const message=this.messageInput.value.trim();
const files=[...this.pendingFiles];
if((!message&&files.length===0)||this.isLoading)return;

const welcome=this.chatContainer?.querySelector('.welcome-message');
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

// 🔧 FIX: Filter messages yang valid (punya content)
const validHistory=history
.filter(m=>m && typeof m.content==='string' && m.content.length>0)
.slice(-20)
.map(m=>({role:m.role==='assistant'?'assistant':'user',content:m.content}));

const promptMessages=[
{role:'user',content:'[SYSTEM]\n'+systemPrompt+'\n[/SYSTEM]\n\nAcknowledge.'},
{role:'assistant',content:'Dimengerti. Saya '+this.settings.aiName+', siap membantu.'},
...validHistory,
{role:'user',content:userContent}
];

// 🔧 Validasi final: pastikan semua punya content
const safeMessages=promptMessages.filter(m=>m && m.role && typeof m.content==='string' && m.content.length>0);

const model=this.settings.model;
const streamingMsg=this.createStreamingMessage();
if(!streamingMsg){this.isLoading=false;return;}

try{
const response=await puter.ai.chat(safeMessages,{model:model,stream:true});
let accumulated='';
for await(const part of response){
const text=part?.text||'';
if(text){
accumulated+=text;
if(streamingMsg.textSpan)streamingMsg.textSpan.textContent=accumulated;
this.scrollToBottom();
}
}

const{cleanReply,references}=this.extractReferences(accumulated);
if(streamingMsg.contentDiv)streamingMsg.contentDiv.innerHTML=this.formatMessage(cleanReply);

if(references.length>0&&streamingMsg.contentDiv){
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
this.chats[this.currentChatId].messages.push({role:'assistant',content:accumulated||'',timestamp:Date.now()});
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

// 🧠 Auto-extract memory setelah 6+ messages
const msgCount=this.chats[this.currentChatId].messages.length;
if(this.settings.autoMemory!==false && msgCount===6){
setTimeout(()=>this.extractMemoryFromChat(this.chats[this.currentChatId]),1000);
}
}

this.scrollToBottom();
}catch(error){
console.error('Error:',error);
if(streamingMsg.div)streamingMsg.div.remove();
this.addMessage('assistant','❌ Error: '+(error.message||'Unknown error')+'\n\n💡 Tips: Coba model lain atau kirim pesan lebih pendek.');
}finally{
this.isLoading=false;
this.updateSendButton();
}
}

updateRefBadge(){
const chat=this.chats[this.currentChatId];
const count=chat?.references?.length||0;
if(this.refBadge){this.refBadge.textContent=count;this.refBadge.style.display=count>0?'flex':'none';}
}

extractReferences(text){
const referenceRegex=/$$(\d+)$$\s*(https?:\/\/[^\s"'<>]+)\s*"?([^"\n]*)"?/g;
let references=[];
let cleanText=text;
let match;
while((match=referenceRegex.exec(text))!==null){
const[,number,url,title]=match;
references.push({number:parseInt(number),url:url,title:(title||url).replace(/["']/g,'').trim()});
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
if(!this.chatContainer||!content)return;
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
if(!container)return;
container.querySelectorAll('.code-block-wrapper').forEach(wrapper=>{
const ext=wrapper.dataset.ext;
const codeEl=wrapper.querySelector('code');
const copyBtn=wrapper.querySelector('.btn-copy');
const dlBtn=wrapper.querySelector('.btn-download');
if(copyBtn&&!copyBtn.dataset.bound){
copyBtn.dataset.bound='1';
copyBtn.addEventListener('click',async()=>{
try{await navigator.clipboard.writeText(codeEl.textContent);
copyBtn.innerHTML='<i class="fas fa-check"></i> Copied';copyBtn.classList.add('copied');
this.showToast('<i class="fas fa-check"></i> Kode berhasil dicopy!');
setTimeout(()=>{copyBtn.innerHTML='<i class="fas fa-copy"></i> Copy';copyBtn.classList.remove('copied');},2000);
}catch(err){
const ta=document.createElement('textarea');ta.value=codeEl.textContent;
document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();
this.showToast('<i class="fas fa-check"></i> Kode berhasil dicopy!');
}
});
}
if(dlBtn&&!dlBtn.dataset.bound){
dlBtn.dataset.bound='1';
dlBtn.addEventListener('click',()=>{
const blob=new Blob([codeEl.textContent],{type:'text/plain;charset=utf-8'});
const url=URL.createObjectURL(blob);
const a=document.createElement('a');a.href=url;
a.download='dexter_code_'+Date.now()+'.'+ext;
document.body.appendChild(a);a.click();document.body.removeChild(a);
URL.revokeObjectURL(url);
this.showToast('<i class="fas fa-download"></i> File didownload: '+a.download);
});
}
});
}
}

if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',()=>new DexTerChat());}
else{new DexTerChat();}
