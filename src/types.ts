export interface Question {
  id: number;
  question: string;
  options: string[];
  answer: number; // 1, 2, 3, or 4
  explanation: string;
  diagramSvg?: string;
}

export interface ExamRound {
  id: string;
  title: string;
  questions: Question[];
}

export interface TestAttempt {
  id: string;
  roundId: string;
  roundTitle: string;
  date: string;
  score: number; // Points out of 100
  correctCount: number;
  totalCount: number;
  passed: boolean;
  timeSpentSeconds: number;
  userAnswers: { [key: number]: number }; // questionId -> selectedOption
  questions?: Question[]; // Dynamically generated questions for random mock exams
}
