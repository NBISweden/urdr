import React from "react";

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
  return (
    <section
      className="alert-overlay"
      style={{ display: `${isOpen ? "block" : "none"}` }}
    >
      <div className="alert-wrapper">
        <section className="alert-title-wrapper">
          <h2>{title}</h2>
        </section>
        <section className="alert-content-wrapper">
          {!children && <p>{content}</p>}
          {children}
        </section>
        <section className="alert-buttons-wrapper">
          <button
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
