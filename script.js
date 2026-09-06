let songs = [];
const list = document.querySelector('#song-list');
const dialog = document.querySelector('#song-dialog');
let currentSong = songs[0];
let currentFilter = 'recentes';
let fontSize = 16;
const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const bflatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const instrumentOffsets = { Flauta: 0, Gaita: 0, teclado: 0, violao: 0};
const favoritesKey = 'ciframel-favorites';
let favorites = new Set(JSON.parse(localStorage.getItem(favoritesKey) || '[]'));
const themeToggle = document.querySelector('#theme-toggle');

function setTheme(isDark) {
  document.body.classList.toggle('warm-mode', isDark);
  themeToggle.textContent = isDark ? '☀' : '◐';
  themeToggle.setAttribute('aria-label', isDark ? 'Usar tema claro' : 'Usar tema escuro');
  document.querySelector('meta[name="theme-color"]').setAttribute('content', isDark ? '#211b1b' : '#f8f5f0');
}

function normalizeText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function saveFavorites() {
  localStorage.setItem(favoritesKey, JSON.stringify([...favorites]));
}

async function loadSongs() {
  try {
    const response = await fetch('louvores.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    songs = await response.json();
    currentSong = songs[0];
    renderSongs();
  } catch (error) {
    list.innerHTML = '<p class="empty-state">Não foi possível carregar os louvores.<br><small>Abra o projeto por um servidor local para acessar louvores.json.</small></p>';
    document.querySelector('#result-count').textContent = 'Erro ao carregar';
    console.error('Falha ao carregar louvores.json:', error);
  }
}

function normalizePitch(note) {
  const normalized = note.trim().toUpperCase().replace('♭', 'b').replace('♯', '#');
  const normalizations = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
    'CB': 'B', 'E#': 'F', 'B#': 'C'
  };
  return normalizations[normalized] || normalized;
}

function isFlat(note) {
  const normalized = note.trim().toUpperCase().replace('♭', 'b').replace('♯', '#');
  return ['Db', 'Eb', 'Fb', 'Gb', 'Ab', 'Bb', 'CB'].includes(normalized);
}

function isMinorKey(key) {
  return key.trim().endsWith('m');
}

function transposeNote(note, semitones) {
  const normalized = normalizePitch(note);
  const index = noteNames.indexOf(normalized);
  
  if (index < 0) return note;
  
  const newIndex = (index + semitones + 12) % 12;
  
  // Se a nota original era bemol, retorna em formato bemol
  if (isFlat(note)) {
    return bflatNames[newIndex];
  }
  
  return noteNames[newIndex];
}

function transposeChordLine(chord, semitones) {
  return chord.replace(/[A-Ga-g](?:#|b|♯|♭)?(?:\([^)]*\))?/g, note => {
    return transposeNote(note, semitones);
  });
}

function keyRoot(key) {
  return normalizePitch(key.replace(/m$/, ''));
}

function filterKeyOptions() {
  if (!currentSong || !currentSong.key) return;
  
  const keySelect = document.querySelector('#key-select');
  const originalKeyIsMinor = isMinorKey(currentSong.key);
  
  keySelect.querySelectorAll('option').forEach(option => {
    const optionKey = option.value;
    const optionIsMinor = isMinorKey(optionKey);
    
    if (originalKeyIsMinor === optionIsMinor) {
      option.style.display = '';
    } else {
      option.style.display = 'none';
    }
  });
}

function renderLyrics() {
  const selectedKey = document.querySelector('#key-select').value;
  const instrument = document.querySelector('#instrument-select').value;
  const selectedIndex = noteNames.indexOf(keyRoot(selectedKey));
  const originalIndex = noteNames.indexOf(keyRoot(currentSong.key));
  const keyShift = selectedIndex - originalIndex;
  const totalShift = keyShift + instrumentOffsets[instrument];
  document.querySelector('#lyrics-content').innerHTML = currentSong.melody.map(([chord, line]) => {
    const notes = transposeChordLine(chord, totalShift);
    return `<div class="verse"><span class="chord">${notes}</span><span class="line">${line}</span></div>`;
  }).join('');
  const instrumentName = document.querySelector('#instrument-select').selectedOptions[0].textContent;
  document.querySelector('#notation-note').innerHTML = `<span>♪</span> ${instrumentName} · notas transpostas para ${selectedKey}`;
}

