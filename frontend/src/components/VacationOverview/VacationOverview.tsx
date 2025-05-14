import "../../index.css";
import React, { useState, useMemo, useContext, useEffect } from "react";
import { VacationTable } from "./VacationTable";
import { AuthContext } from "../AuthProvider";
import { Group } from "../../model";
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
        setGroups(groups);

        const nbisGroup = groups.find((group) => group.name === "NBIS staff");
        if (nbisGroup) {
            setSelectedGroup(nbisGroup.id);
        } else if (groups.length > 0) {
            setSelectedGroup(groups[0].id);
        }
    };

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
        getGroups();
    }, []);

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
