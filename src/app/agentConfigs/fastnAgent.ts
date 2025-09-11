import { RealtimeAgent, tool, RealtimeItem } from '@openai/agents/realtime';

// Helper function to fetch tools from Fastn API
async function getFastnTools(): Promise<any[]> {
  const headers = {
    "x-fastn-api-key": process.env.FASTN_API_KEY,
    "x-fastn-space-id": process.env.FASTN_SPACE_ID,
    "x-fastn-space-tenantid": "",
    "stage": "LIVE",
    "x-fastn-custom-auth": "true",
    "Content-Type": "application/json",
  };
  const resp = await fetch("https://live.fastn.ai/api/ucl/getTools", {
    method: "POST",
    headers,
    body: JSON.stringify({ input: {} }),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Failed to fetch Fastn tools:", resp.status, errorText);
    throw new Error(`Failed to fetch Fastn tools: ${resp.status} ${errorText}`);
  }
  const data = await resp.json();
  return data.map((tool: any) => ({
    type: "function",
    name: tool.function.name,
    description: tool.function.description,
    parameters: tool.function.parameters,
    actionId: tool.actionId, // Store actionId for execution
  }));
}

// Helper function to execute a tool via Fastn API
async function executeFastnTool(actionId: string, parameters: any): Promise<any> {
  const headers = {
    "x-fastn-api-key": process.env.FASTN_API_KEY ,
    "x-fastn-space-id": process.env.FASTN_SPACE_ID ,
    "x-fastn-space-tenantid": "",
    "stage": "LIVE",
    "x-fastn-custom-auth": "true",
    "Content-Type": "application/json",
  };
  const resp = await fetch("https://live.fastn.ai/api/ucl/executeTool", {
    method: "POST",
    headers,
    body: JSON.stringify({ input: { actionId, parameters } }),
  });
  if (!resp.ok) {
    const errorText = await resp.text();
    console.error("Failed to execute Fastn tool:", resp.status, errorText);
    throw new Error(`Failed to execute Fastn tool: ${resp.status} ${errorText}`);
  }
  return resp.json();
}

// This function is similar to fetchResponsesMessage in supervisorAgent.ts
// It calls the local /api/responses endpoint which proxies to OpenAI.
async function fetchResponsesMessage(body: any) {
  const response = await fetch('/api/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, parallel_tool_calls: false }),
  });

  if (!response.ok) {
    console.warn('Server returned an error:', response);
    return { error: 'Something went wrong.' };
  }

  const completion = await response.json();
  return completion;
}

