import { useRef, useState } from 'react';

export default function AddItemForm({ onAdd }) {
  const [value, setValue] = useState('');
  const [msg, setMsg] = useState('');
  const timer = useRef(null);

  const submit = (e) => {
    e.preventDefault();
    const raw = value
      .split(/[\s,;]+/)
      .map((x) => Number(x))
      .filter((n) => Number.isFinite(n) && n >= 1 && Number.isInteger(n));
    if (raw.length === 0) {
      setMsg('Введите положительные числа');
      return;
    }
    onAdd(raw);
    setValue('');
    setMsg(`Добавлено в очередь: ${raw.join(', ')} (появится в течение 10 с)`);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(''), 4000);
  };

  return (
    <form className="add-form" onSubmit={submit}>
      <input
        className="add-input"
        value={value}
        placeholder="Новые ID (через запятую)"
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="btn" type="submit">
        Добавить
      </button>
      {msg && <div className="add-msg">{msg}</div>}
    </form>
  );
}
