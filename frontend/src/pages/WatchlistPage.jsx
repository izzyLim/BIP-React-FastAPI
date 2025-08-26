import { useEffect, useState } from 'react'
import MainLayout from '../layouts/MainLayout'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { watchlistAPI } from '../utils/api'

function SortableItem({ item, idx, editNote, handleNoteChange, handleNoteSave, handleDelete }) {
  const { setNodeRef, attributes, listeners, isDragging, transform, transition } = useSortable({ id: item.ticker })
  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        minHeight: "44px",
      }}
      {...attributes}
      className={`flex items-center gap-2 py-2 px-2 bg-white dark:bg-gray-900
                  text-sm text-gray-800 dark:text-gray-100
                  ${isDragging ? "ring-2 ring-blue-400" : ""}`}
    >
      <span className="w-6 cursor-move select-none" {...listeners}>☰</span>
      <span className="w-16 font-mono">{item.ticker}</span>
      <span className="w-32">{item.name || "-"}</span>
      <span className="ml-3 w-28 text-right">{item.exchange || "-"}</span>
      <input
        className="ml-10 w-48 border rounded px-1 py-0.5 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 text-right"
        value={editNote[item.ticker] ?? ""}
        onChange={e => handleNoteChange(item.ticker, e.target.value)}
        onBlur={() => handleNoteSave(item.ticker)}
        onKeyDown={e => e.key === "Enter" && handleNoteSave(item.ticker)}
      />
      <button
        onClick={() => handleDelete(item.ticker)}
        className="ml-5 rounded border border-transparent hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900 transition-all duration-200"
        style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
        title="삭제"
      >
        🗑️
      </button>
    </li>
  )
}

export default function WatchlistPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editNote, setEditNote] = useState({})
  const [newTicker, setNewTicker] = useState("")

  // 목록 불러오기
  const fetchList = () => {
    setLoading(true)
    watchlistAPI.getList()
      .then(data => setItems(data.sort((a, b) => a.position - b.position)))
      .finally(() => setLoading(false))
  }

  useEffect(fetchList, [])

  useEffect(() => {
    // items가 바뀔 때마다 editNote를 현재 note로 초기화
    setEditNote(items.reduce((acc, item) => {
      acc[item.ticker] = item.note ?? "";
      return acc;
    }, {}));
  }, [items]);

  // 메모 인라인 수정
  const handleNoteChange = (ticker, note) => {
    setEditNote({ ...editNote, [ticker]: note })
  }
  // 메모 저장, 삭제, 추가 후에는 fetchList 호출 OK
  const handleNoteSave = (ticker) => {
    watchlistAPI.updateNote(ticker, editNote[ticker] || "").then(fetchList)
  }

  // 삭제
  const handleDelete = (ticker) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return
    watchlistAPI.remove(ticker).then(fetchList)
  }

  // 추가
  const handleAdd = () => {
    if (!newTicker) return
    watchlistAPI.add(newTicker).then(() => {
      setNewTicker("")
      fetchList()
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.ticker === active.id)
    const newIndex = items.findIndex(i => i.ticker === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    const updated = reordered.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }))
    setItems(updated)
    // 전체 순서 PATCH
    watchlistAPI.updatePositions(updated.map(i => ({ ticker: i.ticker, position: i.position })))
  }

  return (
    <MainLayout showSidebar>
      <div className="max-w-2xl mx-auto py-8">
        <h1 className="text-2xl font-semibold mb-4">관심종목 관리</h1>
        {loading ? (
          <div>로딩 중...</div>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.ticker)} strategy={verticalListSortingStrategy}>
              {/* 헤더 */}
              <ul>
                <li
                  className="flex items-center gap-2 py-2 px-2 bg-gray-50 dark:bg-gray-800
                             text-sm font-medium text-gray-800 dark:text-gray-100
                             border-b border-gray-200 dark:border-gray-700"
                  style={{ minHeight: "44px" }}
                >
                  <span className="w-6" /> {/* 드래그 핸들 자리 */}
                  <span className="w-16 font-mono">종목코드</span>
                  <span className="w-32">종목명</span>
                  <span className="w-28 text-right">거래소</span>
                  <span className="ml-5 w-48 text-center">메모</span>
                  <span className="ml-10 w-8 text-center">삭제</span>
                </li>
              </ul>
              {/* 목록 */}
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, idx) => (
                  <SortableItem
                    key={item.ticker}
                    item={item}
                    idx={idx}
                    editNote={editNote}
                    handleNoteChange={handleNoteChange}
                    handleNoteSave={handleNoteSave}
                    handleDelete={handleDelete}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </MainLayout>
  )
}


