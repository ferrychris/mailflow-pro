import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Send, TrendingUp, Users } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Total Sent",
      value: "0",
      description: "Emails sent today",
      icon: Mail,
      color: "text-primary",
    },
    {
      title: "Active Campaigns",
      value: "0",
      description: "Currently running",
      icon: Send,
      color: "text-success",
    },
    {
      title: "Open Rate",
      value: "0%",
      description: "Last 30 days",
      icon: TrendingUp,
      color: "text-warning",
    },
    {
      title: "Recipients",
      value: "0",
      description: "Total contacts",
      icon: Users,
      color: "text-chart-4",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Monitor your email campaigns and performance
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Campaigns</CardTitle>
            <CardDescription>Your latest email campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No campaigns yet. Create your first campaign to get started!
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SMTP Status</CardTitle>
            <CardDescription>Active SMTP profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No SMTP profiles configured. Add one to start sending emails.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}