// The main tool for the Fastn agent that handles dynamic tool execution
export const callFastnAPI = tool({
  name: 'callFastnAPI',
  description: 'A tool to interact with the Fastn.ai platform to dynamically fetch and execute various tools. Use this tool whenever you need to perform an action that might involve external systems or data retrieval.',
  parameters: {
    type: 'object',
    properties: {
      user_query: {
        type: 'string',
        description: "The user's full query or intent that needs to be addressed by a Fastn tool. Provide as much detail as possible from the user's request.",
      },
    },
    required: ['user_query'],
    additionalProperties: false,
  },
  execute: async (input, details) => {
    const { user_query } = input as { user_query: string };

    const addBreadcrumb = (details?.context as any)?.addTranscriptBreadcrumb as
      | ((title: string, data?: any) => void)
      | undefined;

    const history: RealtimeItem[] = (details?.context as any)?.history ?? [];
    const filteredLogs = history.filter((log) => log.type === 'message');

    let fastnTools: any[] = [];
    try {
      fastnTools = await getFastnTools();
      if (addBreadcrumb) {
        addBreadcrumb('Fetched Fastn Tools', fastnTools.map(t => t.name));
      }
    } catch (error) {
      console.error('Error fetching Fastn tools:', error);
      return { error: 'Failed to fetch available tools from Fastn.ai.' };
    }
    const now = new Date().toISOString();
    // Prepare the body for the /api/responses call to let OpenAI decide which Fastn tool to use
    const body: any = {
      model: 'gpt-5-mini', // Or another suitable model
      input: [
        {
          type: 'message',
          role: 'system',
          content: `You are an assistant that can use Fastn.ai tools to fulfill user requests.
          Here are the available Fastn.ai tools: ${JSON.stringify(fastnTools.map(t => ({ name: t.name, description: t.description, parameters: t.parameters })), null, 2)}
          
          Based on the user's query, decide which Fastn.ai tool to call and with what parameters.
          If no tool is suitable, respond with a message to the user.

          * Google Docs & Sheets:
    * ID for Updates: Updating existing documents/sheets REQUIRES an "ID", not just a name.
    * Two-Step Creation & Population:
        1.  Create: First, call the function to create the blank document/sheet. Get the title from the user and confirm before this step.
        2.  Update/Append: Once creation is confirmed and the ID is available, use a *separate* function call to add/insert content using that ID.
        * NEVER attempt to insert content during the initial creation call.
        * If a document/sheet is confirmed as already created (and its ID is known), proceed directly to content insertion or other modification actions.
    * Google Docs Update Specifics: Ensure 'location' and 'index' parameters are correctly passed for updates to avoid failures.and pass location index as 1 for first time after creation.
    * Slack:
    * '#channelName' can be used as both channel ID and name. Pass it as the ID if provided in this format.
    * For sending messages: If the user provides names for recipients, use a helper function (if available) to retrieve their Slack user IDs. If multiple matches occur for a name, you may need to ask the user to clarify. Send the message using the retrieved IDs.
    *Google Calendar:
        *Creating Meetings Requires a title and a date. state time and end time and zone should be US make sure you are passing time dont miss any parameters.
   * Google Sheets:
        - IN the body you just need pass the title of the sheet. Dont pass any other parameters.
        - Example =>  {
            "properties": {
              "title": "ask user to provide a title for the sheet or use a default title from context"
            }
          }
        - Slack Example Use Blocks If needed With Correct Format if You Know => {
            "channel": "#channelName or use the channel ID",
            "text": "Hello, team! This is a message from the Fastn agent.",
            "blocks": []
          }
        * Current Date: ${now}
          `,
        },
        {
          type: 'message',
          role: 'user',
          content: `User's request: ${user_query}`,
        },
      ],
      tools: fastnTools, // Pass the dynamically fetched tools to OpenAI
    };

    let currentResponse = await fetchResponsesMessage(body);

    while (true) {
      if (currentResponse?.error) {
        return { error: 'Something went wrong with OpenAI response.' } as any;
      }

      const outputItems: any[] = currentResponse.output ?? [];

      const functionCalls = outputItems.filter((item) => item.type === 'function_call');

      if (functionCalls.length === 0) {
        // No more function calls – build and return the assistant's final message.
        const assistantMessages = outputItems.filter((item) => item.type === 'message');

        const finalText = assistantMessages
          .map((msg: any) => {
            const contentArr = msg.content ?? [];
            return contentArr
              .filter((c: any) => c.type === 'output_text')
              .map((c: any) => c.text)
              .join('');
          })

        return { result: finalText };
      }

      // Execute each function call returned by OpenAI using the executeFastnTool API
      for (const toolCall of functionCalls) {
        const fName = toolCall.name;
        const args = JSON.parse(toolCall.arguments || '{}');

        // Find the actionId for the tool being called
        const fastnTool = fastnTools.find(t => t.name === fName);
        if (!fastnTool || !fastnTool.actionId) {
          console.error(`Action ID not found for tool: ${fName}`);
          return { error: `Tool ${fName} not found or missing action ID.` };
        }

        if (addBreadcrumb) {
          addBreadcrumb(`[Fastn Agent] Executing tool: ${fName}`, args);
        }

        let toolRes;
        try {
          toolRes = await executeFastnTool(fastnTool.actionId, args);
          if (addBreadcrumb) {
            addBreadcrumb(`[Fastn Agent] Tool result: ${fName}`, toolRes);
          }
        } catch (execError) {
          console.error(`Error executing Fastn tool ${fName}:`, execError);
          return { error: `Failed to execute tool ${fName}.` };
        }

        // Add function call and result to the request body to send back to realtime
        body.input.push(
          {
            type: 'function_call',
            call_id: toolCall.call_id,
            name: toolCall.name,
            arguments: toolCall.arguments,
          },
          {
            type: 'function_call_output',
            call_id: toolCall.call_id,
            output: JSON.stringify(toolRes),
          },
        );
      }

      // Make the follow-up request including the tool outputs.
      currentResponse = await fetchResponsesMessage(body);
    }
  },
});

export const fastnAgent = new RealtimeAgent({
  name: 'fastnAgent',
  voice: 'sage', // You can choose a different voice if available
  instructions: `You are a helpful assistant that can interact with various external systems via Fastn.ai tools.
  Your primary function is to understand the user's request and use the 'callFastnAPI' tool to fulfill it.
  When the user asks you to perform an action or retrieve information that might involve an external system, always use the 'callFastnAPI' tool.
  Provide clear and concise responses to the user based on the results of the tool calls.
  `,
  tools: [
    callFastnAPI,
  ],
  handoffs: [], // Define handoffs if this agent can transfer to others
  handoffDescription: 'An agent capable of interacting with external systems via dynamically fetched Fastn.ai tools.',
});

export const fastnScenario = [fastnAgent];

// Name of the company represented by this agent set. Used by guardrails
export const fastnCompanyName = 'Fastn.ai';
