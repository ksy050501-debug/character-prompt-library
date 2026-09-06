(()=>{
  const STORAGE_KEY='prompt_library_v1';
  const TAG_KEY='prompt_library_tags_v1';
  const $=s=>document.querySelector(s);

  function getItems(){
    try{const v=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(v)?v:[]}catch{return []}
  }
  function getCatalog(){
    let stored=[];
    try{const v=JSON.parse(localStorage.getItem(TAG_KEY));if(Array.isArray(v))stored=v.map(String)}catch{}
    const fromItems=getItems().flatMap(x=>Array.isArray(x.tags)?x.tags:[]).map(String);
    const tags=[...new Set([...stored,...fromItems].map(s=>s.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
    localStorage.setItem(TAG_KEY,JSON.stringify(tags));
    return tags;
  }
  function getTagCounts(){
    const counts=new Map(getCatalog().map(t=>[t,0]));
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
    const bar=$('#quickTagList'),source=$('#tagList');
    if(!bar||!source)return;
    const buttons=[...source.querySelectorAll('[data-tag]')];
    const hasActive=buttons.some(b=>b.classList.contains('active'));
    const active=buttons.find(b=>b.classList.contains('active'))?.dataset.tag||'';
    const used=getTagCounts().filter(([,count])=>count>0);
    bar.innerHTML=`<button class="chip quick-tag ${!hasActive?'active':''}" data-quick-all="1">전체</button>`+
      used.map(([tag,count])=>`<button class="chip quick-tag ${active===tag?'active':''}" data-quick-tag="${esc(tag)}">${esc(tag)} · ${count}</button>`).join('');
  }
  function renderEditorTags(){
    const wrap=$('#existingTagList'),input=$('#tags');
    if(!wrap||!input)return;
    const selected=new Set(input.value.split(',').map(s=>s.trim()).filter(Boolean));
    const tags=getTagCounts();
    wrap.innerHTML=tags.length
      ?tags.map(([tag,count])=>`<button type="button" class="chip editor-tag ${selected.has(tag)?'active':''}" data-editor-tag="${esc(tag)}">${esc(tag)}${count?` · ${count}`:''}</button>`).join('')
      :'<span class="help">아직 만들어진 태그가 없습니다.</span>';
  }
  function toggleEditorTag(tag){
    const input=$('#tags');if(!input)return;
    const set=new Set(input.value.split(',').map(s=>s.trim()).filter(Boolean));
    set.has(tag)?set.delete(tag):set.add(tag);
    input.value=[...set].join(', ');
    input.dispatchEvent(new Event('input',{bubbles:true}));
    renderEditorTags();
  }
  document.addEventListener('click',e=>{
    const quick=e.target.closest('[data-quick-tag]');
    if(quick){
      const original=[...document.querySelectorAll('#tagList [data-tag]')].find(b=>b.dataset.tag===quick.dataset.quickTag);
      if(original)original.click();
      return;
    }
    if(e.target.closest('[data-quick-all]')){$('#clearTag')?.click();return}
    const editorTag=e.target.closest('[data-editor-tag]');
    if(editorTag)toggleEditorTag(editorTag.dataset.editorTag);
  });
  $('#tags')?.addEventListener('input',renderEditorTags);
  const tagList=$('#tagList');
  if(tagList)new MutationObserver(syncQuickTags).observe(tagList,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  const editor=$('#editor');
  if(editor)new MutationObserver(()=>{if(editor.open)setTimeout(renderEditorTags,0)}).observe(editor,{attributes:true,attributeFilter:['open']});
  window.addEventListener('storage',()=>{syncQuickTags();renderEditorTags()});
  setTimeout(()=>{syncQuickTags();renderEditorTags()},0);
})();