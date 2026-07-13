import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWatchlist } from '../context/WatchlistContext'
import {
  enrichAllWatchlist,
  resetAutoEnrichFlag,
  type BatchEnrichProgress,
} from '../lib/batchEnrich'
import { getTmdbApiKey, setTmdbApiKey } from '../lib/tmdb'

export default function SettingsPage() {
  const { data, exportJson, importJson, reset, replaceData } = useWatchlist()
  const [json, setJson] = useState('')
  const [message, setMessage] = useState('')
  const [apiKey, setApiKey] = useState(() => getTmdbApiKey())
  const [batchProgress, setBatchProgress] = useState<BatchEnrichProgress | null>(null)
  const batchRunning = useRef(false)

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

  const saveApiKey = () => {
    setTmdbApiKey(apiKey)
    setMessage('TMDB API Key 已保存')
  }

  const runBatchEnrich = async (force = false) => {
    if (batchRunning.current) return
    if (!getTmdbApiKey()) {
      setMessage('请先保存 TMDB API Key')
      return
    }
    if (force) resetAutoEnrichFlag()

    batchRunning.current = true
    setMessage('开始批量补全，请保持页面打开…')

    try {
      const result = await enrichAllWatchlist(data, replaceData, setBatchProgress)
      setMessage(
        result.failed.length
          ? `补全完成：${result.done - result.failed.length} 成功，${result.failed.length} 失败${result.failed[0] ? `（如：${result.failed[0].title} - ${result.failed[0].reason}）` : ''}`
          : `全部 ${result.done} 条已补全`,
      )
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '批量补全失败')
    } finally {
      batchRunning.current = false
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

      <section className="mb-6 rounded-2xl border border-slate-200 p-4 dark:border-slate-700">
        <h2 className="font-semibold">自动补全（TMDB）</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          添加条目时联网获取简介、演员、分类等。免费注册：
          <a
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 dark:text-indigo-400"
          >
            themoviedb.org
          </a>
          ，复制 API Key（v3 auth）粘贴到下方。
        </p>
        <input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="TMDB API Key"
          className="mt-3 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-800"
        />
        <button
          type="button"
          onClick={saveApiKey}
          className="mt-2 min-h-11 w-full rounded-xl bg-indigo-600 text-sm font-medium text-white"
        >
          保存 API Key
        </button>
        <button
          type="button"
          onClick={() => void runBatchEnrich(true)}
          className="mt-2 min-h-11 w-full rounded-xl border border-indigo-200 text-sm text-indigo-700 dark:border-indigo-900 dark:text-indigo-300"
        >
          一键补全全部条目
        </button>
        {batchProgress && (
          <p className="mt-2 text-xs text-slate-500">
            进度 {batchProgress.done}/{batchProgress.total}
            {batchProgress.current ? ` · ${batchProgress.current}` : ''}
          </p>
        )}
        <p className="mt-2 text-xs text-slate-400">
          打开网站后会自动补全一次；你的备注（note）和观看进度不会被覆盖。
        </p>
      </section>

      <div className="space-y-3">
        <button
          type="button"
          onClick={copyExport}
          className="min-h-11 w-full rounded-xl border border-slate-200 text-sm dark:border-slate-700"
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
              resetAutoEnrichFlag()
              setMessage('已恢复默认清单，将自动重新补全')
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
