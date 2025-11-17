import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";

export default function SuppressionList() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suppression List</h1>
          <p className="text-muted-foreground mt-1">
            Manage bounced and unsubscribed contacts
          </p>
        </div>
        <Button className="gap-2" variant="outline">
          <Plus className="h-4 w-4" />
          Add Manually
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suppressed Emails</CardTitle>
          <CardDescription>
            Emails that will be automatically skipped during campaigns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search emails..." className="pl-9" />
          </div>
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
            <p>No suppressed emails.</p>
            <p className="text-sm mt-2">Bounced and unsubscribed emails will appear here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}