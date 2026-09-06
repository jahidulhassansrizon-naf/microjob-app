import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { className } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API Key not found" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const prompt = `You are a helpful API that returns JSON only. Provide the official list of subjects for ${className} according to the NCTB curriculum of Bangladesh.
    Return ONLY a valid JSON array of objects with "label" and "value" keys. No markdown, no explanation, just the raw JSON array.
    Example: [{"label": "Physics 1st Paper", "value": "physics-1st"}, {"label": "Bangla 1st Paper", "value": "bangla-1st"}]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanJson = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const jsonStart = cleanJson.indexOf("[");
    const jsonEnd = cleanJson.lastIndexOf("]");

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Invalid JSON format received from AI");
    }

    const finalJsonString = cleanJson.substring(jsonStart, jsonEnd + 1);
    const subjects = JSON.parse(finalJsonString);

    return NextResponse.json({ success: true, subjects });
  } catch (error: any) {
    console.error("Gemini Subjects API Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
