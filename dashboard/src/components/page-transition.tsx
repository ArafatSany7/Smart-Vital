import { ViewTransition, type ReactNode } from "react";

export const FORWARD = ["journey-forward"];
export const BACK = ["journey-back"];

export function PageTransition({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <ViewTransition
      key={id}
      enter={{ "journey-forward": "journey-in", "journey-back": "journey-back-in", default: "page-in" }}
      exit={{ "journey-forward": "journey-out", "journey-back": "journey-back-out", default: "page-out" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
