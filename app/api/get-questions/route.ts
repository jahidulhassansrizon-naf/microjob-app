// app/api/get-questions/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  try {
    const { className, subjectName, chapterName, questionType, searchQuery } =
      await req.json();

    if (!className || !subjectName || !chapterName) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 },
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });

    const prompt = `
      You are an expert curriculum and exam question creator for Bangladeshi schools.
      Generate 15 to 20 realistic practice questions in Bangla based on the following criteria:
      - Class: ${className}
      - Subject: ${subjectName}
      - Chapter: ${chapterName}
      - Question Type requested: ${questionType} (Options: "All question types", "MCQ", "Short Questions", "Descriptive Questions")
      ${searchQuery ? `- Topic Keyword Search: ${searchQuery}` : ""}

      Rules for Output:
      1. If questionType is "MCQ", return ONLY multiple choice questions with 4 options and correct answer.
      2. If questionType is "Short Questions", return ONLY short-answer questions (1-2 marks each).
      3. If questionType is "Descriptive Questions", return ONLY broad/creative/descriptive questions (4-10 marks each).
      4. If "All question types", return a mixed set of MCQ, Short, and Descriptive questions.
      5. Strictly return ONLY a raw valid JSON array of objects without markdown backticks or extra text.

      JSON Structure expected:
      [
        {
          "id": "q1",
          "type": "MCQ" | "Short" | "Descriptive",
          "question": "প্রশ্নটি বাংলায় লিখুন",
          "options": ["অপশন ১", "অপশন ২", "অপশন ৩", "অপশন ৪"], // Clean string without prefixes like ক) or a)
          "answer": "সঠিক উত্তর",
          "marks": 1
        }
      ]
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean JSON response
    const cleanJson = responseText.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleanJson);

    return NextResponse.json({ success: true, questions });
  } catch (error) {
    console.error("Error generating questions:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate questions" },
      { status: 500 },
    );
  }
}
