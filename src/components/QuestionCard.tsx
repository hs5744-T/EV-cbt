import { Question } from "../types";
import { Bookmark, Check, HelpCircle, Info, X } from "lucide-react";

interface QuestionCardProps {
  key?: any;
  question: Question;
  index: number;
  totalQuestions: number;
  selectedOption: number | undefined;
  isBookmarked: boolean;
  showCorrectAnswers: boolean; // Show results directly (post-test or in practice mode)
  onSelectOption: (option: number) => void;
  onToggleBookmark: () => void;
  showAnswerCheckedInPractice?: boolean; // Immediate feedback in Practice mode
  onCheckAnswerInPractice?: () => void;
  isPracticeMode?: boolean;
}

export default function QuestionCard({
  question,
  index,
  totalQuestions,
  selectedOption,
  isBookmarked,
  showCorrectAnswers,
  onSelectOption,
  onToggleBookmark,
  showAnswerCheckedInPractice = false,
  onCheckAnswerInPractice,
  isPracticeMode = false,
}: QuestionCardProps) {
  const isRevealMode = showCorrectAnswers || (isPracticeMode && showAnswerCheckedInPractice);

  const getOptionStyle = (optionIndex: number) => {
    const isSelected = selectedOption === optionIndex;
    const isCorrect = question.answer === optionIndex;

    // Normal quiz mode before submission / verification
    if (!isRevealMode) {
      if (isSelected) {
        return "border-blue-500 bg-blue-50/50 text-blue-700 ring-1 ring-blue-500 font-semibold";
      }
      return "border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700";
    }

    // After submission / verification
    if (isCorrect) {
      // Always highlight correct answer in green
      return "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500 font-semibold";
    }

    if (isSelected && !isCorrect) {
      // User chose wrong answer - highlight user choice in red
      return "border-rose-500 bg-rose-50 text-rose-800 ring-2 ring-rose-500 font-semibold";
    }

    return "border-slate-100 bg-slate-50/30 text-slate-400 cursor-not-allowed";
  };

  const renderBadge = (optionIndex: number) => {
    const isCorrect = question.answer === optionIndex;
    const isSelected = selectedOption === optionIndex;

    if (!isRevealMode) return null;

    if (isCorrect) {
      return (
        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] absolute right-3 top-1/2 -translate-y-1/2" id={`correct-badge-${optionIndex}`}>
          <Check size={11} strokeWidth={3} />
        </span>
      );
    }

    if (isSelected && !isCorrect) {
      return (
        <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] absolute right-3 top-1/2 -translate-y-1/2" id={`incorrect-badge-${optionIndex}`}>
          <X size={11} strokeWidth={3} />
        </span>
      );
    }

    return null;
  };

  // Custom diagram drawing depending on the question ID or content keywords
  const renderDiagram = () => {
    // Render custom diagram depending on question characteristics code / logics
    if (question.id === 56 || question.question.includes("논리 회로") || question.question.includes("High")) {
      return (
        <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center" id="circuit-diagram-56">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">전기전자 기초 회로 기판</span>
          <svg className="w-[180px] h-[100px] overflow-visible" viewBox="0 0 180 100">
            {/* Input Lines */}
            <line x1="20" y1="30" x2="60" y2="30" stroke="#64748b" strokeWidth="2" />
            <line x1="20" y1="70" x2="60" y2="70" stroke="#64748b" strokeWidth="2" />
            <text x="15" y="34" fontSize="11" fontWeight="bold" fill="#334155" textAnchor="end">A</text>
            <text x="15" y="74" fontSize="11" fontWeight="bold" fill="#334155" textAnchor="end">B</text>

            {/* Diodes/Transistors box */}
            <rect x="60" y="20" width="60" height="60" rx="6" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
            <text x="90" y="55" fontSize="12" fontWeight="bold" fill="#e2e8f0" textAnchor="middle">AND Gate</text>

            {/* Output Line */}
            <line x1="120" y1="50" x2="160" y2="50" stroke="#64748b" strokeWidth="2" />
            <text x="165" y="54" fontSize="11" fontWeight="bold" fill="#ef4444" textAnchor="start">Output Y</text>
          </svg>
        </div>
      );
    }

    if (question.id === 42 || question.question.includes("옴의 법칙") || question.question.includes("10 옴")) {
      return (
        <div className="my-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col items-center justify-center" id="ohm-diagram">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">기초 전기 오옴의 회로도</span>
          <svg className="w-[160px] h-[90px] overflow-visible" viewBox="0 0 160 90">
            {/* Battery */}
            <line x1="30" y1="45" x2="50" y2="45" stroke="#64748b" strokeWidth="2" />
            <line x1="35" y1="35" x2="35" y2="55" stroke="#3b82f6" strokeWidth="3" />
            <line x1="45" y1="40" x2="45" y2="50" stroke="#3b82f6" strokeWidth="1.5" />
            <text x="40" y="28" fontSize="10" fontWeight="bold" fill="#3b82f6" textAnchor="middle">V = ?</text>

            {/* Circuit loop wire */}
            <path d="M 30,45 L 30,15 L 130,15 L 130,45 L 30,45" fill="none" stroke="#64748b" strokeWidth="1.5" />

            {/* Resistor zig-zag */}
            <rect x="70" y="10" width="30" height="10" fill="#f8fafc" stroke="#f43f5e" strokeWidth="1.5" />
            <text x="85" y="5" fontSize="9" fontWeight="bold" fill="#f43f5e" textAnchor="middle">R = 10 Ω</text>

            {/* Ammeter circle */}
            <circle cx="130" cy="45" r="10" fill="#f8fafc" stroke="#10b981" strokeWidth="1.5" />
            <text x="130" y="48" fontSize="9" fontWeight="bold" fill="#10b981" textAnchor="middle">A</text>
            <text x="145" y="48" fontSize="9" fontWeight="bold" fill="#10b981">I = 20A</text>
          </svg>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 md:p-6 bg-white rounded-2xl border border-slate-200/80 shadow-sm relative space-y-4" id={`question-card-${index}`}>
      {/* Question Card Header */}
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded-lg border border-blue-100">
          <HelpCircle size={13} />
          <span>문제 {index}</span>
          <span className="text-blue-300">/</span>
          <span>{totalQuestions}</span>
        </span>

        <button
          onClick={onToggleBookmark}
          className={`p-2 rounded-xl transition-all duration-200 border ${
            isBookmarked
              ? "text-amber-500 bg-amber-50 border-amber-200 scale-105"
              : "text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 border-slate-100"
          }`}
          title="북마크 등록/해제"
          id={`btn-bookmark-${index}`}
        >
          <Bookmark size={16} fill={isBookmarked ? "#f59e0b" : "none"} />
        </button>
      </div>

      {/* Question Text */}
      <div className="space-y-1">
        <p className="text-[15px] md:text-base font-bold text-slate-800 leading-relaxed leading-snug">
          {question.question}
        </p>
      </div>

      {/* Render optional Diagram */}
      {renderDiagram()}

      {/* Option choices */}
      <div className="grid grid-cols-1 gap-2.5 pt-2">
        {question.options.map((option, optIdx) => {
          const numberSymbol = ["①", "②", "③", "④"][optIdx];
          return (
            <button
              key={optIdx}
              onClick={() => {
                if (!isRevealMode) {
                  onSelectOption(optIdx + 1);
                }
              }}
              disabled={isRevealMode}
              className={`w-full p-3.5 pl-4 text-left rounded-xl border text-sm transition-all duration-200 relative pr-10 flex items-start gap-2.5 ${getOptionStyle(optIdx + 1)}`}
              id={`question-${index}-option-${optIdx + 1}`}
            >
              <span className="text-[15px] leading-none shrink-0 text-slate-400 font-semibold">{numberSymbol}</span>
              <span className="leading-snug">{option}</span>
              {renderBadge(optIdx + 1)}
            </button>
          );
        })}
      </div>

      {/* Action panel for practice mode instant checks */}
      {isPracticeMode && !showCorrectAnswers && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info size={12} />
            연습모드에서는 즉시 해설과 정답 확인이 가능합니다.
          </p>

          {!showAnswerCheckedInPractice ? (
            <button
              onClick={onCheckAnswerInPractice}
              disabled={selectedOption === undefined}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                selectedOption !== undefined
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm cursor-pointer"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
              }`}
              id="btn-check-practice-answer"
            >
              정답 확인
            </button>
          ) : (
            <span className="text-xs font-semibold text-slate-500">
              확인 완료
            </span>
          )}
        </div>
      )}

      {/* Question Explanation */}
      {isRevealMode && (
        <div className="mt-4 p-4 bg-blue-50/40 rounded-2xl border border-blue-100 flex gap-3 text-slate-700 text-[13px] leading-relaxed" id={`explanation-${index}`}>
          <div className="text-blue-500 pt-0.5 shrink-0">
            <Info size={16} />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-blue-800">
              [정답: <span className="underline">{"①②③④"[question.answer - 1]}번</span>]
            </p>
            <p className="text-slate-600 font-medium">{question.explanation}</p>
          </div>
        </div>
      )}
    </div>
  );
}
