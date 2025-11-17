import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus } from "lucide-react";

export default function Templates() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Email Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage your email templates
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Templates</CardTitle>
          <CardDescription>
            Build reusable email templates with personalization support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>No templates created yet.</p>
            <p className="text-sm mt-2">Click "Create Template" to build your first email template.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}