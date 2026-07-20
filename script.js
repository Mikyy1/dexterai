class DexTerChat{
constructor(){
this.chatContainer=document.getElementById('chatContainer');
this.messageInput=document.getElementById('messageInput');
this.sendBtn=document.getElementById('sendBtn');
this.resetBtn=document.getElementById('resetBtn');
this.refBtn=document.getElementById('refBtn');
this.refPanel=document.getElementById('refPanel');
this.refList=document.getElementById('refList');
this.closeRefBtn=document.getElementById('closeRefBtn');
this.loadingOverlay=document.getElementById('loadingOverlay');
this.charCount=document.getElementById('charCount');
this.messages=[];
this.isLoading=false;
this.allReferences=[];
this.init();
}

init(){
this.sendBtn.addEventListener('click',()=>this.sendMessage());
this.resetBtn.addEventListener('click',()=>this.resetChat());
this.refBtn.addEventListener('click',()=>this.toggleRefPanel());
this.closeRefBtn.addEventListener('click',()=>this.refPanel.classList.remove('open'));
this.messageInput.addEventListener('keydown',(e)=>{
if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();this.sendMessage();}
});
this.messageInput.addEventListener('input',()=>{
this.updateCharCount();
this.updateSendButton();
this.autoResize();
});
document.querySelectorAll('.suggestion-btn').forEach(btn=>{
btn.addEventListener('click',()=>{
this.messageInput.value=btn.getAttribute('data-msg');
this.updateSendButton();
this.sendMessage();
});
});
this.messageInput.focus();
}

autoResize(){
this.messageInput.style.height='auto';
this.messageInput.style.height=Math.min(this.messageInput.scrollHeight,120)+'px';
}

updateCharCount(){this.charCount.textContent=this.messageInput.value.length+'/2000';}
updateSendButton(){this.sendBtn.disabled=this.messageInput.value.trim()===''||this.isLoading;}
toggleRefPanel(){this.refPanel.classList.toggle('open');}

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
this.showLoading(true);
try{
const response=await fetch('/api/chat',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({message:message,history:this.messages})
});
const contentType=response.headers.get('content-type')||'';
if(!contentType.includes('application/json')){
const text=await response.text();
throw new Error('API tidak tersedia. Response: '+text.substring(0,100));
}
const result=await response.json();
if(result.success){
const{cleanReply,references}=this.extractReferences(result.data.reply);
this.addMessage('assistant',cleanReply,references);
if(references.length>0){
references.forEach(r=>this.allReferences.push(r));
this.updateRefPanel();
}
this.messages=result.data.messages;
}else{
this.addMessage('assistant','❌ Error: '+(result.error||'Unknown error'));
}
}catch(error){
this.addMessage('assistant','❌ Gagal terhubung: '+error.message);
}finally{
this.showLoading(false);
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
const inlineRefRegex=/$$(\d+)$$/g;
cleanText=cleanText.replace(inlineRefRegex,(m,num)=>{
const ref=references.find(r=>r.number===parseInt(num));
if(ref)return ' <a href="'+ref.url+'" target="_blank" class="inline-ref">'+num+'</a> ';
return m;
});
cleanText=cleanText.replace(/$$REF(\d+)$$/g,(m,num)=>{
return ' <a href="#" class="inline-ref" data-ref="'+num+'">'+num+'</a> ';
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
referencesDiv.innerHTML='<div class="references-title"><i class="fas fa-book"></i> Referensi</div>';
references.forEach(ref=>{
const refItem=document.createElement('div');
refItem.className='reference-item';
refItem.onclick=()=>window.open(ref.url,'_blank');
refItem.innerHTML='<div class="reference-number">'+ref.number+'</div><div class="reference-content"><a href="'+ref.url+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+this.escapeHtml(ref.title)+'</a><div class="ref-url">'+this.escapeHtml(this.truncateUrl(ref.url))+'</div></div>';
referencesDiv.appendChild(refItem);
});
contentDiv.appendChild(referencesDiv);
}
messageDiv.appendChild(contentDiv);
this.chatContainer.appendChild(messageDiv);
this.chatContainer.scrollTop=this.chatContainer.scrollHeight;
}

truncateUrl(url){
try{
const u=new URL(url);
return u.hostname+(u.pathname.length>1?u.pathname.substring(0,30):'');
}catch(e){return url.substring(0,40);}
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
if(this.allReferences.length===0){
this.refList.innerHTML='<p class="ref-empty">Belum ada referensi. Mulai chat untuk melihat referensi.</p>';
return;
}
this.refList.innerHTML='';
this.allReferences.forEach(ref=>{
const refItem=document.createElement('div');
refItem.className='reference-item';
refItem.onclick=()=>window.open(ref.url,'_blank');
refItem.innerHTML='<div class="reference-number">'+ref.number+'</div><div class="reference-content"><a href="'+ref.url+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+this.escapeHtml(ref.title)+'</a><div class="ref-url">'+this.escapeHtml(this.truncateUrl(ref.url))+'</div></div>';
this.refList.appendChild(refItem);
});
}

showLoading(show){
this.isLoading=show;
this.loadingOverlay.style.display=show?'flex':'none';
this.updateSendButton();
}

resetChat(){
if(confirm('Reset semua chat?')){
this.messages=[];
this.allReferences=[];
this.updateRefPanel();
this.chatContainer.innerHTML='<div class="welcome-message"><div class="welcome-icon">✨</div><h2>Chat Direset!</h2><p>Mulai percakapan baru</p><div class="suggestions"><button class="suggestion-btn" data-msg="Jelaskan tentang quantum computing dengan referensi"><i class="fas fa-lightbulb"></i> Jelaskan quantum computing</button><button class="suggestion-btn" data-msg="Buatkan kode Python untuk web scraping dengan referensi"><i class="fas fa-code"></i> Bantu coding Python</button><button class="suggestion-btn" data-msg="Tulis puisi tentang teknologi dengan referensi"><i class="fas fa-pen-nib"></i> Tulis puisi</button></div></div>';
this.chatContainer.querySelectorAll('.suggestion-btn').forEach(btn=>{
btn.addEventListener('click',()=>{
this.messageInput.value=btn.getAttribute('data-msg');
this.updateSendButton();
this.sendMessage();
});
});
}
}
}
document.addEventListener('DOMContentLoaded',()=>{new DexTerChat();});
