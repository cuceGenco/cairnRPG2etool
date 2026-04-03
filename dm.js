function roll(d){ return Math.floor(Math.random()*d)+1; }
function rollN(times,d){ let arr=[]; for(let i=0;i<times;i++)arr.push(roll(d)); return arr; }

let initiativeEntries = [];
function renderInitiative(){
  if(!initiativeEntries.length){ document.getElementById('initOutput').textContent = 'No entries yet.'; return; }
  const lines = initiativeEntries.map((e,i)=>`${i+1}. ${e.name} — Init: ${e.init} — HP: ${e.hp || '-'} — Notes: ${e.notes || '-'} `);
  document.getElementById('initOutput').textContent = lines.join('\n');
}
function addInitiative(name, init, hp='', notes=''){
  if(!name || Number.isNaN(init)){ return; }
  initiativeEntries.push({name, init, hp, notes});
  renderInitiative();
}
function sortInitiative(){ initiativeEntries.sort((a,b)=>b.init - a.init); renderInitiative(); }
function clearInitiative(){ initiativeEntries=[]; renderInitiative(); }

function diceRoll(d){ const n=roll(d); document.getElementById('diceOutput').textContent = `d${d}: ${n}`; }
function diceRollN(n,d){ const r=rollN(n,d); document.getElementById('diceOutput').textContent = `${n}d${d}: ${r.join(', ')} = ${r.reduce((a,b)=>a+b,0)}`; }

function loadNotes(){
  const txt = localStorage.getItem('cairn-notes') || '';
  const notesEle = document.getElementById('notesText');
  if(notesEle){ notesEle.value = txt; }
}

function autoSaveNotes(){
  const notesEle = document.getElementById('notesText');
  if(!notesEle) return;
  localStorage.setItem('cairn-notes', notesEle.value);
}

function loadExtraPanels(){
  const extra = JSON.parse(localStorage.getItem('cairn-extra-panels') || '[]');
  const container = document.getElementById('extraPanelBody');
  container.innerHTML = '';
  extra.forEach((d, idx) => {
    const item = document.createElement('div');
    item.className = 'output-block';
    item.style.marginBottom = '6px';
    item.innerHTML = `<strong>${d.title || 'Notes Block ' + (idx+1)}</strong><br><div>${d.content || ''}</div>`;
    container.appendChild(item);
  });
}

function saveExtraPanels(extra){
  localStorage.setItem('cairn-extra-panels', JSON.stringify(extra));
  loadExtraPanels();
}

function addExtraPanel(){
  const extra = JSON.parse(localStorage.getItem('cairn-extra-panels') || '[]');
  extra.push({title: `Extra Note ${extra.length+1}`, content: 'Empty'});
  saveExtraPanels(extra);
}

function removeExtraPanel(){
  const extra = JSON.parse(localStorage.getItem('cairn-extra-panels') || '[]');
  if(!extra.length) return;
  extra.pop();
  saveExtraPanels(extra);
}

window.addEventListener('storage', (event) => {
  if(['cairn-chars','cairn-map','cairn-monsters','cairn-notes','cairn-extra-panels'].includes(event.key)) {
    loadDisplays();
    loadNotes();
    loadExtraPanels();
  }
});

