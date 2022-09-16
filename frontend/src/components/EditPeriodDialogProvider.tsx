import React, {
  createContext,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { ModalDialog } from "./ModalDialog";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import sv from "date-fns/locale/sv";
import { dateFormat } from "../utils";

const EditPeriodDialog = createContext(null);

export const EditPeriodDialogProvider = ({ children }) => {
  const [updatedAbsenceStartDate, setUpdatedAbsenceStartDate] =
    useState<Date>(undefined);
  const [updatedAbsenceEndDate, setUpdatedAbsenceEndDate] =
    useState<Date>(undefined);
  const [state, setState] = useState<{}>({ isOpen: false });
  const handlerFunction =
    useRef<
      (selection: { choice: boolean; startDate: Date; endDate: Date }) => void
    >();

  const UpdateAbsenceRangesContainer = (): JSX.Element => (
    <div>
      <p>Please enter below the new start and end date of your absence.</p>
      <p>From</p>
      <DatePicker
        dateFormat={dateFormat}
        isClearable={true}
        selected={updatedAbsenceStartDate ? updatedAbsenceStartDate : undefined}
        onChange={(date: Date) => {
          setUpdatedAbsenceStartDate(date);
        }}
        showWeekNumbers
        minDate={new Date()}
        maxDate={new Date("2030-01-01")}
        locale={sv}
        showYearDropdown
        todayButton="Idag"
        selectsStart
        startDate={updatedAbsenceStartDate}
        endDate={updatedAbsenceEndDate}
        monthsShown={1}
      />
      <p>To</p>
      <DatePicker
        dateFormat={dateFormat}
        isClearable={true}
        selected={updatedAbsenceEndDate ? updatedAbsenceEndDate : undefined}
        onChange={(date: Date) => {
          setUpdatedAbsenceEndDate(date);
        }}
        showWeekNumbers
        minDate={updatedAbsenceStartDate}
        maxDate={new Date("2030-01-01")}
        locale={sv}
        showYearDropdown
        todayButton="Idag"
        selectsEnd
        startDate={updatedAbsenceStartDate}
        endDate={updatedAbsenceEndDate}
        monthsShown={1}
      />
    </div>
  );

  const selectDates = useCallback(
    (forwarded) => {
      return new Promise((resolve) => {
        setState({ ...forwarded, isOpen: true });
        handlerFunction.current = (selection: {
          choice: boolean;
          startDate: Date;
          endDate: Date;
        }) => {
          resolve(selection);
          setState({ isOpen: false });
        };
      });
    },
    [setState]
  );

  return (
    <EditPeriodDialog.Provider value={selectDates}>
      {children}
      <ModalDialog
        {...state}
        onCancel={() =>
          handlerFunction.current({
            choice: false,
            startDate: updatedAbsenceStartDate,
            endDate: updatedAbsenceEndDate,
          })
        }
        onConfirm={() =>
          handlerFunction.current({
            choice: true,
            startDate: updatedAbsenceStartDate,
            endDate: updatedAbsenceEndDate,
          })
        }
      >
        {UpdateAbsenceRangesContainer()}
      </ModalDialog>
    </EditPeriodDialog.Provider>
  );
};

export const useSelectDates = () => {
  return useContext(EditPeriodDialog);
};
