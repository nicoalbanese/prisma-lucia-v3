"use server";

import { db } from "@/lib/db";
import { Argon2id } from "oslo/password";
import { lucia, validateRequest } from "../auth/lucia";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authenticationSchema } from "../db/schema/auth";
import { type Cookie, generateId } from "lucia";

interface ActionResult {
  error: string;
}

const genericError = { error: "Error, please try again." };
const setCookie = (cookie: Cookie) => {};

export async function signInAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get("email");
  const password = formData.get("password");
  const result = authenticationSchema.safeParse({ email, password });

  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    if (errors.email) return { error: "Invalid Email" };
    if (errors.password)
      return { error: "Invalid Password - " + errors.password[0] };
    return genericError;
  }

  const payload = result.data;
  const existingUser = await db.user.findUnique({
    where: { email: payload.email.toLowerCase() },
  });
  if (!existingUser) {
    return {
      error: "Incorrect username or password",
    };
  }

  const validPassword = await new Argon2id().verify(
    existingUser.hashedPassword,
    payload.password,
  );
  if (!validPassword) {
    return {
      error: "Incorrect username or password",
    };
  }

  const session = await lucia.createSession(existingUser.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/dashboard");
}

export async function signUpAction(
  _: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  "use server";
  const email = formData.get("email");
  // username must be between 4 ~ 31 characters, and only consists of lowercase letters, 0-9, -, and _
  // keep in mind some database (e.g. mysql) are case insensitive
  if (typeof email !== "string" || email.length < 3 || email.length > 31) {
    return {
      error: "Invalid username",
    };
  }
  const password = formData.get("password");
  if (
    typeof password !== "string" ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      error: "Invalid password",
    };
  }

  const hashedPassword = await new Argon2id().hash(password);
  const userId = generateId(15);

  // TODO: check if username is already used
  await db.user.create({
    data: {
      id: userId,
      email,
      hashedPassword,
    },
  });

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/dashboard");
}

export async function signOutAction(): Promise<ActionResult> {
  const { session } = await validateRequest();
  if (!session) {
    return {
      error: "Unauthorized",
    };
  }

  await lucia.invalidateSession(session.id);

  const sessionCookie = lucia.createBlankSessionCookie();
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
  return redirect("/sign-in");
}
