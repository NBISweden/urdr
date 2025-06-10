import {Group} from "../../model";
import React from "react";

type Props = {
    groups: Group[];
    selectedGroup: number | null;
    onChange: (groupId: number) => void;
};

export const GroupSelect: React.FC<Props> = ({ groups, selectedGroup, onChange }) => {
    return (
        <div className="group-select-wrapper">
            <label htmlFor="group-select">
                Select group:
            </label>
            <select id="group-select" onChange={(e) => onChange(Number(e.target.value))} value={selectedGroup ?? ''}>
                {groups &&
                    groups.map((group) => (
                        <option key={group.id}  value={group.id}>
                            {group.name}
                        </option>
                    ))}
            </select>
        </div>
    );
};