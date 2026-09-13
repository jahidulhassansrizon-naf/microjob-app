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

export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "Form ID is required" },
        { status: 400 },
      );
    }

    const body = await request.json();
    await connectDB();

    const updatedForm = await SavedForm.findByIdAndUpdate(
      id,
      { formData: body },
      { new: true },
    );

    if (!updatedForm) {
      return NextResponse.json({ message: "Form not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Form updated successfully", data: updatedForm },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: "Failed to update form", error: error.message },
      { status: 500 },
    );
  }
}
