import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Shield } from "lucide-react";

export default function SpamChecker() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Spam Checker</h1>
        <p className="text-muted-foreground mt-1">
          Analyze your email content for spam triggers
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Email Content</CardTitle>
            <CardDescription>
              Paste your email HTML or text to analyze
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea 
              placeholder="Paste your email content here..."
              className="min-h-[300px] font-mono text-sm"
            />
            <Button className="w-full gap-2">
              <Shield className="h-4 w-4" />
              Check for Spam
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              Spam score and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
              <Shield className="h-12 w-12 mb-4 text-muted-foreground/50" />
              <p>No content analyzed yet.</p>
              <p className="text-sm mt-2">Enter email content and click "Check for Spam".</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}