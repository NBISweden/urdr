import React, {
  createContext,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { Alert } from "./Alert";

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

  return (
    <ConfirmDialog.Provider value={confirm}>
      {children}
      <Alert
        {...state}
        onCancel={() => handlerFunction.current(false)}
        onConfirm={() => handlerFunction.current(true)}
      />
    </ConfirmDialog.Provider>
  );
};

export const useConfirm = () => {
  return useContext(ConfirmDialog);
};
