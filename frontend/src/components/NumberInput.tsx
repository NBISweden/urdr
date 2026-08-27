import React, { useState } from "react";

type NumberInputProps = {
  max?: number;
  min?: number;
  value: number;
  onChange: (v: number) => void;
  id?: string;
}

export function NumberInput({max, min, value, onChange, id}: NumberInputProps) {
  const [valueStr, setValueStr] = useState(String(value))

  return (
    <input
      id={id}
      type="number"
      max={max}
      min={min}
      value={valueStr}
      onChange={(event) => {
        setValueStr(event.target.value)
      }}
      onBlur={() => {
        const result = Math.max(min, Math.min(max, parseFloat(valueStr)));
        if (isNaN(result)) {
          setValueStr(String(value))
        } else {
          setValueStr(String(result))
          onChange(result)
        }
      }}
    />
  )
}