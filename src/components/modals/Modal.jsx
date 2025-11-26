import styles from './Modal.module.css';

function Modal({ isOpen, title, onClose, onSubmit, children }) {
  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <form onSubmit={handleSubmit}>
          {children}
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className="secondary-btn">
              Cancelar
            </button>
            <button type="submit" className="primary-btn">
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Modal;
