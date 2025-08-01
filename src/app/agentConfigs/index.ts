import type { RealtimeAgent } from '@openai/agents/realtime';
import { fastnScenario } from './fastnAgent';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  fastn: fastnScenario,
};

export const defaultAgentSetKey = 'fastn';