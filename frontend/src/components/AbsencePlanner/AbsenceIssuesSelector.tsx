import React from "react";

interface AbsenceIssuesSelectorProps {
  id?: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: { id: number; subject: string }[];
  defaultOption: number;
  className?: string;
}

export function AbsenceIssuesSelector({
  id,
  onChange,
  options,
  defaultOption,
  className = "",
}: AbsenceIssuesSelectorProps) {
  return (
    <select
      id={id}
      defaultValue={defaultOption}
      className={className}
      name="reason-for-absence"
      onChange={onChange}
    >
      {options.map((issue) => (
        <option value={issue.id} key={issue.id}>
          {issue.subject}
        </option>
      ))}
    </select>
  );
}

export default AbsenceIssuesSelector;
