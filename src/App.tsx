import { useState, useEffect, useRef } from "react";
import { EXAM_ROUNDS, Question } from "./questionsData";
import { TestAttempt } from "./types";
import HistoryDashboard from "./components/HistoryDashboard";
import QuestionCard from "./components/QuestionCard";
import OMRSheetBlock from "./components/OMRSheetBlock";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Compass,
  FileText,
  History,
  Info,
  Lightbulb,
  List,
  Play,
  RotateCcw,
  Sparkles,
  Timer,
  XCircle,
  Bookmark,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Navigation Screens: "WELCOME" | "TESTING" | "RESULT"
  const [currentScreen, setCurrentScreen] = useState<"WELCOME" | "TESTING" | "RESULT">("WELCOME");
  
  // App States
  const [selectedRound, setSelectedRound] = useState(EXAM_ROUNDS[0]);
  const [selectedYearCode, setSelectedYearCode] = useState<string>("ALL"); // "ALL", "22", "23", "24", "25", "MOCK"
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: number]: number }>({});
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [viewDensityMode, setViewDensityMode] = useState<"SINGLE" | "ALL">("SINGLE");

  // Helper to generate dynamic random mock exam
  const generateRandomMockExam = (roundId: string) => {
    const pooledQuestions: Question[] = [];
    EXAM_ROUNDS.forEach((round) => {
      round.questions.forEach((q) => {
        pooledQuestions.push({
          ...q,
          question: `[${round.title.split(" ")[0] || "기출"}] ${q.question}`
        });
      });
    });

    // Seed depends on roundId
    let seed = 42;
    if (roundId.startsWith("RANDOM_MOCK_")) {
      const idx = parseInt(roundId.replace("RANDOM_MOCK_", ""), 10) || 1;
      seed = idx * 123 + 456;
    }

    const seededRandom = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };

    // Shuffle using seeded random for persistent mock subsets, offering a rich study pathway
    const shuffled = [...pooledQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }
    
    // Choose 60
    const selectedQuestions = shuffled.slice(0, 60);

    // Re-index questions 1 to 60 for perfect OMR alignment
    const remappedQuestions = selectedQuestions.map((q, index) => ({
      ...q,
      id: index + 1
    }));

    let numStr = "제1회";
    if (roundId === "RANDOM_MOCK_02") numStr = "제2회";
    if (roundId === "RANDOM_MOCK_03") numStr = "제3회";
    if (roundId === "RANDOM_MOCK_04") numStr = "제4회";
    if (roundId === "RANDOM_MOCK_05") numStr = "제5회";

    return {
      id: roundId,
      title: `통합 랜덤 모의평가 ${numStr} (60문항)`,
      questions: remappedQuestions
    };
  };
  
  // Time States
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600); // 60 minutes
  const [timeSpentSeconds, setTimeSpentSeconds] = useState<number>(0);
  
  // In Practice mode, track which questions have been checked for immediate feedback
  const [practiceRevealedAnswers, setPracticeRevealedAnswers] = useState<{ [key: number]: boolean }>({});
  
  // History Record States
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [lastAttempt, setLastAttempt] = useState<TestAttempt | null>(null);
  const [activeReviewAttempt, setActiveReviewAttempt] = useState<TestAttempt | null>(null);
  
  // OMR View Toggles (such as showing only remaining questions)
  const [filterUnansweredOMR, setFilterUnansweredOMR] = useState<boolean>(false);
  const [omrDrawerOpen, setOmrDrawerOpen] = useState<boolean>(false); // Collapsible on mobile

  // Timer reference
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load history on startup
  useEffect(() => {
    const loadedHistory = localStorage.getItem("cbt_history");
    if (loadedHistory) {
      try {
        setAttempts(JSON.parse(loadedHistory));
      } catch (e) {
        console.error("Error reading CBT history", e);
      }
    }
  }, []);

  // Save history helper
  const saveHistory = (newAttempts: TestAttempt[]) => {
    setAttempts(newAttempts);
    localStorage.setItem("cbt_history", JSON.stringify(newAttempts));
  };

  // Timer Effect
  useEffect(() => {
    if (currentScreen === "TESTING") {
      // Start testing timer
      timerRef.current = setInterval(() => {
        setTimeSpentSeconds((prev) => prev + 1);
        
        if (!isPracticeMode) {
          setSecondsRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(timerRef.current!);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentScreen, isPracticeMode]);

  // Handle Automatic submission when timer expires
  const handleAutoSubmit = () => {
    alert("제한 시간이 끝났습니다! 시험 답안이 자동으로 제출됩니다.");
    submitTest();
  };

  // Initializing exam parameters
  const startExam = (roundId: string, practice: boolean) => {
    let round;
    if (roundId.startsWith("RANDOM_MOCK_")) {
      round = generateRandomMockExam(roundId);
    } else {
      round = EXAM_ROUNDS.find((r) => r.id === roundId) || EXAM_ROUNDS[0];
    }
    setSelectedRound(round);
    setIsPracticeMode(practice);
    setActiveQuestionIndex(0);
    setUserAnswers({});
    setBookmarks([]);
    setPracticeRevealedAnswers({});
    setSecondsRemaining(3600); // 60 minutes
    setTimeSpentSeconds(0);
    setActiveReviewAttempt(null);
    setCurrentScreen("TESTING");
  };

  // Record OMR and selection actions
  const selectOption = (questionId: number, optionIndex: number) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const toggleBookmark = (questionId: number) => {
    setBookmarks((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  // Calculate score and submit
  const submitTest = () => {
    const totalCount = selectedRound.questions.length;
    let correctCount = 0;

    selectedRound.questions.forEach((q) => {
      if (userAnswers[q.id] === q.answer) {
        correctCount += 1;
      }
    });

    const percentScore = Math.round((correctCount / totalCount) * 100);
    const passed = correctCount >= Math.ceil(totalCount * 0.60); // 60% or more

    const newAttempt: TestAttempt = {
      id: `attempt_${Date.now()}`,
      roundId: selectedRound.id,
      roundTitle: selectedRound.title,
      date: new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }),
      score: percentScore,
      correctCount,
      totalCount,
      passed,
      timeSpentSeconds,
      userAnswers,
      questions: selectedRound.id.startsWith("RANDOM_MOCK_") ? selectedRound.questions : undefined
    };

    const updatedAttempts = [newAttempt, ...attempts];
    saveHistory(updatedAttempts);
    setLastAttempt(newAttempt);
    setCurrentScreen("RESULT");
  };

  // Action to reset local history
  const resetAllHistory = () => {
    saveHistory([]);
    setLastAttempt(null);
  };

  // Format digital countdown timer (e.g. 59:59)
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const formatSpentTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}분 ${secs}초`;
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans flex flex-col items-center justify-between pb-10" id="main-root">
      {/* Universal Navigation Banner */}
      <header className="w-full bg-white border-b border-slate-200/80 sticky top-0 z-40 px-4 py-3 md:py-4 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentScreen("WELCOME")}>
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              CBT
            </div>
            <div>
              <h1 className="text-sm md:text-base font-extrabold text-slate-900 tracking-tight">승강기기능사 필기 CBT</h1>
              <p className="text-[10px] text-slate-400 font-medium">Q-Net 최신 복원 기출문제 수록</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {currentScreen !== "WELCOME" && (
              <button
                onClick={() => {
                  if (currentScreen === "TESTING") {
                    if (window.confirm("정말로 시험을 중단하고 메인 화면으로 돌아가시겠습니까? 현재 풀던 답변은 소실됩니다.")) {
                      setCurrentScreen("WELCOME");
                    }
                  } else {
                    setCurrentScreen("WELCOME");
                  }
                }}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs md:text-sm rounded-xl transition-colors border border-slate-200"
                id="btn-nav-home"
              >
                메인 홈으로
              </button>
            )}

            <button
              onClick={() => {
                alert("승강기기능사 필기 CBT 앱을 공유하거나 주소를 브라우저에 저장해보세요!");
              }}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors hidden sm:block"
              title="공유하기"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl mx-auto p-4 md:p-6 flex-1 flex flex-col justify-start">
        <AnimatePresence mode="wait">
          {/* SCREEN 1: WELCOME SCREEN */}
          {currentScreen === "WELCOME" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 w-full"
              id="screen-welcome"
            >
              {/* Hero Section Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 p-6 md:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden" id="hero-banner">
                {/* Ambient dynamic shape layer */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl -ml-16 -mb-16" />
                
                <div className="relative z-10 max-w-xl space-y-3.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 text-blue-200 text-xs font-bold rounded-lg border border-white/5 backdrop-blur-md">
                    <Sparkles size={13} className="text-yellow-400" />
                    <span>합격 프리패스 모의고사</span>
                  </span>

                  <h2 className="text-xl md:text-2xl font-extrabold tracking-tight leading-relaxed">
                    승강기기능사 필기 대비 <br />
                    실전과 동일한 CBT 모의고사
                  </h2>

                  <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium">
                    승강기기능사 필기 합격 컷오프는 60문제 중 <strong className="text-emerald-400 font-extrabold text-sm md:text-base">60% (36문제)</strong> 이상입니다. 
                    CBT OMR 답안지를 제공해 실제 시험장에서 쓰는 기류 그대로 연습할 수 있습니다. 
                  </p>
                </div>
              </div>

              {/* Selection Section */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* Left Card: Start Test */}
                <div className="md:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-sm space-y-5 flex flex-col justify-between" id="test-selector-card">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5 mb-1.5">
                      <Play size={16} className="text-blue-500 fill-blue-500/20" />
                      자체 시험 응시 회차 선택
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 font-medium">정형 기출 복원 모형문제들을 선택해 모의고사를 기동합니다.</p>

                    {/* Year Filter Tabs */}
                    <div className="flex flex-wrap gap-1 mb-4 p-1 bg-slate-100 rounded-xl" id="year-filter-tabs">
                      {[
                        { id: "ALL", label: "전체" },
                        { id: "22", label: "22년도" },
                        { id: "23", label: "23년도" },
                        { id: "24", label: "24년도" },
                        { id: "25", label: "25년도" },
                        { id: "MOCK", label: "랜덤 모의평가 🎯" }
                      ].map((tab) => {
                        const isTabActive = selectedYearCode === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setSelectedYearCode(tab.id);
                              if (tab.id === "MOCK") {
                                setSelectedRound({
                                  id: "RANDOM_MOCK_01",
                                  title: "통합 랜덤 모의평가 제1회 (60문항)",
                                  questions: []
                                });
                              } else {
                                const matched = EXAM_ROUNDS.find((r) => {
                                  if (tab.id === "ALL") return true;
                                  return r.id.startsWith(`20${tab.id}`);
                                });
                                if (matched) {
                                  setSelectedRound(matched);
                                }
                              }
                            }}
                            className={`flex-1 min-w-[64px] py-2 px-2.5 text-xs font-extrabold rounded-lg transition-all text-center cursor-pointer ${
                              isTabActive
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-white/40"
                            }`}
                            id={`tab-year-${tab.id}`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-3" id="exam-rounds-list">
                      {selectedYearCode === "MOCK" ? (
                        <div className="space-y-2.5 w-full">
                          {[
                            { id: "RANDOM_MOCK_01", title: "통합 랜덤 모의평가 제1회" },
                            { id: "RANDOM_MOCK_02", title: "통합 랜덤 모의평가 제2회" },
                            { id: "RANDOM_MOCK_03", title: "통합 랜덤 모의평가 제3회" },
                            { id: "RANDOM_MOCK_04", title: "통합 랜덤 모의평가 제4회" },
                            { id: "RANDOM_MOCK_05", title: "통합 랜덤 모의평가 제5회" }
                          ].map((mockItem) => {
                            const isSelected = selectedRound.id === mockItem.id;
                            return (
                              <div
                                key={mockItem.id}
                                onClick={() => setSelectedRound({
                                  id: mockItem.id,
                                  title: `${mockItem.title} (60문항)`,
                                  questions: []
                                })}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                  isSelected
                                    ? "border-amber-400 bg-amber-50/40 text-amber-900 shadow-md scale-[1.01]"
                                    : "border-slate-100 hover:border-slate-200 bg-slate-50/50 text-slate-600"
                                }`}
                                id={`round-selector-${mockItem.id}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                    isSelected ? "bg-amber-500 text-white" : "bg-slate-200/70 text-slate-400"
                                  }`}>
                                    <Sparkles size={16} />
                                  </div>
                                  <div>
                                    <span className="text-[10px] font-extrabold tracking-wider bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full uppercase">MOCK TEST</span>
                                    <h4 className="text-sm font-bold text-slate-800 mt-1">{mockItem.title}</h4>
                                  </div>
                                </div>
                                <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-1 rounded-lg border shrink-0 ${
                                  isSelected ? "text-amber-700 bg-amber-100/30 border-amber-300" : "text-slate-400 bg-white border-slate-100"
                                }`}>
                                  60문항 설정
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        EXAM_ROUNDS.filter((r) => {
                          if (selectedYearCode === "ALL") return true;
                          return r.id.startsWith(`20${selectedYearCode}`);
                        }).map((round) => {
                          const isSelected = selectedRound.id === round.id;
                          return (
                            <div
                              key={round.id}
                              onClick={() => setSelectedRound(round)}
                              className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "border-blue-500 bg-blue-50/30 text-blue-800"
                                  : "border-slate-100 hover:border-slate-200 bg-slate-50/50 text-slate-600"
                              }`}
                              id={`round-selector-${round.id}`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isSelected ? "bg-blue-600 text-white" : "bg-slate-200/70 text-slate-400"
                                }`}>
                                  <FileText size={16} />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-400">승강기기능사 기출</span>
                                  <h4 className="text-sm font-bold text-slate-800">{round.title}</h4>
                                </div>
                              </div>
                              <span className="text-[10px] font-mono font-bold uppercase text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 shadow-sm shrink-0">
                                {round.questions.length}문항
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Dual Mode Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => startExam(selectedRound.id, true)}
                      className="py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold text-sm rounded-xl transition-all border border-slate-200/80 active:translate-y-0.5"
                      id="btn-start-practice"
                    >
                      📖 실시간 학습 모드
                    </button>
                    <button
                      onClick={() => startExam(selectedRound.id, false)}
                      className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-500/10 active:translate-y-0.5"
                      id="btn-start-exam"
                    >
                      🚀 실전 시험 모드
                    </button>
                  </div>
                </div>

                {/* Right Card: History & Analytics */}
                <div className="md:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 md:p-6 shadow-sm space-y-4" id="attempts-dashboard-card">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <History size={16} className="text-blue-500" />
                    나의 학습 레코드 분석
                  </h3>

                  <HistoryDashboard
                    attempts={attempts}
                    onResetHistory={resetAllHistory}
                    onSelectAttempt={(attempt) => {
                      if (attempt.questions && attempt.roundId.startsWith("RANDOM_MOCK_")) {
                        setSelectedRound({
                          id: attempt.roundId,
                          title: attempt.roundTitle,
                          questions: attempt.questions
                        });
                      } else {
                        setSelectedRound(EXAM_ROUNDS.find((r) => r.id === attempt.roundId) || EXAM_ROUNDS[0]);
                      }
                      setUserAnswers(attempt.userAnswers);
                      setSecondsRemaining(3600 - attempt.timeSpentSeconds);
                      setTimeSpentSeconds(attempt.timeSpentSeconds);
                      setActiveReviewAttempt(attempt);
                      setActiveQuestionIndex(0);
                      setCurrentScreen("RESULT");
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 2: TESTING SCREEN */}
          {currentScreen === "TESTING" && (
            <motion.div
              key="testing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full items-start"
              id="screen-testing"
            >
              {/* Left Column: Timer & Questions Panel */}
              <div className="lg:col-span-8 space-y-4">
                
                {/* Top Control Progress Bar Panel */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="testing-control-panel">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      {isPracticeMode ? <BookOpen size={20} /> : <Timer size={20} />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 block">
                        {isPracticeMode ? "STUDY & PRACTICE" : "TIMER MODE ACTIVED"}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{selectedRound.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                    {/* Time Counter */}
                    {!isPracticeMode ? (
                      <div className="flex items-center gap-1.5" id="timer-box">
                        <Clock size={16} className={secondsRemaining < 600 ? "text-rose-500 animate-pulse" : "text-blue-500"} />
                        <span className={`text-lg font-mono font-bold tracking-tight ${
                          secondsRemaining < 600 ? "text-rose-500" : "text-slate-800"
                        }`}>
                          {formatTimer(secondsRemaining)}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5" id="elapsed-time-box">
                        <Clock size={16} className="text-emerald-500" />
                        <span className="text-sm font-semibold text-slate-700">
                          {formatSpentTime(timeSpentSeconds)}
                        </span>
                      </div>
                    )}

                    {/* View Density Switch */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/30">
                      <button
                        onClick={() => {
                          setViewDensityMode("SINGLE");
                          setActiveQuestionIndex(0);
                        }}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          viewDensityMode === "SINGLE"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        id="view-mode-single"
                      >
                        한 문항씩
                      </button>
                      <button
                        onClick={() => setViewDensityMode("ALL")}
                        className={`text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all ${
                          viewDensityMode === "ALL"
                            ? "bg-white text-slate-800 shadow-sm"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                        id="view-mode-all"
                      >
                        전체 한번에
                      </button>
                    </div>
                  </div>
                </div>

                {/* Question Area Render */}
                {viewDensityMode === "SINGLE" ? (
                  <div className="space-y-4">
                    <QuestionCard
                      question={selectedRound.questions[activeQuestionIndex]}
                      index={activeQuestionIndex + 1}
                      totalQuestions={selectedRound.questions.length}
                      selectedOption={userAnswers[selectedRound.questions[activeQuestionIndex].id]}
                      isBookmarked={bookmarks.includes(selectedRound.questions[activeQuestionIndex].id)}
                      showCorrectAnswers={false}
                      onSelectOption={(option) => selectOption(selectedRound.questions[activeQuestionIndex].id, option)}
                      onToggleBookmark={() => toggleBookmark(selectedRound.questions[activeQuestionIndex].id)}
                      isPracticeMode={isPracticeMode}
                      showAnswerCheckedInPractice={practiceRevealedAnswers[selectedRound.questions[activeQuestionIndex].id]}
                      onCheckAnswerInPractice={() => {
                        setPracticeRevealedAnswers((prev) => ({
                          ...prev,
                          [selectedRound.questions[activeQuestionIndex].id]: true
                        }));
                      }}
                    />

                    {/* Left/Right Single Question Navigator Controller */}
                    <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                      <button
                        onClick={() => setActiveQuestionIndex((prev) => Math.max(0, prev - 1))}
                        disabled={activeQuestionIndex === 0}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-600 hover:text-slate-800 text-xs md:text-sm font-bold rounded-xl transition-colors border border-slate-200/50"
                        id="btn-prev-question"
                      >
                        <ChevronLeft size={16} />
                        이전 문항
                      </button>

                      <div className="flex flex-wrap items-center gap-1.5 justify-center max-w-[50%] overflow-x-auto text-[13px] font-semibold text-slate-400">
                        <span className="text-slate-800">{activeQuestionIndex + 1}</span>
                        <span>/</span>
                        <span>{selectedRound.questions.length} 문항</span>
                      </div>

                      <button
                        onClick={() => setActiveQuestionIndex((prev) => Math.min(selectedRound.questions.length - 1, prev + 1))}
                        disabled={activeQuestionIndex === selectedRound.questions.length - 1}
                        className="flex items-center gap-1 px-4 py-2 bg-slate-50 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none text-slate-600 hover:text-slate-800 text-xs md:text-sm font-bold rounded-xl transition-colors border border-slate-200/50"
                        id="btn-next-question"
                      >
                        다음 문항
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode B: Bulk Scroll view
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                    {selectedRound.questions.map((q, idx) => (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        index={idx + 1}
                        totalQuestions={selectedRound.questions.length}
                        selectedOption={userAnswers[q.id]}
                        isBookmarked={bookmarks.includes(q.id)}
                        showCorrectAnswers={false}
                        onSelectOption={(option) => selectOption(q.id, option)}
                        onToggleBookmark={() => toggleBookmark(q.id)}
                        isPracticeMode={isPracticeMode}
                        showAnswerCheckedInPractice={practiceRevealedAnswers[q.id]}
                        onCheckAnswerInPractice={() => {
                          setPracticeRevealedAnswers((prev) => ({
                            ...prev,
                            [q.id]: true
                          }));
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column: OMR Answer Sidebar Sheet */}
              <div className="lg:col-span-4 sticky top-24 space-y-4">
                {/* Mobile Drawer Trigger Bar */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setOmrDrawerOpen(!omrDrawerOpen)}
                    className="w-full flex items-center justify-between p-3.5 bg-blue-600 text-white font-extrabold text-sm rounded-xl shadow-md"
                    id="btn-toggle-omr-mobile"
                  >
                    <span className="flex items-center gap-1.5">
                      <ClipboardList size={16} />
                      OMR 답안지 확인 ({Object.keys(userAnswers).length}/{selectedRound.questions.length})
                    </span>
                    <ChevronRight size={16} className={`transform transition-transform ${omrDrawerOpen ? "rotate-90" : ""}`} />
                  </button>
                </div>

                {/* Actual OMR Sheet Body (Collapsible on Mobile, Fixed sidebar on Desktop) */}
                <div className={`${omrDrawerOpen ? "block" : "hidden"} lg:block`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="flex items-center space-x-1.5 text-xs text-slate-500 font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterUnansweredOMR}
                        onChange={() => setFilterUnansweredOMR(!filterUnansweredOMR)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        id="chk-filter-unanswered"
                      />
                      <span>미해결 문제만 모아보기</span>
                    </label>

                    <button
                      onClick={() => setBookmarks([])}
                      disabled={bookmarks.length === 0}
                      className="text-[10px] font-semibold text-slate-400 hover:text-slate-600 disabled:opacity-40"
                    >
                      북마크 초기화
                    </button>
                  </div>

                  <OMRSheetBlock
                    questions={selectedRound.questions}
                    userAnswers={userAnswers}
                    activeQuestionIndex={activeQuestionIndex}
                    bookmarks={bookmarks}
                    onSelectQuestion={(idx) => {
                      setViewDensityMode("SINGLE");
                      setActiveQuestionIndex(idx);
                      setOmrDrawerOpen(false); // CLOSE on mobile row select
                    }}
                    onSelectOption={selectOption}
                    onSubmitExam={submitTest}
                    filterUnansweredOnly={filterUnansweredOMR}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* SCREEN 3: RESULTS SCREEN & REVIEW EXPLANATIONS */}
          {currentScreen === "RESULT" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 w-full"
              id="screen-results"
            >
              {/* Dynamic Pass/Fail Greeting Hero Header Card */}
              {lastAttempt && (
                <div className={`p-6 md:p-8 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${
                  lastAttempt.passed
                    ? "bg-gradient-to-br from-emerald-950 via-emerald-900 to-emerald-950 text-white border-emerald-900"
                    : "bg-gradient-to-br from-rose-950 via-rose-900 to-slate-900 text-white border-rose-950"
                }`} id="results-headline-banner">
                  {/* Subtle graphical glow elements */}
                  <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -mr-16 -mt-16 ${
                    lastAttempt.passed ? "bg-emerald-500/10" : "bg-rose-500/10"
                  }`} />

                  <div className="space-y-4 relative z-10 max-w-lg">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-lg border backdrop-blur-md ${
                      lastAttempt.passed
                        ? "bg-white/10 text-emerald-200 border-white/5"
                        : "bg-white/10 text-rose-200 border-white/5"
                    }`}>
                      {lastAttempt.passed ? (
                        <>
                          <CheckCircle size={13} className="text-emerald-400" />
                          <span>합격 기준 통과</span>
                        </>
                      ) : (
                        <>
                          <XCircle size={13} className="text-rose-400" />
                          <span>합격 기준 미달</span>
                        </>
                      )}
                    </span>

                    <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight shrink-none">
                      {lastAttempt.passed ? "축하합니다! 합격하셨습니다! 🎉" : "불합격입니다. 조금만 더 해보세요! 💪"}
                    </h2>

                    <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-semibold">
                      {lastAttempt.passed
                        ? "승강기기능사 필기 과락 없는 합격권에 드셨습니다. 이 감각을 그대로 실전 고사까지 들고 가시기 바랍니다."
                        : "승강기기능사 필기는 60문제 중 36문제 이상 맞추어야 합격합니다. 오답 노트를 꼼꼼히 점검해 약점을 보완해 보세요."
                      }
                    </p>
                  </div>

                  {/* Gigantic visual score bubble */}
                  <div className="flex items-center gap-4 relative z-10 shrink-0 self-center" id="score-bubble-block">
                    <div className="text-center bg-white/10 p-5 rounded-3xl border border-white/5 backdrop-blur-md min-w-[124px]">
                      <span className="text-[10px] uppercase font-bold text-slate-300 block tracking-wider mb-0.5">내 점수</span>
                      <p className="text-4xl font-extrabold line-height-none tracking-tight">{lastAttempt.score}점</p>
                      <span className="text-[10px] text-slate-400 font-semibold block mt-1">총 60문제 기준</span>
                    </div>

                    <div className="space-y-1.5">
                      <p className="text-xs text-slate-300">
                        정답률: <strong className="text-white font-extrabold">{lastAttempt.correctCount}</strong> / {lastAttempt.totalCount} 문제
                      </p>
                      <p className="text-xs text-slate-300">
                        소요 시간: <strong className="text-white font-bold">{formatSpentTime(lastAttempt.timeSpentSeconds)}</strong>
                      </p>
                      <p className="text-xs text-slate-300">
                        판정: <strong className={lastAttempt.passed ? "text-emerald-400 font-extrabold" : "text-rose-400 font-extrabold"}>
                          {lastAttempt.passed ? "합격 (PASS)" : "불합격 (FAIL)"}
                        </strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons to restart / home */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm">
                <button
                  onClick={() => {
                    startExam(selectedRound.id, isPracticeMode);
                  }}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:translate-y-0.5 flex items-center gap-1.5"
                  id="btn-retry-same-exam"
                >
                  <RotateCcw size={15} />
                  동일 모의고사 재도전
                </button>

                <button
                  onClick={() => setCurrentScreen("WELCOME")}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-extrabold text-sm rounded-xl transition-all border border-slate-200 active:translate-y-0.5"
                  id="btn-return-home-results"
                >
                  메인 회차 선택으로
                </button>
              </div>

              {/* Incorrect Notes & Deep Review explanation Listheet */}
              <div className="space-y-4" id="incorrectnotes-container">
                <div className="flex items-center justify-between" id="filter-review-actions">
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <ClipboardList size={16} className="text-blue-500" />
                    상세 오답 노트 및 해설 분석
                  </h3>
                </div>

                <div className="space-y-4">
                  {selectedRound.questions.map((q, idx) => {
                    const selected = lastAttempt?.userAnswers[q.id];
                    const isCorrect = selected === q.answer;
                    
                    return (
                      <QuestionCard
                        key={q.id}
                        question={q}
                        index={idx + 1}
                        totalQuestions={selectedRound.questions.length}
                        selectedOption={selected}
                        isBookmarked={bookmarks.includes(q.id)}
                        showCorrectAnswers={true} // ALWAYS reveal values in result screen!
                        onSelectOption={() => {}}
                        onToggleBookmark={() => toggleBookmark(q.id)}
                      />
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Aesthetic pairing footer copyright section */}
      <footer className="w-full text-center py-4 text-[10px] text-slate-400 font-mono select-none" id="footer-copyright">
        © 2026 GOOGLE AI STUDIO BUILD • DESIGNED AND CRAFTED IN KO-KR CBT
      </footer>
    </div>
  );
}
