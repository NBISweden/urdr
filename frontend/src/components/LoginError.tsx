import React from "react";
import warning from "../icons/exclamation-circle.svg";

export const LoginError = ({ code }: { code: number }) => {
  const message =
    code === 401
      ? "Wrong combination of username and password."
      : "We are having technical problems. Please try again later.";
  return (
    <>
      <div className="login-error-container">
        <img src={warning} alt="warning" className="login-error-img" />
        <p className="login-error-text">{message}</p>
      </div>
    </>
  );
};
