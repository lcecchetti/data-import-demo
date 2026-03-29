import type { PropsWithChildren } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

type StepProps = PropsWithChildren & {
  title: string;
  description: string;
}

export const Step = ({ children, title, description }: StepProps) => (
  <Card>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>
      {children}
    </CardContent>
  </Card>
)