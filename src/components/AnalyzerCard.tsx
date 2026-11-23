import React, { useMemo } from 'react';
import { MessageSquareText, RotateCcw, X } from 'lucide-react';
import type { AnalysisReport, Person } from '../types/notebook';
import { AnimatePresence, motion } from 'motion/react';
import { useI18n } from '../utils/LanguageContext';
import { parseChatTranscript } from '../utils/chatParser';
import { FAST_TRANSITION, collapseVariants } from '../utils/motionPresets';

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
  onChatCleaned?: () => void;
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
  onChatCleaned,
}) => {
  const { t } = useI18n();
  const chatPreview = useMemo(
    () => parseChatTranscript(draftText, person.name),
    [draftText, person.name]
  );
  const showChatBar =
    chatPreview.isChat &&
    Boolean(chatPreview.cleanedText) &&
    chatPreview.cleanedText !== draftText.trim();

  return (
    <section
      className="rounded-lg border p-4 sm:p-5"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <h2 className="text-sm font-semibold tracking-tight">{t.analyzer.title}</h2>

        <button
          type="button"
          onClick={onFillDemo}
          className="text-xs font-medium px-2 py-1 rounded transition-colors hover:bg-[var(--bg-hover)]"
          style={{ color: 'var(--text-secondary)' }}
        >
          {t.analyzer.insertDemo}
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
        placeholder={t.analyzer.placeholder(person.name)}
        className="w-full min-h-[92px] p-3 rounded-md border text-[13.5px] leading-relaxed resize-y outline-none transition-colors disabled:opacity-60"
        style={{
          backgroundColor: 'var(--bg-input)',
          borderColor: 'var(--border-color)',
        }}
      />

      <AnimatePresence initial={false}>
        {showChatBar && (
          <motion.div
            key="chat-detected-bar"
            variants={collapseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FAST_TRANSITION}
            className="overflow-hidden"
          >
            <div
              className="mt-2 px-3 py-2 rounded-md border flex flex-wrap items-center justify-between gap-2 text-xs"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <span className="inline-flex items-center gap-1.5">
                <MessageSquareText className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--info-text)' }} />
                <span>{t.analyzer.chatDetected(chatPreview.extractedLines.length)}</span>
              </span>
              <button
                type="button"
                disabled={isAnalyzing}
                onClick={() => {
                  onDraftChange(chatPreview.cleanedText);
                  onChatCleaned?.();
                }}
                className="px-2.5 py-1 rounded border text-xs font-medium transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-60"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-color)',
                  color: 'var(--text-primary)',
                }}
              >
                {t.analyzer.cleanChatBtn}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center justify-between gap-3 mt-2.5">
        <span className="hidden sm:inline text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          {t.analyzer.shortcutHint}
        </span>

        <div className="flex items-center gap-2 ml-auto">
          {draftText && (
            <button
              type="button"
              disabled={isAnalyzing}
              onClick={onClearDraft}
              className="px-3 py-1.5 rounded-md border text-[13px] font-medium transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-60"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              {t.common.clear}
            </button>
          )}
          <button
            type="button"
            disabled={isAnalyzing}
            onClick={onAnalyze}
            className="px-4 py-1.5 rounded-md text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{
              backgroundColor: 'var(--btn-primary-bg)',
              color: 'var(--btn-primary-text)',
            }}
          >
            {isAnalyzing ? t.analyzer.analyzing : t.analyzer.submit}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {report && (
          <motion.div
            key="analysis-report"
            variants={collapseVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={FAST_TRANSITION}
            className="overflow-hidden"
          >
            <div
              className="mt-3 px-3.5 py-2.5 rounded-md border flex flex-wrap items-center justify-between gap-2 text-xs"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-color)',
                color: 'var(--text-secondary)',
              }}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 tabular-nums">
                <span className="font-medium" style={{ color: 'var(--success-text)' }}>
                  {t.analyzer.donePrefix} ({report.engineName})
                </span>
                <span aria-hidden="true">·</span>
                <span>{t.analyzer.factsAdded(report.factsAdded)}</span>
                {report.newColsCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t.analyzer.newCols(report.newColsCount)}</span>
                  </>
                )}
                {report.inferencesCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t.analyzer.inferences(report.inferencesCount)}</span>
                  </>
                )}
                {report.updatedCount > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t.analyzer.updates(report.updatedCount)}</span>
                  </>
                )}
                {report.duplicatesSkipped > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{t.analyzer.dupsSkipped(report.duplicatesSkipped)}</span>
                  </>
                )}
                {report.usedFallback && report.fallbackReason && (
                  <span style={{ color: 'var(--warning-text)' }}>
                    ({report.fallbackReason})
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {report.factsAdded > 0 && (
                  <button
                    type="button"
                    onClick={onUndoAnalysis}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium hover:bg-[var(--bg-hover)]"
                    style={{
                      borderColor: 'var(--border-color)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{t.analyzer.undo}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onDismissReport}
                  aria-label={t.analyzer.dismissReportAria}
                  className="p-1 rounded hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask over dossier */}
      <div
        className="mt-4 pt-3.5 border-t flex flex-col gap-2.5"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {t.analyzer.quickQuestionLabel}
          </span>
          {t.analyzer.quickQuestions.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onAskAdvisor(q)}
              className="text-xs transition-colors hover:underline"
              style={{ color: 'var(--text-secondary)' }}
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
            placeholder={t.analyzer.questionPlaceholder(person.name)}
            className="flex-1 px-3 py-1.5 rounded-md border text-[13px] outline-none disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-input)',
              borderColor: 'var(--border-color)',
            }}
          />
          <button
            type="submit"
            disabled={isAskingAdvisor}
            className="px-3.5 py-1.5 rounded-md border text-[13px] font-medium whitespace-nowrap transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-60"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)',
            }}
          >
            {isAskingAdvisor ? t.analyzer.searching : t.analyzer.askBtn}
          </button>
        </form>

        <AnimatePresence initial={false}>
          {advisorAnswer && (
            <motion.div
              key="advisor-answer"
              variants={collapseVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={FAST_TRANSITION}
              className="overflow-hidden"
            >
              <div
                className="p-3.5 rounded-md border text-[13px] leading-relaxed whitespace-pre-line"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-color)',
                }}
              >
                <div className="flex items-center justify-between text-xs font-medium mb-1.5">
                  <span style={{ color: 'var(--text-primary)' }}>
                    {t.analyzer.answerHeader(person.name)}
                  </span>
                  <button
                    type="button"
                    onClick={onDismissAdvisor}
                    aria-label={t.analyzer.dismissAnswerAria}
                    className="p-0.5 rounded hover:bg-[var(--bg-hover)]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>{advisorAnswer}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
