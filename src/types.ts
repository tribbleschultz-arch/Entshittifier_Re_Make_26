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

export interface ZoneInfo {
  name: string;
  sentence: string;
}

export interface EinordnungData {
  top_left: ZoneInfo;
  bottom_half: ZoneInfo;
  top_right_potential: ZoneInfo;
  top_right_suffizient: ZoneInfo;
  center_neutral: ZoneInfo;
}
