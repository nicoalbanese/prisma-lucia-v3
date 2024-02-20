import { lucia, validateRequest } from "@/lib/auth/lucia";
import { Button } from "../ui/button";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ActionResult } from "next/dist/server/app-render/types";

export default function SignOutBtn() {
  return (
    <form action={signOut} className="w-full text-left">
      <Btn />
    </form>
  );
}

const Btn = () => {
  // const { pending } = useFormStatus();
  return (
    <Button type="submit" /* disabled={pending}  */ variant={"destructive"}>
      {/* Sign{pending ? "ing" : ""} out */}
      Sign out
    </Button>
  );
};

async function signOut(): Promise<ActionResult> {
  "use server";
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
