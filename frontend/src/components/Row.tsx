import React from "react";

export const Row = ({ name, issueId }: { name: string; issueId: number }) => {
  return (
    <>
      <div>
        <p>{name}</p>
      </div>
    </>
  );
};
