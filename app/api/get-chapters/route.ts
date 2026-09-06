import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { className, subjectName } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API Key not found in environment variables" },
        { status: 500 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const prompt = `Act as an expert Bangladeshi curriculum educational assistant. 
    Provide the official and complete list of chapters for ${subjectName} of ${className} according to the National Curriculum and Textbook Board (NCTB) of Bangladesh.
    Return the response strictly as a JSON array of objects, where each object has "label" (Chapter name in Bengali or English as appropriate) and "value" (a slug or id). No extra text, markdown formatting or explanation, just the raw JSON array.
    Example format: [{"label": "অধ্যায় ১: বাস্তব সংখ্যা", "value": "ch-1"}, ...]`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const cleanJson = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();
    const chapters = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, chapters });
  } catch (error: any) {
    console.error("Gemini API Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
