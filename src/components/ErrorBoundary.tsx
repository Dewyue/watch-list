import type { ReactNode } from 'react'
import { Component } from 'react'

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto flex min-h-full max-w-[430px] flex-col justify-center px-4 py-8">
          <h1 className="text-lg font-bold text-red-600">页面加载出错</h1>
          <p className="mt-2 text-sm text-slate-600">{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('watch-list-data')
              sessionStorage.removeItem('watch-list-enrich-lock')
              window.location.reload()
            }}
            className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-medium text-white"
          >
            清除本地数据并恢复
          </button>
          <p className="mt-3 text-xs text-slate-400">
            不会删除 GitHub 上的默认清单，只会重置本机浏览器缓存。
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
