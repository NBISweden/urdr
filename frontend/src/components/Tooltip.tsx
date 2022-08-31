import React, { ReactChild, useState } from "react";

export const Tooltip = ({
  content,
  children,
}: {
  content: string | JSX.Element;
  children: ReactChild;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="tooltip-wrapper"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && <span className="tooltip-box">{content}</span>}
    </div>
  );
};
