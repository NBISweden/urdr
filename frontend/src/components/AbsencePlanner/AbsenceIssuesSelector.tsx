import React from "react";

interface AbsenceIssuesSelectorProps {
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  options: { id: number; subject: string }[];
  defaultOption: number;
  className?: string;
}

export function AbsenceIssuesSelector({
  onChange,
  options,
  defaultOption,
  className = "",
}: AbsenceIssuesSelectorProps) {
  return (
    <select
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
