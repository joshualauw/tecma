import { WebhookPayload, WebhookValue } from "@whatsapp-cloudapi/types/webhook";
import { handleWhatsappMessageReceive } from "./_handlers/receive-message";
import { handleWhatsappMessageStatus } from "./_handlers/receive-status";
import { ApiResponse } from "@/types/ApiResponse";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse<string | null>> {
  try {
    const { searchParams } = new URL(request.url);

    const verifyToken = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");
    const mode = searchParams.get("hub.mode");

    if (verifyToken !== process.env.WHATSAPP_VERIFY_TOKEN) {
      return new NextResponse("Invalid verify token", { status: 400 });
    }

    if (mode !== "subscribe") {
      return new NextResponse("Invalid mode", { status: 400 });
    }

    return new NextResponse(challenge, { status: 200 });
  } catch (error) {
    console.error("Error receiving message:", error);
    return NextResponse.json("Error receiving message", { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const body: WebhookPayload = await request.json();

    if (body.object == "whatsapp_business_account") {
      const payload = body.entry[0].changes[0];

      if (payload.field == "messages") {
        const value = payload.value as WebhookValue;
        if (value.messages) {
          await handleWhatsappMessageReceive(value);
        }
        if (value.statuses) {
          await handleWhatsappMessageStatus(value);
        }
      }
    }

    return new NextResponse("Message received successfully", { status: 200 });
  } catch (error) {
    console.error("Error receiving message:", error);
    return new NextResponse("Error receiving message", { status: 200 });
  }
}
