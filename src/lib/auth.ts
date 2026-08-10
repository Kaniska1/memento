import { SignJWT, jwtVerify } from "jose";

const SESSION_COOKIE_NAME = "memento_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  throw new Error(
    "JWT_SECRET is missing. Add it to your .env.local file.",
  );
}

const secretKey = new TextEncoder().encode(jwtSecret);

export type SessionPayload = {
  userId: string;
  email: string;
  username: string;
};

export async function createSessionToken(
  payload: SessionPayload,
) {
  return new SignJWT({
    email: payload.email,
    username: payload.username,
  })
    .setProtectedHeader({
      alg: "HS256",
    })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secretKey);
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.username !== "string"
    ) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  } catch {
    return null;
  }
}

export const sessionCookie = {
  name: SESSION_COOKIE_NAME,
  maxAge: SESSION_DURATION_SECONDS,

  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  },
};