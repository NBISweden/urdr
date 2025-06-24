import "../index.css";
import React, { useState, useMemo, useContext, useEffect } from "react";
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

export const VacationOverview = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [vacationData, setVacationData] = useState<{
    [userId: string]: number[];
  }>({});
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [savedGroup, setSavedGroup] = useState<number | null>(null);
  const [loadingVacationData, setLoadingVacationData] =
    useState<boolean>(false);

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
  const weeks = useMemo(() => generateWeeks(), []);
  const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

  useEffect(() => {
    if (!selectedGroupData) return;

    const loadAbsenceData = async () => {
      setLoadingVacationData(true);
      try {
        const userIds = selectedGroupData.users.map((user) => ({
          id: user.id,
        }));
        const vacationData = await fetchAbsenceData(
          { id: 6995, name: "Vacation" },
          userIds,
          weeks,
          context
        );
        const parentalLeaveData = await fetchAbsenceData(
          { id: 6992, name: "Parental Leave" },
          userIds,
          weeks,
          context
        );

        // Merge parental data into vacation data under absenceData
        const absenceData = { ...vacationData };

        for (const userId in parentalLeaveData) {
          if (absenceData[userId]) {
            absenceData[userId] = absenceData[userId].concat(
              parentalLeaveData[userId]
            );
          } else {
            absenceData[userId] = parentalLeaveData[userId];
          }
        }
        setVacationData(absenceData);
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
            />
          </>
        )}
      </main>
    </>
  );
};
