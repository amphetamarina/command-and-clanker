import type { BuildingDescriptor } from "../shared/types.ts";
import type { ProcsResponse } from "../shared/proc-types.ts";

export type WorldResponse = {
  district: string;
  buildings: BuildingDescriptor[];
};

export async function fetchWorld(): Promise<WorldResponse> {
  const res = await fetch("/world");
  if (!res.ok) {
    throw new Error(`/world responded ${res.status}`);
  }
  return (await res.json()) as WorldResponse;
}

export async function fetchProcs(): Promise<ProcsResponse> {
  const res = await fetch("/procs");
  if (!res.ok) {
    throw new Error(`/procs responded ${res.status}`);
  }
  return (await res.json()) as ProcsResponse;
}
