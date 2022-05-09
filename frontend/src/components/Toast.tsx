import React, { useEffect } from "react";
import xgreen from "../icons/x-green.svg";

export const Toast = ({ onCloseToast }: { onCloseToast: () => void }) => {
  useEffect(() => {
    setTimeout(() => {
      onCloseToast();
    }, 3000);
  });
  return (
    <div className="toast-box" role="status">
      <p className="toast-message">All changes saved!</p>
      <button onClick={onCloseToast} className="toast-button">
        <img src={xgreen} alt="close button" />
      </button>
    </div>
  );
};
