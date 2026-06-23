import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json();

  console.log("Received in API:", body);

  return NextResponse.json({
    success: true,
    message: "Agent received successfully",
    data: body,
  });
}