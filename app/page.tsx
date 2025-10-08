import { Button } from "@/components/ui/button";
import { getSession, signOutAdmin, resetUsers } from "./actions/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <main className="flex-1 container mx-auto py-12">
        <div className="space-y-4">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">You are logged in; you can configure the LLM API Key proxy and load balancing.</p>
          {/* <div className="text-sm text-muted-foreground">User: {session.user.name ?? session.user.email}</div> */}
          <div className="text-sm text-muted-foreground">User: {session.user.email}</div>
          <div className="flex gap-2">
            <form action={signOutAdmin}>
              <Button type="submit" variant="outline">Sign out</Button>
            </form>
            <form action={resetUsers}>
              <Button type="submit" className="bg-red-600 text-white hover:bg-red-700">Delete account</Button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
