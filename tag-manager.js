(()=>{
  const DATA_KEY='prompt_library_v1';
  const TAG_KEY='prompt_library_tags_v1';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let draftItems=[];
  let draftTags=[];
  let selectedTag='';

  function readItems(){try{const v=JSON.parse(localStorage.getItem(DATA_KEY));return Array.isArray(v)?v:[]}catch{return []}}
  function readCatalog(){
    let stored=[];
    try{const v=JSON.parse(localStorage.getItem(TAG_KEY));if(Array.isArray(v))stored=v.map(String)}catch{}
    const fromItems=readItems().flatMap(x=>Array.isArray(x.tags)?x.tags:[]).map(String);
    return [...new Set([...stored,...fromItems].map(s=>s.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  }
  function persistCatalog(tags){localStorage.setItem(TAG_KEY,JSON.stringify([...new Set(tags)].sort((a,b)=>a.localeCompare(b,'ko'))))}
  function open(){
    draftItems=typeof structuredClone==='function'?structuredClone(readItems()):JSON.parse(JSON.stringify(readItems()));
    draftTags=readCatalog();
    selectedTag=draftTags[0]||'';
    render();
    $('#tagManager').showModal();
  }
  function counts(){
    const m=new Map(draftTags.map(t=>[t,0]));
    draftItems.forEach(x=>(x.tags||[]).forEach(t=>m.set(t,(m.get(t)||0)+1)));
    return m;
  }
  function render(){
    const c=counts();
    $('#manageTagList').innerHTML=draftTags.length?draftTags.map(t=>`<button type="button" class="manage-tag ${t===selectedTag?'active':''}" data-manage-tag="${esc(t)}"><span>${esc(t)}</span><small>${c.get(t)||0}</small></button>`).join(''):'<div class="help">태그가 없습니다. 위에서 새 태그를 추가하세요.</div>';
    $('#selectedTagName').textContent=selectedTag||'태그를 선택하세요';
    const q=$('#tagPromptSearch').value.trim().toLowerCase();
    const list=draftItems.filter(x=>!q||[x.title,x.content,...(x.tags||[])].join(' ').toLowerCase().includes(q));
    $('#tagPromptList').innerHTML=selectedTag?list.map(x=>{
      const on=(x.tags||[]).includes(selectedTag);
      return `<label class="prompt-check"><input type="checkbox" data-prompt-id="${esc(x.id)}" ${on?'checked':''}><span><b>${esc(x.title)}</b><small>${x.type==='situation'?'상황':'인물'}</small></span></label>`;
    }).join(''):'<div class="help" style="padding:14px">왼쪽에서 태그를 선택하세요.</div>';
    const total=draftItems.filter(x=>(x.tags||[]).includes(selectedTag)).length;
    $('#tagSelectionCount').textContent=selectedTag?`${total}개 프롬프트에 적용 중`:'';
  }
  function addTag(){
    const input=$('#newTagName'),tag=input.value.trim();
    if(!tag)return;
    if(draftTags.includes(tag)){selectedTag=tag;input.value='';render();return}
    draftTags.push(tag);draftTags.sort((a,b)=>a.localeCompare(b,'ko'));selectedTag=tag;input.value='';render();
  }
  function deleteSelected(){
    if(!selectedTag)return;
    if(!confirm(`태그 “${selectedTag}”을 삭제할까요?\n모든 프롬프트에서도 이 태그가 제거됩니다.`))return;
    const doomed=selectedTag;
    draftTags=draftTags.filter(t=>t!==doomed);
    draftItems.forEach(x=>x.tags=(x.tags||[]).filter(t=>t!==doomed));
    selectedTag=draftTags[0]||'';
    render();
  }
  function setAll(value){
    if(!selectedTag)return;
    const visible=[...document.querySelectorAll('#tagPromptList [data-prompt-id]')].map(el=>el.dataset.promptId);
    draftItems.forEach(x=>{
      if(!visible.includes(x.id))return;
      const set=new Set(x.tags||[]);
      value?set.add(selectedTag):set.delete(selectedTag);
      x.tags=[...set];
    });
    render();
  }
  function apply(){
    localStorage.setItem(DATA_KEY,JSON.stringify(draftItems));
    persistCatalog(draftTags);
    location.reload();
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#manageTagsBtn')){open();return}
    const tag=e.target.closest('[data-manage-tag]');if(tag){selectedTag=tag.dataset.manageTag;render();return}
    if(e.target.closest('#addManagedTag')){addTag();return}
    if(e.target.closest('#deleteManagedTag')){deleteSelected();return}
    if(e.target.closest('#selectAllPrompts')){setAll(true);return}
    if(e.target.closest('#clearAllPrompts')){setAll(false);return}
    if(e.target.closest('#applyTagManager')){apply();return}
    if(e.target.closest('#closeTagManager')){$('#tagManager').close();return}
  });
  document.addEventListener('change',e=>{
    const cb=e.target.closest('#tagPromptList [data-prompt-id]');if(!cb||!selectedTag)return;
    const x=draftItems.find(v=>v.id===cb.dataset.promptId);if(!x)return;
    const set=new Set(x.tags||[]);cb.checked?set.add(selectedTag):set.delete(selectedTag);x.tags=[...set];render();
  });
  $('#newTagName')?.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();addTag()}});
  $('#tagPromptSearch')?.addEventListener('input',render);
  persistCatalog(readCatalog());
})();