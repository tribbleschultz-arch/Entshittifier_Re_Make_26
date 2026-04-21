export interface ScoreImpact {
  x: number;
  y: number;
}

export interface Question {
  id: string;
  short_label: string;
  question: string;
  why_it_matters: string;
  yes: ScoreImpact;
  no: ScoreImpact;
  dont_know: ScoreImpact;
}
