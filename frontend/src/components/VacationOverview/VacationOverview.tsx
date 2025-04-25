import "../../index.css";
import React, { useState, useMemo } from "react";
import {VacationTable} from "./VacationTable";
import {AuthContext} from "../AuthProvider";
import {Group} from "../../model";
import {getApiEndpoint} from "../../utils";
import {fetchVacationData, generateWeeks, groupWeeksByMonth} from './utils';
import {GroupSelect} from "./GroupSelect";


export const VacationOverview = () => {
    const context = React.useContext(AuthContext);
    const getGroups = async () => {
        const groups: Group[] = await getApiEndpoint("/api/groups", context);
        setGroups(groups);

        const nbisGroup = groups.find((group) => group.name === "NBIS staff");

        if (nbisGroup) {
            setSelectedGroup(nbisGroup.name);
        } else if (groups.length > 0) {
            setSelectedGroup(groups[0].name);
        }
    };
    const [groups, setGroups] = useState<Group[]>([]);
    const [vacationData, setVacationData] = useState<{ [userId: string]: number[] }>({});
    let [selectedGroup, setSelectedGroup]= useState<string | null>(null);
    const selectedGroupData = groups.find((group) => group.name === selectedGroup)
    const weeks = useMemo(() => generateWeeks(), []);
    const monthGroups = useMemo(() => groupWeeksByMonth(weeks), [weeks]);

    React.useEffect(() => {
        if (!selectedGroupData) return;

        const loadVacationData = async () => {
            const userIds =  selectedGroupData.users.map(user => ({ id: user.id }));
            const data = await fetchVacationData(userIds, weeks, context);
            setVacationData(data);
        };

        loadVacationData();
    }, [selectedGroupData, context]);

    React.useEffect(() => {
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
