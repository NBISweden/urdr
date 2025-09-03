import React from "react";
import DatePicker from "react-datepicker";
import enGB from "date-fns/locale/en-GB";

type Props = {
    onWeekDateChange: (newDate: Date) => void;
    startDate: Date;
    labelText: string;
}


export const WeekPicker : React.FC<Props> = ({
    startDate,
    onWeekDateChange,
    labelText
}) => {
    return (
        <div className="week-picker-wrapper">
            <label htmlFor="week-picker">{labelText}</label>
            <DatePicker
                id="week-picker"
                selected={startDate}
                onChange={(date: Date) => onWeekDateChange(date)}
                dateFormat="I - R"
                locale={enGB}
                showWeekNumbers
                showWeekPicker
            />
        </div>

    )
}