import {Group} from "../../model";
import React from "react";

type Props = {
    groups: Group[];
    selectedGroup: string | null;
    onChange: (groupId: string) => void;
};

export const GroupSelect: React.FC<Props> = ({ groups, selectedGroup, onChange }) => {
    return (
        <select className="group-select" onChange={(e) => onChange(e.target.value)} value={selectedGroup ?? ''}>
            {groups &&
                groups.map((group) => (
                    <option key={group.id}  value={group.name}>
                        {group.name}
                    </option>
                ))}
        </select>
    )
}