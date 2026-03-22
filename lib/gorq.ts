"use server"
import fs from "fs";
import path from "path";
import Groq from "groq-sdk";
import { rooms } from './rooms';
import { bookings } from "./bookings";
import { Booking } from "./bookings";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const messages: Groq.Chat.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content: `You are a helpful hotel booking assistant.
RULES:
- Call get_available_rooms when user asks for rooms.
- When booking, you only need room_id and fullname.
- Ask for fullname if not provided.
- NEVER call create_room_booking until you have both room_id and fullname.`,
  },
];

const tools: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "get_available_rooms",
      description: "Gets all available rooms.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "create_room_booking",
      description: "Books a room using room_id and fullname only.",
      parameters: {
        type: "object",
        properties: {
          room_id:  { type: "number", description: "ID of the room to book." },
          fullname: { type: "string", description: "Full name of the guest." },
        },
        required: ["room_id", "fullname"],
      },
    },
  },
];

function getAvailableRooms() {
  return rooms.filter((room) => room.available);
}

function bookRoom(room_id: number, fullname: string) {
  const room = rooms.find((r) => r.room_id === room_id);
  if (!room)           return { success: false, message: "Room not found." };
  if (!room.available) return { success: false, message: "Room is no longer available." };

  room.available = false;
  bookings.push({ room_id, fullname } as Booking);

  const line = `Room: ${room_id} | Guest: ${fullname} | Booked at: ${new Date().toISOString()}\n`;
  const filePath = path.join(process.cwd(), "bookings.txt");
  fs.appendFileSync(filePath, line, "utf-8");

  return { success: true, message: `Room ${room_id} booked for ${fullname}.` };
}

export async function main(message: string) {
  messages.push({ role: "user", content: message });

  let response = await groq.chat.completions.create({
    messages,
    model: "llama-3.3-70b-versatile",
    tools,
    tool_choice: "auto",
  });

  while (response.choices[0].message.tool_calls) {
    const assistantMessage = response.choices[0].message;
    const toolCall = assistantMessage.tool_calls![0];
    const args = JSON.parse(toolCall.function.arguments);

    messages.push(assistantMessage);

    let results;
    if (toolCall.function.name === "get_available_rooms") {
      results = getAvailableRooms();
    } else if (toolCall.function.name === "create_room_booking") {
      results = bookRoom(args.room_id, args.fullname);
    }

    messages.push({
      role: "tool",
      tool_call_id: toolCall.id,
      content: JSON.stringify(results),
    });

    response = await groq.chat.completions.create({
      messages,
      model: "llama-3.3-70b-versatile",
      tools,
      tool_choice: "auto",
    });
  }

  return response.choices[0].message.content ?? "";
}
