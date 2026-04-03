const backgrounds = ['Acolyte','Artisan','Criminal','Entertainer','Folk Hero','Guild Artisan','Hermit','Noble','Outlander','Sage','Sailor','Soldier','Urchin','Hunter','Merchant','Scholar','Scout','Warden','Reaver','Hedge Witch'];
const bonds = ['We passed the test together','I owe them my life','I will prove myself to ...','My family name','Their path aligns with mine','I choose to protect them'];
const omens = ['A falling star','A whisper in the night','A sudden chill','A blood-moon','A stone carving glows','A ghost appears'];
const physique = ['Lanky','Stocky','Scarred','Sinewy','Broad-shouldered'];
const skin = ['Pale','Tanned','Bronze','Olive','Dark'];
const hair = ['Shaved','Braided','Long','Curly','Grey'];
const eyes = ['Piercing','Warm','Cold','Hooded','Wild'];
const pois = ['Heart','Settlement','Waypoint','Curiosity','Lair','Dungeon'];
const topography = ['Barrens','Windswept Plains','Deciduous Forest','Pine Forest','Swamp','Hills','Mountains','Coastal Cliffs','River Gorge'];
const landmarks = ['Ruined Tower','Stone Circle','Old Road','Sacred Oak','Salt Pool','Crumbling Keep','Sinkhole','Ancient Bridge'];
const bestiary = [
  {name:'Wendigo',Category:'Undead',HP:'27',Attack:'+4',Traits:'Frenzy'},
  {name:'Grim Wolf',Category:'Beast',HP:'14',Attack:'+3',Traits:'Pack Hunter'},
  {name:'Cairn Raider',Category:'Humanoid',HP:'18',Attack:'+3',Traits:'Tactics'},
  {name:'Stonecrawler',Category:'Abomination',HP:'22',Attack:'+2',Traits:'Burrow'},
  {name:'Nightshade',Category:'Undead',HP:'20',Attack:'+4',Traits:'Shadow Step'}
];
function roll(d){ return Math.floor(Math.random()*d)+1; }
function rollN(times,d){ let arr=[]; for(let i=0;i<times;i++)arr.push(roll(d)); return arr; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function renderChar(card){
  const stats = document.getElementById('charStats');
  stats.innerHTML='';
  ['STR','DEX','WIL'].forEach(k=>{ const d=document.createElement('div'); d.className='stat-card'; d.innerHTML=`<div>${k}</div><b>${card[k]}</b>`; stats.appendChild(d); });
  let out = `Name: ${card.name}\nBackground: ${card.background}\nHP: ${card.hp} (1d6)\nBond: ${card.bond}\nOmen: ${card.omen}\nPhysique: ${card.physique}, Skin: ${card.skin}, Hair: ${card.hair}, Eyes: ${card.eyes}\nGear: ${card.gear.join(', ')}\n`;
  document.getElementById('charOutput').textContent = out;
}

function generateCharacter(){
  const card = {name:'Adventurer', background: pick(backgrounds), STR: roll(6)+roll(6)+roll(6), DEX: roll(6)+roll(6)+roll(6), WIL: roll(6)+roll(6)+roll(6), hp: roll(6), bond: pick(bonds), omen: pick(omens), physique: pick(physique), skin: pick(skin), hair: pick(hair), eyes: pick(eyes), gear:[`Reliable weapon`,`Trail rations`,`Cloth armor`], notes:'Swap any two stats with UI controls in next release.'};
  window.lastChar=card; renderChar(card);
}

function saveCharacter(){ if(!window.lastChar){alert('Generate character first'); return;} localStorage.setItem('cairn-char',JSON.stringify(window.lastChar)); alert('Saved.'); }
function loadCharacter(){ const raw=localStorage.getItem('cairn-char'); if(!raw){alert('No saved char'); return;} window.lastChar=JSON.parse(raw); renderChar(window.lastChar); }
function exportCharacter(){ if(!window.lastChar){alert('Generate character first'); return;} const blob=new Blob([JSON.stringify(window.lastChar,null,2)],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='cairn_character.json'; a.click(); URL.revokeObjectURL(url); }

function generateMap(){ const map=[...new Set(rollN(5,topography.length).map(i=>topography[i-1]))]; const poi=rollN(6,pois.length).map(i=>`${pois[i-1]} at ${pick(landmarks)}`); document.getElementById('mapOutput').textContent = `Terrain: ${map.join(', ')}\nPOI:\n- ${poi.join('\n- ')}`; }

function showBestiary(){ const filter=document.getElementById('bestiaryFilter').value.toLowerCase(); const list=bestiary.filter(m=> filter==='all' || m.Category.toLowerCase()===filter ); document.getElementById('bestOutput').textContent = list.length === 0 ? 'No monsters found.' : list.map(m=>`${m.name} [${m.Category}] HP${m.HP} Atk:${m.Attack} Traits:${m.Traits}`).join('\n'); }

function randomMonster(){ const m=pick(bestiary); window.lastMonster=m; document.getElementById('bestOutput').textContent=`${m.name} (${m.Category})\nHP ${m.HP} Attack ${m.Attack}\nTraits:${m.Traits}`; }
function randomEncounter(){ randomMonster(); const r=['stalking','sleeping','patrolling','hunting','foraging']; const place = pick(['ruins','forest','cave','river','hills']); document.getElementById('bestOutput').textContent += `\nEncounter: ${window.lastMonster.name} is ${pick(r)} near ${place}.`; }

function diceRoll(d){ const n=roll(d); document.getElementById('diceOutput').textContent = `d${d}: ${n}`; }
function diceRollN(n,d){ const r=rollN(n,d); document.getElementById('diceOutput').textContent = `${n}d${d}: ${r.join(', ')} = ${r.reduce((a,b)=>a+b,0)}`; }

let initiativeEntries = [];
function renderInitiative(){
  if(!initiativeEntries.length){ document.getElementById('initOutput').textContent = 'No entries yet.'; return; }
  const lines = initiativeEntries.map((e,i)=>`${i+1}. ${e.name} — Init: ${e.init} — HP: ${e.hp || '-'} — Notes: ${e.notes || '-'} `);
  document.getElementById('initOutput').textContent = lines.join('\n');
}
function addInitiative(){
  const name = document.getElementById('initName').value.trim();
  const init = parseInt(document.getElementById('initValue').value,10);
  if(!name || Number.isNaN(init)){ alert('Name and initiative needed'); return; }
  initiativeEntries.push({name, init, hp:'', notes:''});
  document.getElementById('initName').value=''; document.getElementById('initValue').value='';
  renderInitiative();
}
function sortInitiative(){ initiativeEntries.sort((a,b)=>b.init - a.init); renderInitiative(); }
function clearInitiative(){ initiativeEntries=[]; renderInitiative(); }

function init() {
  document.getElementById('charRollBtn').addEventListener('click', generateCharacter);
  document.getElementById('saveCharBtn').addEventListener('click', saveCharacter);
  document.getElementById('loadCharBtn').addEventListener('click', loadCharacter);
  document.getElementById('exportCharBtn').addEventListener('click', exportCharacter);
  document.getElementById('mapGenBtn').addEventListener('click', generateMap);
  document.getElementById('mapCopyBtn').addEventListener('click',()=>navigator.clipboard.writeText(document.getElementById('mapOutput').textContent));
  document.getElementById('bestiaryFilter').addEventListener('change', showBestiary);
  document.getElementById('bestiaryRndBtn').addEventListener('click', randomMonster);
  document.getElementById('encounterBtn').addEventListener('click', randomEncounter);
  document.getElementById('roll3d6').addEventListener('click',()=>diceRollN(3,6));
  document.getElementById('roll2d6').addEventListener('click',()=>diceRollN(2,6));
  document.querySelectorAll('[data-die]').forEach(btn=>btn.addEventListener('click',e=>diceRoll(Number(e.currentTarget.dataset.die))));

  document.getElementById('addInitBtn').addEventListener('click', addInitiative);
  document.getElementById('sortInitBtn').addEventListener('click', sortInitiative);
  document.getElementById('clearInitBtn').addEventListener('click', clearInitiative);


  document.querySelectorAll('[data-toggle-panel]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const panelId = e.currentTarget.dataset.togglePanel;
      const panel = document.getElementById(panelId);
      if(!panel) return;
      panel.classList.toggle('hidden');
      e.currentTarget.classList.toggle('active', !panel.classList.contains('hidden'));
    });
  });

  document.querySelectorAll('.panel').forEach(panel=>{
    panel.draggable=true;
    panel.addEventListener('dragstart', e=>{ e.dataTransfer.setData('text/plain', panel.id); e.dataTransfer.effectAllowed='move'; panel.classList.add('dragging'); });
    panel.addEventListener('dragend', ()=>panel.classList.remove('dragging'));
  });

  const main = document.querySelector('.main');
  main.addEventListener('dragover', e=>{ e.preventDefault(); const after = getDragAfterElement(main, e.clientY); const dragging = document.querySelector('.dragging'); if(after == null) main.appendChild(dragging); else main.insertBefore(dragging, after); });

  function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.panel:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if(offset < 0 && offset > closest.offset) { return { offset: offset, element: child }; } else { return closest; }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  showBestiary(); generateCharacter(); generateMap();
}
document.addEventListener('DOMContentLoaded', init);
