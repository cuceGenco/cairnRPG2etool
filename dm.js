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

function diceRoll(d, cellId){ const n=roll(d); document.getElementById(`diceOutput-${cellId}`).textContent = `d${d}: ${n}`; }
function diceRollN(n,d, cellId){ const r=rollN(n,d); document.getElementById(`diceOutput-${cellId}`).textContent = `${n}d${d}: ${r.join(', ')} = ${r.reduce((a,b)=>a+b,0)}`; }

const panelTypes = {
  character: { title: 'Generated Character', html: `<div class="output-block" id="charDisplay-{{cellId}}"></div>` },
  map: { title: 'Generated Map', html: `<div class="output-block" id="mapDisplay-{{cellId}}"></div>` },
  bestiary: { title: 'Saved Monsters', html: `<div class="output-block" id="bestDisplay-{{cellId}}"></div>` },
  initiative: { title: 'War / Initiative Tracker', html: `<div class="inline-grid" style="margin-bottom: 8px;"><input id="initName-{{cellId}}" placeholder="Name" type="text"/><input id="initValue-{{cellId}}" placeholder="Initiative" type="number"/><button class="btn" id="addInitBtn-{{cellId}}">Add</button></div><div class="output-block" id="initOutput-{{cellId}}" style="height: 220px; overflow:auto;">No entries yet.</div><div style="margin-top: 8px;" class="inline-grid"><button class="btn small-btn" id="sortInitBtn-{{cellId}}">Sort Desc</button><button class="btn small-btn" id="clearInitBtn-{{cellId}}">Clear</button></div>` },
  dice: { title: 'Dice Roller', html: `<div class="inline-grid" style="grid-template-columns: repeat(4, minmax(0,1fr)); gap:6px;"><button class="btn small-btn" data-die="{{cellId}}" data-cell="{{cellId}}">d4</button><button class="btn small-btn" data-die="6" data-cell="{{cellId}}">d6</button><button class="btn small-btn" data-die="8" data-cell="{{cellId}}">d8</button><button class="btn small-btn" data-die="10" data-cell="{{cellId}}">d10</button><button class="btn small-btn" data-die="12" data-cell="{{cellId}}">d12</button><button class="btn small-btn" data-die="20" data-cell="{{cellId}}">d20</button><button class="btn small-btn" id="roll3d6-{{cellId}}">3d6</button><button class="btn small-btn" id="roll2d6-{{cellId}}">2d6</button></div><div class="output-block" id="diceOutput-{{cellId}}">Roll results appear</div>` },
  notes: { title: 'Notes', html: `<textarea id="notesText-{{cellId}}" rows="14" style="width:100%; background:#111a2d; color:#dce1e9; border:1px solid #2e3c57; border-radius:5px; padding:6px; resize:vertical;"></textarea>`, allowMultiple: true }
};

let panelAssignments = {}; // cellId: type

function savePanelAssignments(){
  localStorage.setItem('cairn-panel-assignments', JSON.stringify(panelAssignments));
}

function loadPanelAssignments(){
  panelAssignments = JSON.parse(localStorage.getItem('cairn-panel-assignments') || '{}');
}

function showMenu(cellId, event) {
  const menu = document.createElement('div');
  menu.className = 'panel-menu';
  Object.keys(panelTypes).forEach(type => {
    const btn = document.createElement('button');
    btn.className = 'menu-btn';
    btn.textContent = panelTypes[type].title;
    btn.onclick = () => {
      assignPanel(type, cellId);
      document.body.removeChild(menu);
    };
    menu.appendChild(btn);
  });
  document.body.appendChild(menu);
  menu.style.position = 'fixed';
  menu.style.left = (event.clientX + 10) + 'px'; // right bottom, adjust
  menu.style.top = (event.clientY + 10) + 'px';
  // Ensure not off screen, but basic
}

function assignPanel(type, cellId) {
  if (!panelTypes[type].allowMultiple && Object.values(panelAssignments).includes(type)) {
    // Remove from old cell
    const oldCellId = Object.keys(panelAssignments).find(cid => panelAssignments[cid] === type);
    if (oldCellId) {
      const oldCell = document.getElementById(oldCellId);
      oldCell.innerHTML = '<button class="add-btn">+</button>';
      oldCell.querySelector('.add-btn').onclick = (e) => showMenu(oldCellId, e);
      delete panelAssignments[oldCellId];
    }
  }
  panelAssignments[cellId] = type;
  const cell = document.getElementById(cellId);
  const html = panelTypes[type].html.replace(/\{\{cellId\}\}/g, cellId);
  cell.innerHTML = `<section class="panel"><header><h2>${panelTypes[type].title}</h2><button class="close-btn">×</button></header><div class="body">${html}</div></section>`;
  cell.querySelector('.close-btn').onclick = () => removePanel(cellId);
  attachPanelEvents(type, cellId);
  savePanelAssignments();
  loadDisplays();
  loadNotes();
}

