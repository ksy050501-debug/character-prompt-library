(()=>{
  const KEY='prompt_library_v1';
  const selected=new Set();
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];

  function items(){
    try{const v=JSON.parse(localStorage.getItem(KEY));return Array.isArray(v)?v:[]}catch{return []}
  }

  function apply(){
    const byId=new Map(items().map(x=>[String(x.id),x]));
    let visible=0;
    $$('#grid .card').forEach(card=>{
      const item=byId.get(String(card.dataset.id));
      const tags=item?.tags||[];
      const show=[...selected].every(t=>tags.includes(t));
      card.hidden=!show;
      if(show)visible++;
    });

    $$('#tagList [data-tag]').forEach(b=>b.classList.toggle('active',selected.has(b.dataset.tag)));
    $$('#quickTagList [data-quick-tag]').forEach(b=>b.classList.toggle('active',selected.has(b.dataset.quickTag)));
    const all=$('#quickTagList [data-quick-all]');
    if(all)all.classList.toggle('active',selected.size===0);

    const grid=$('#grid'),empty=$('#empty');
    if(grid&&empty){
      const anyCards=$$('#grid .card').length>0;
      grid.hidden=anyCards&&visible===0;
      empty.hidden=!(anyCards&&visible===0);
      if(anyCards&&visible===0)empty.firstChild.textContent='선택한 태그를 모두 포함하는 프롬프트가 없습니다.';
    }

    const stats=$$('#stats .stat');
    if(stats.length){
      const last=stats[stats.length-1];
      if(last&&last.textContent.startsWith('현재 표시'))last.textContent=`현재 표시 ${visible}`;
      let chip=$('#multiTagStat');
      if(selected.size){
        if(!chip){chip=document.createElement('span');chip.className='stat';chip.id='multiTagStat';last?.before(chip)}
        chip.textContent=`선택 태그 ${selected.size}`;
      }else chip?.remove();
    }
  }

  function toggle(tag){
    if(selected.has(tag))selected.delete(tag);else selected.add(tag);
    apply();
  }

  document.addEventListener('click',e=>{
    const quick=e.target.closest('[data-quick-tag]');
    if(quick){
      e.preventDefault();e.stopImmediatePropagation();
      toggle(quick.dataset.quickTag);
      return;
    }
    if(e.target.closest('[data-quick-all]')){
      e.preventDefault();e.stopImmediatePropagation();
      selected.clear();apply();
      return;
    }
    const side=e.target.closest('#tagList [data-tag]');
    if(side){
      e.preventDefault();e.stopImmediatePropagation();
      toggle(side.dataset.tag);
      return;
    }
    if(e.target.closest('#clearTag')){
      e.preventDefault();e.stopImmediatePropagation();
      selected.clear();apply();
    }
  },true);

  const grid=$('#grid');
  if(grid)new MutationObserver(()=>setTimeout(apply,0)).observe(grid,{childList:true,subtree:true});
  const tagList=$('#tagList');
  if(tagList)new MutationObserver(()=>setTimeout(apply,0)).observe(tagList,{childList:true,subtree:true});
  const quick=$('#quickTagList');
  if(quick)new MutationObserver(()=>setTimeout(apply,0)).observe(quick,{childList:true,subtree:true});

  ['search','sort','favFilter'].forEach(id=>$('#'+id)?.addEventListener(id==='search'?'input':'change',()=>setTimeout(apply,0)));
  setTimeout(apply,0);
})();