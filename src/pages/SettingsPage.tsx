import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWatchlist } from '../context/WatchlistContext'

export default function SettingsPage() {
  const { exportJson, importJson, reset } = useWatchlist()
  const [json, setJson] = useState('')
  const [message, setMessage] = useState('')

  const copyExport = async () => {
    const text = exportJson()
    setJson(text)
    try {
      await navigator.clipboard.writeText(text)
      setMessage('已复制到剪贴板')
    } catch {
      setMessage('请手动复制下方 JSON')
    }
  }

  const handleImport = () => {
    try {
      importJson(json)
      setMessage('导入成功')
    } catch {
      setMessage('JSON 格式有误，导入失败')
    }
  }

  return (
    <div>
      <header className="mb-4">
        <Link to="/watching" className="text-sm text-indigo-600 dark:text-indigo-400">
          ← 返回
        </Link>
        <h1 className="mt-2 text-xl font-bold">数据管理</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          修改会保存在本机浏览器。换设备可用导出/导入同步。
        </p>
      </header>

      {message && (
        <p className="mb-4 rounded-xl bg-indigo-50 px-3 py-2 text-sm text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
          {message}
        </p>
      )}

      <div className="space-y-3">
        <button
          type="button"
          onClick={copyExport}
          className="min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-medium text-white"
        >
          导出 JSON
        </button>

        <button
          type="button"
          onClick={handleImport}
          className="min-h-11 w-full rounded-xl border border-slate-200 text-sm dark:border-slate-700"
        >
          导入 JSON
        </button>

        <button
          type="button"
          onClick={() => {
            if (confirm('确定恢复为网站默认清单？本地修改将丢失。')) {
              reset()
              setMessage('已恢复默认清单')
            }
          }}
          className="min-h-11 w-full rounded-xl border border-red-200 text-sm text-red-600 dark:border-red-900 dark:text-red-400"
        >
          恢复默认清单
        </button>
      </div>

      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        placeholder="在此粘贴 JSON 后点「导入 JSON」"
        className="mt-4 min-h-48 w-full rounded-2xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-700 dark:bg-slate-900"
      />
    </div>
  )
}
