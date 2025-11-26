import styles from './Pedido.module.css';

const STATUS_LABELS = {
  pendente: 'pendente',
  entregue: 'entregue',
  'nao-entregue': 'nao-entregue',
  cancelado: 'cancelado',
};

function Pedido({ numeroPedido, statusEntrega = 'pendente', highlighted = false, onClick, onReopen }) {
  const statusKey = STATUS_LABELS[statusEntrega] || 'pendente';

  return (
    <div
      className={styles.pedido}
      data-status={statusKey}
      data-highlighted={highlighted ? 'true' : 'false'}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
        if (e.key === 'r' && statusKey !== 'pendente') {
          onReopen?.();
        }
      }}
      onDoubleClick={() => {
        if (statusKey !== 'pendente') onReopen?.();
      }}
    >
      <span className={styles.numero}>#{numeroPedido}</span>
      <span className={styles.status}>{statusKey}</span>
      {statusKey !== 'pendente' && (
        <button
          type="button"
          className={styles.reopen}
          title="Reabrir (voltar para pendente)"
          onClick={(e) => {
            e.stopPropagation();
            onReopen?.();
          }}
        >
          ↺
        </button>
      )}
    </div>
  );
}

export default Pedido;
