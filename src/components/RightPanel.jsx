import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ListWindow from './ListWindow.jsx';
import { useInfiniteList } from '../hooks/useInfiniteList.js';
import { fetchRight } from '../api.js';

function SortableRow({ id, onDeselect }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`row ${isDragging ? 'dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <span className="drag-handle" {...attributes} {...listeners} title="Тяните для сортировки">
        ::
      </span>
      <span className="row-id">#{id}</span>
      <button className="btn btn-remove" onClick={() => onDeselect(id)} title="Убрать <=">
        {"<="}
      </button>
    </div>
  );
}

export default function RightPanel({ reloadToken, onDeselect, onReorder, onDragState }) {
  const [search, setSearch] = useState('');
  const { items, hasMore, loading, loadMore, setItems } = useInfiniteList(
    (opts) => fetchRight(opts),
    { search, reloadToken },
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const onDragEnd = (e) => {
    const { active, over } = e;
    if (!over || active.id === over.id) {
      onDragState(false);
      return;
    }
    setItems((prev) => {
      const from = prev.indexOf(active.id);
      const to = prev.indexOf(over.id);
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
    onReorder(active.id, over.id);
    onDragState(false);
  };

  return (
    <section className="panel panel-right">
      <header className="panel-header">
        <h2>Выбранные ({items.length})</h2>
        <input
          className="search"
          placeholder="Фильтр по ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </header>

      <ListWindow
        items={items}
        hasMore={hasMore}
        loading={loading}
        onLoadMore={loadMore}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={() => onDragState(true)}
          onDragEnd={onDragEnd}
          onDragCancel={() => onDragState(false)}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((id) => (
              <SortableRow key={id} id={id} onDeselect={onDeselect} />
            ))}
          </SortableContext>
        </DndContext>
      </ListWindow>
    </section>
  );
}
