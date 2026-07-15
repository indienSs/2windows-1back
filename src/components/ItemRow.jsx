export default function ItemRow({ id, onSelect }) {
  return (
    <div className="row">
      <span className="row-id">#{id}</span>
      <button className="btn btn-add" onClick={() => onSelect(id)} title="Выбрать →">
        →
      </button>
    </div>
  );
}
