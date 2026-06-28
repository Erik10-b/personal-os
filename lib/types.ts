export type EventArea = "allgemein" | "fussball";
export type TodoArea = "erik" | "arbeit";
export type TransactionType = "income" | "expense";

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
  created_at: string;
  updated_at: string;
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
