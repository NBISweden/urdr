import React from "react";

export const LoginError = ({ code }: { code: number }) => {
  return (
    <>
      {code === 401 && (
        <div>
          <p>Wrong combination of username and password.</p>
        </div>
      )}
    </>
  );
};
