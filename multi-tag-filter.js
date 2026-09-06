(()=>{
  const KEY='prompt_library_v1';
  const selected=new Set();
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let rendering=false;

  function readItems(){
    try{const v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)?v:[]}catch{return []}
  }
  function esc(s=''){
    return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function activeType(){
    return document.querySelector('.tab.active[data-type]')?.dataset.type||'all';
  }
  function filteredItems(){
    const q=($('#search')?.value||'').trim().toLowerCase();
    const fav=$('#favFilter')?.value||'all';
    const sort=$('#sort')?.value||'updated';
    const type=activeType();
    let out=readItems().filter(x=>{
      if(type!=='all'&&x.type!==type)return false;
      if(fav==='fav'&&!x.favorite)return false;
      const tags=Array.isArray(x.tags)?x.tags:[];
      if(selected.size&&![...selected].every(t=>tags.includes(t)))return false;
      if(q&&![(x.title||''),...tags,(x.content||'')].join(' ').toLowerCase().includes(q))return false;
      return true;
    });
    out.sort((a,b)=>{
      if(sort==='title')return String(a.title||'').localeCompare(String(b.title||''),'ko');
      if(sort==='created')return (b.createdAt||0)-(a.createdAt||0);
      if(sort==='used')return ((b.lastUsedAt||0)-(a.lastUsedAt||0))||((b.updatedAt||0)-(a.updatedAt||0));
      return (b.updatedAt||0)-(a.updatedAt||0);
    });
    return out;
  }
  function renderCards(){
    if(rendering)return;
    rendering=true;
    const grid=$('#grid'),empty=$('#empty');
    if(!grid||!empty){rendering=false;return}
    const data=filteredItems();
    grid.innerHTML=data.map(x=>`<article class="card" data-id="${esc(x.id)}"><div class="card-top"><div><div class="card-title">${esc(x.title)}</div><div style="margin-top:7px"><span class="badge ${x.type}">${x.type==='person'?'인물':'상황'}</span></div></div><button class="star ${x.favorite?'on':''}" data-action="fav">★</button></div><div class="meta">${(x.tags||[]).slice(0,8).map(t=>`<span class="mini-tag">#${esc(t)}</span>`).join('')}</div><div class="preview">${esc(x.content)}</div><div class="card-actions"><button class="btn primary" data-action="copy">복사</button><button class="btn" data-action="edit">수정</button><button class="btn" data-action="duplicate">복제</button><button class="btn danger" data-action="delete">삭제</button></div></article>`).join('');
    grid.hidden=data.length===0;
    empty.hidden=data.length!==0;
    if(data.length===0){
      const msg=selected.size?'선택한 태그를 모두 포함하는 프롬프트가 없습니다.':'조건에 맞는 프롬프트가 없습니다.';
      empty.childNodes[0].textContent=msg;
    }
    const stats=$$('#stats .stat');
    const current=stats.find(s=>s.textContent.startsWith('현재 표시'));
    if(current)current.textContent=`현재 표시 ${data.length}`;
    let chip=$('#multiTagStat');
    if(selected.size){
      if(!chip){chip=document.createElement('span');chip.className='stat';chip.id='multiTagStat';$('#stats')?.appendChild(chip)}
      chip.textContent=`선택 태그 ${selected.size}`;
    }else chip?.remove();
    syncActiveState();
    rendering=false;
  }
  function syncActiveState(){
    $$('#tagList [data-tag]').forEach(b=>b.classList.toggle('active',selected.has(b.dataset.tag)));
    $$('#quickTagList [data-quick-tag]').forEach(b=>b.classList.toggle('active',selected.has(b.dataset.quickTag)));
    const all=$('#quickTagList [data-quick-all]');
    if(all)all.classList.toggle('active',selected.size===0);
  }
  function toggle(tag){
    if(!tag)return;
    selected.has(tag)?selected.delete(tag):selected.add(tag);
    renderCards();
  }

  document.addEventListener('click',e=>{
    const quick=e.target.closest('[data-quick-tag]');
    if(quick){e.preventDefault();e.stopImmediatePropagation();toggle(quick.dataset.quickTag);return}
    if(e.target.closest('[data-quick-all]')){e.preventDefault();e.stopImmediatePropagation();selected.clear();renderCards();return}
    const side=e.target.closest('#tagList [data-tag]');
    if(side){e.preventDefault();e.stopImmediatePropagation();toggle(side.dataset.tag);return}
    if(e.target.closest('#clearTag')){e.preventDefault();e.stopImmediatePropagation();selected.clear();renderCards();return}
  },true);

  ['search','sort','favFilter'].forEach(id=>{
    const el=$('#'+id);if(!el)return;
    el.addEventListener(id==='search'?'input':'change',()=>setTimeout(renderCards,0));
  });
  $$('.tab[data-type]').forEach(b=>b.addEventListener('click',()=>setTimeout(renderCards,0)));
  $('#grid')?.addEventListener('click',()=>setTimeout(renderCards,30));
  $('#saveBtn')?.addEventListener('click',()=>setTimeout(renderCards,30));
  $('#importFile')?.addEventListener('change',()=>setTimeout(renderCards,80));

  const tagList=$('#tagList');
  if(tagList)new MutationObserver(()=>setTimeout(syncActiveState,0)).observe(tagList,{childList:true,subtree:true});
  const quick=$('#quickTagList');
  if(quick)new MutationObserver(()=>setTimeout(syncActiveState,0)).observe(quick,{childList:true,subtree:true});
  window.addEventListener('storage',renderCards);
  setTimeout(renderCards,0);
})();