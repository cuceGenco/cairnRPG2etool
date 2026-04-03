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
let editedCharIndex = null;
let editedMonsterIndex = null;

function roll(d){ return Math.floor(Math.random()*d)+1; }
function rollN(times,d){ let arr=[]; for(let i=0;i<times;i++)arr.push(roll(d)); return arr; }
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)]; }

function renderChar(card){
  const stats = document.getElementById('charStats');
  stats.innerHTML='';
  ['STR','DEX','WIL'].forEach(k=>{ const d=document.createElement('div'); d.className='stat-card'; d.innerHTML=`<div>${k}</div><b>${card[k]}</b>`; stats.appendChild(d); });
  let out = `Name: ${card.name}\nBackground: ${card.background}\nSTR:${card.STR} DEX:${card.DEX} WIL:${card.WIL}\nHP: ${card.hp} (1d6)\nBond: ${card.bond}\nOmen: ${card.omen}\nPhysique: ${card.physique}, Skin: ${card.skin}, Hair: ${card.hair}, Eyes: ${card.eyes}\nGear: ${card.gear.join(', ')}\n`;
  document.getElementById('charOutput').textContent = out;
  document.getElementById('charName').value = card.name;
  document.getElementById('charBackground').value = card.background;
  document.getElementById('charSTR').value = card.STR;
  document.getElementById('charDEX').value = card.DEX;
  document.getElementById('charWIL').value = card.WIL;
  document.getElementById('charHP').value = card.hp;
  document.getElementById('charBond').value = card.bond;
  document.getElementById('charOmen').value = card.omen;
  document.getElementById('charGear').value = card.gear.join(', ');
}

function generateCharacter(){
  const card = {name:'Adventurer', background: pick(backgrounds), STR: roll(6)+roll(6)+roll(6), DEX: roll(6)+roll(6)+roll(6), WIL: roll(6)+roll(6)+roll(6), hp: roll(6), bond: pick(bonds), omen: pick(omens), physique: pick(physique), skin: pick(skin), hair: pick(hair), eyes: pick(eyes), gear:[`Reliable weapon`,`Trail rations`,`Cloth armor`]};
  window.lastChar=card; renderChar(card);
}

function readCharFromFields(){
  return {
    name: document.getElementById('charName').value.trim() || 'Adventurer',
    background: document.getElementById('charBackground').value.trim() || 'Unknown',
    STR: Number(document.getElementById('charSTR').value) || 3,
    DEX: Number(document.getElementById('charDEX').value) || 3,
    WIL: Number(document.getElementById('charWIL').value) || 3,
    hp: Number(document.getElementById('charHP').value) || 1,
    bond: document.getElementById('charBond').value.trim() || 'None',
    omen: document.getElementById('charOmen').value.trim() || 'None',
    physique: window.lastChar?.physique || 'Average',
    skin: window.lastChar?.skin || 'Normal',
    hair: window.lastChar?.hair || 'Normal',
    eyes: window.lastChar?.eyes || 'Normal',
    gear: document.getElementById('charGear').value.split(',').map(x=>x.trim()).filter(x=>x)
  };
}

function loadSavedChars(){
  const chars = JSON.parse(localStorage.getItem('cairn-chars') || '[]');
  const area = document.getElementById('savedCharList');
  if(!chars.length){ area.innerHTML = '<i>No saved characters</i>'; return; }
  area.innerHTML = chars.map((c,i)=>`<div style="margin:2px 0; display:flex; justify-content:space-between; align-items:center;">${i+1}. ${c.name} (${c.background}) <span><button data-load-char="${i}" style="border:none;background:#2f4565;color:#fff;border-radius:3px;padding:2px 6px;cursor:pointer;">Load</button> <button data-delete-char="${i}" style="border:none;background:#7f2323;color:#fff;border-radius:3px;padding:2px 6px;cursor:pointer;">Delete</button></span></div>`).join('');
  area.querySelectorAll('[data-load-char]').forEach(btn=>btn.addEventListener('click', e=>{
    const idx = Number(e.currentTarget.dataset.loadChar);
    const chosen = chars[idx];
    window.lastChar = chosen;
    window.editedCharIndex = idx;
    renderChar(chosen);
  }));
  area.querySelectorAll('[data-delete-char]').forEach(btn=>btn.addEventListener('click', e=>{
    const idx = Number(e.currentTarget.dataset.deleteChar);
    chars.splice(idx,1);
    localStorage.setItem('cairn-chars', JSON.stringify(chars));
    loadSavedChars();
    loadDisplays();
  }));
}

function notifyDMUpdate(){
  try {
    localStorage.setItem('cairn-last-updated', Date.now().toString());
  } catch(e) { }
  if(window.opener && !window.opener.closed){
    window.opener.postMessage({type:'cairn_data_updated'}, '*');
  }
}

function saveCharacter(){
  const card = readCharFromFields();
  window.lastChar = card;
  renderChar(card);
  let chars = JSON.parse(localStorage.getItem('cairn-chars') || '[]');
  if(editedCharIndex !== null && editedCharIndex >= 0 && editedCharIndex < chars.length){
    chars[editedCharIndex] = card;
    editedCharIndex = null;
  } else {
    chars.push(card);
  }
  localStorage.setItem('cairn-chars', JSON.stringify(chars));
  notifyDMUpdate();
  alert('Character saved.');
  loadSavedChars();
  loadDisplays();
}

