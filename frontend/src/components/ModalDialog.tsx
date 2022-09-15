import React, { useEffect, useRef } from "react";
import { useEscaper } from "../utils";

/*
  The modal component can be filled with a simple string using the content prop. 
  In that case, the component should be rendered without children.
  To fill it with more complex JSX, it can be rendered with children.
  If children are present, the content prop will be ignored.
*/

export const ModalDialog = ({
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
  const modal = useRef(null);
  useEscaper(modal, () => onCancel());

  return (
    <section
      className="modal-overlay"
      style={{ display: `${isOpen ? "block" : "none"}` }}
      ref={modal}
    >
      <div
        className="modal-wrapper"
        role="alertdialog"
        aria-modal={true}
        aria-labelledby="modalTitle"
        aria-describedby="modalContent"
      >
        <section className="modal-title-wrapper">
          <h2 id="modalTitle">{title}</h2>
        </section>
        <section className="modal-content-wrapper">
          {!children && <p id="modalContent">{content}</p>}
          {children}
        </section>
        <section className="modal-buttons-wrapper">
          <button
            ref={cancelButton}
            onClick={onCancel}
            className="basic-button modal-cancel-button"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="basic-button modal-confirm-button"
          >
            {confirmButtonLabel}
          </button>
        </section>
      </div>
    </section>
  );
};
