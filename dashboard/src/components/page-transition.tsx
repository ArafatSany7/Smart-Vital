import { ViewTransition, type ReactNode } from "react";

export function PageTransition({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <ViewTransition key={id} exit="page-out" default="none">
      {children}
    </ViewTransition>
  );
}
