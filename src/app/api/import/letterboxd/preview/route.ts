import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { parseLetterboxdExport } from "@/lib/letterboxd-import";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES =
  20 * 1024 * 1024;

export async function POST(
  request: Request,
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authenticated.",
        },
        {
          status: 401,
        },
      );
    }

    const formData =
      await request.formData();

    const file =
      formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Choose a Letterboxd export ZIP first.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith(".zip")
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Letterboxd exports must be uploaded as a ZIP file.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      file.size <= 0 ||
      file.size >
        MAX_UPLOAD_BYTES
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The ZIP must be between 1 byte and 20 MB.",
        },
        {
          status: 400,
        },
      );
    }

    const bytes =
      await file.arrayBuffer();

    const parsed =
      await parseLetterboxdExport(
        Buffer.from(bytes),
      );

    /*
     * Raw diary/review rows are intentionally
     * kept server-side. The browser only needs
     * the preview/normalized data.
     */
    const {
      importData:
        _importData,
      ...preview
    } = parsed;

    return NextResponse.json({
      success: true,
      fileName:
        file.name,
      fileSize:
        file.size,
      preview,
    });
  } catch (error) {
    console.error(
      "Could not preview Letterboxd import:",
      error,
    );

    return NextResponse.json(
      {
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Could not read this Letterboxd export.",
      },
      {
        status: 400,
      },
    );
  }
}