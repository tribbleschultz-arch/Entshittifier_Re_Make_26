export interface Question {
  id: string;
  short_label: string;
  question: string;
  why_it_matters: string;
  yes_weight: number;
  no_weight: number;
  dont_know_weight: number;
  question_multiplier: number;
  var_1?: string;
  var_2?: string;
  var_3?: string;
}
