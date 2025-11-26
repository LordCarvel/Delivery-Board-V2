export function getWorkspaceId() {
  // Prefer hash route like #/workspace/:id, fallback to ?ws= or localStorage
  try {
    const hash = location.hash || '';
    const m = hash.match(/#\/workspace\/([^\/\?]+)/);
    if (m && m[1]) return m[1];
  } catch (e) {}
  const ws = new URLSearchParams(location.search).get('ws');
  const stored = localStorage.getItem('workspaceId');
  return ws || stored || 'default';
}

export function setWorkspaceId(wsId) {
  localStorage.setItem('workspaceId', wsId);
}

export function updateUrlWorkspace(wsId) {
  // Update both search param and hash route for compatibility
  try {
    const sp = new URLSearchParams(location.search);
    sp.set('ws', wsId);
    const newSearch = sp.toString();
    const base = location.pathname + (newSearch ? `?${newSearch}` : '');
    // Replace search without reloading by using history API
    history.replaceState(null, '', base + location.hash);
  } catch (e) {}
  try {
    // Also set hash route for direct linking
    location.hash = `#/workspace/${wsId}`;
  } catch (e) {}
}
