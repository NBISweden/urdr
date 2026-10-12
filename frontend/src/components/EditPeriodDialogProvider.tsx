import React, {
  createContext,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { ModalDialog } from "./ModalDialog";
import { ConfirmOptions } from "./ConfirmDialogProvider";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { sv } from "date-fns/locale/sv";
import { dateFormat, isWeekday } from "../utils";

const EditPeriodDialog = createContext(null);

const closedState = { isOpen: false, title: "", confirmButtonLabel: "" };

export const EditPeriodDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [updatedAbsenceStartDate, setUpdatedAbsenceStartDate] =
    useState<Date | undefined>(undefined);
  const [updatedAbsenceEndDate, setUpdatedAbsenceEndDate] =
    useState<Date | undefined>(undefined);
  const [state, setState] = useState<ConfirmOptions & { isOpen: boolean }>(
    closedState
  );
  const handlerFunction =
    useRef<
      ((selection: { choice: boolean; startDate: Date; endDate: Date }) => void) | undefined
    >(undefined);

  const UpdateAbsenceRangesContainer = (): React.JSX.Element => (
    <div>
      <p>Please enter below the new start and end date of your absence.</p>
      <hr></hr>
      <label htmlFor="fromDate">Start date</label>
      <div>
        <DatePicker
          filterDate={isWeekday}
          dateFormat={dateFormat}
          selected={
            updatedAbsenceStartDate ? updatedAbsenceStartDate : undefined
          }
          onChange={(date: Date) => {
            setUpdatedAbsenceStartDate(date);
          }}
          showWeekNumbers
          locale={sv}
          showYearDropdown
          todayButton="Idag"
          selectsStart
          startDate={updatedAbsenceStartDate}
          endDate={updatedAbsenceEndDate}
          monthsShown={1}
          className="form-control dateInput"
          placeholderText="YYYY-MM-DD"
          strictParsing
        />
      </div>
      <label htmlFor="toDate">End date</label>

      <div>
        <DatePicker
          filterDate={isWeekday}
          dateFormat={dateFormat}
          selected={updatedAbsenceEndDate ? updatedAbsenceEndDate : undefined}
          onChange={(date: Date) => {
            setUpdatedAbsenceEndDate(date);
          }}
          showWeekNumbers
          locale={sv}
          showYearDropdown
          todayButton="Idag"
          selectsEnd
          startDate={updatedAbsenceStartDate}
          endDate={updatedAbsenceEndDate}
          monthsShown={1}
          className="form-control dateInput"
          placeholderText="YYYY-MM-DD"
          strictParsing
        />
      </div>
    </div>
  );

  const selectDates = useCallback(
    ({
      startDate,
      endDate,
      ...options
    }: ConfirmOptions & { startDate: Date; endDate: Date }) => {
      return new Promise((resolve) => {
        setState({ ...options, isOpen: true });
        setUpdatedAbsenceStartDate(startDate);
        setUpdatedAbsenceEndDate(endDate);
        handlerFunction.current = (selection: {
          choice: boolean;
          startDate: Date;
          endDate: Date;
        }) => {
          resolve(selection);
          setState(closedState);
        };
      });
    },
    [setState]
  );

  const onChoiceMade = (choice: boolean) => {
    if (handlerFunction.current) {
      handlerFunction.current({
        choice: choice,
        startDate: updatedAbsenceStartDate,
        endDate: updatedAbsenceEndDate,
      });
      setUpdatedAbsenceStartDate(undefined);
      setUpdatedAbsenceEndDate(undefined);
    }
  };

  return (
    <EditPeriodDialog.Provider value={selectDates}>
      {children}
      <ModalDialog
        {...state}
        onCancel={() => onChoiceMade(false)}
        onConfirm={() => onChoiceMade(true)}
      >
        {UpdateAbsenceRangesContainer()}
      </ModalDialog>
    </EditPeriodDialog.Provider>
  );
};

export const useSelectDates = () => {
  return useContext(EditPeriodDialog);
};
