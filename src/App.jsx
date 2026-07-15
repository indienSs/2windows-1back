import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiQueue } from './api.js';
import LeftPanel from './components/LeftPanel.jsx';
import RightPanel from './components/RightPanel.jsx';

export default function App() {
  const [reloadToken, setReloadToken] = useState(0);
  const queueRef = useRef(null);

  useEffect(() => {
    const queue = new ApiQueue({
      onFlushed: () => setReloadToken((t) => t + 1),
    });
    queueRef.current = queue;
    return () => {
      queue.destroy();
      queueRef.current = null;
    };
  }, []);

  const handleDragState = useCallback((active) => {
    if (active) queueRef.current?.pause();
    else queueRef.current?.resume();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <p className="subtitle">
          1 000 000 элементов · добавление пакетами 10 с · синхронизация 1 с
        </p>
      </header>

      <div className="panels">
        <LeftPanel
          reloadToken={reloadToken}
          onSelect={(id) => queueRef.current?.requestSelect(id)}
          onAdd={(ids) => queueRef.current?.requestAdd(ids)}
        />
        <RightPanel
          reloadToken={reloadToken}
          onDeselect={(id) => queueRef.current?.requestDeselect(id)}
          onReorder={(a, b) => queueRef.current?.requestReorder(a, b)}
          onDragState={handleDragState}
        />
      </div>
    </div>
  );
}
