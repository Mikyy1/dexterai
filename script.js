class DexTerChat{
constructor(){
this.chatContainer=document.getElementById('chatContainer');
this.messageInput=document.getElementById('messageInput');
this.sendBtn=document.getElementById('sendBtn');
this.resetBtn=document.getElementById('resetBtn');
this.refBtn=document.getElementById('refBtn');
this.refPanel=document.getElementById('refPanel');
this.refOverlay=document.getElementById('refOverlay');
this.refList=document.getElementById('refList');
this.refBadge=document.getElementById('refBadge');
this.closeRefBtn=document.getElementById('closeRefBtn');
this.charCount=document.getElementById('charCount');
this.messages=[];
this.isLoading=false;
this.allReferences=[];
this.typingDiv=null;
this.init();
}

init(){
this.sendBtn.addEventListener('click',()=>this.sendMessage());
this.resetBtn.addEventListener('click',()=>this.resetChat());
this.refBtn.addEventListener('click',()=>this.toggleRefPanel());
this.closeRefBtn.addEventListener('click',()=>this.closeRefPanel());
this.refOverlay.addEventListener('click',()=>this.closeRefPanel());
this.messageInput.addEventListener('keydown',(e)=>{
if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this.sendMessage();}
});
this.messageInput.addEventListener('input',()=>{
this.updateCharCount();
this.updateSendButton();
this.autoResize();
});
this.attachSuggestionListeners();
this.messageInput.focus();
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

autoResize(){
this.messageInput.style.height='auto';
this.messageInput.style.height=Math.min(this.messageInput.scrollHeight,100)+'px';
}

updateCharCount(){this.charCount.textContent=this.messageInput.value.length+'/2000';}
updateSendButton(){this.sendBtn.disabled=this.messageInput.value.trim()===''||this.isLoading;}

toggleRefPanel(){
this.refPanel.classList.toggle('open');
this.refOverlay.classList.toggle('open');
}

closeRefPanel(){
this.refPanel.classList.remove('open');
this.refOverlay.classList.remove('open');
}

showTypingIndicator(){
this.hideTypingIndicator();
const wrapper=document.createElement('div');
wrapper.className='message message-assistant typing-wrapper';
wrapper.innerHTML='<div class="message-content"><div class="typing-indicator"><div class="dot"></div><div class="dot"></div><div class="dot"></div><span class="typing-label">DexTerAi sedang mengetik...</span></div></div>';
this.chatContainer.appendChild(wrapper);
this.typingDiv=wrapper;
this.scrollToBottom();
}

hideTypingIndicator(){
if(this.typingDiv){
this.typingDiv.remove();
this.typingDiv=null;
}
}

scrollToBottom(){
setTimeout(()=>{
this.chatContainer.scrollTop=this.chatContainer.scrollHeight;
},50);
}

async sendMessage(){
const message=this.messageInput.value.trim();
if(!message||this.isLoading)return;
const welcome=this.chatContainer.querySelector('.welcome-message');
if(welcome)welcome.remove();
this.addMessage('user',message);
this.messageInput.value='';
this.updateCharCount();
this.updateSendButton();
this.messageInput.style.height='auto';

this.isLoading=true;
this.showTypingIndicator();

try{
const response=await fetch('/api/chat',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({message:message,history:this.messages})
});
const contentType=response.headers.get('content-type')||'';
if(!contentType.includes('application/json')){
const text=await response.text();
throw new Error('API tidak tersedia');
}
const result=await response.json();
this.hideTypingIndicator();
if(result.success){
const{cleanReply,references}=this.extractReferences(result.data.reply);
this.addMessage('assistant',cleanReply,references);
if(references.length>0){
references.forEach(r=>{
const existingNum=this.allReferences.find(x=>x.number===r.number);
if(!existingNum)this.allReferences.push(r);
});
this.updateRefPanel();
}
this.messages=result.data.messages;
}else{
this.addMessage('assistant','❌ Error: '+(result.error||'Unknown error'));
}
}catch(error){
this.hideTypingIndicator();
this.addMessage('assistant','❌ Gagal terhubung: '+error.message);
}finally{
this.isLoading=false;
this.updateSendButton();
}
}

