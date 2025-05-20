import "../../index.css";
import React, { useState, useMemo, useContext, useEffect } from "react";
import { VacationTable } from "./VacationTable";
import { AuthContext } from "../AuthProvider";
import { Group } from "../../model";
import {
  getGroups,
  getSavedGroup,
  selectGroup,
  saveSettings,
  fetchVacationData,
  generateWeeks,
  groupWeeksByMonth,
} from "./utils";
import { GroupSelect } from "./GroupSelect";

export const VacationOverview = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [vacationData, setVacationData] = useState<{
    [userId: string]: number[];
  }>({});
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [savedGroup, setSavedGroup] = useState<number | null>(null);

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

    const loadVacationData = async () => {
      const userIds = selectedGroupData.users.map((user) => ({ id: user.id }));
      const data = await fetchVacationData(userIds, weeks, context);
      setVacationData(data);
    };

    loadVacationData();
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
    <div className="vacation-overview">
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
    </div>
  );
};
