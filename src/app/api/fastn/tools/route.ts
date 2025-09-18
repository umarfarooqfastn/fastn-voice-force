import { NextResponse } from "next/server";

export async function POST() {
  try {
    // Log environment variables (safely)
    console.log("Environment variables check:");
    console.log("FASTN_API_KEY exists:", !!process.env.FASTN_API_KEY);
    console.log("FASTN_API_KEY length:", process.env.FASTN_API_KEY?.length || 0);
    console.log("FASTN_SPACE_ID exists:", !!process.env.FASTN_SPACE_ID);
    console.log("FASTN_SPACE_ID length:", process.env.FASTN_SPACE_ID?.length || 0);
    
    const headers = new Headers();
    headers.append("x-fastn-api-key", process.env.FASTN_API_KEY || '');
    headers.append("x-fastn-space-id", process.env.FASTN_SPACE_ID || '');
    headers.append("x-fastn-space-tenantid", "");
    headers.append("stage", "LIVE");
    headers.append("x-fastn-custom-auth", "true");
    headers.append("Content-Type", "application/json");
    
    // Log headers being sent (safely - don't log full API key)
    console.log("Headers being sent:");
    console.log("x-fastn-api-key:", process.env.FASTN_API_KEY ? `${process.env.FASTN_API_KEY.slice(0, 8)}...` : 'MISSING');
    console.log("x-fastn-space-id:", process.env.FASTN_SPACE_ID || 'MISSING');
    console.log("x-fastn-space-tenantid:", '""');
    console.log("stage:", "LIVE");
    console.log("x-fastn-custom-auth:", "true");
    
    const resp = await fetch("https://live.fastn.ai/api/ucl/getTools", {
      method: "POST",
      headers,
      body: JSON.stringify({ input: {} }),
    });

    console.log("Response status:", resp.status);
    console.log("Response headers:", Object.fromEntries(resp.headers.entries()));

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Failed to fetch Fastn tools:", resp.status, errorText);
      console.error("Full response details:", {
        status: resp.status,
        statusText: resp.statusText,
        headers: Object.fromEntries(resp.headers.entries()),
        body: errorText
      });
      return NextResponse.json(
        { error: `Failed to fetch Fastn tools: ${resp.status} ${errorText}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    const tools = data.map((tool: any) => ({
      type: "function",
      name: tool.function.name,
      description: tool.function.description,
      parameters: tool.function.parameters,
      actionId: tool.actionId, // Store actionId for execution
    }));

    return NextResponse.json(tools);
  } catch (error) {
    console.error("Error in /api/fastn/tools:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
