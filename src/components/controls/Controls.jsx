import { useRef, useState } from 'react';
import styles from './Controls.module.css';

function Controls({
  searchValue = '',
  onSearch,
  onAddMotoboy,
  onClearAll,
  onSetWorkspace,
  onExport,
  onImport,
  activeFilter,
  syncStatus,
}) {
  const [workspaceValue, setWorkspaceValue] = useState('');
  const importFileRef = useRef(null);

  const handleImportClick = () => {
    importFileRef.current?.click();
  };

  const handleImportChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport?.(file);
      e.target.value = '';
    }
  };

  const handleSetWorkspace = () => {
    const ws = workspaceValue.trim() || 'default';
    onSetWorkspace?.(ws);
    setWorkspaceValue('');
  };

  const handleCopyLink = () => {
    const link = location.href;
    try {
      navigator.clipboard.writeText(link);
      window.alert('Link copiado para a area de transferencia');
    } catch (e) {
      window.prompt('Copie o link abaixo:', link);
    }
  };

  return (
    <section className={styles.controls}>
      <input
        id="searchInput"
        type="text"
        placeholder="Buscar por numero do pedido"
        className="search-input"
        value={searchValue}
        onChange={(e) => onSearch?.(e.target.value)}
      />
      <div className={styles.buttonGroup}>
        {activeFilter && (
          <button
            id="clearFiltersBtn"
            className="secondary-btn"
            onClick={() => onSearch?.('')}
          >
            Limpar busca
          </button>
        )}
        <button
          id="addMotoboyBtn"
          className="primary-btn"
          onClick={onAddMotoboy}
        >
          + Motoboy
        </button>
        <button
          id="clearAllBtn"
          className="secondary-btn"
          onClick={onClearAll}
        >
          Limpar tudo
        </button>
        <button
          id="copyLinkBtn"
          className="secondary-btn"
          onClick={handleCopyLink}
        >
          Copiar link
        </button>
      </div>
      <div className={styles.workspaceGroup}>
        <input
          id="workspaceInput"
          className="search-input"
          style={{ width: '220px' }}
          placeholder="Workspace (ex: pizzaria-123)"
          value={workspaceValue}
          onChange={(e) => setWorkspaceValue(e.target.value)}
        />
        <button
          id="setWorkspaceBtn"
          className="secondary-btn"
          onClick={handleSetWorkspace}
        >
          Definir workspace
        </button>
        <span
          id="syncStatus"
          style={{
            fontFamily: 'var(--font-ibm-plex-mono)',
            fontSize: '0.85rem',
            color: '#555',
          }}
        >
          sync: {syncStatus || 'idle'}
        </span>
        <button
          id="exportBtn"
          className="secondary-btn"
          onClick={onExport}
        >
          Exportar JSON
        </button>
        <button
          id="importBtn"
          className="secondary-btn"
          onClick={handleImportClick}
        >
          Importar JSON
        </button>
        <input
          ref={importFileRef}
          id="importFile"
          type="file"
          accept="application/json"
          style={{ display: 'none' }}
          onChange={handleImportChange}
        />
      </div>
    </section>
  );
}

export default Controls;
