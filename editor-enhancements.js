(()=>{
  const MAX=2000;
  const editor=document.querySelector('#editor');
  const content=document.querySelector('#content');
  const counter=document.querySelector('#contentCounter');
  const saveBtn=document.querySelector('#saveBtn');
  const closeBtn=document.querySelector('#editorClose');
  const cancelBtn=document.querySelector('#editorCancel');
  const viewer=document.querySelector('#viewer');
  const viewerToast=document.querySelector('#viewerToast');
  const globalToast=document.querySelector('#toast');

  function updateCount(){
    if(!content||!counter||!saveBtn)return;
    const n=content.value.length;
    const over=n>MAX;
    counter.textContent=`${n}/${MAX}`;
    counter.classList.toggle('over',over);
    content.classList.toggle('over-limit',over);
    content.setAttribute('aria-invalid',over?'true':'false');
    saveBtn.disabled=over;
    saveBtn.title=over?'본문은 2000자 이하로 줄여야 저장할 수 있습니다.':'';
  }

  function closeEditor(){
    if(editor?.open) editor.close('cancel');
  }

  content?.addEventListener('input',updateCount);
  closeBtn?.addEventListener('click',closeEditor);
  cancelBtn?.addEventListener('click',closeEditor);

  saveBtn?.addEventListener('click',e=>{
    if((content?.value.length||0)>MAX){
      e.preventDefault();
      e.stopImmediatePropagation();
      updateCount();
    }
  },true);

  if(editor){
    new MutationObserver(()=>{if(editor.open)setTimeout(updateCount,0)}).observe(editor,{attributes:true,attributeFilter:['open']});
  }

  let toastTimer;
  function mirrorToast(){
    if(!viewer?.open||!viewerToast||!globalToast?.classList.contains('show'))return;
    const msg=globalToast.textContent.trim();
    if(!msg)return;
    viewerToast.textContent=msg;
    viewerToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>viewerToast.classList.remove('show'),1500);
  }
  if(globalToast){
    new MutationObserver(mirrorToast).observe(globalToast,{attributes:true,childList:true,characterData:true,subtree:true,attributeFilter:['class']});
  }
  viewer?.addEventListener('close',()=>viewerToast?.classList.remove('show'));
  updateCount();
})();