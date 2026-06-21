import { Question } from "../types";
import { Check, ClipboardList, LayoutGrid, Award, HelpCircle, Bookmark } from "lucide-react";

interface OMRSheetBlockProps {
  questions: Question[];
  userAnswers: { [key: number]: number };
  activeQuestionIndex: number;
  bookmarks: number[];
  onSelectQuestion: (index: number) => void;
  onSelectOption: (questionId: number, option: number) => void;
  onSubmitExam: () => void;
  showCorrectAnswers?: boolean; // If showing results, color the cells green/red
  filterUnansweredOnly?: boolean;
}

export default function OMRSheetBlock({
  questions,
  userAnswers,
  activeQuestionIndex,
  bookmarks,
  onSelectQuestion,
  onSelectOption,
  onSubmitExam,
  showCorrectAnswers = false,
  filterUnansweredOnly = false,
}: OMRSheetBlockProps) {
  const answeredCount = Object.keys(userAnswers).length;
  const totalCount = questions.length;
  const progressPercent = Math.round((answeredCount / totalCount) * 100);

  const getCellClass = (qId: number, optionIndex: number) => {
    const isSelected = userAnswers[qId] === optionIndex;
    const question = questions.find((q) => q.id === qId);
    const isCorrect = question?.answer === optionIndex;

    if (!showCorrectAnswers) {
      if (isSelected) {
        return "bg-blue-600 border-blue-600 text-white font-bold scale-110 shadow-sm";
      }
      return "border-slate-200 hover:border-slate-400 bg-slate-50 text-slate-600";
    }

    // After submission / results review: highlight correct answers and selected states
    if (isCorrect) {
      return "bg-emerald-500 border-emerald-500 text-white font-bold";
    }
    if (isSelected && !isCorrect) {
      return "bg-rose-500 border-rose-500 text-white font-bold";
    }
    return "border-slate-100 bg-slate-50 text-slate-300";
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm flex flex-col h-full" id="omr-sheet-block">
      {/* OMR Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold text-sm">
            <ClipboardList size={16} className="text-blue-500" />
            <span>OMR 스마트 답안지</span>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
            {answeredCount} / {totalCount} 문항
          </span>
        </div>

        {/* Linear progress bar */}
        <div className="w-full bg-slate-150 h-2 rounded-full overflow-hidden mt-3 relative">
          <div
            className="bg-blue-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Grid containing the OMR cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 max-h-[420px] md:max-h-none">
        {questions.map((q, idx) => {
          const isSelectedAny = userAnswers[q.id] !== undefined;
          const isCurrent = activeQuestionIndex === idx;
          const isBookmarked = bookmarks.includes(q.id);

          if (filterUnansweredOnly && isSelectedAny) {
            return null; // Filter out answered
          }

          return (
            <div
              key={q.id}
              onClick={() => onSelectQuestion(idx)}
              className={`flex items-center justify-between p-2 rounded-xl transition-all duration-150 cursor-pointer ${
                isCurrent
                  ? "bg-blue-50/50 border border-blue-100 shadow-sm"
                  : "hover:bg-slate-50 border border-transparent"
              }`}
              id={`omr-row-${q.id}`}
            >
              {/* Left Number Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-extrabold w-6 h-6 rounded-lg flex items-center justify-center ${
                  isCurrent
                    ? "bg-blue-600 text-white"
                    : isSelectedAny
                    ? "bg-slate-200 text-slate-800"
                    : "bg-slate-100 text-slate-400"
                }`}>
                  {String(q.id).padStart(2, "0")}
                </span>
                
                {isBookmarked && (
                  <span className="text-amber-500" title="북마크됨">
                    <Bookmark size={12} fill="#f59e0b" />
                  </span>
                )}
              </div>

              {/* Four circles for options */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {[1, 2, 3, 4].map((optIndex) => {
                  const label = ["①", "②", "③", "④"][optIndex - 1];
                  return (
                    <button
                      key={optIndex}
                      onClick={() => onSelectOption(q.id, optIndex)}
                      disabled={showCorrectAnswers}
                      className={`w-7 h-7 text-xs rounded-full flex items-center justify-center border transition-all duration-150 ${getCellClass(
                        q.id,
                        optIndex
                      )}`}
                      id={`omr-cell-${q.id}-${optIndex}`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Submission Part */}
      {!showCorrectAnswers && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/30 rounded-b-2xl">
          <button
            onClick={onSubmitExam}
            disabled={answeredCount === 0}
            className={`w-full py-3 rounded-xl font-extrabold text-sm transition-all shadow-sm ${
              answeredCount > 0
                ? "bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
                : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
            }`}
            id="btn-omr-submit"
          >
            최종 답안 제출하기
          </button>
          {answeredCount < totalCount && answeredCount > 0 && (
            <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
              아직 풀지 않은 문제가 {totalCount - answeredCount}개 있습니다.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
