import React, {
  createContext,
  useState,
  useRef,
  useCallback,
  useContext,
} from "react";
import { ModalDialog } from "./ModalDialog";

export interface ConfirmOptions {
  title: string;
  content?: string;
  confirmButtonLabel: string;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmDialog = createContext<Confirm | null>(null);

const closedState = { isOpen: false, title: "", confirmButtonLabel: "" };

export const ConfirmDialogProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<ConfirmOptions & { isOpen: boolean }>(
    closedState
  );
  const handlerFunction = useRef<((choice: boolean) => void) | undefined>(undefined);

  const confirm = useCallback(
    (forwarded: ConfirmOptions) => {
      return new Promise<boolean>((resolve) => {
        setState({ ...forwarded, isOpen: true });
        handlerFunction.current = (choice: boolean) => {
          resolve(choice);
          setState(closedState);
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

export const useConfirm = (): Confirm => {
  const confirm = useContext(ConfirmDialog);
  if (!confirm) {
    throw new Error("useConfirm must be used within a ConfirmDialogProvider");
  }
  return confirm;
};
