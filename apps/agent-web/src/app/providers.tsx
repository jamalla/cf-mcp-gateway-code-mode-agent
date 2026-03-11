"use client";

import { ReactNode } from "react";
import { CopilotKit } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";

type Props = {
  children: ReactNode;
};

export function Providers({ children }: Props) {
  return <CopilotKit publicApiKey="demo-public-key">{children}</CopilotKit>;
}