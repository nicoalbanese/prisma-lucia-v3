import SignOutBtn from "@/components/auth/SignOutBtn";
import { validateRequest } from "@/lib/auth/lucia";
import { getUserAuth } from "@/lib/auth/utils";

export default async function Home() {
  const { session } = await getUserAuth();
  return (
    <main>
      <h1 className="font-semibold text-2xl">Home</h1>
      <p className="my-2">
        Wow, that was easy. Now it&apos;s your turn. Building something cool!
      </p>
      <pre className="bg-muted p-8">{JSON.stringify(session, null, 2)}</pre>
      <SignOutBtn />
    </main>
  );
}
