/** A new Projects conversation starts with the first running agent. */
export function pickDefaultProjectsAgent<Agent>(
  agents: readonly Agent[],
): Agent | null {
  return agents[0] ?? null;
}
