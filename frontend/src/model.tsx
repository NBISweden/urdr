import.meta.hot;

// interfaces use snake case to follow Redmines variable names

export interface User {
  login: string;
}
export interface Id {
  id: number;
}

export interface IdName {
  id: number;
  name: string;
}

export interface IssueActivityPair {
  activity: IdName;
  issue: Issue;
  custom_name: string;
  is_hidden: boolean;
}

export interface Issue {
  id: number;
  subject: string;
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
