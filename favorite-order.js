(()=>{
  const DATA_KEY='prompt_library_v1';
  const ORDER_KEY='prompt_library_favorite_order_v1';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let originalDateNow=null;
  let arranging=false;

  function readItems(){try{const v=JSON.parse(localStorage.getItem(DATA_KEY));return Array.isArray(v)?v:[]}catch{return []}}
  function readOrder(){try{const v=JSON.parse(localStorage.getItem(ORDER_KEY));return Array.isArray(v)?v.map(String):[]}catch{return []}}
  function writeOrder(v){localStorage.setItem(ORDER_KEY,JSON.stringify(v))}
  function favoriteMode(){return $('#favFilter')?.value==='fav'}
  function normalizeOrder(){
    const favIds=readItems().filter(x=>x.favorite).map(x=>String(x.id));
    const favSet=new Set(favIds);
    const order=readOrder().filter(id=>favSet.has(id));
    favIds.forEach(id=>{if(!order.includes(id))order.push(id)});
    writeOrder(order);
    return order;
  }
  function refreshFavButton(){
    const on=favoriteMode();
    $('#favoriteOnlyBtn')?.classList.toggle('active',on);
    document.body.classList.toggle('favorite-only-mode',on);
    const note=$('#favoriteOrderNote');
    if(note)note.hidden=!on;
  }
  function addMoveControls(card){
    const actions=card.querySelector('.card-actions');
    if(!actions||actions.querySelector('.fav-move-controls'))return;
    const wrap=document.createElement('span');
    wrap.className='fav-move-controls';
    wrap.innerHTML='<button class="btn" type="button" data-fav-move="up" aria-label="즐겨찾기 순서 위로">↑</button><button class="btn" type="button" data-fav-move="down" aria-label="즐겨찾기 순서 아래로">↓</button>';
    actions.appendChild(wrap);
  }
  function applyManualOrder(){
    if(arranging)return;
    refreshFavButton();
    const grid=$('#grid');
    if(!grid)return;
    if(!favoriteMode()){
      $$('.fav-move-controls').forEach(x=>x.remove());
      return;
    }
    arranging=true;
    const order=normalizeOrder();
    const pos=new Map(order.map((id,i)=>[id,i]));
    const cards=$$('#grid .card');
    const desired=[...cards].sort((a,b)=>(pos.get(String(a.dataset.id))??Number.MAX_SAFE_INTEGER)-(pos.get(String(b.dataset.id))??Number.MAX_SAFE_INTEGER));
    const current=cards.map(c=>String(c.dataset.id)).join('|');
    const target=desired.map(c=>String(c.dataset.id)).join('|');
    if(current!==target)desired.forEach(c=>grid.appendChild(c));
    desired.forEach(addMoveControls);
    arranging=false;
  }
  function triggerRefresh(){
    const fav=$('#favFilter');
    if(fav)fav.dispatchEvent(new Event('change',{bubbles:true}));
    window.dispatchEvent(new CustomEvent('favoriteorderchange'));
    setTimeout(applyManualOrder,40);
  }
  function move(id,dir){
    const order=normalizeOrder();
    applyManualOrder();
    const visible=$$('#grid .card').map(c=>String(c.dataset.id));
    const vi=visible.indexOf(String(id));
    const vj=dir==='up'?vi-1:vi+1;
    if(vi<0||vj<0||vj>=visible.length)return;
    const other=visible[vj];
    const i=order.indexOf(String(id)),j=order.indexOf(other);
    if(i<0||j<0)return;
    [order[i],order[j]]=[order[j],order[i]];
    writeOrder(order);
    applyManualOrder();
  }

  // app.js의 즐겨찾기 처리에서 updatedAt을 갱신하지 못하도록
  // 즐겨찾기 클릭 이벤트 동안만 Date.now()를 기존 updatedAt으로 고정한다.
  document.addEventListener('click',e=>{
    const star=e.target.closest('#grid [data-action="fav"]');
    if(!star)return;
    const id=String(star.closest('.card')?.dataset.id||'');
    const item=readItems().find(x=>String(x.id)===id);
    if(!item)return;
    if(!originalDateNow)originalDateNow=Date.now;
    const frozen=Number(item.updatedAt)||originalDateNow();
    Date.now=()=>frozen;
    setTimeout(()=>{
      Date.now=originalDateNow;
      originalDateNow=null;
      normalizeOrder();
      triggerRefresh();
    },0);
  },true);

  document.addEventListener('click',e=>{
    const moveBtn=e.target.closest('[data-fav-move]');
    if(moveBtn){
      e.preventDefault();
      e.stopImmediatePropagation();
      move(moveBtn.closest('.card')?.dataset.id,moveBtn.dataset.favMove);
      return;
    }
    if(e.target.closest('#favoriteOnlyBtn')){
      e.preventDefault();
      const fav=$('#favFilter');
      if(!fav)return;
      fav.value=fav.value==='fav'?'all':'fav';
      triggerRefresh();
    }
  },true);

  $('#favFilter')?.addEventListener('change',()=>setTimeout(applyManualOrder,40));
  ['search','sort'].forEach(id=>$('#'+id)?.addEventListener(id==='search'?'input':'change',()=>setTimeout(applyManualOrder,40)));
  $$('.tab[data-type]').forEach(b=>b.addEventListener('click',()=>setTimeout(applyManualOrder,40)));
  const grid=$('#grid');
  if(grid)new MutationObserver(()=>setTimeout(applyManualOrder,0)).observe(grid,{childList:true,subtree:false});
  window.addEventListener('favoriteorderchange',applyManualOrder);
  window.addEventListener('storage',()=>{normalizeOrder();applyManualOrder()});
  normalizeOrder();
  setTimeout(applyManualOrder,60);
})();