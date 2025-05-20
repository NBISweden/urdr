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
  project: IdName;
}

export interface TimeEntry {
  id?: number;
  issue_id?: number;
  activity_id?: number;
  hours: number;
  comments?: string;
  spent_on?: string;
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
  group?: string;
}

export interface AbsenceInterval {
  startDate: Date;
  endDate: Date;
  entryIds: number[];
  extent: number;
  issueId: number;
}

type ToastType = "success" | "warning" | "info";

export interface ToastMsg {
  type: ToastType;
  timeout: number;
  message: string;
}

export interface Group {
  id: number;
  name: string;
  users: IdName[];
}

export interface UserSetting {
  id: number;
  name: string;
  value: string;
}
