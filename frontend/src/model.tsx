// interfaces use snake case to follow Redmines variable names

export interface Id {
  id: number;
}

export interface IdName {
  id: number;
  name: string;
}

export interface RecentIssue {
  activity: IdName;
  issue: Issue;
}

export interface Issue {
  assigned_to: IdName;
  assigned_to_id: number;
  author: IdName;
  category: IdName;
  category_id: number;
  closed_on: string;
  created_on: string;
  description: string;
  done_ratio: number;
  due_date: string;
  estimated_hours: number;
  id: number;
  notes: string;
  project: IdName;
  project_id: number;
  start_date: string;
  status: IdName;
  status_date: string;
  status_id: 0;
  subject: string;
  updated_on: string;
}

export interface TimeEntry {
  id: number;
  issue_id: number;
  activity_id: number;
  hours: number;
  comments: string;
  spent_on: string;
}

export interface FetchedTimeEntry {
  id: number;
  project: IdName;
  issue: Id;
  user: IdName;
  activity: IdName;
  hours: number;
  comments: string;
  spent_on: string;
  created_on: string;
  updated_on: string;
}
