import "../../index.css";
import React, { useState, useMemo, useContext, useEffect } from "react";
import { VacationTable } from "./VacationTable";
import { AuthContext } from "../AuthProvider";
import { Group, UserSetting } from "../../model";
import { getApiEndpoint, PUBLIC_API_URL } from "../../utils";
import { fetchVacationData, generateWeeks, groupWeeksByMonth} from './utils';
import { GroupSelect } from "./GroupSelect";

export const VacationOverview = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [vacationData, setVacationData] = useState<{ [userId: string]: number[] }>({});
    const [selectedGroup, setSelectedGroup]= useState<number | null>(null);
    const [savedGroup, setSavedGroup] = useState<number | null>(null);

    const context = useContext(AuthContext);

    const getGroups = async () => {
        const groups: Group[] = await getApiEndpoint("/api/groups", context);
        if (!groups) {
            return [];
        }
        return groups;  
    };

    const getSavedGroup = async () => {
        const groupSettingArray: UserSetting[] = await getApiEndpoint("/api/setting?name=group", context);
        const groupSettingObject = groupSettingArray.find((setting) => setting.name === "group");
        const { value } = groupSettingObject || {};
        const groupId = Number(value);
        if (isNaN(groupId)) {
            return;
        }
        return groupId;
    };

    const selectGroup = (groups: Group[], savedGroupId: number | null) => {
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

    const saveSettings = async (
      settings: { name: string; value: string }[],
      context: any
    ) => {
      const url = new URL(`${PUBLIC_API_URL}/api/setting`);
      url.search = new URLSearchParams({
        name: settings[0].name,
        value: settings[0].value,
      }).toString();
      const headers = new Headers({
        "Accept": "application/json",
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
    }

    useEffect(() => {
        const fetchGroupData = async () => {
            const groups = await getGroups();
            setGroups(groups);

            const groupId = await getSavedGroup();
            setSavedGroup(groupId);

            const selectedGroup = selectGroup(groups, groupId);
            setSelectedGroup(selectedGroup);
        };
        fetchGroupData();
    }, []);

    const selectedGroupData = groups.find((group) => group.id === selectedGroup)
    const weeks = useMemo(() => generateWeeks(), []);
    const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

    useEffect(() => {
        if (!selectedGroupData) return;

        const loadVacationData = async () => {
            const userIds =  selectedGroupData.users.map(user => ({ id: user.id }));
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
            }
            )
            .catch((error) => {
                console.error("Error saving group:", error);
            }
        );
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
}