function loadDisplays(){
  // Character
  const chars = JSON.parse(localStorage.getItem('cairn-chars') || '[]');
  if(chars.length){
    const lines = chars.map((c,i)=>`${i+1}. ${c.name} (${c.background}) STR:${c.STR} DEX:${c.DEX} WIL:${c.WIL} HP:${c.hp} Bond:${c.bond} Omen:${c.omen}`);
    const html = chars.map((c,i)=>`<div style="margin:2px 0; padding:4px 4px; border:1px solid #2c4a67; border-radius:4px;">${i+1}. <strong>${c.name}</strong> <button data-add-init-char="${i}" style="border:none;background:#2c6f3e;color:#fff;border-radius:3px;padding:2px 6px;cursor:pointer;">+Init</button><br><small>BG:${c.background} STR:${c.STR} DEX:${c.DEX} WIL:${c.WIL}</small><br>HP: <input data-hp-edit-char="${i}" type="number" value="${c.hp}" style="width:72px; background:#152d46; color:#fff; border:1px solid #3f5a7a; border-radius:3px;"/> <button data-save-hp-char="${i}" style="border:none;background:#4a7b2f;color:#fff;border-radius:3px;padding:1px 6px;cursor:pointer;">Save HP</button></div>`).join('');
    const container = document.getElementById('charDisplay');
    container.innerHTML = html;
    container.querySelectorAll('[data-add-init-char]').forEach(btn=>btn.addEventListener('click', e=>{
      const ci = Number(e.currentTarget.dataset.addInitChar);
      const cp = chars[ci];
      addInitiative(cp.name, cp.DEX, cp.hp, `From char ${cp.name}`);
    }));
    container.querySelectorAll('[data-save-hp-char]').forEach(btn=>btn.addEventListener('click', e=>{
      const ci = Number(e.currentTarget.dataset.saveHpChar);
      const input = container.querySelector(`[data-hp-edit-char='${ci}']`);
      const newHP = Number(input.value);
      if(!Number.isNaN(newHP)) {
        chars[ci].hp = newHP;
        localStorage.setItem('cairn-chars', JSON.stringify(chars));
        loadDisplays();
      }
    }));
  } else {
    document.getElementById('charDisplay').textContent = 'No character generated yet.';
  }

  // Map
  const map = localStorage.getItem('cairn-map');
  document.getElementById('mapDisplay').textContent = map || 'No map generated yet.';

  // Bestiary
  const monsters = JSON.parse(localStorage.getItem('cairn-monsters') || '[]');
  if(monsters.length){
    const container = document.getElementById('bestDisplay');
    container.innerHTML = monsters.map((m,i)=>`<div style="margin:2px 0;">${i+1}. <strong>${m.name}</strong> <button data-add-init-monster="${i}" style="border:none;background:#2c6f3e;color:#fff;border-radius:3px;padding:2px 6px;cursor:pointer;">+Init</button><br><small>${m.Category} HP:${m.HP} Atk:${m.Attack} Traits:${m.Traits}</small></div>`).join('');
    container.querySelectorAll('[data-add-init-monster]').forEach(btn=>btn.addEventListener('click', e=>{
      const mi = Number(e.currentTarget.dataset.addInitMonster);
      const m = monsters[mi];
      addInitiative(m.name, Math.floor(Math.random()*20)+1, m.HP, `From monster ${m.name}`);
    }));
  } else {
    document.getElementById('bestDisplay').textContent = 'No monsters saved yet.';
  }

  loadNotes();
}

document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('addInitBtn').addEventListener('click', ()=>{
    const name = document.getElementById('initName').value.trim();
    const init = parseInt(document.getElementById('initValue').value,10);
    addInitiative(name, init);
    document.getElementById('initName').value=''; document.getElementById('initValue').value='';
  });
  document.getElementById('sortInitBtn').addEventListener('click', sortInitiative);
  document.getElementById('clearInitBtn').addEventListener('click', clearInitiative);
  const notesArea = document.getElementById('notesText');
  if(notesArea){
    notesArea.addEventListener('input', autoSaveNotes);
  }
  document.getElementById('addNotePanelBtn').addEventListener('click', addExtraPanel);
  document.getElementById('removeNotePanelBtn').addEventListener('click', removeExtraPanel);
  document.getElementById('exportAllBtn').addEventListener('click', exportAllData);
  document.getElementById('importAllBtn').addEventListener('click', ()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importAllData);
  document.querySelectorAll('[data-die]').forEach(btn=>btn.addEventListener('click',e=>diceRoll(Number(e.currentTarget.dataset.die))));
  document.getElementById('roll3d6').addEventListener('click',()=>diceRollN(3,6));
  document.getElementById('roll2d6').addEventListener('click',()=>diceRollN(2,6));

  document.querySelectorAll('[data-toggle-panel]').forEach(btn=>{
    btn.addEventListener('click', e=>{
      const panelId = e.currentTarget.dataset.togglePanel;
      const panel = document.getElementById(panelId);
      if(!panel) return;
      panel.classList.toggle('hidden');
      e.currentTarget.classList.toggle('active', !panel.classList.contains('hidden'));
    });
  });

  loadDisplays();
  loadNotes();
  loadExtraPanels();
});

function exportAllData(){
  const payload = {
    chars: JSON.parse(localStorage.getItem('cairn-chars') || '[]'),
    map: localStorage.getItem('cairn-map') || '',
    monsters: JSON.parse(localStorage.getItem('cairn-monsters') || '[]'),
    notes: localStorage.getItem('cairn-notes') || '',
    extraPanels: JSON.parse(localStorage.getItem('cairn-extra-panels') || '[]'),
    initiative: initiativeEntries
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'cairn_dm_export.json'; a.click(); URL.revokeObjectURL(url);
}

function importAllData(event){
  const file = event.target.files?.[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(reader.result);
      if(payload.chars) localStorage.setItem('cairn-chars', JSON.stringify(payload.chars));
      if(payload.map !== undefined) localStorage.setItem('cairn-map', payload.map);
      if(payload.monsters) localStorage.setItem('cairn-monsters', JSON.stringify(payload.monsters));
      if(payload.notes !== undefined) localStorage.setItem('cairn-notes', payload.notes);
      if(payload.extraPanels) localStorage.setItem('cairn-extra-panels', JSON.stringify(payload.extraPanels));
      if(payload.initiative) {
        initiativeEntries = payload.initiative;
        renderInitiative();
      }
      loadDisplays();
      loadNotes();
      loadExtraPanels();
      alert('Data imported.');
    } catch(e){ alert('Invalid JSON import'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}
