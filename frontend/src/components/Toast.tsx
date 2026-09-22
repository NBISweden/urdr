import React, { useEffect, useState } from "react";
import { ToastMsg } from "../model";

export const Toast = ({
  onCloseToast,
  toastList,
}: {
  onCloseToast: (index: number) => void;
  toastList: ToastMsg[];
}) => {
  const [list, setList] = useState<ToastMsg[]>([]);
  useEffect(() => {
    if (list.length === 0) {
      return;
    }

    list.map((toast, i) => {
      setTimeout(() => {
        onCloseToast(i);
      }, toast.timeout);
    });
  }, [list]);

  type ToastIconProps = {
    type: ToastMsg["type"];
  };

  const ToastIcon = ({ type }: ToastIconProps) => {
    switch (type) {
      case "success":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="hsl(107deg 55% 15%)"
            className={`toast-icon toast-icon-${type}`}
            viewBox="0 0 16 16"
          >
            <path d="M10.97 4.97a.75.75 0 0 1 1.07 1.05l-3.99 4.99a.75.75 0 0 1-1.08.02L4.324 8.384a.75.75 0 1 1 1.06-1.06l2.094 2.093 3.473-4.425a.267.267 0 0 1 .02-.022z" />
          </svg>
        );

      case "info":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="hsl(185deg 92% 11%)"
            className={`toast-icon toast-icon-${type}`}
            viewBox="0 0 16 16"
          >
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2" />
          </svg>
        );

      case "warning":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="hsl(6deg 91% 15%)"
            className={`toast-icon toast-icon-${type}`}
            viewBox="0 0 16 16"
          >
            <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.146.146 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.163.163 0 0 1-.054.06.116.116 0 0 1-.066.017H1.146a.115.115 0 0 1-.066-.017.163.163 0 0 1-.054-.06.176.176 0 0 1 .002-.183L7.884 2.073a.147.147 0 0 1 .054-.057zm1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566z" />
            <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995z" />
          </svg>
        );
    }
  };

  useEffect(() => {
    setList(toastList);
  }, toastList);
  return (
    <div className="toast-wrapper">
      {toastList.map((toast, i) => {
        return (
          <div
            className={`toast-box toast-${toast.type}`}
            role={
              toast.type === "success" || toast.type === "info"
                ? "status"
                : "alert"
            }
            key={i}
          >
            <div className="toast-content">
              <ToastIcon type={toast.type} />
              <p className="toast-message">{toast.message}</p>
            </div>
            <button
              onClick={() => onCloseToast(i)}
              className="toast-button"
              aria-label="close message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-x"
                viewBox="0 0 16 16"
              >
                <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
