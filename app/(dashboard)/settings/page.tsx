import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/app/actions/auth";
import { getAllowedTokens, saveAllowedTokens } from "@/app/actions/settings";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/");

  const tokens = await getAllowedTokens();
  const initial = tokens.join("\n");

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          Manage your application settings and configuration.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Allowed Tokens</CardTitle>
            <p className="text-sm text-gray-600">
              Configure which tokens are allowed to access the API. Enter one token per line.
            </p>
          </CardHeader>
          <CardContent>
            <form action={saveAllowedTokens} className="space-y-4">
              <div>
                <label htmlFor="tokens" className="block text-sm font-medium text-gray-700 mb-2">
                  Tokens
                </label>
                <textarea
                  id="tokens"
                  name="tokens"
                  rows={8}
                  className="w-full rounded-md border border-gray-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  defaultValue={initial}
                  placeholder="Enter one token per line..."
                />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Save Tokens
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Additional Settings Sections */}
        <Card>
          <CardHeader>
            <CardTitle>API Configuration</CardTitle>
            <p className="text-sm text-gray-600">
              Configure API endpoints and load balancing settings.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              API configuration settings will be available in future updates.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Security Settings</CardTitle>
            <p className="text-sm text-gray-600">
              Manage security and access control settings.
            </p>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-500">
              Security settings will be available in future updates.
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
