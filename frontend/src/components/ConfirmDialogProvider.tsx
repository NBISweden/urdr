import React, {
  createContext,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { ModalDialog } from "./ModalDialog";

const ConfirmDialog = createContext(null);

export const ConfirmDialogProvider = ({ children }) => {
  const [state, setState] = useState<{}>({ isOpen: false });
  const handlerFunction = useRef<(choice: boolean) => void>();

  const confirm = useCallback(
    (forwarded) => {
      return new Promise((resolve) => {
        setState({ ...forwarded, isOpen: true });
        handlerFunction.current = (choice: boolean) => {
          resolve(choice);
          setState({ isOpen: false });
        };
      });
    },
    [setState]
  );

  const onConfirm = () => {
    if (handlerFunction.current) {
      handlerFunction.current(true);
    }
  };

  const onCancel = () => {
    if (handlerFunction.current) {
      handlerFunction.current(false);
    }
  };

  return (
    <ConfirmDialog.Provider value={confirm}>
      {children}
      <ModalDialog {...state} onCancel={onCancel} onConfirm={onConfirm} />
    </ConfirmDialog.Provider>
  );
};

export const useConfirm = () => {
  return useContext(ConfirmDialog);
};
