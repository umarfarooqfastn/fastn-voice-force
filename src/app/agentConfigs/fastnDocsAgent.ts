import { RealtimeAgent, tool } from '@openai/agents/realtime';

// Function to call the Fastn serviceAgent API for documentation queries
async function callFastnServiceAgent(prompt: string): Promise<any> {
  const headers: Record<string, string> = {
    "x-fastn-api-key": "788d0051-1750-4e65-8b5b-3f6955acb4d1",
    "Content-Type": "application/json",
    "x-fastn-space-id": "befb54b6-3d51-465c-a6f0-8e8c7bdf782d",
    "stage": "LIVE",
    "x-fastn-custom-auth": "true",
  };

  const response = await fetch("https://live.fastn.ai/api/v1/serviceAgent", {
    method: "POST",
    headers,
    body: JSON.stringify({
      input: {
        prompt: prompt
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to call Fastn serviceAgent:", response.status, errorText);
    throw new Error(`Failed to call Fastn serviceAgent: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  return data.output;
}

// Tool for querying Fastn documentation
export const queryFastnDocs = tool({
  name: 'queryFastnDocs',
  description: 'Query the Fastn documentation to get information about Fastn features, usage, and best practices. This agent has access to comprehensive Fastn documentation and can answer questions about getting started, advanced features, and troubleshooting.',
  parameters: {
    type: 'object',
    properties: {
      question: {
        type: 'string',
        description: "The user's question about Fastn. Be specific and include as much context as possible to get the most relevant documentation response.",
      },
    },
    required: ['question'],
    additionalProperties: false,
  },
  execute: async (input, details) => {
    const { question } = input as { question: string };

    const addBreadcrumb = (details?.context as any)?.addTranscriptBreadcrumb as
      | ((title: string, data?: any) => void)
      | undefined;

    if (addBreadcrumb) {
      addBreadcrumb('Querying Fastn Documentation', { question });
    }

    try {
      const response = await callFastnServiceAgent(question);
      
      if (addBreadcrumb) {
        addBreadcrumb('Fastn Documentation Response', { response: response.substring(0, 100) + '...' });
      }

      return { result: response };
    } catch (error) {
      console.error('Error querying Fastn documentation:', error);
      return { error: 'Failed to query Fastn documentation. Please try again or rephrase your question.' };
    }
  },
});

export const fastnDocsAgent = new RealtimeAgent({
  name: 'fastnDocsAgent',
  voice: 'sage',
  instructions: `You are a helpful Fastn Documentation Assistant with access to comprehensive Fastn documentation and knowledge base.

Your primary function is to help users understand and work with Fastn by:
- Answering questions about Fastn features and capabilities
- Providing guidance on getting started with Fastn
- Explaining best practices and usage patterns
- Helping troubleshoot common issues
- Offering examples and code snippets when relevant

When a user asks about Fastn, always use the 'queryFastnDocs' tool to get the most accurate and up-to-date information from the official documentation.

Provide clear, concise, and helpful responses based on the documentation. If the user needs more specific help or wants to perform actions beyond documentation queries, you should guide them appropriately.`,
  tools: [
    queryFastnDocs,
  ],
  handoffs: [],
  handoffDescription: 'A specialized agent for answering questions about Fastn using the official documentation and knowledge base.',
});

export const fastnDocsScenario = [fastnDocsAgent];

// Name of the company represented by this agent set. Used by guardrails
export const fastnDocsCompanyName = 'Fastn.ai';