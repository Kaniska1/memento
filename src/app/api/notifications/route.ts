import {
  randomUUID,
} from "crypto";

import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";

import User from "@/models/User";

import type {
  MementoNotificationType,
} from "@/types/notification";

export const runtime = "nodejs";

type CreateNotificationBody = {
  type?: MementoNotificationType;
  title?: string;
  message?: string;
  href?: string | null;
};

export async function GET() {
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

    await connectDB();

    const user =
      await User.findById(
        currentUser.id,
      )
        .select("notifications")
        .lean();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    const notifications = [
      ...(user.notifications ?? []),
    ]
      .sort(
        (a, b) =>
          new Date(
            b.createdAt,
          ).getTime() -
          new Date(
            a.createdAt,
          ).getTime(),
      )
      .map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message:
          notification.message,
        href:
          notification.href ??
          null,
        read: notification.read,
        createdAt:
          new Date(
            notification.createdAt,
          ).toISOString(),
      }));

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error(
      "Could not load notifications:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load notifications.",
      },
      {
        status: 500,
      },
    );
  }
}

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

    const body =
      (await request.json()) as CreateNotificationBody;

    if (
      !body.type ||
      !body.title?.trim() ||
      !body.message?.trim()
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification type, title and message are required.",
        },
        {
          status: 400,
        },
      );
    }

    const allowedTypes:
      MementoNotificationType[] = [
        "diary",
        "watchlist",
        "list",
        "recommendation",
        "system",
      ];

    if (
      !allowedTypes.includes(
        body.type,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid notification type.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const notification = {
      id: randomUUID(),

      type: body.type,

      title:
        body.title.trim(),

      message:
        body.message.trim(),

      href:
        body.href ?? null,

      read: false,

      createdAt:
        new Date(),
    };

    const user =
      await User.findByIdAndUpdate(
        currentUser.id,
        {
          $push: {
            notifications: {
              $each: [
                notification,
              ],

              $position: 0,

              /*
               * Same behaviour as the
               * old localStorage system:
               * retain max 50.
               */
              $slice: 50,
            },
          },
        },
        {
          new: true,
        },
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json(
      {
        success: true,

        notification: {
          ...notification,

          createdAt:
            notification.createdAt.toISOString(),
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Could not create notification:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not create notification.",
      },
      {
        status: 500,
      },
    );
  }
}