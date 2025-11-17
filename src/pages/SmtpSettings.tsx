import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function SmtpSettings() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SMTP Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage your SMTP profiles for sending emails
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add SMTP Profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>SMTP Profiles</CardTitle>
          <CardDescription>
            Configure multiple SMTP profiles with automatic rotation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>No SMTP profiles configured yet.</p>
            <p className="text-sm mt-2">Click "Add SMTP Profile" to create your first profile.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}