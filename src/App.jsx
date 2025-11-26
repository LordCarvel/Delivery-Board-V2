import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Footer from './components/footer/Footer';
import Header from './components/header/Header';
import RouteBar from './components/router/RouteBar';
import Controls from './components/controls/Controls';
import MotoboyContainer from './components/motoboy/MotoboyContainer';
import MotoboyCard from './components/motoboy/MotoboyCard';
import Leva from './components/leva/Leva';
import Pedido from './components/pedido/Pedido';
import AddMotoboyModal from './components/modals/AddMotoboy/AddMotoboyModal';
import AddLevaModal from './components/modals/AddLeva/AddLevaModal';
import EditPedidoModal from './components/modals/EditPedido/EditPedidoModal';
import { useDeliveryBoard } from './hooks/useDeliveryBoard';
import { getWorkspaceId, setWorkspaceId, updateUrlWorkspace } from './utils/workspace';
import { useRoute } from './router/Router';
import { exportToJSON, importFromJSON } from './utils/fileOperations';
import { parsePedidos } from './utils/dataHelpers';

function formatShortTime(value) {
  if (!value) return '--:--';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function App() {
  const {
    motoboys,
    viagens,
    entregas,
    addMotoboy,
    removeMotoboy,
    openViagem,
    closeViagem,
    reopenViagem,
    removeViagem,
    addEntrega,
    addEntregasBulk,
    moveEntrega,
    updateEntrega,
    setEntregaEntregue,
    removeEntrega,
    findEntregas,
    clearStore,
    replaceStore,
    store,
  } = useDeliveryBoard();

  const [addMotoboyModalOpen, setAddMotoboyModalOpen] = useState(false);
  const [addLevaModalOpen, setAddLevaModalOpen] = useState(false);
  const [editPedidoModalOpen, setEditPedidoModalOpen] = useState(false);

  const [currentMotoboyId, setCurrentMotoboyId] = useState(null);
  const [currentEntregaId, setCurrentEntregaId] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  const syncStatus = 'idle';
  const workspaceId = getWorkspaceId();
  const route = useRoute();

  useEffect(() => {
    setWorkspaceId(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (!route) return;
    if (route.name === 'workspace' && route.params?.workspaceId) {
      const ws = route.params.workspaceId;
      setWorkspaceId(ws);
      updateUrlWorkspace(ws);
    }
  }, [route]);

  const viagemById = useMemo(() => new Map(viagens.map((v) => [v.id, v])), [viagens]);

  const motoboyEntregaStats = useMemo(() => {
    const stats = new Map();
    motoboys.forEach((m) => stats.set(m.id, { total: 0, entregues: 0 }));
    entregas.forEach((e) => {
      const viagem = viagemById.get(e.viagemId);
      if (!viagem) return;
      const mid = viagem.motoboyId;
      if (!stats.has(mid)) stats.set(mid, { total: 0, entregues: 0 });
      const entry = stats.get(mid);
      entry.total += 1;
      if (e.statusEntrega === 'entregue') entry.entregues += 1;
    });
    return stats;
  }, [motoboys, entregas, viagemById]);

  const viagensByMotoboy = useMemo(() => {
    const map = new Map();
    motoboys.forEach((m) => map.set(m.id, []));
    viagens.forEach((v) => {
      if (!map.has(v.motoboyId)) map.set(v.motoboyId, []);
      map.get(v.motoboyId).push(v);
    });
    map.forEach((list) => list.sort((a, b) => new Date(b.dataHoraSaida) - new Date(a.dataHoraSaida)));
    return map;
  }, [motoboys, viagens]);

  const entregasByViagem = useMemo(() => {
    const map = new Map();
    viagens.forEach((v) => map.set(v.id, []));
    entregas.forEach((e) => {
      const list = map.get(e.viagemId) || [];
      list.push(e);
      map.set(e.viagemId, list);
    });
    return map;
  }, [viagens, entregas]);

  const viagemOptions = useMemo(() => viagens.map((v) => {
    const motoboyName = motoboys.find((m) => m.id === v.motoboyId)?.nome || 'Motoboy';
    return { value: v.id, label: `${motoboyName} - ${formatShortTime(v.dataHoraSaida)} (${v.status})` };
  }), [viagens, motoboys]);

  const currentEntrega = useMemo(() => entregas.find((e) => e.id === currentEntregaId) || null, [entregas, currentEntregaId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setHighlightedIds(new Set());
      return;
    }
    const matches = findEntregas(searchQuery.trim());
    setHighlightedIds(new Set(matches.map((m) => m.id)));
  }, [searchQuery, findEntregas]);

  const filterContext = useMemo(() => {
    if (!searchQuery.trim() || highlightedIds.size === 0) return null;
    const viagemIds = new Set();
    const motoboyIds = new Set();
    highlightedIds.forEach((entregaId) => {
      const entrega = entregas.find((e) => e.id === entregaId);
      if (!entrega) return;
      viagemIds.add(entrega.viagemId);
      const v = viagemById.get(entrega.viagemId);
      if (v) motoboyIds.add(v.motoboyId);
    });
    return { viagemIds, motoboyIds };
  }, [searchQuery, highlightedIds, entregas, viagemById]);

  const handleAddMotoboy = ({ motoboyName }) => {
    try {
      addMotoboy(motoboyName);
      setAddMotoboyModalOpen(false);
    } catch (err) {
      window.alert(err.message || 'Erro ao adicionar motoboy');
    }
  };

  const checkCancelados = (pedidosList = []) => {
    const cancelados = entregas.filter(
      (e) => pedidosList.includes(e.numeroPedido) && e.statusEntrega === 'cancelado',
    );
    if (!cancelados.length) return true;
    const lista = cancelados.map((e) => `#${e.numeroPedido}`).join(', ');
    return window.confirm(`Pedidos ${lista} estao marcados como cancelados. Deseja continuar?`);
  };

  const addPedidosToViagem = (viagemId, pedidosList = []) => {
    if (!pedidosList.length) return;
    if (!checkCancelados(pedidosList)) return;
    try {
      if (pedidosList.length === 1) {
        addEntrega(viagemId, pedidosList[0]);
      } else {
        addEntregasBulk(viagemId, pedidosList);
      }
    } catch (err) {
      window.alert(err.message || 'Erro ao adicionar entrega');
    }
  };

  const handleAddLeva = ({ pedidos = [] }) => {
    if (!currentMotoboyId) {
      window.alert('Selecione um motoboy antes de abrir uma viagem');
      return;
    }
    if (!pedidos.length) {
      window.alert('Informe ao menos um pedido');
      return;
    }
    if (!checkCancelados(pedidos)) return;
    try {
      const motoboyExiste = motoboys.find((m) => m.id === currentMotoboyId);
      if (!motoboyExiste) throw new Error('Motoboy nao encontrado');
      const viagem = openViagem(currentMotoboyId);
      if (!viagem || !viagem.id) throw new Error('Falha ao criar viagem');
      addPedidosToViagem(viagem.id, pedidos);
      setAddLevaModalOpen(false);
      setCurrentMotoboyId(null);
    } catch (err) {
      window.alert(err.message || 'Erro ao criar viagem');
    }
  };

  const handleAddEntregaToViagem = (viagemId, value) => {
    const pedidos = Array.isArray(value) ? value : parsePedidos(String(value || ''));
    addPedidosToViagem(viagemId, pedidos);
  };

  const handleDeleteViagem = (viagemId) => {
    if (!window.confirm('Excluir esta viagem e suas entregas?')) return;
    removeViagem(viagemId, { cascade: true });
  };

  const handleReopenViagem = (viagemId) => {
    reopenViagem(viagemId);
  };

  const handleDeleteMotoboy = (motoboyId) => {
    if (!window.confirm('Excluir este motoboy e todas as suas viagens?')) return;
    removeMotoboy(motoboyId, { cascade: true });
  };

  const handleEditEntrega = (data) => {
    if (!currentEntregaId) return;

    if (data.action === 'delete') {
      removeEntrega(currentEntregaId);
      setEditPedidoModalOpen(false);
      setCurrentEntregaId(null);
      return;
    }

    const entregaAlvo = entregas.find((e) => e.id === currentEntregaId);
    if (!entregaAlvo) return;

    try {
      if (data.targetViagemId && data.targetViagemId !== entregaAlvo.viagemId) {
        moveEntrega(currentEntregaId, data.targetViagemId);
      }

      const updates = {};
      if (data.numeroPedido && data.numeroPedido !== entregaAlvo.numeroPedido) {
        updates.numeroPedido = data.numeroPedido;
      }
      if (data.statusEntrega === 'entregue') {
        setEntregaEntregue(currentEntregaId);
      } else if (data.statusEntrega && data.statusEntrega !== entregaAlvo.statusEntrega) {
        updates.statusEntrega = data.statusEntrega;
      }

      if (Object.keys(updates).length) {
        updateEntrega(currentEntregaId, updates);
      }

      setEditPedidoModalOpen(false);
      setCurrentEntregaId(null);
    } catch (err) {
      window.alert(err.message || 'Erro ao editar entrega');
    }
  };

  const handleReopenEntrega = (entregaId) => {
    if (!entregaId) return;
    updateEntrega(entregaId, { statusEntrega: 'pendente' });
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
  };

  const handleClearAll = () => {
    if (!window.confirm('Apagar todos os dados deste workspace?')) return;
    clearStore();
    localStorage.removeItem('deliveryBoardV2');
    localStorage.removeItem('motoboys');
    setSearchQuery('');
    setHighlightedIds(new Set());
  };

  const handleSetWorkspace = (newWorkspace) => {
    if (!newWorkspace.trim()) return;
    setWorkspaceId(newWorkspace);
    updateUrlWorkspace(newWorkspace);
  };

  const handleExport = () => {
    exportToJSON(store, workspaceId);
  };

  const handleImport = async (file) => {
    const result = await importFromJSON(file);
    if (result.success) {
      replaceStore(result.data);
      setHighlightedIds(new Set());
      setSearchQuery('');
      window.alert('Importacao concluida');
    } else {
      window.alert(`Falha ao importar: ${result.error}`);
    }
  };

  const hasSearch = Boolean(searchQuery.trim());
  const hasResults = highlightedIds.size > 0;
  const shouldFilter = hasSearch && hasResults && filterContext;

  const motoboysToRender = useMemo(() => {
    if (!shouldFilter || !filterContext) return motoboys;
    return motoboys.filter((m) => filterContext.motoboyIds.has(m.id));
  }, [motoboys, shouldFilter, filterContext]);

  const renderMotoboys = () => {
    if (!motoboysToRender.length) {
      return (
        <p style={{ textAlign: 'center', color: 'gray', padding: '1rem' }}>
          {hasSearch && !hasResults ? 'Nenhuma entrega encontrada para esta busca.' : 'Nenhum motoboy registrado.'}
        </p>
      );
    }

    return motoboysToRender.map((motoboy) => {
      const viagensDoMotoboy = viagensByMotoboy.get(motoboy.id) || [];
      const viagensParaRender = shouldFilter && filterContext
        ? viagensDoMotoboy.filter((v) => filterContext.viagemIds.has(v.id))
        : viagensDoMotoboy;

      if (shouldFilter && filterContext && viagensParaRender.length === 0) {
        return null;
      }

      return (
        <MotoboyCard
          key={motoboy.id}
          motoboy={motoboy}
          stats={motoboyEntregaStats.get(motoboy.id)}
          onAddViagem={() => {
            setCurrentMotoboyId(motoboy.id);
            setAddLevaModalOpen(true);
          }}
          onDeleteMotoboy={() => handleDeleteMotoboy(motoboy.id)}
        >
          {viagensParaRender.length === 0 && (
            <p style={{ color: '#777', fontSize: '0.9rem' }}>Nenhuma viagem registrada.</p>
          )}

          {viagensParaRender.map((viagem) => {
            const entregasDaViagem = entregasByViagem.get(viagem.id) || [];
            const entregasParaRender = shouldFilter && filterContext
              ? entregasDaViagem.filter((e) => highlightedIds.has(e.id))
              : entregasDaViagem;

            return (
              <Leva
                key={viagem.id}
                viagem={viagem}
                onAddEntrega={(numeroPedido) => handleAddEntregaToViagem(viagem.id, numeroPedido)}
                onAddEntregas={(lista) => handleAddEntregaToViagem(viagem.id, lista)}
                onClose={() => closeViagem(viagem.id)}
                onReopen={() => handleReopenViagem(viagem.id)}
                onDelete={() => handleDeleteViagem(viagem.id)}
              >
                {entregasParaRender.map((entrega) => (
                  <Pedido
                    key={entrega.id}
                    numeroPedido={entrega.numeroPedido}
                    statusEntrega={entrega.statusEntrega}
                    highlighted={highlightedIds.has(entrega.id)}
                    onClick={() => {
                      setCurrentEntregaId(entrega.id);
                      setEditPedidoModalOpen(true);
                    }}
                    onReopen={() => handleReopenEntrega(entrega.id)}
                  />
                ))}

                {entregasParaRender.length === 0 && (
                  <p style={{ color: '#777', fontSize: '0.85rem', padding: '0.3rem 0' }}>
                    Nenhuma entrega nesta viagem.
                  </p>
                )}
              </Leva>
            );
          })}
        </MotoboyCard>
      );
    });
  };

  return (
    <div className="body">
      <Header />
      <RouteBar />
      <main className="main-content">
        <Controls
          searchValue={searchQuery}
          onSearch={handleSearch}
          onAddMotoboy={() => setAddMotoboyModalOpen(true)}
          onClearAll={handleClearAll}
          onSetWorkspace={handleSetWorkspace}
          onExport={handleExport}
          onImport={handleImport}
          activeFilter={hasSearch}
          syncStatus={syncStatus}
        />
        <MotoboyContainer>
          {renderMotoboys()}
        </MotoboyContainer>
      </main>
      <Footer />

      <AddMotoboyModal
        isOpen={addMotoboyModalOpen}
        onClose={() => setAddMotoboyModalOpen(false)}
        onSubmit={handleAddMotoboy}
      />
      <AddLevaModal
        isOpen={addLevaModalOpen}
        onClose={() => setAddLevaModalOpen(false)}
        onSubmit={handleAddLeva}
        title="Abrir viagem"
        canceladosLookup={(pedidosList) => entregas
          .filter((e) => pedidosList.includes(e.numeroPedido) && e.statusEntrega === 'cancelado')
          .map((e) => e.numeroPedido)}
      />
      <EditPedidoModal
        isOpen={editPedidoModalOpen}
        onClose={() => setEditPedidoModalOpen(false)}
        onSubmit={handleEditEntrega}
        entrega={currentEntrega}
        viagemOptions={viagemOptions}
      />
    </div>
  );
}

export default App;
