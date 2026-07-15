import { useState } from 'react';
import ListWindow from './ListWindow.jsx';
import ItemRow from './ItemRow.jsx';
import AddItemForm from './AddItemForm.jsx';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchLeft } from '../api.js';

export default function LeftPanel({ reloadToken, onSelect, onAdd }) {
  const [search, setSearch] = useState('');
  const { items, hasMore, loading, loadMore } = useInfiniteList(
    (opts) => fetchLeft(opts),
    { search, reloadToken },
  );

  return (
    <section className="panel panel-left">
      <header className="panel-header">
        <h2>Все элементы</h2>
        <input
          className="search"
          placeholder="Фильтр по ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <AddItemForm onAdd={onAdd} />

      <ListWindow
        items={items}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
      >
        {items.map((id) => (
          <ItemRow key={id} id={id} onSelect={onSelect} />
        ))}
      </ListWindow>
    </section>
  );
}
