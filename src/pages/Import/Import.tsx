import React, { useState } from 'react'
import { Download, FileText } from 'lucide-react'

export default function Import() {
  const [importText, setImportText] = useState('')

  const sampleText = `Задача 1 - 30 мин - P1
Задача 2 - 45 мин - P2
Задача 3 - 60 мин - P3
Задача 4 - 15 мин - P1`

  const handleImport = () => {
    // Здесь будет логика импорта
    console.log('Импорт задач:', importText)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-text">Импорт задач</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Формат импорта */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-panel shadow-soft p-s4">
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <FileText size={20} />
              Формат импорта
            </h3>
            <div className="space-y-3">
              <p className="text-sm text-text-weak">
                Введите задачи в формате:
              </p>
              <div className="bg-card border border-border rounded-lg p-3">
                <code className="text-xs text-text-muted">
                  Название задачи - время в минутах - приоритет
                </code>
              </div>
              <div className="bg-card border border-border rounded-lg p-3">
                <pre className="text-xs text-text-muted whitespace-pre-wrap">{sampleText}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Ввод задач */}
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-panel shadow-soft p-s4">
            <h3 className="text-lg font-semibold text-text mb-4 flex items-center gap-2">
              <Download size={20} />
              Вставьте список задач
            </h3>
            <div className="space-y-3">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Вставьте список задач здесь..."
                className="w-full h-40 px-3 py-2 border border-border rounded-lg bg-card text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-accent-600 focus:border-transparent resize-none"
              />
              <button
                onClick={handleImport}
                disabled={!importText.trim()}
                className="w-full px-4 py-3 bg-accent-600 text-white font-medium rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Импортировать задачи
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
