import React from "react";

export const Alert = ({
  isOpen,
  title,
  content,
  confirmButtonLabel,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  content: string;
  confirmButtonLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  return (
    <section
      className="alert-overlay"
      style={{ display: `${isOpen ? "block" : "none"}` }}
    >
      <div className="alert-wrapper">
        <h1>{title}</h1>
        <p>{content}</p>
        <button onClick={onCancel}>Cancel</button>
        <button onClick={onConfirm}>{confirmButtonLabel}</button>
      </div>
    </section>
  );
};
