import React, { ReactChild, useState } from "react";

export const Tooltip = ({
  text,
  children,
}: {
  text: string;
  children: ReactChild;
}) => {
  const [visible, setVisible] = useState(false);
  return (
    <div
      className="issuetooltip"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && <span className="tooltiptext">{text}</span>}
    </div>
  );
};
