import { MouseSensor } from "@dnd-kit/core";
import { MouseEvent, TouchEvent } from "react";

// Block DnD event propagation if an html element has "data-no-dnd=true" attribute
const handler = ({ nativeEvent: event }: MouseEvent | TouchEvent) => {
  let cur = event.target as HTMLElement;

  while (cur) {
    if (cur.dataset && cur.dataset.noDnd) {
      return false;
    }
    cur = cur.parentElement as HTMLElement;
  }

  return true;
};

export class CustomMouseSensor extends MouseSensor {
  static activators = [
    { eventName: "onMouseDown", handler },
  ] as (typeof MouseSensor)["activators"];
}