function exportCharacter(){
  if(!window.lastChar){alert('Generate character first'); return;}
  const blob=new Blob([JSON.stringify(window.lastChar,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='cairn_character.json'; a.click(); URL.revokeObjectURL(url);
}

function generateMap(){
  const map=[...new Set(rollN(5,topography.length).map(i=>topography[i-1]))];
  const poi=rollN(6,pois.length).map(i=>`${pois[i-1]} at ${pick(landmarks)}`);
  const desc = `Terrain: ${map.join(', ')}\nPOI:\n- ${poi.join('\n- ')}`;
  document.getElementById('mapOutput').textContent=desc;
  document.getElementById('mapEdit').value = desc;
  window.lastMap=desc;
}

function saveMap(){
  if(!window.lastMap){alert('Generate map first'); return;}
  const text = document.getElementById('mapEdit').value.trim();
  if(text){ window.lastMap = text; }
  localStorage.setItem('cairn-map', window.lastMap);
  notifyDMUpdate();
  alert('Map saved.');
  loadSavedMap();
}

function loadSavedMap(){
  const mapText = localStorage.getItem('cairn-map') || '';
  document.getElementById('mapEdit').value = mapText;
}

function randomMonster(){
  const m=pick(bestiary);
  window.lastMonster=m;
  document.getElementById('bestOutput').textContent=`${m.name} (${m.Category})\nHP ${m.HP} Attack ${m.Attack}\nTraits:${m.Traits}`;
  document.getElementById('monsterName').value = m.name;
  document.getElementById('monsterCategory').value = m.Category;
  document.getElementById('monsterHP').value = m.HP;
  document.getElementById('monsterAttack').value = m.Attack;
  document.getElementById('monsterTraits').value = m.Traits;
}

function saveMonster(){
  const monster = {
    name: document.getElementById('monsterName').value.trim() || window.lastMonster?.name || 'Unknown',
    Category: document.getElementById('monsterCategory').value.trim() || window.lastMonster?.Category || 'Unknown',
    HP: Number(document.getElementById('monsterHP').value) || window.lastMonster?.HP || 1,
    Attack: document.getElementById('monsterAttack').value.trim() || window.lastMonster?.Attack || '+0',
    Traits: document.getElementById('monsterTraits').value.trim() || window.lastMonster?.Traits || 'None'
  };
  window.lastMonster = monster;
  let monsters = JSON.parse(localStorage.getItem('cairn-monsters') || '[]');
  if(editedMonsterIndex !== null && editedMonsterIndex >=0 && editedMonsterIndex < monsters.length){
    monsters[editedMonsterIndex] = monster;
    editedMonsterIndex = null;
  } else {
    monsters.push(monster);
  }
  localStorage.setItem('cairn-monsters', JSON.stringify(monsters));
  notifyDMUpdate();
  alert('Monster saved.');
  loadSavedMonsters();
  loadDisplays();
}

function loadSavedMonsters(){
  const monsters = JSON.parse(localStorage.getItem('cairn-monsters') || '[]');
  const area = document.getElementById('savedMonsterList');
  if(!monsters.length){ area.innerHTML = '<i>No saved monsters</i>'; return; }
  area.innerHTML = monsters.map((m,i)=>`<div style="margin:2px 0; display:flex; justify-content:space-between; align-items:center;">${i+1}. ${m.name} (${m.Category}) HP:${m.HP} <button data-load-monster="${i}" style="border:none;background:#2f4565;color:#fff;border-radius:3px;padding:2px 6px;cursor:pointer;">Load</button></div>`).join('');
  area.querySelectorAll('[data-load-monster]').forEach(btn=>btn.addEventListener('click', e=>{
    const idx = Number(e.currentTarget.dataset.loadMonster);
    editedMonsterIndex = idx;
    const chosen = monsters[idx];
    window.lastMonster = chosen;
    document.getElementById('monsterName').value = chosen.name;
    document.getElementById('monsterCategory').value = chosen.Category;
    document.getElementById('monsterHP').value = chosen.HP;
    document.getElementById('monsterAttack').value = chosen.Attack;
    document.getElementById('monsterTraits').value = chosen.Traits;
    document.getElementById('bestOutput').textContent = `${chosen.name} (${chosen.Category})\nHP ${chosen.HP} Attack ${chosen.Attack}\nTraits:${chosen.Traits}`;
  }));
  area.querySelectorAll('[data-delete-monster]').forEach(btn=>btn.addEventListener('click', e=>{
    const idx = Number(e.currentTarget.dataset.deleteMonster);
    monsters.splice(idx,1);
    localStorage.setItem('cairn-monsters', JSON.stringify(monsters));
    loadSavedMonsters();
    loadDisplays();
  }));
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('charRollBtn').addEventListener('click', generateCharacter);
  document.getElementById('saveCharBtn').addEventListener('click', saveCharacter);
  document.getElementById('loadCharsBtn').addEventListener('click', loadSavedChars);
  document.getElementById('exportCharBtn').addEventListener('click', exportCharacter);
  document.getElementById('mapGenBtn').addEventListener('click', generateMap);
  document.getElementById('saveMapBtn').addEventListener('click', saveMap);
  document.getElementById('bestiaryRndBtn').addEventListener('click', randomMonster);
  document.getElementById('saveMonsterBtn').addEventListener('click', saveMonster);

  loadSavedChars();
  loadSavedMap();
  loadSavedMonsters();
});