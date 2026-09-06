(()=>{
  const STORAGE_KEY='prompt_library_v1';
  const $=s=>document.querySelector(s);

  function getItems(){
    try{
      const v=JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(v)?v:[];
    }catch{return []}
  }

  function getTagCounts(){
    const counts=new Map();
    getItems().forEach(item=>(item.tags||[]).forEach(tag=>{
      const t=String(tag).trim();
      if(t) counts.set(t,(counts.get(t)||0)+1);
    }));
    return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0],'ko'));
  }

  function esc(s=''){
    return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function syncQuickTags(){
    const bar=$('#quickTagList');
    const source=$('#tagList');
    if(!bar||!source) return;
    const buttons=[...source.querySelectorAll('[data-tag]')];
    const hasActive=buttons.some(b=>b.classList.contains('active'));
    bar.innerHTML=`<button class="chip quick-tag ${!hasActive?'active':''}" data-quick-all="1">전체</button>`+
      buttons.map(b=>`<button class="chip quick-tag ${b.classList.contains('active')?'active':''}" data-quick-tag="${esc(b.dataset.tag)}">${esc(b.textContent)}</button>`).join('');
  }

  function renderEditorTags(){
    const wrap=$('#existingTagList');
    const input=$('#tags');
    if(!wrap||!input) return;
    const selected=new Set(input.value.split(',').map(s=>s.trim()).filter(Boolean));
    const tags=getTagCounts();
    wrap.innerHTML=tags.length
      ?tags.map(([tag,count])=>`<button type="button" class="chip editor-tag ${selected.has(tag)?'active':''}" data-editor-tag="${esc(tag)}">${esc(tag)} · ${count}</button>`).join('')
      :'<span class="help">아직 만들어진 태그가 없습니다.</span>';
  }

  function toggleEditorTag(tag){
    const input=$('#tags');
    if(!input) return;
    const tags=input.value.split(',').map(s=>s.trim()).filter(Boolean);
    const set=new Set(tags);
    if(set.has(tag)) set.delete(tag); else set.add(tag);
    input.value=[...set].join(', ');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    renderEditorTags();
  }

  document.addEventListener('click',e=>{
    const quick=e.target.closest('[data-quick-tag]');
    if(quick){
      const tag=quick.dataset.quickTag;
      const original=[...document.querySelectorAll('#tagList [data-tag]')].find(b=>b.dataset.tag===tag);
      if(original) original.click();
      return;
    }
    if(e.target.closest('[data-quick-all]')){
      $('#clearTag')?.click();
      return;
    }
    const editorTag=e.target.closest('[data-editor-tag]');
    if(editorTag){
      toggleEditorTag(editorTag.dataset.editorTag);
    }
  });

  $('#tags')?.addEventListener('input',renderEditorTags);

  const tagList=$('#tagList');
  if(tagList){
    new MutationObserver(syncQuickTags).observe(tagList,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  }

  const editor=$('#editor');
  if(editor){
    new MutationObserver(()=>{if(editor.open) setTimeout(renderEditorTags,0)}).observe(editor,{attributes:true,attributeFilter:['open']});
  }

  window.addEventListener('storage',()=>{syncQuickTags();renderEditorTags()});
  setTimeout(()=>{syncQuickTags();renderEditorTags()},0);
})();