export type OhmMeasurement = {
  sequence: number;
  voltage: number;
  current: number;
};

export type OhmPayload = {
  resistorName: string;
  measurements: OhmMeasurement[];
  conclusion: string;
};

export type ResistanceFactor = "material" | "length" | "area";

export type ResistanceFactorMeasurement = {
  sequence: number;
  material: string;
  length: number;
  area: number;
  resistance: number;
};

export type ResistanceFactorsPayload = {
  investigations: Record<ResistanceFactor, ResistanceFactorMeasurement[]>;
  conclusions: Record<ResistanceFactor, string>;
};

export type ExperimentSubmission<TPayload> = {
  id: string;
  className: string;
  groupName: string;
  createdAt: string;
  payload: TPayload;
};
