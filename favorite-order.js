(()=>{
  const DATA_KEY='prompt_library_v1';
  const ORDER_KEY='prompt_library_favorite_order_v1';
  const $=s=>document.querySelector(s);
  const $$=s=>[...document.querySelectorAll(s)];
  let originalDateNow=null;

  function readItems(){try{const v=JSON.parse(localStorage.getItem(DATA_KEY));return Array.isArray(v)?v:[]}catch{return []}}
  function readOrder(){try{const v=JSON.parse(localStorage.getItem(ORDER_KEY));return Array.isArray(v)?v.map(String):[]}catch{return []}}
  function writeOrder(v){localStorage.setItem(ORDER_KEY,JSON.stringify(v))}
  function normalizeOrder(){
    const favIds=readItems().filter(x=>x.favorite).map(x=>String(x.id));
    const favSet=new Set(favIds);
    const order=readOrder().filter(id=>favSet.has(id));
    favIds.forEach(id=>{if(!order.includes(id))order.push(id)});
    writeOrder(order);
    return order;
  }
  function refreshFavButton(){
    const on=$('#favFilter')?.value==='fav';
    $('#favoriteOnlyBtn')?.classList.toggle('active',on);
    document.body.classList.toggle('favorite-only-mode',on);
  }
  function triggerRefresh(){
    const fav=$('#favFilter');
    if(fav)fav.dispatchEvent(new Event('change',{bubbles:true}));
    window.dispatchEvent(new CustomEvent('favoriteorderchange'));
    refreshFavButton();
  }
  function move(id,dir){
    const order=normalizeOrder();
    const i=order.indexOf(String(id));
    if(i<0)return;
    const j=dir==='up'?i-1:i+1;
    if(j<0||j>=order.length)return;
    [order[i],order[j]]=[order[j],order[i]];
    writeOrder(order);
    triggerRefresh();
  }

  // 즐겨찾기 클릭 시 app.js가 updatedAt을 현재 시각으로 바꾸지 못하도록
  // 해당 클릭 이벤트가 끝날 때까지만 Date.now()를 기존 updatedAt으로 고정한다.
  document.addEventListener('click',e=>{
    const star=e.target.closest('#grid [data-action="fav"]');
    if(!star)return;
    const card=star.closest('.card');
    const id=String(card?.dataset.id||'');
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

  $('#favFilter')?.addEventListener('change',()=>setTimeout(refreshFavButton,0));
  window.addEventListener('storage',()=>{normalizeOrder();refreshFavButton()});
  normalizeOrder();
  refreshFavButton();
})();