import type { TeamAssignments } from "@/lib/team";

export type OhmMeasurement = {
  sequence: number;
  voltage: number;
  current: number;
};

export type OhmPayload = {
  teamAssignments?: TeamAssignments;
  measurements: OhmMeasurement[];
  conclusion: string;
};

export type ResistanceFactor = "material" | "length" | "area";

export type ResistanceFactorMeasurement = {
  sequence: number;
  material: string;
  length: number;
  area: number;
  voltage: number;
  current: number;
  resistance: number;
};

export type ResistanceFactorsPayload = {
  teamAssignments?: TeamAssignments;
  investigations: Record<ResistanceFactor, ResistanceFactorMeasurement[]>;
  conclusions: Record<ResistanceFactor, string>;
  overallConclusion?: string;
};

export type PrismColorPayload = {
  teamAssignments?: TeamAssignments;
  constructionCompleted: boolean;
  colorChallengeCompleted: boolean;
  dispersionConclusion?: string;
  colorConclusion: string;
};

export type ExperimentSubmission<TPayload> = {
  id: string;
  schoolYear: string;
  className: string;
  groupName: string;
  createdAt: string;
  payload: TPayload;
};
