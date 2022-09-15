import React, { useEffect, useRef } from "react";
import { useEscaper } from "../utils";

/*
  The Alert component can be filled with a simple string using the content prop. 
  In that case, the component should be rendered without children.
  To fill it with more complex JSX, it can be rendered with children.
  If children are present, the content prop will be ignored.
*/

export const Alert = ({
  isOpen,
  title,
  content,
  confirmButtonLabel,
  onCancel,
  onConfirm,
  children,
}: {
  isOpen: boolean;
  title: string;
  content?: string;
  confirmButtonLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  children: JSX.Element;
}) => {
  // Autofocus on cancel button when opening dialog
  const cancelButton = useRef(null);
  useEffect(() => {
    cancelButton.current.focus();
  });

  // Close the dialog when pressing escape
  const alert = useRef(null);
  useEscaper(alert, () => onCancel());

  return (
    <section
      className="alert-overlay"
      style={{ display: `${isOpen ? "block" : "none"}` }}
      ref={alert}
    >
      <div
        className="alert-wrapper"
        role="alertdialog"
        aria-modal={true}
        aria-labelledby="alertTitle"
        aria-describedby="alertContent"
      >
        <section className="alert-title-wrapper">
          <h2 id="alertTitle">{title}</h2>
        </section>
        <section className="alert-content-wrapper">
          {!children && <p id="alertContent">{content}</p>}
          {children}
        </section>
        <section className="alert-buttons-wrapper">
          <button
            ref={cancelButton}
            onClick={onCancel}
            className="basic-button alert-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="basic-button alert-confirm-button"
          >
            {confirmButtonLabel}
          </button>
        </section>
      </div>
    </section>
  );
};