function removePanel(cellId) {
  const type = panelAssignments[cellId];
  delete panelAssignments[cellId];
  const cell = document.getElementById(cellId);
  cell.innerHTML = '<button class="add-btn">+</button>';
  cell.querySelector('.add-btn').onclick = (e) => showMenu(cellId, e);
  savePanelAssignments();
}

function attachPanelEvents(type, cellId) {
  if (type === 'initiative') {
    document.getElementById(`addInitBtn-${cellId}`).addEventListener('click', () => {
      const name = document.getElementById(`initName-${cellId}`).value.trim();
      const init = parseInt(document.getElementById(`initValue-${cellId}`).value,10);
      addInitiative(name, init);
      document.getElementById(`initName-${cellId}`).value=''; document.getElementById(`initValue-${cellId}`).value='';
    });
    document.getElementById(`sortInitBtn-${cellId}`).addEventListener('click', sortInitiative);
    document.getElementById(`clearInitBtn-${cellId}`).addEventListener('click', clearInitiative);
  } else if (type === 'dice') {
    document.querySelectorAll(`[data-cell="${cellId}"]`).forEach(btn => btn.addEventListener('click', e => diceRoll(Number(e.currentTarget.dataset.die), cellId)));
    document.getElementById(`roll3d6-${cellId}`).addEventListener('click', () => diceRollN(3,6, cellId));
    document.getElementById(`roll2d6-${cellId}`).addEventListener('click', () => diceRollN(2,6, cellId));
  } else if (type === 'notes') {
    const notesArea = document.getElementById(`notesText-${cellId}`);
    if (notesArea) {
      notesArea.addEventListener('input', () => autoSaveNotes(cellId));
    }
  }
}

function loadNotes(){
  Object.keys(panelAssignments).forEach(cellId => {
    if (panelAssignments[cellId] === 'notes') {
      const notesEle = document.getElementById(`notesText-${cellId}`);
      if (notesEle) {
        const txt = localStorage.getItem(`cairn-notes-${cellId}`) || '';
        notesEle.value = txt;
      }
    }
  });
}

function autoSaveNotes(cellId){
  const notesEle = document.getElementById(`notesText-${cellId}`);
  if(!notesEle) return;
  localStorage.setItem(`cairn-notes-${cellId}`, notesEle.value);
}

window.addEventListener('storage', (event) => {
  if(['cairn-chars','cairn-map','cairn-monsters','cairn-notes','cairn-last-updated'].includes(event.key)) {
    loadDisplays();
    loadNotes();
  }
});

window.addEventListener('message', (event) => {
  if(event.data && event.data.type === 'cairn_data_updated') {
    loadDisplays();
    loadNotes();
  }
});

