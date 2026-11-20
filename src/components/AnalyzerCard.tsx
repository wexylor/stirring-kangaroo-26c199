import React from 'react';
import { Sparkles, Bot, RotateCcw, X } from 'lucide-react';
import type { AnalysisReport, Person } from '../types/notebook';

interface AnalyzerCardProps {
  person: Person;
  draftText: string;
  isAnalyzing: boolean;
  report: AnalysisReport | null;
  advisorQuery: string;
  advisorAnswer: string;
  isAskingAdvisor: boolean;
  onDraftChange: (text: string) => void;
  onFillDemo: () => void;
  onClearDraft: () => void;
  onAnalyze: () => void;
  onUndoAnalysis: () => void;
  onDismissReport: () => void;
  onAdvisorQueryChange: (q: string) => void;
  onAskAdvisor: (question: string) => void;
  onDismissAdvisor: () => void;
}

export const AnalyzerCard: React.FC<AnalyzerCardProps> = ({
  person,
  draftText,
  isAnalyzing,
  report,
  advisorQuery,
  advisorAnswer,
  isAskingAdvisor,
  onDraftChange,
  onFillDemo,
  onClearDraft,
  onAnalyze,
  onUndoAnalysis,
  onDismissReport,
  onAdvisorQueryChange,
  onAskAdvisor,
  onDismissAdvisor,
}) => {
  return (
    <section
      className="rounded-2xl border p-4 sm:p-5 shadow-sm"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'rgba(124, 58, 237, 0.32)',
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{
              backgroundColor: 'var(--accent-soft)',
              color: 'var(--accent-text)',
            }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold">Умный анализатор текста</h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Дистиллирует атомарные факты, блокирует дубликаты, делает выводы ИИ и отслеживает изменения
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onFillDemo}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors hover:brightness-110"
          style={{
            backgroundColor: 'var(--accent-soft)',
            color: 'var(--accent-text)',
            borderColor: 'rgba(124, 58, 237, 0.25)',
          }}
        >
          ✨ Вставить пример заметки
        </button>
      </div>

      <textarea
        id="analyzerTextarea"
        disabled={isAnalyzing}
        value={draftText}
        onChange={(e) => onDraftChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            onAnalyze();
          }
        }}
        placeholder={`Например: Сегодня болтали с ${person.name} — она отказалась от кофе и перешла на матчу, мечтает научиться играть на укулеле, аллергия на арахис, приходит на встречи заранее...`}
        className="w-full min-h-[100px] p-3.5 rounded-xl border text-sm leading-relaxed resize-y outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-color)',
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
        <span className="hidden sm:inline text-xs" style={{ color: 'var(--text-muted)' }}>
          Быстрый запуск:{' '}
          <kbd
            className="px-1.5 py-0.5 rounded border text-[11px] font-mono"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            Ctrl
          </kbd>{' '}
          +{' '}
          <kbd
            className="px-1.5 py-0.5 rounded border text-[11px] font-mono"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            Enter
          </kbd>
        </span>

        <div className="flex flex-wrap items-center gap-2 ml-auto">
          {draftText && (
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={onClearDraft}
              className="px-3.5 py-2 rounded-xl border text-[13px] font-semibold transition-colors disabled:opacity-60"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-primary)',
              }}
            >
              Очистить
            </button>
          )}
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={onAnalyze}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-all hover:brightness-110 disabled:opacity-60"
            style={{ background: 'var(--accent-gradient)' }}
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'ИИ анализирует...' : 'Анализировать и разложить'}</span>
          </button>
        </div>
      </div>

      {report && (
        <div
          className="mt-3.5 p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 text-[13px] animate-pop-in"
          style={{
            backgroundColor: 'var(--success-bg)',
            borderColor: 'var(--success-border)',
            color: 'var(--success-text)',
          }}
        >
          <div className="flex flex-wrap items-center gap-1.5 font-semibold">
            <span>✅ Готово ({report.engineName}):</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-xs tabular-nums">
              +{report.factsAdded} фактов
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-xs tabular-nums">
              📁 {report.newColsCount} новых колонок
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-xs tabular-nums">
              💡 {report.inferencesCount} выводов ИИ
            </span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-xs tabular-nums">
              🔄 {report.updatedCount} обновлений
            </span>
            {report.duplicatesSkipped > 0 && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-xs tabular-nums">
                🛡️ {report.duplicatesSkipped} дублей отсеяно
              </span>
            )}
            {report.usedFallback && report.fallbackReason && (
              <span
                className="text-xs font-normal ml-1 opacity-90"
                style={{ color: 'var(--warning-text)' }}
              >
                ({report.fallbackReason})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {report.factsAdded > 0 && (
              <button
                type="button"
                onClick={onUndoAnalysis}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-xs font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Отменить разбор</span>
              </button>
            )}
            <button
              type="button"
              onClick={onDismissReport}
              aria-label="Закрыть отчёт"
              className="p-1 opacity-75 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Interactive AI Advisor */}
      <div
        className="mt-4 pt-3.5 border-t border-dashed flex flex-col gap-2.5"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Спросить ИИ о {person.name}:</span>
          </span>
          {[
            'Что подарить?',
            'Куда позвать на встречу?',
            'О чём поговорить при встрече?',
            'Какие есть табу и аллергии?',
          ].map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onAskAdvisor(q)}
              className="px-2.5 py-1 rounded-full border text-xs font-medium transition-colors hover:brightness-110"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              {q}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onAskAdvisor(advisorQuery);
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            disabled={isAskingAdvisor}
            value={advisorQuery}
            onChange={(e) => onAdvisorQueryChange(e.target.value)}
            placeholder={`Задайте любой вопрос по досье (например: какой чай заказать для ${person.name}?)...`}
            className="flex-1 px-3 py-2 rounded-xl border text-[13px] outline-none focus:ring-2 focus:ring-violet-500/30 disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
          <button
            type="submit"
            disabled={isAskingAdvisor}
            className="px-4 py-2 rounded-xl border text-[13px] font-semibold whitespace-nowrap transition-colors disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {isAskingAdvisor ? 'Думаю...' : 'Спросить ИИ'}
          </button>
        </form>

        {advisorAnswer && (
          <div
            className="p-3.5 rounded-xl border text-[13px] leading-relaxed whitespace-pre-line animate-pop-in"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'rgba(124, 58, 237, 0.3)',
            }}
          >
            <div
              className="flex items-center justify-between text-xs font-bold mb-1.5"
              style={{ color: 'var(--accent-text)' }}
            >
              <span>🤖 Ответ ИИ-советника по досье «{person.name}»</span>
              <button
                type="button"
                onClick={onDismissAdvisor}
                aria-label="Закрыть ответ советника"
                className="p-0.5 opacity-75 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>{advisorAnswer}</div>
          </div>
        )}
      </div>
    </section>
  );
};
