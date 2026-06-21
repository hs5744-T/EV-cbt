import { useState } from "react";
import { TestAttempt } from "../types";
import { Award, Calendar, CheckCircle2, ChevronDown, ChevronUp, Clock, FileSpreadsheet, RotateCcw, Trash2, XCircle } from "lucide-react";

interface HistoryDashboardProps {
  attempts: TestAttempt[];
  onResetHistory: () => void;
  onSelectAttempt: (attempt: TestAttempt) => void;
}

export default function HistoryDashboard({
  attempts,
  onResetHistory,
  onSelectAttempt,
}: HistoryDashboardProps) {
  const [expandedAttempt, setExpandedAttempt] = useState<string | null>(null);

  if (attempts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-200/80 text-center" id="empty-history-container">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <FileSpreadsheet size={32} />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-1">CBT 응시 이력이 없습니다</h3>
        <p className="text-sm text-slate-500 max-w-sm mb-4">
          시험을 시작하고 답안을 제출하면 이곳에서 합격 현황 및 성적 추이를 한눈에 관리할 수 있습니다.
        </p>
      </div>
    );
  }

  // Calculate statistics
  const totalCount = attempts.length;
  const passedCount = attempts.filter((a) => a.passed).length;
  const passRate = Math.round((passedCount / totalCount) * 100);
  const averageScore = Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / totalCount);
  const maxScore = Math.max(...attempts.map((a) => a.score));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-emerald-600 bg-emerald-50 border-emerald-100";
    return "text-rose-600 bg-rose-50 border-rose-100";
  };

  // Custom SVG Line Graph
  const svgWidth = 500;
  const svgHeight = 150;
  const padding = 25;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  // Max out history at 10 items for graph
  const recentAttempts = [...attempts].reverse().slice(-8);

  const getPointsPathList = () => {
    if (recentAttempts.length < 2) return "";
    return recentAttempts
      .map((attempt, index) => {
        const x = padding + (index / (recentAttempts.length - 1)) * chartWidth;
        const y = padding + chartHeight - (attempt.score / 100) * chartHeight;
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="space-y-6" id="history-dashboard">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm" id="stat-card-total">
          <p className="text-xs font-medium text-slate-500 mb-1">총 응시 횟수</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-slate-800">{totalCount}</span>
            <span className="text-sm font-medium text-slate-400">회</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm" id="stat-card-pass-rate">
          <p className="text-xs font-medium text-slate-500 mb-1">합격률</p>
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-bold ${passRate >= 60 ? "text-emerald-600" : "text-amber-600"}`}>
              {passRate}%
            </span>
            <span className="text-xs text-slate-400">
              ({passedCount}/{totalCount})
            </span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm" id="stat-card-avg-score">
          <p className="text-xs font-medium text-slate-500 mb-1">평균 점수</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-slate-800">{averageScore}</span>
            <span className="text-sm font-medium text-slate-400">점</span>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm" id="stat-card-max-score">
          <p className="text-xs font-medium text-slate-500 mb-1">최고 점수</p>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold text-emerald-600">{maxScore}</span>
            <span className="text-sm font-medium text-slate-400">점</span>
          </div>
        </div>
      </div>

      {/* Custom score trend graph */}
      {attempts.length >= 1 && (
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-sm" id="score-trend-chart">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              <Award size={16} className="text-blue-500" />
              성적 변화 추이 (최근 8회)
            </h4>
            <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
              Cutoff: 60점 (합격)
            </span>
          </div>

          <div className="relative w-full aspect-[16/7] md:aspect-[16/5] min-h-[140px]">
            <svg
              className="w-full h-full overflow-visible"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              preserveAspectRatio="none"
            >
              {/* Grid Lines */}
              <line
                x1={padding}
                y1={padding}
                x2={svgWidth - padding}
                y2={padding}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <line
                x1={padding}
                y1={padding + chartHeight / 2}
                x2={svgWidth - padding}
                y2={padding + chartHeight / 2}
                stroke="#f1f5f9"
                strokeWidth={1}
              />
              <line
                x1={padding}
                y1={padding + chartHeight}
                x2={svgWidth - padding}
                y2={padding + chartHeight}
                stroke="#f1f5f9"
                strokeWidth={1}
              />

              {/* Cutoff (60 pt) red dashed line */}
              <line
                x1={padding}
                y1={padding + chartHeight - (60 / 100) * chartHeight}
                x2={svgWidth - padding}
                y2={padding + chartHeight - (60 / 100) * chartHeight}
                stroke="#fda4af"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />

              {/* Connected Line Path */}
              {recentAttempts.length >= 2 && (
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  points={getPointsPathList()}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Plot dots */}
              {recentAttempts.map((attempt, index) => {
                const x = padding + (index / (recentAttempts.length - 1)) * chartWidth;
                const y = padding + chartHeight - (attempt.score / 100) * chartHeight;
                const activeColor = attempt.passed ? "#10b981" : "#f43f5e";
                return (
                  <g key={attempt.id} className="group cursor-pointer">
                    <circle
                      cx={x}
                      cy={y}
                      r={recentAttempts.length === 1 ? 5 : 4}
                      fill={activeColor}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-all duration-200 hover:r-6"
                    />
                    <text
                      x={x}
                      y={y - 8}
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      fill={attempt.passed ? "#047857" : "#be123c"}
                      className="font-mono bg-white"
                    >
                      {attempt.score}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Attempts log list */}
      <div className="space-y-3" id="attempts-list-container">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-slate-800">회차별 응시 기록</h4>
          <button
            onClick={() => {
              if (window.confirm("정말로 모든 응시 기출 이력을 삭제하시겠습니까? 복구할 수 없습니다.")) {
                onResetHistory();
              }
            }}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-rose-500 transition-colors"
            id="btn-reset-history"
          >
            <Trash2 size={13} />
            기록 전체 초기화
          </button>
        </div>

        <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
          {attempts.map((attempt, index) => {
            const isExpanded = expandedAttempt === attempt.id;
            return (
              <div
                key={attempt.id}
                className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden hover:border-slate-300 transition-colors"
                id={`attempt-item-${attempt.id}`}
              >
                {/* Attempt Header */}
                <div
                  onClick={() => setExpandedAttempt(isExpanded ? null : attempt.id)}
                  className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {attempt.passed ? (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 size={18} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
                          <XCircle size={18} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {attempt.roundTitle}
                      </h5>
                      <div className="flex items-center gap-2.5 mt-0.5 text-xs text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <Calendar size={12} />
                          {attempt.date}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <Clock size={12} />
                          {formatTime(attempt.timeSpentSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-sm font-bold text-slate-800">{attempt.score}점</span>
                      <p className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border text-center mt-0.5 ${getScoreColor(attempt.score)}`}>
                        {attempt.passed ? "합격" : "불합격"}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                  </div>
                </div>

                {/* Attempt Details Dropdown */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 bg-slate-50 border-t border-slate-100 text-slate-600 text-xs space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400 font-medium bloque">맞춘 문항 수</span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                          {attempt.correctCount} / {attempt.totalCount} 문제
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium bloque">응시 경과 시간</span>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">
                          {formatTime(attempt.timeSpentSeconds)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end pt-2 border-t border-slate-200/50">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectAttempt(attempt);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold rounded-lg transition-colors border border-blue-100"
                      >
                        <RotateCcw size={13} />
                        오답 분석 및 복습하기
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
