import {addDays, addWeeks, format, getISOWeek, startOfWeek} from "date-fns";
import {sv} from "date-fns/locale";
import {WeekInfo, MonthGroup} from "./types";
import {IdName, IssueActivityPair} from "../../model";
import {getTimeEntries} from "../../utils";

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
            context,
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
        is_hidden: false
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

        const startDay = format(weekStart, 'd', { locale: sv });
        const endDay = format(weekEnd, 'd', { locale: sv });

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
        const month = format(week.monday, 'MMMM');

        if (monthMap[month]) {
            monthMap[month].colSpan += 1;
        } else {
            monthMap[month] = { name: month, colSpan: 1 };
        }
    });

    return Object.values(monthMap);
};