import React, {
  createContext,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { Alert } from "./Alert";

const ConfirmDialogue = createContext(null);

export const ConfirmDialogueProvider = ({ children }) => {
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
    <ConfirmDialogue.Provider value={confirm}>
      {children}
      <Alert
        {...state}
        onCancel={() => handlerFunction.current(false)}
        onConfirm={() => handlerFunction.current(true)}
      />
    </ConfirmDialogue.Provider>
  );
};

export const useConfirm = () => {
  return useContext(ConfirmDialogue);
};
