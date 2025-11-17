# Supabase Setup Guide for MailFlow SaaS

This guide contains all the SQL schemas, edge functions, and configuration needed to set up your own Supabase backend for this email sending SaaS platform.

## Prerequisites

1. Create a Supabase account at https://supabase.com
2. Create a new Supabase project
3. Note down your project URL and anon key

## Step 1: Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SMTP Settings Table
CREATE TABLE smtp_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  from_email TEXT NOT NULL,
  rate_limit INTEGER NOT NULL DEFAULT 10,
  rate_limit_unit TEXT NOT NULL DEFAULT 'minute' CHECK (rate_limit_unit IN ('second', 'minute')),
  is_enabled BOOLEAN DEFAULT true,
  warmup_day INTEGER DEFAULT 0,
  warmup_cap INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns Table
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recipients Table
CREATE TABLE recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  personalization_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Queue Table
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  smtp_profile_id UUID REFERENCES smtp_settings(id) ON DELETE SET NULL,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'processing', 'sent', 'failed', 'suppressed')),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Opens Tracking Table
CREATE TABLE opens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  opened_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Clicks Tracking Table
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES recipients(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- Suppression List Table
CREATE TABLE suppression_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('bounce', 'spam', 'unsubscribe', 'manual')),
  bounce_type TEXT,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_smtp_settings_user_id ON smtp_settings(user_id);
CREATE INDEX idx_smtp_settings_enabled ON smtp_settings(is_enabled);
CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_recipients_campaign_id ON recipients(campaign_id);
CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_campaign_id ON email_queue(campaign_id);
CREATE INDEX idx_opens_recipient_id ON opens(recipient_id);
CREATE INDEX idx_opens_campaign_id ON opens(campaign_id);
CREATE INDEX idx_clicks_recipient_id ON clicks(recipient_id);
CREATE INDEX idx_clicks_campaign_id ON clicks(campaign_id);
CREATE INDEX idx_suppression_list_email ON suppression_list(email);

-- Enable Row Level Security
ALTER TABLE smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE opens ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list ENABLE ROW LEVEL SECURITY;

-- RLS Policies for smtp_settings
CREATE POLICY "Users can view their own SMTP settings" ON smtp_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own SMTP settings" ON smtp_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own SMTP settings" ON smtp_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own SMTP settings" ON smtp_settings
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for templates
CREATE POLICY "Users can view their own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates" ON templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates" ON templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates" ON templates
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for campaigns
CREATE POLICY "Users can view their own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for recipients (through campaigns)
CREATE POLICY "Users can view recipients of their campaigns" ON recipients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = recipients.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert recipients to their campaigns" ON recipients
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = recipients.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- RLS Policies for email_queue (through campaigns)
CREATE POLICY "Users can view queue of their campaigns" ON email_queue
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = email_queue.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- RLS Policies for opens (through campaigns)
CREATE POLICY "Users can view opens of their campaigns" ON opens
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = opens.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- RLS Policies for clicks (through campaigns)
CREATE POLICY "Users can view clicks of their campaigns" ON clicks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM campaigns 
      WHERE campaigns.id = clicks.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- RLS Policies for suppression_list
CREATE POLICY "Users can view suppression list" ON suppression_list
  FOR SELECT USING (true);

CREATE POLICY "Users can add to suppression list" ON suppression_list
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_smtp_settings_updated_at BEFORE UPDATE ON smtp_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_queue_updated_at BEFORE UPDATE ON email_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Step 2: Edge Functions

You'll need to create the following edge functions in your Supabase project.

### Function 1: queue-worker

This function processes the email queue and sends emails via SMTP.

