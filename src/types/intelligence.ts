export type TopicSource = {
  type: "video" | "questionbank" | "formula";
  label: string;
  url: string;
  description: string;
  verified: boolean; // true = came from Tavily live search, false = Gemini fallback
};

export type StudyPlanDay = {
  dayIndex: number;
  date: string;
  topics: string[];
  estimatedHours: number;
  relevantPapers: {
    paperId: string;
    title: string;
    relevanceReason: string;
  }[];
  rosettaLinks: {
    label: string;
    url: string;
  }[];
  citationSnippets: {
    text: string;
    paperId: string;
    pageNumber: number;
  }[];
  sources: TopicSource[];
};

export type GeneratedStudyPlan = {
  totalDays: number;
  examTitle: string;
  subject: string;
  days: StudyPlanDay[];
};
