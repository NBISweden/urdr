import "../../index.css";
import React, { useState, useMemo, useContext, useEffect } from "react";
import { VacationTable } from "./VacationTable";
import { AuthContext } from "../AuthProvider";
import { Group, UserSetting } from "../../model";
import { getApiEndpoint } from "../../utils";
import { fetchVacationData, generateWeeks, groupWeeksByMonth} from './utils';
import { GroupSelect } from "./GroupSelect";

export const VacationOverview = () => {
    const [groups, setGroups] = useState<Group[]>([]);
    const [vacationData, setVacationData] = useState<{ [userId: string]: number[] }>({});
    const [selectedGroup, setSelectedGroup]= useState<number | null>(null);

    const context = useContext(AuthContext);

    const getGroups = async () => {
        const groups: Group[] = await getApiEndpoint("/api/groups", context);
        if (!groups) {
            return [];
        }
        return groups;  
    };

    const getGroupSetting = async () => {
        const groupSettingArray: UserSetting[] = await getApiEndpoint("/api/setting?name=group", context);
        const groupSettingObject = groupSettingArray.find((setting) => setting.name === "group");
        const { value } = groupSettingObject || {};
        const groupId = Number(value);
        if (isNaN(groupId)) {
            return;
        } else {
            return groupId;
        }
    };

    useEffect(() => {
        const fetchGroupData = async () => {
            const groups = await getGroups();
            setGroups(groups);
            const groupId = await getGroupSetting();
            if (groups.length > 0) {
                const group = groups.find((group) => group.id === groupId);
                const nbisgroup = groups.find((group) => group.name === "NBIS staff");
                if (group) {
                    setSelectedGroup(group.id);
                } else if (nbisgroup) {
                    setSelectedGroup(nbisgroup.id);
                } else {
                    setSelectedGroup(groups[0].id);
                }
            }
        };
        fetchGroupData();
    }, [context]);

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
