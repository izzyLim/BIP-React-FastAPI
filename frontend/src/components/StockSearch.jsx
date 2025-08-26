import { useEffect, useRef, useState } from "react";
import { stocksAPI } from "../utils/api";

export default function StockSearch({ onSelect }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const timer = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    if (!q) {
      setItems([]);
      setOpen(false);
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      try {
        const data = await stocksAPI.search(q, 10);
        setItems(data);
        setOpen(true);
        setHighlight(0);
      } catch (error) {
        console.error('Stock search failed:', error);
        setItems([]);
        setOpen(false);
      }
    }, 250);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  useEffect(() => {
    function onDocClick(e) {
      if (!boxRef.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  function choose(i) {
    const picked = items[i];
    if (picked) {
      onSelect(picked);
      setOpen(false);
      setQ(picked.ticker);
    }
  }

  function onKeyDown(e) {
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + items.length) % items.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      choose(highlight);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="relative w-full max-w-md">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Search ticker or name..."
        className="
          w-full px-3 py-2 rounded-md
          border border-gray-300 bg-white text-gray-900 placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder-gray-500
        "
      />
      {open && items.length > 0 && (
        <div
          role="listbox"
          className="
            absolute z-20 mt-1 w-full max-h-80 overflow-y-auto
            rounded-md border border-gray-200 bg-white shadow-lg
            dark:bg-gray-800 dark:border-gray-700
          "
        >
          {items.map((s, i) => {
            const active = i === highlight;
            return (
              <div
                key={`${s.ticker}-${i}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  choose(i);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={`px-3 py-2 cursor-pointer flex items-center gap-2 justify-between
                  ${active ? "bg-gray-100 dark:bg-gray-700" : "bg-white dark:bg-gray-800"}
                `}
              >
                <span className="font-semibold text-gray-900 dark:text-gray-100">{s.ticker}</span>
                <span className="flex-1 text-left text-gray-700 dark:text-gray-300 truncate">
                  {s.stock_name}
                  {s.stock_name_eng ? ` / ${s.stock_name_eng}` : ""}
                </span>
                <span className="text-gray-500 dark:text-gray-400">{s.exchange_code}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}