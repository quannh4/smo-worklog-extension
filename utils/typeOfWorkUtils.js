// Type of Work helpers (pure functions, no DOM/network)

const DEFAULT_TYPE_OF_WORK_ID = 6; // Coding
const FALLBACK_TYPES_OF_WORK = [{ id: DEFAULT_TYPE_OF_WORK_ID, name: 'Coding' }];

function escapeHtmlText(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Accepts API response { typeOfWorks: [...] } and returns [{id, name}]
function normalizeTypesOfWork(data) {
  const list = data && Array.isArray(data.typeOfWorks) ? data.typeOfWorks : [];
  const types = list
    .filter(t => t && t.id != null && t.name)
    .map(t => ({ id: Number(t.id), name: String(t.name) }));
  return types.length > 0 ? types : FALLBACK_TYPES_OF_WORK.slice();
}

// Pick saved id if it still exists, else Coding (6), else first item
function resolveDefaultTypeOfWork(types, savedId) {
  const saved = Number(savedId);
  if (types.some(t => t.id === saved)) return saved;
  if (types.some(t => t.id === DEFAULT_TYPE_OF_WORK_ID)) return DEFAULT_TYPE_OF_WORK_ID;
  return types.length > 0 ? types[0].id : DEFAULT_TYPE_OF_WORK_ID;
}

function buildTypeOfWorkOptions(types, selectedId) {
  return types
    .map(t => `<option value="${t.id}"${t.id === Number(selectedId) ? ' selected' : ''}>${escapeHtmlText(t.name)}</option>`)
    .join('');
}