function renderSongs() {
  const query = normalizeText(document.querySelector('#search-input').value);
  const visible = songs.filter(song => {
    const searchableText = normalizeText(`${song.number} ${song.title} ${song.artist} ${song.category} ${song.melody.flat().join(' ')}`);
    const matchesFilter = currentFilter === 'favoritos' ? favorites.has(song.title) : !currentFilter || song.tags.includes(currentFilter);
    return (!query || searchableText.includes(query)) && matchesFilter;
  });
  list.innerHTML = visible.map(song => `<button class="song-card" data-index="${songs.indexOf(song)}"><span class="song-number">${String(song.number).padStart(2, '0')}</span><span class="song-card-info"><span class="song-title">${song.title}</span><span class="song-meta">${song.category} · [${song.key}]</span></span><span class="song-key">${song.key}</span></button>`).join('');
  document.querySelector('#result-count').textContent = `${visible.length} ${visible.length === 1 ? 'melodia' : 'melodias'}`;
  document.querySelector('#empty-state').hidden = visible.length > 0;
  document.querySelectorAll('.song-card').forEach(card => card.addEventListener('click', () => openSong(songs[card.dataset.index])));
}

function openSong(song) {
  currentSong = song;
  document.querySelector('#dialog-title').textContent = song.title;
  document.querySelector('#dialog-category').textContent = song.category;
  document.querySelector('#favorite-dialog').textContent = favorites.has(song.title) ? '♥' : '♡';
  document.querySelector('#key-select').value = song.key;
  filterKeyOptions();
  renderLyrics();
  dialog.showModal();
}

document.querySelector('#search-input').addEventListener('input', renderSongs);
document.querySelectorAll('.chip').forEach(chip => chip.addEventListener('click', () => { currentFilter = chip.dataset.filter; document.querySelectorAll('.chip').forEach(item => item.classList.toggle('active', item.data-filter === currentFilter)); renderSongs(); }));
document.querySelector('#clear-filters').addEventListener('click', () => { currentFilter = ''; document.querySelectorAll('.chip').forEach(item => item.classList.remove('active')); renderSongs(); });
document.querySelector('#reset-search').addEventListener('click', () => { document.querySelector('#search-input').value = ''; currentFilter = ''; document.querySelectorAll('.chip').forEach(item => item.classList.remove('active')); renderSongs(); });
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
document.querySelector('#favorite-dialog').addEventListener('click', event => {
  if (favorites.has(currentSong.title)) favorites.delete(currentSong.title);
  else favorites.add(currentSong.title);
  saveFavorites();
  event.currentTarget.textContent = favorites.has(currentSong.title) ? '♥' : '♡';
  renderSongs();
});
document.querySelector('#font-smaller').addEventListener('click', () => { fontSize = Math.max(13, fontSize - 1); document.querySelector('#lyrics-content').style.fontSize = `${fontSize}px`; });
document.querySelector('#font-larger').addEventListener('click', () => { fontSize = Math.min(22, fontSize + 1); document.querySelector('#lyrics-content').style.fontSize = `${fontSize}px`; });
themeToggle.addEventListener('click', () => {
  const isDark = !document.body.classList.contains('warm-mode');
  setTheme(isDark);
  localStorage.setItem('ciframel-theme', isDark ? 'dark' : 'light');
});
document.querySelector('#key-select').addEventListener('change', renderLyrics);
document.querySelector('#instrument-select').addEventListener('change', renderLyrics);
document.querySelector('a[href="#favoritos"]').addEventListener('click', event => {
  event.preventDefault();
  currentFilter = 'favoritos';
  document.querySelectorAll('.chip').forEach(item => item.classList.toggle('active', item.dataset.filter === currentFilter));
  renderSongs();
  document.querySelector('#songs-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
document.addEventListener('keydown', event => { if (event.key === '/' && document.activeElement.tagName !== 'INPUT') { event.preventDefault(); document.querySelector('#search-input').focus(); } });
setTheme(localStorage.getItem('ciframel-theme') === 'dark');
loadSongs();
