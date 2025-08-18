import "../index.css";
import React, { useState, useMemo, useContext, useEffect } from "react";
import { getISOWeek, startOfWeek } from "date-fns";
import {
  getGroups,
  getSavedGroup,
  selectGroup,
  saveSettings,
  fetchAbsenceData,
  generateWeeks,
  groupWeeksByMonth,
} from "../components/VacationOverview/utils";
import { GroupSelect } from "../components/VacationOverview/GroupSelect";
import { VacationTable } from "../components/VacationOverview/VacationTable";
import { AuthContext } from "../components/AuthProvider";
import { Group } from "../model";
import { HeaderUser } from "../components/HeaderUser";
import { ClimbingBoxLoader } from "react-spinners";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { ArrowDirection, WeekInfo } from "../components/VacationOverview/types";

export const VacationOverview = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [vacationData, setVacationData] = useState<{
    [userId: string]: { [date: string]: "vacation" | "parental" };
  }>({});
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [savedGroup, setSavedGroup] = useState<number | null>(null);
  const [loadingVacationData, setLoadingVacationData] =
    useState<boolean>(false);
  const today = new Date();
  const [startDate, setStartDate] = useState<Date>(today);
  const [fetchedWeeks, setFetchedWeeks] = useState<number[]>([]);
  const context = useContext(AuthContext);

  useEffect(() => {
    const fetchGroupData = async () => {
      const groups = await getGroups(context);
      setGroups(groups);

      const groupId = await getSavedGroup(context);
      setSavedGroup(groupId);

      const selectedGroup = selectGroup(groups, groupId);
      setSelectedGroup(selectedGroup);
    };
    fetchGroupData();
  }, []);

  const selectedGroupData = groups.find((group) => group.id === selectedGroup);
  const weeks = useMemo(() => generateWeeks(14, startDate), [startDate]);
  const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

  const getAbsenceData = async (timespan: WeekInfo[]) => {
    const userIds = selectedGroupData.users.map((user) => ({
      id: user.id,
    }));
    const [vacationData, parentalLeaveData] = await Promise.all([
      fetchAbsenceData(
          { id: 6995, name: "Vacation" },
          userIds,
          timespan,
          context
      ),
      fetchAbsenceData(
          { id: 6992, name: "Parental Leave" },
          userIds,
          timespan,
          context
      ),
    ]);

    const absenceData: { [userId: string]: { [date: string]: "vacation" | "parental" } } = {};

    for (const userId in vacationData) {
      absenceData[userId] = { ...vacationData[userId] };
    }

    for (const userId in parentalLeaveData) {
      if (!absenceData[userId]) absenceData[userId] = {};

      for (const date in parentalLeaveData[userId]) {
        if (!absenceData[userId][date]) {
          absenceData[userId][date] = parentalLeaveData[userId][date];
        } else {
          console.warn(
              `User ${userId} has multiples types of leave on ${date}. Keeping: ${absenceData[userId][date]}, ignoring: ${parentalLeaveData[userId][date]}`
          );
        }
      }
    }
    return absenceData;
  };

  useEffect(() => {
    if (!selectedGroupData) return;

    const loadAbsenceData = async () => {
      setLoadingVacationData(true);
      try {
        const absenceData = await getAbsenceData(weeks);
        setVacationData(absenceData);
        let updatedFetchedWeeks = fetchedWeeks;
        weeks.map((week) => {
          updatedFetchedWeeks.push(week.week);
        });
        setFetchedWeeks(updatedFetchedWeeks);
      } catch (error) {
        console.error("Error fetching vacation data:", error);
      } finally {
        setLoadingVacationData(false);
      }
    };

    loadAbsenceData();
  }, [selectedGroupData, context]);

  useEffect(() => {
    if (savedGroup === selectedGroup) return;

    const settings = [
      {
        name: "group",
        value: selectedGroup ? selectedGroup.toString() : "",
      },
    ];
    saveSettings(settings, context)
      .then((result) => {
        if (result) {
          setSavedGroup(selectedGroup);
        } else {
          console.log("Failed to save group");
        }
      })
      .catch((error) => {
        console.error("Error saving group:", error);
      });
  }, [savedGroup, selectedGroup]);

  const handleStartDateChange = (newDate: Date, direction: ArrowDirection) => {
    setStartDate(newDate);
    let newMonday: Date;
    if (direction == "back") {
      newMonday = startOfWeek(newDate, { weekStartsOn: 1 });
    } else if (direction == "forward") {
      newMonday = startOfWeek(
        // we want to fetch data for the new week at the end of the displayed 14 weeks
        new Date(newDate.getTime() + 13 * 7 * 24 * 60 * 60 * 1000),
        { weekStartsOn: 1 }
      );
    }
    extendVacationData(newMonday);
    return;
  };

  const extendVacationData = async (monday: Date) => {
    if (fetchedWeeks.includes(getISOWeek(monday))) {
      return;
    }
    setLoadingVacationData(true);
    const week = generateWeeks(1, monday);
    try {
      const absenceData = await getAbsenceData(week);

      setVacationData((prev) => {
        const next: { [userId: string]: { [date: string]: "vacation" | "parental" } } = { ...prev };
        for (const userId in absenceData) {
          next[userId] = { ...(next[userId] ?? {}), ...absenceData[userId] };
        }
        return next;
      });

      let updatedFetchedWeeks = fetchedWeeks;
      fetchedWeeks.push(getISOWeek(monday));
      setFetchedWeeks(updatedFetchedWeeks);
    } catch (error) {
      console.error("Error fetching absence data: ", error);
    } finally {
      setLoadingVacationData(false);
    }
  };

  return (
    <>
      {loadingVacationData && (
        <LoadingOverlay>
          <ClimbingBoxLoader
            color="hsl(76deg 55% 53%)"
            loading={loadingVacationData}
            size={17}
            width={4}
            height={6}
            radius={4}
            margin={4}
          />
        </LoadingOverlay>
      )}
      <header className="page-header">
        <h1 className="help-title">
          Vacation Overview
          <span className="badge bg-warning beta-label">BETA</span>
        </h1>
        <HeaderUser username={context.user ? context.user.login : ""} />
      </header>
      <main className="page-wrapper">
        {groups.length === 0 ? (
          <p>Du tillhör inga grupper ännu.</p>
        ) : (
          <>
            <GroupSelect
              groups={groups}
              selectedGroup={selectedGroup}
              onChange={setSelectedGroup}
            />
            <VacationTable
              group={selectedGroupData}
              weeks={weeks}
              monthGroups={monthGroups}
              vacationData={vacationData}
              startDate={startDate}
              onStartDateChange={handleStartDateChange}
            />
          </>
        )}
      </main>
    </>
  );
};
