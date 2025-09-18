import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { actionId, parameters } = await req.json();

    if (!actionId) {
      return NextResponse.json(
        { error: "actionId is required" },
        { status: 400 }
      );
    }

    const headers = new Headers();
    headers.append("x-fastn-api-key", process.env.FASTN_API_KEY || '');
    headers.append("x-fastn-space-id", process.env.FASTN_SPACE_ID || '');
    headers.append("x-fastn-space-tenantid", "");
    headers.append("stage", "LIVE");
    headers.append("x-fastn-custom-auth", "true");
    headers.append("Content-Type", "application/json");
    
    const resp = await fetch("https://live.fastn.ai/api/ucl/executeTool", {
      method: "POST",
      headers,
      body: JSON.stringify({ input: { actionId, parameters } }),
    });

    if (!resp.ok) {
      const errorText = await resp.text();
      console.error("Failed to execute Fastn tool:", resp.status, errorText);
      return NextResponse.json(
        { error: `Failed to execute Fastn tool: ${resp.status} ${errorText}` },
        { status: resp.status }
      );
    }

    const data = await resp.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /api/fastn/execute:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
