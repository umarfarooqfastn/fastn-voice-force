# Fastn Voice Force

A voice-enabled AI assistant powered by the OpenAI Realtime API and OpenAI Agents SDK, featuring specialized agents for Fastn.ai tool integration and documentation assistance. 

## About the OpenAI Agents SDK

This project uses the [OpenAI Agents SDK](https://github.com/openai/openai-agents-js), a toolkit for building, managing, and deploying advanced AI agents. The SDK provides:

- A unified interface for defining agent behaviors and tool integrations.
- Built-in support for agent orchestration, state management, and event handling.
- Easy integration with the OpenAI Realtime API for low-latency, streaming interactions.
- Extensible patterns for multi-agent collaboration, handoffs, tool use, and guardrails.

For full documentation, guides, and API references, see the official [OpenAI Agents SDK Documentation](https://github.com/openai/openai-agents-js#readme).

## Features

This project includes two specialized AI agents:

1. **Fastn Tools Agent:** Dynamically fetches and executes Fastn.ai tools for various integrations including Google Workspace, Slack, and other productivity platforms.
2. **Fastn Docs Agent:** Provides comprehensive assistance with Fastn documentation, best practices, and getting started guidance.

## Setup

- This is a Next.js typescript app. Install dependencies with `npm i`.
- Add your `OPENAI_API_KEY` to your env. Either add it to your `.bash_profile` or equivalent, or copy `.env.sample` to `.env` and add it there.
- Start the server with `npm run dev`
- Open your browser to [http://localhost:3000](http://localhost:3000). It should default to the `Fastn Tools` Agent.
- You can switch between agents via the "Agent Set" dropdown in the bottom toolbar.

# Agent Architecture

## Fastn Tools Agent

The Fastn Tools Agent dynamically fetches and executes tools from the Fastn.ai platform. It can:
- Access Google Workspace (Docs, Sheets, Calendar)
- Integrate with Slack for messaging and notifications
- Handle various productivity and workflow automation tasks
- Provide intelligent tool selection based on user requests

## Fastn Docs Agent

The Fastn Docs Agent specializes in providing assistance with Fastn documentation and knowledge base. It can:
- Answer questions about Fastn features and capabilities
- Provide getting started guidance and tutorials
- Explain best practices and usage patterns
- Help troubleshoot common issues
- Offer examples and code snippets

## Screenshots

### Fastn Tools Agent in Action
![Fastn Tools Agent Screenshot](/public/fastn-tool-agent.png)
*The Fastn Tools Agent dynamically executing tools for Google Workspace, Slack, and other integrations*

### Fastn Docs Agent Interface  
![Fastn Docs Agent Screenshot](/public/FastnDocs-Agent.png)
*The Fastn Docs Agent providing comprehensive documentation assistance and guidance*

## How It Works

```mermaid
sequenceDiagram
    participant User
    participant FastnAgent as Fastn Voice Agent<br/>(gpt-4o-realtime-mini)
    participant FastnAPI as Fastn.ai API<br/>(Dynamic Tools)
    participant ExternalTool as External Tool<br/>(Google/Slack/etc)

    alt [Simple queries or basic chat]
        User->>FastnAgent: "Hello" or "How are you?"
        FastnAgent->>User: Responds directly
    else [Tool execution required]
        User->>FastnAgent: "Create a Google Doc called 'Meeting Notes'"
        FastnAgent->>User: "Let me help you with that"
        FastnAgent->>FastnAPI: Fetch available tools & execute
        alt [Tool call needed]
            FastnAPI->>ExternalTool: Execute tool action
            ExternalTool->>FastnAPI: Returns result
        end
        FastnAPI->>FastnAgent: Tool execution response
        FastnAgent->>User: "Document created successfully!"
    end

    Note over User, ExternalTool: Fastn Voice Agent handles both direct responses and complex tool integrations
```

## Benefits
- **Voice-First Interface**: Natural conversation experience with low-latency responses
- **Dynamic Tool Access**: Automatically discovers and uses the latest Fastn.ai tools
- **Specialized Knowledge**: Dedicated documentation agent for comprehensive Fastn guidance  
- **Seamless Integration**: Direct connection to Fastn.ai platform and third-party services
- **Modular Design**: Easy to extend with additional agents for specific use cases
- **Intelligent Routing**: Automatically selects the right tools based on user intent

## Configuration

The application is configured with two main agent sets:

1. **Fastn Tools Agent** (`src/app/agentConfigs/fastnAgent.ts`)
   - Dynamically fetches available tools from Fastn.ai platform
   - Handles complex tool execution workflows
   - Provides intelligent parameter mapping and validation

2. **Fastn Docs Agent** (`src/app/agentConfigs/fastnDocsAgent.ts`)  
   - Connects to Fastn serviceAgent API for documentation queries
   - Provides contextual help and examples
   - Assists with onboarding and troubleshooting

### Adding Custom Agents

To add your own agent:
1. Create a new agent configuration in `src/app/agentConfigs/`
2. Add the agent to the `allAgentSets` mapping in `src/app/agentConfigs/index.ts`
3. Update the UI selector options in `src/app/components/BottomToolbar.tsx`

## API Integration

The application integrates with Fastn.ai through two main endpoints:

- **Tools API**: `https://live.fastn.ai/api/ucl/getTools` - Retrieves available tools
- **Execution API**: `https://live.fastn.ai/api/ucl/executeTool` - Executes tools with parameters  
- **ServiceAgent API**: `https://live.fastn.ai/api/v1/serviceAgent` - Queries documentation

## Usage

### Interacting with Fastn Tools Agent
- "Create a new Google Doc called 'Meeting Notes'"  
- "Send a Slack message to the team channel"
- "Schedule a meeting for tomorrow at 2pm"
- "Add a new row to my project tracking sheet"

### Interacting with Fastn Docs Agent  
- "How do I get started with Fastn?"
- "What integrations does Fastn support?"
- "Show me examples of workflow automation"
- "Help me troubleshoot my API connection"

## Output Guardrails
Assistant messages are checked for safety and compliance before they are shown in the UI.  The guardrail call now lives directly inside `src/app/App.tsx`: when a `response.text.delta` stream starts we mark the message as **IN_PROGRESS**, and once the server emits `guardrail_tripped` or `response.done` we mark the message as **FAIL** or **PASS** respectively.  If you want to change how moderation is triggered or displayed, search for `guardrail_tripped` inside `App.tsx` and tweak the logic there.

## Navigating the UI
- You can switch between agent sets using the "Agent Set" dropdown in the bottom toolbar.
- The conversation transcript is on the left, including tool calls, tool call responses, and agent actions. Click to expand non-message elements.
- The event log is on the right, showing both client and server events. Click to see the full payload.
- On the bottom toolbar, you can disconnect, toggle between automated voice-activity detection or push-to-talk, turn off audio playback, toggle logs, and select different agents.

## Contributing

This project demonstrates voice-enabled AI agents for Fastn.ai integration. Feel free to extend it with additional agents, tools, or integrations that enhance the Fastn workflow automation experience.