extractReferences(text){
const referenceRegex=/$$(\d+)$$\s*(https?:\/\/[^\s"'<>]+)\s*"?([^"\n]*)"?/g;
let references=[];
let cleanText=text;
let match;
while((match=referenceRegex.exec(text))!==null){
const[,number,url,title]=match;
const cleanTitle=(title||url).replace(/["']/g,'').trim();
references.push({
number:parseInt(number),
url:url,
title:cleanTitle||url
});
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
cleanText=cleanText.replace(/\n\s*\n/g,'\n\n').trim();
return{cleanReply:cleanText,references};
}

addMessage(role,content,references=[]){
const messageDiv=document.createElement('div');
messageDiv.className='message message-'+role;
const contentDiv=document.createElement('div');
contentDiv.className='message-content';
contentDiv.innerHTML=this.formatMessage(content);
if(references.length>0){
const referencesDiv=document.createElement('div');
referencesDiv.className='references';
let refsHTML='<div class="references-title"><i class="fas fa-book"></i> Referensi</div>';
references.forEach(ref=>{
refsHTML+='<div class="reference-item" onclick="window.open(\''+ref.url+'\',\'_blank\')"><div class="reference-number">'+ref.number+'</div><div class="reference-content"><a href="'+ref.url+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+this.escapeHtml(ref.title)+'</a><div class="ref-url">'+this.escapeHtml(this.truncateUrl(ref.url))+'</div></div></div>';
});
referencesDiv.innerHTML=refsHTML;
contentDiv.appendChild(referencesDiv);
}
messageDiv.appendChild(contentDiv);
this.chatContainer.appendChild(messageDiv);
this.scrollToBottom();
}

truncateUrl(url){
try{
const u=new URL(url);
return u.hostname+(u.pathname.length>1?u.pathname.substring(0,25)+'...':'');
}catch(e){return url.substring(0,35);}
}

escapeHtml(text){
const div=document.createElement('div');
div.textContent=text;
return div.innerHTML;
}

formatMessage(text){
text=text.replace(/```([\s\S]*?)```/g,'<pre><code>$1</code></pre>');
text=text.replace(/`([^`]+)`/g,'<code>$1</code>');
text=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
text=text.replace(/\*(.*?)\*/g,'<em>$1</em>');
text=text.replace(/\n/g,'<br>');
return '<p>'+text+'</p>';
}

updateRefPanel(){
this.refBadge.textContent=this.allReferences.length;
if(this.allReferences.length>0){
this.refBadge.style.display='flex';
}else{
this.refBadge.style.display='none';
}
if(this.allReferences.length===0){
this.refList.innerHTML='<p class="ref-empty"><i class="fas fa-inbox"></i><br>Belum ada referensi. Mulai chat untuk melihat referensi.</p>';
return;
}
let html='';
this.allReferences.forEach(ref=>{
html+='<div class="reference-item" onclick="window.open(\''+ref.url+'\',\'_blank\')"><div class="reference-number">'+ref.number+'</div><div class="reference-content"><a href="'+ref.url+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+this.escapeHtml(ref.title)+'</a><div class="ref-url">'+this.escapeHtml(this.truncateUrl(ref.url))+'</div></div></div>';
});
this.refList.innerHTML=html;
}

resetChat(){
if(confirm('Reset semua chat?')){
this.messages=[];
this.allReferences=[];
this.updateRefPanel();
this.chatContainer.innerHTML='<div class="welcome-message"><div class="welcome-icon">✨</div><h2>Chat Direset!</h2><p>Mulai percakapan baru</p><div class="suggestions"><button class="suggestion-btn" data-msg="Jelaskan tentang quantum computing"><i class="fas fa-lightbulb"></i><span>Jelaskan quantum computing</span></button><button class="suggestion-btn" data-msg="Buatkan kode Python untuk web scraping"><i class="fas fa-code"></i><span>Bantu coding Python</span></button><button class="suggestion-btn" data-msg="Tulis puisi tentang teknologi"><i class="fas fa-pen-nib"></i><span>Tulis puisi teknologi</span></button></div></div>';
this.attachSuggestionListeners();
}
}
}
document.addEventListener('DOMContentLoaded',()=>{new DexTerChat();});
