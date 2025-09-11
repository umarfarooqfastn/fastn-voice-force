import type { RealtimeAgent } from '@openai/agents/realtime';
import { fastnScenario } from './fastnAgent';
import { fastnDocsScenario } from './fastnDocsAgent';

// Map of scenario key -> array of RealtimeAgent objects
export const allAgentSets: Record<string, RealtimeAgent[]> = {
  fastn: fastnScenario,
  fastnDocs: fastnDocsScenario,
};

export const defaultAgentSetKey = 'fastn';