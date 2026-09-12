import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import SavedForm from "@/models/SavedForm";

export async function GET() {
  try {
    await connectDB();
    const forms = await SavedForm.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ data: forms }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to fetch forms", error: error.message },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    await connectDB();

    const newForm = await SavedForm.create({
      formData: body,
    });

    return NextResponse.json(
      { message: "Form saved successfully", data: newForm },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to save form", error: error.message },
      { status: 500 },
    );
  }
}
