import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLinks } from "@/components/social-links";
import { getSession, hasAnyUser, signIn } from "../actions/auth";
import { redirect } from "next/navigation";

export default async function LoginPage() {
    const session = await getSession();
    if (session) {
        redirect("/");
    }
    const hasUser = await hasAnyUser();
    if (!hasUser) {
        redirect("/register");
    }

    return (
        <>
            <main className="flex-1 flex flex-col items-center justify-center min-h-screen px-4 py-8">
                <div className="w-full max-w-sm space-y-6">
                    <Card className="w-full">
                        <CardHeader className="">
                            <div className="flex justify-center mb-2">
                                <img
                                    src="/logo.svg"
                                    alt="Company Logo"
                                    className="h-24 w-auto max-w-[60%] object-contain"
                                />
                            </div>
                            <CardDescription className="text-center">Enter the email and password to access the dashboard</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={signIn} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" name="email" type="email" required placeholder="Enter email" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input id="password" name="password" type="password" required minLength={8} placeholder="Enter password" />
                                </div>
                                <Button type="submit" className="w-full">Sign In</Button>
                            </form>
                        </CardContent>
                    </Card>
                    <SocialLinks />
                </div>
            </main>
        </>
    );
}