import { useMemo } from 'react';
import styles from './RouteBar.module.css';
import { useRoute, navigate } from '../../router/Router';

function RouteBar() {
  const route = useRoute();

  const crumbs = useMemo(() => {
    const out = [{ label: 'Home', path: '#/' }];
    if (!route) return out;
    if (route.name === 'workspace' && route.params?.workspaceId) {
      out.push({ label: `Workspace: ${route.params.workspaceId}`, path: `#/workspace/${route.params.workspaceId}` });
      return out;
    }
    return out;
  }, [route]);

  return (
    <div className={styles.bar} data-route={route?.name || 'home'}>
      <div className={styles.left}>
        <button
          className={styles.back}
          onClick={() => (window.history.length > 1 ? window.history.back() : navigate('#/'))}
          aria-label="Voltar"
        >
          {'<'}
        </button>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          {crumbs.map((c, i) => (
            <button key={i} className={styles.crumb} onClick={() => navigate(c.path)}>
              {c.label}
            </button>
          ))}
        </nav>
      </div>

      <div className={styles.right}>
        <span className={styles.routeBadge}>{route?.name || 'home'}</span>
      </div>
    </div>
  );
}

export default RouteBar;
