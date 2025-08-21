import { NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";

export async function GET() {
  // Resolve the absolute path to the openapi.json file
  const openApiPath = path.join(process.cwd(), "openapi.json");
  try {
    const spec = await fs.readFile(openApiPath, "utf-8");

    // Serve the OpenAPI specification as JSON
    return NextResponse.json(JSON.parse(spec), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    // Handle errors if the file is not found or cannot be read
    return NextResponse.json(
      { error: "Failed to load OpenAPI specification" },
      { status: 500 }
    );
  }
}
