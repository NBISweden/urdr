import React, { ReactChild, useState } from "react";

export const Tooltip = ({
  content,
  children,
  position = "top",
}: {
  content: string | JSX.Element;
  children: ReactChild;
  position?: "top" | "top-start" | "top-end";
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className={`tooltip-box tooltip-box-${position}`}>{content}</span>
      )}
    </div>
  );
};
