import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSession } from "../actions/auth";
import { getAllowedTokens, saveAllowedTokens } from "../actions/settings";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
    const session = await getSession();
    if (!session) redirect("/login");
    if (session.user.role !== "admin") redirect("/");

    const tokens = await getAllowedTokens();
    const initial = tokens.join("\n");

    return (
        <main className="flex-1 container mx-auto py-12">
            <Card>
                <CardHeader>
                    <CardTitle>Allowed Tokens</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={saveAllowedTokens} className="space-y-4">
                        <textarea name="tokens" rows={8} className="w-full rounded-md border p-3" defaultValue={initial} placeholder="One token per line" />
                        <Button type="submit">Save</Button>
                    </form>
                </CardContent>
            </Card>
        </main>
    );
}