**File: `supabase/functions/queue-worker/index.ts`**

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get enabled SMTP profiles
    const { data: smtpProfiles, error: smtpError } = await supabase
      .from("smtp_settings")
      .select("*")
      .eq("is_enabled", true);

    if (smtpError || !smtpProfiles || smtpProfiles.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active SMTP profiles" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check suppression list
    const { data: suppressedEmails } = await supabase
      .from("suppression_list")
      .select("email");
    
    const suppressedSet = new Set(suppressedEmails?.map(s => s.email) || []);

    // Process queue for each SMTP profile
    let totalProcessed = 0;
    
    for (const smtp of smtpProfiles) {
      // Calculate how many emails to send based on rate limit
      const limit = smtp.rate_limit;
      
      // Apply warmup limits if applicable
      const effectiveLimit = smtp.warmup_cap && smtp.warmup_day > 0
        ? Math.min(limit, smtp.warmup_cap)
        : limit;

      // Get pending emails
      const { data: queueItems } = await supabase
        .from("email_queue")
        .select("*")
        .eq("status", "waiting")
        .is("smtp_profile_id", null)
        .limit(effectiveLimit);

      if (!queueItems || queueItems.length === 0) continue;

      for (const item of queueItems) {
        // Skip if suppressed
        if (suppressedSet.has(item.to_email)) {
          await supabase
            .from("email_queue")
            .update({ status: "suppressed" })
            .eq("id", item.id);
          continue;
        }

        // Mark as processing
        await supabase
          .from("email_queue")
          .update({ 
            status: "processing",
            smtp_profile_id: smtp.id 
          })
          .eq("id", item.id);

        // Send email via SMTP (simplified - you'll need a proper SMTP library)
        try {
          // TODO: Implement actual SMTP sending
          // For now, we'll simulate success
          const success = await sendEmailViaSMTP(smtp, item);
          
          if (success) {
            await supabase
              .from("email_queue")
              .update({ 
                status: "sent",
                sent_at: new Date().toISOString()
              })
              .eq("id", item.id);
              
            // Update campaign sent count
            await supabase.rpc('increment_campaign_sent', { 
              campaign_id: item.campaign_id 
            });
            
            totalProcessed++;
          } else {
            throw new Error("SMTP send failed");
          }
        } catch (error) {
          const retryCount = item.retry_count + 1;
          
          if (retryCount >= 3) {
            await supabase
              .from("email_queue")
              .update({ 
                status: "failed",
                retry_count: retryCount,
                error_message: error.message
              })
              .eq("id", item.id);
              
            // Check if it's a permanent bounce
            if (isPermanentBounce(error.message)) {
              await supabase
                .from("suppression_list")
                .insert({
                  email: item.to_email,
                  reason: "bounce",
                  bounce_type: "permanent"
                });
            }
          } else {
            await supabase
              .from("email_queue")
              .update({ 
                status: "waiting",
                retry_count: retryCount,
                error_message: error.message
              })
              .eq("id", item.id);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        message: "Queue processed",
        processed: totalProcessed
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Placeholder for SMTP sending - you'll need to implement this with a proper SMTP library
async function sendEmailViaSMTP(smtp: any, email: any): Promise<boolean> {
  // TODO: Implement actual SMTP sending using Deno SMTP library
  console.log(`Sending email to ${email.to_email} via ${smtp.host}`);
  return true;
}

function isPermanentBounce(error: string): boolean {
  const permanentBouncePatterns = [
    "550", "551", "553", "554",
    "invalid recipient",
    "mailbox unavailable",
    "user unknown",
    "domain not found"
  ];
  
  return permanentBouncePatterns.some(pattern => 
    error.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

### Function 2: track-open

Tracks email opens via pixel.

**File: `supabase/functions/track-open/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// 1x1 transparent GIF
const transparentGif = Uint8Array.from([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x21,
  0xF9, 0x04, 0x01, 0x00, 0x00, 0x00, 0x00, 0x2C, 0x00, 0x00,
  0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
  0x01, 0x00, 0x3B
]);

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const recipientId = url.pathname.split("/").pop()?.replace(".png", "");

    if (!recipientId) {
      return new Response(transparentGif, {
        headers: { "Content-Type": "image/gif" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recipient and campaign info
    const { data: recipient } = await supabase
      .from("recipients")
      .select("campaign_id")
      .eq("id", recipientId)
      .single();

    if (recipient) {
      // Record the open
      await supabase.from("opens").insert({
        recipient_id: recipientId,
        campaign_id: recipient.campaign_id,
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });

      // Update campaign opened count
      await supabase.rpc('increment_campaign_opened', { 
        campaign_id: recipient.campaign_id 
      });
    }

    return new Response(transparentGif, {
      headers: { "Content-Type": "image/gif" },
    });
  } catch (error) {
    console.error("Error tracking open:", error);
    return new Response(transparentGif, {
      headers: { "Content-Type": "image/gif" },
    });
  }
});
```

### Function 3: track-click

Tracks link clicks and redirects.

**File: `supabase/functions/track-click/index.ts`**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const recipientId = url.pathname.split("/").pop();
    const targetUrl = url.searchParams.get("url");

    if (!recipientId || !targetUrl) {
      return new Response("Invalid request", { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get recipient and campaign info
    const { data: recipient } = await supabase
      .from("recipients")
      .select("campaign_id")
      .eq("id", recipientId)
      .single();

    if (recipient) {
      // Record the click
      await supabase.from("clicks").insert({
        recipient_id: recipientId,
        campaign_id: recipient.campaign_id,
        url: decodeURIComponent(targetUrl),
        ip_address: req.headers.get("x-forwarded-for"),
        user_agent: req.headers.get("user-agent"),
      });

      // Update campaign clicked count
      await supabase.rpc('increment_campaign_clicked', { 
        campaign_id: recipient.campaign_id 
      });
    }

    // Redirect to the actual URL
    return Response.redirect(decodeURIComponent(targetUrl), 302);
  } catch (error) {
    console.error("Error tracking click:", error);
    return new Response("Error", { status: 500 });
  }
});
```

### Function 4: spam-check

AI-powered spam content checker.

**File: `supabase/functions/spam-check/index.ts`**

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content } = await req.json();
    const openAIKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAIKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-5-mini-2025-08-07",
        messages: [
          {
            role: "system",
            content: "You are an email spam detection expert. Analyze the email content and identify spam trigger words, risky phrases, and provide actionable recommendations. Return a JSON response with: score (low/medium/high), triggerWords (array), riskyPhrases (array), and recommendations (array)."
          },
          {
            role: "user",
            content: `Analyze this email for spam triggers:\n\n${content}`
          }
        ],
        max_completion_tokens: 1000,
      }),
    });

    const data = await response.json();
    const analysis = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
```

## Step 3: Database Functions for Counters

Add these SQL functions to handle campaign statistics:

```sql
-- Function to increment campaign sent count
CREATE OR REPLACE FUNCTION increment_campaign_sent(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET sent_count = sent_count + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment campaign opened count
CREATE OR REPLACE FUNCTION increment_campaign_opened(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET opened_count = opened_count + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment campaign clicked count
CREATE OR REPLACE FUNCTION increment_campaign_clicked(campaign_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE campaigns 
  SET clicked_count = clicked_count + 1
  WHERE id = campaign_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Step 4: Set Up Cron Job for Queue Worker

To automatically process the email queue, set up a cron job:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule queue worker to run every minute
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/queue-worker',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  ) as request_id;
  $$
);
```

## Step 5: Environment Variables

You'll need to add these secrets to your Supabase project:

1. `OPENAI_API_KEY` - For the spam checker feature
2. Service role key is already available in your project

## Step 6: Connect Frontend to Supabase

Update your React app's `.env.local` file:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps

1. The frontend UI is already built and ready
2. We'll need to create Supabase client integration in the React app
3. Build out the SMTP settings form
4. Create template editor with Monaco
5. Build campaign creation flow
6. Add CSV upload for recipients
7. Implement personalization engine

Would you like me to proceed with building out any specific module?
