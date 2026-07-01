export type EventArea = "allgemein" | "fussball";
export type TodoArea = "erik" | "arbeit";
export type TransactionType = "income" | "expense";
export type TodoUrgency = "today" | "this_week" | "this_month" | "someday";
export type TodoPriority = "high" | "medium" | "low";
export type GoalScope = "week" | "month";

export interface EventRow {
  id: string;
  user_id: string;
  area: EventArea;
  title: string;
  starts_at: string;
  ends_at: string | null;
  note: string | null;
  category: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
}

export interface TodoRow {
  id: string;
  user_id: string;
  area: TodoArea;
  title: string;
  done: boolean;
  due_date: string | null;
  urgency: TodoUrgency;
  priority: TodoPriority;
  key: boolean;
  created_at: string;
  updated_at: string;
}

export interface GoalRow {
  id: string;
  user_id: string;
  scope: GoalScope;
  title: string;
  done: boolean;
  created_at: string;
}

export interface MealRow {
  id: string;
  user_id: string;
  eaten_on: string;
  name: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  created_at: string;
}

export interface NetWorthSnapshotRow {
  id: string;
  user_id: string;
  snapshot_date: string;
  amount: number;
  note: string | null;
  created_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  occurred_on: string;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface HabitRow {
  id: string;
  user_id: string;
  name: string;
  color: string;
  archived: boolean;
  created_at: string;
}

export interface HabitLogRow {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
  created_at: string;
}

export interface WeightLogRow {
  id: string;
  user_id: string;
  weight_kg: number;
  logged_on: string;
  note: string | null;
  created_at: string;
}

export interface NoteRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatchRow {
  id: string;
  user_id: string;
  played_on: string;
  opponent: string;
  goals_for: number;
  goals_against: number;
  own_goals: number;
  note: string | null;
  event_id: string | null;
  created_at: string;
}

export interface WorkoutSessionRow {
  id: string;
  user_id: string;
  session_date: string;
  title: string | null;
  note: string | null;
  created_at: string;
}

export interface WorkoutExerciseRow {
  id: string;
  session_id: string;
  user_id: string;
  name: string;
  sets: number;
  reps: number;
  weight_kg: number;
  created_at: string;
}

export interface WorkoutTemplateRow {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface WorkoutTemplateExerciseRow {
  id: string;
  template_id: string;
  user_id: string;
  name: string;
  default_sets: number;
  default_reps: number;
  default_weight_kg: number;
  order_index: number;
  created_at: string;
}