function loadDisplays(){
  const chars = JSON.parse(localStorage.getItem('cairn-chars') || '[]');
  const map = localStorage.getItem('cairn-map');
  const monsters = JSON.parse(localStorage.getItem('cairn-monsters') || '[]');

  Object.keys(panelAssignments).forEach(cellId => {
    const type = panelAssignments[cellId];
    const cell = document.getElementById(cellId);
    if (!cell) return;
    if (type === 'character') {
      const display = cell.querySelector(`#charDisplay-${cellId}`);
      if (display) {
        if (chars.length) {
          const html = chars.map((c,i)=>`<div style="margin:2px 0; padding:4px 4px; border:1px solid #2c4a67; border-radius:4px;">${i+1}. <strong>${c.name}</strong> <button data-add-init-char="${i}" data-cell="${cellId}" style="border:none;background:#2c6f3e;color:#fff;border-radius:3px;padding:2px 6px;cursor:pointer;">+Init</button><br><small>BG:${c.background} STR:${c.STR} DEX:${c.DEX} WIL:${c.WIL}</small><br>HP: <input data-hp-edit-char="${i}" data-cell="${cellId}" type="number" value="${c.hp}" style="width:72px; background:#152d46; color:#fff; border:1px solid #3f5a7a; border-radius:3px;"/> <button data-save-hp-char="${i}" data-cell="${cellId}" style="border:none;background:#4a7b2f;color:#fff;border-radius:3px;padding:1px 6px;cursor:pointer;">Save HP</button></div>`).join('');
          display.innerHTML = html;
          display.querySelectorAll(`[data-cell="${cellId}"][data-add-init-char]`).forEach(btn => btn.addEventListener('click', e => {
            const ci = Number(e.currentTarget.dataset.addInitChar);
            const cp = chars[ci];
            addInitiative(cp.name, cp.DEX, cp.hp, `From char ${cp.name}`);
          }));
          display.querySelectorAll(`[data-cell="${cellId}"][data-save-hp-char]`).forEach(btn => btn.addEventListener('click', e => {
            const ci = Number(e.currentTarget.dataset.saveHpChar);
            const input = display.querySelector(`[data-cell="${cellId}"][data-hp-edit-char='${ci}']`);
            const newHP = Number(input.value);
            if (!Number.isNaN(newHP)) {
              chars[ci].hp = newHP;
              localStorage.setItem('cairn-chars', JSON.stringify(chars));
              loadDisplays();
            }
          }));
        } else {
          display.textContent = 'No character generated yet.';
        }
      }
    } else if (type === 'map') {
      const display = cell.querySelector(`#mapDisplay-${cellId}`);
      if (display) {
        display.textContent = map || 'No map generated yet.';
      }
    } else if (type === 'bestiary') {
      const display = cell.querySelector(`#bestDisplay-${cellId}`);
      if (display) {
        if (monsters.length) {
          const html = monsters.map((m,i)=>`<div style="margin:2px 0;">${i+1}. <strong>${m.name}</strong> <button data-add-init-monster="${i}" data-cell="${cellId}" style="border:none;background:#2c6f3e;color:#fff;border-radius:3px;padding:2px 6px;cursor:pointer;">+Init</button><br><small>${m.Category} HP:<input data-hp-edit-monster="${i}" data-cell="${cellId}" type="number" value="${m.HP}" style="width:50px; background:#152d46; color:#fff; border:1px solid #3f5a7a; border-radius:3px;"/> <button data-save-hp-monster="${i}" data-cell="${cellId}" style="border:none;background:#4a7b2f;color:#fff;border-radius:3px;padding:1px 6px;cursor:pointer;">Save</button> Atk:${m.Attack} Traits:${m.Traits}</small></div>`).join('');
          display.innerHTML = html;
          display.querySelectorAll(`[data-cell="${cellId}"][data-add-init-monster]`).forEach(btn => btn.addEventListener('click', e => {
            const mi = Number(e.currentTarget.dataset.addInitMonster);
            const m = monsters[mi];
            addInitiative(m.name, Math.floor(Math.random()*20)+1, m.HP, `From monster ${m.name}`);
          }));
          display.querySelectorAll(`[data-cell="${cellId}"][data-save-hp-monster]`).forEach(btn => btn.addEventListener('click', e => {
            const mi = Number(e.currentTarget.dataset.saveHpMonster);
            const input = display.querySelector(`[data-cell="${cellId}"][data-hp-edit-monster='${mi}']`);
            const newHP = Number(input.value);
            if (!Number.isNaN(newHP)) {
              monsters[mi].HP = newHP;
              localStorage.setItem('cairn-monsters', JSON.stringify(monsters));
              loadDisplays();
            }
          }));
        } else {
          display.textContent = 'No monsters saved yet.';
        }
      }
    }
  });

  loadNotes();
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadPanelAssignments();
  for(let i=1; i<=8; i++){
    const cell = document.getElementById(`cell${i}`);
    const btn = cell.querySelector('.add-btn');
    btn.onclick = (e) => showMenu(`cell${i}`, e);
  }
  // Reassign existing panels
  Object.keys(panelAssignments).forEach(cellId => {
    assignPanel(panelAssignments[cellId], cellId);
  });

  document.getElementById('exportAllBtn').addEventListener('click', exportAllData);
  document.getElementById('importAllBtn').addEventListener('click', ()=>document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importAllData);
});

function exportAllData(){
  const notes = {};
  Object.keys(panelAssignments).forEach(cellId => {
    if (panelAssignments[cellId] === 'notes') {
      notes[cellId] = localStorage.getItem(`cairn-notes-${cellId}`) || '';
    }
  });
  const payload = {
    chars: JSON.parse(localStorage.getItem('cairn-chars') || '[]'),
    map: localStorage.getItem('cairn-map') || '',
    monsters: JSON.parse(localStorage.getItem('cairn-monsters') || '[]'),
    notes: notes,
    panelAssignments: panelAssignments,
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
      if(payload.notes) {
        Object.keys(payload.notes).forEach(cellId => {
          localStorage.setItem(`cairn-notes-${cellId}`, payload.notes[cellId] || '');
        });
      }
      if(payload.panelAssignments) {
        panelAssignments = payload.panelAssignments;
        savePanelAssignments();
        // Clear all cells
        for(let i=1; i<=8; i++){
          const cell = document.getElementById(`cell${i}`);
          cell.innerHTML = '<button class="add-btn">+</button>';
          cell.querySelector('.add-btn').onclick = (e) => showMenu(`cell${i}`, e);
        }
        // Reassign
        Object.keys(panelAssignments).forEach(cellId => {
          assignPanel(panelAssignments[cellId], cellId);
        });
      }
      if(payload.initiative) {
        initiativeEntries = payload.initiative;
        renderInitiative();
      }
      loadDisplays();
      loadNotes();
      alert('Data imported.');
    } catch(e){ alert('Invalid JSON import'); }
  };
  reader.readAsText(file);
  event.target.value = '';
}
