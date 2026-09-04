// src/utils/transposition.js
// Utility to generate chromatic transposition options matching the original key's quality (major/minor)

// Chromatic scales in sharps and flats
const CHROMATIC_SHARP = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const CHROMATIC_FLAT  = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];

function parseKey(originalKey) {
  if (!originalKey || typeof originalKey !== 'string') {
    throw new Error('originalKey must be a string like "D" or "Bm" or "Bb"');
  }
  // normalize
  let k = originalKey.trim();
  k = k.replace('♭', 'b'); // accept unicode flat
  const minor = /m$/i.test(k);
  if (minor) k = k.slice(0, -1);
  // format root: first letter uppercase, keep '#' or 'b' as-is
  k = k[0].toUpperCase() + (k.slice(1) || '');
  return { root: k, minor };
}

// Detect whether to use flats notation: if input used "b" or "♭" prefer flats, otherwise prefer sharps
function prefersFlats(originalKey) {
  if (!originalKey) return false; // default to sharps
  return originalKey.includes('b') || originalKey.includes('♭');
}

// Return 12 transposition options starting at the original root, using either sharps or flats notation.
// major/minor is preserved: majors are returned without suffix, minors with 'm'.
function getTranspositionOptions(originalKey, forceFlats = null) {
  const { root, minor } = parseKey(originalKey);
  // Choose notation
  let useFlats = forceFlats;
  if (useFlats === null) useFlats = prefersFlats(originalKey);
  const scale = useFlats ? CHROMATIC_FLAT : CHROMATIC_SHARP;

  // Find starting index. Try exact match, otherwise try enharmonic match.
  let start = scale.indexOf(root);

  // If not found (e.g., user passed 'A#' but scale uses 'Bb'), try matching enharmonics
  if (start === -1) {
    // map enharmonics
    const enharmonic = {
      'C#':'Db','Db':'C#','D#':'Eb','Eb':'D#','F#':'Gb','Gb':'F#','G#':'Ab','Ab':'G#','A#':'Bb','Bb':'A#'
    };
    const mapped = enharmonic[root];
    if (mapped) start = scale.indexOf(mapped);
  }

  if (start === -1) {
    // as a fallback, try uppercase of first letter (in case of weird inputs)
    const fallback = root[0].toUpperCase();
    start = scale.indexOf(fallback);
  }

  if (start === -1) {
    throw new Error('Could not determine root note from: ' + originalKey);
  }

  const suffix = minor ? 'm' : '';
  const result = [];
  for (let i = 0; i < 12; i++) {
    result.push(scale[(start + i) % 12] + suffix);
  }
  return result;
}

// Example small helper to render HTML <option> elements (for client-side usage)
function renderOptionsAsHtml(originalKey, forceFlats = null) {
  const options = getTranspositionOptions(originalKey, forceFlats);
  return options.map(opt => `<option value="${opt}">${opt}</option>`).join('\n');
}

module.exports = {
  getTranspositionOptions,
  renderOptionsAsHtml,
  parseKey
};
