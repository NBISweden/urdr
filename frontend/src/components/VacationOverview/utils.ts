import { addDays, addWeeks, format, getISOWeek, startOfWeek } from "date-fns";
import { sv } from "date-fns/locale";
import { WeekInfo, MonthGroup } from "./types";
import { IdName, IssueActivityPair, Group, UserSetting } from "../../model";
import { getTimeEntries, getApiEndpoint, PUBLIC_API_URL } from "../../utils";

export const getGroups = async (context: any) => {
  const groups: Group[] = await getApiEndpoint("/api/groups", context);
  if (!groups) {
    return [];
  }
  return groups;
};

export const getSavedGroup = async (context: any) => {
  const groupSettingArray: UserSetting[] = await getApiEndpoint(
    "/api/setting?name=group",
    context
  );
  const groupSettingObject = groupSettingArray.find(
    (setting) => setting.name === "group"
  );
  const { value } = groupSettingObject || {};
  const groupId = Number(value);
  if (isNaN(groupId)) {
    return;
  }
  return groupId;
};

export const selectGroup = (groups: Group[], savedGroupId: number | null) => {
  let selectedGroup = null;

  if (groups.length > 0) {
    const savedGroup = groups.find((group) => group.id === savedGroupId);
    const nbisgroup = groups.find((group) => group.name === "NBIS staff");
    if (savedGroup) {
      selectedGroup = savedGroup.id;
    } else if (nbisgroup) {
      selectedGroup = nbisgroup.id;
    } else {
      selectedGroup = groups[0].id;
    }
  }
  return selectedGroup;
};

export const saveSettings = async (
  settings: { name: string; value: string }[],
  context: any
) => {
  const url = new URL(`${PUBLIC_API_URL}/api/setting`);
  url.search = new URLSearchParams({
    name: settings[0].name,
    value: settings[0].value,
  }).toString();
  const headers = new Headers({
    Accept: "application/json",
    "Content-Type": "application/json",
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: headers,
    });

    if (res.ok) {
      return true;
    } else if (res.status === 401) {
      context.setUser(null);
    } else {
      throw new Error("There was an error accessing the settings endpoint");
    }
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const fetchVacationData = async (
  users: { id: number }[],
  weeks: { monday: Date }[],
  context: any
): Promise<{ [userId: string]: number[] }> => {
  const allUserVacation: { [userId: string]: number[] } = {};

  const promises = users.map(async (user) => {
    const timeEntries = await getVacationTimeEntries(
      weeks[0].monday,
      addDays(weeks[weeks.length - 1].monday, 4),
      user.id.toString(),
      context
    );

    if (timeEntries) {
      const userWeeks = new Set<number>();

      for (const entry of timeEntries) {
        const entryDate = new Date(entry.spent_on);
        const entryWeek = getISOWeek(entryDate);
        userWeeks.add(entryWeek);
      }

      return { userId: user.id, weeks: Array.from(userWeeks) };
    }

    return { userId: user.id, weeks: [] };
  });

  const results = await Promise.all(promises);

  results.forEach((result) => {
    allUserVacation[result.userId] = result.weeks;
  });

  return allUserVacation;
};

const getVacationTimeEntries = async (
  fromDate: Date,
  toDate: Date,
  user_id: string,
  context: any
) => {
  const vacationIssue: IdName = { id: 6995, name: "Vacation" };
  const activity: IdName = { id: 19, name: "Absence (Vacation/VAB/Other)" };

  const absence_pair: IssueActivityPair = {
    issue: vacationIssue,
    activity,
    custom_name: "",
    is_hidden: false,
  };

  const entries = await getTimeEntries(
    absence_pair,
    fromDate,
    toDate,
    context,
    user_id
  );
  return entries || [];
};

export const fetchParentalLeaveData = async (
  users: { id: number }[],
  weeks: { monday: Date }[],
  context: any
): Promise<{ [userId: string]: number[] }> => {
  const allUserParentalLeave: { [userId: string]: number[] } = {};

  const promises = users.map(async (user) => {
    const timeEntries = await getParentalLeaveTimeEntries(
      weeks[0].monday,
      addDays(weeks[weeks.length - 1].monday, 4),
      user.id.toString(),
      context
    );

    if (timeEntries) {
      const userWeeks = new Set<number>();

      for (const entry of timeEntries) {
        // filter out days with 8 hours reported
        if (entry.hours !== 8) continue; 

        const entryDate = new Date(entry.spent_on);
        const entryWeek = getISOWeek(entryDate);
        userWeeks.add(entryWeek);
      }

      return { userId: user.id, weeks: Array.from(userWeeks) };
    }

    return { userId: user.id, weeks: [] };
  });

  const results = await Promise.all(promises);

  results.forEach((result) => {
    allUserParentalLeave[result.userId] = result.weeks;
  });
  return allUserParentalLeave;
};

const getParentalLeaveTimeEntries = async (
  fromDate: Date,
  toDate: Date,
  user_id: string,
  context: any
) => {
  const parentalLeaveIssue: IdName = { id: 6992, name: "Parental Leave" };
  const activity: IdName = { id: 19, name: "Absence (Vacation/VAB/Other)" };

  const absence_pair: IssueActivityPair = {
    issue: parentalLeaveIssue,
    activity,
    custom_name: "",
    is_hidden: false,
  };

  const entries = await getTimeEntries(
    absence_pair,
    fromDate,
    toDate,
    context,
    user_id
  );
  return entries || [];
};

export const generateWeeks = (numWeeks: number = 13): WeekInfo[] => {
  const today = new Date();
  const currentMonday = startOfWeek(addWeeks(today, 1), { weekStartsOn: 1 });

  const weeks: WeekInfo[] = [];

  for (let i = 0; i < numWeeks; i++) {
    const weekStart = addWeeks(currentMonday, i);
    const weekEnd = addDays(weekStart, 4); // Friday

    const startDay = format(weekStart, "d", { locale: sv });
    const endDay = format(weekEnd, "d", { locale: sv });

    const range = `${startDay}–${endDay}`; // Alltid dagnummer till dagnummer

    weeks.push({
      week: getISOWeek(weekStart),
      dateRange: range,
      monday: weekStart,
    });
  }

  return weeks;
};

export const groupWeeksByMonth = (weeks: WeekInfo[]): MonthGroup[] => {
  const monthMap: { [month: string]: MonthGroup } = {};

  weeks.forEach((week) => {
    const month = format(week.monday, "MMMM");

    if (monthMap[month]) {
      monthMap[month].colSpan += 1;
    } else {
      monthMap[month] = { name: month, colSpan: 1 };
    }
  });

  return Object.values(monthMap);
};