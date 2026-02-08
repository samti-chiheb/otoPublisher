"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

const checks = [
  { label: "Required", body: "Media type, caption, schedule, targets." },
  { label: "Media", body: "File exists in media bucket or has a URL." },
  { label: "Targets", body: "Instagram and/or TikTok must be selected." },
  { label: "Duplicates", body: "external_id is used to upsert." },
];

export default function ImportPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [missingMedia, setMissingMedia] = useState<Array<{ filename: string; external_id?: string }>>(
    [],
  );

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusy(true);
    setError(null);
    setResult(null);
    setFilename(file.name);
    setMissingMedia([]);

    try {
      const content = await file.text();
      const payload = JSON.parse(content);

      const response = await fetch("/api/posts/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        setError(data.error ?? "Import failed");
        if (data.details?.missingMedia) {
          setMissingMedia(data.details.missingMedia);
        }
      } else {
        setResult(
          `Imported ${data.data.total} posts (${data.data.created} created, ${data.data.updated} upserted)`,
        );
      }
    } catch {
      setError("Invalid JSON file");
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Import publication plan</CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload a JSON file with scheduled posts. Validation runs before data
            is inserted into Supabase.
          </p>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border border-dashed border-border bg-white/60 p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold">Drop JSON file here</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Expected fields: media.type, media.filename/url, caption,
                  schedule_at, targets.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center">
                <input
                  accept="application/json"
                  className="hidden"
                  onChange={handleFileChange}
                  type="file"
                />
                <Button disabled={busy} type="button">
                  {busy ? "Importing..." : "Choose file"}
                </Button>
              </label>
            </div>
            <Separator className="my-4" />
            <p className="text-xs text-muted-foreground">
              {filename ? `Selected: ${filename}` : "No file selected"}
            </p>
            {result ? <p className="mt-3 text-sm text-green-700">{result}</p> : null}
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            {missingMedia.length ? (
              <div className="mt-4 space-y-2 text-sm text-red-700">
                <p>Missing media files:</p>
                <ul className="list-disc pl-5">
                  {missingMedia.map((item) => (
                    <li key={`${item.filename}-${item.external_id ?? ""}`}>
                      {item.filename}
                      {item.external_id ? ` (external_id: ${item.external_id})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Validation checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {checks.map((check) => (
              <div key={check.label} className="space-y-2">
                <Badge className="w-fit" variant="secondary">
                  {check.label}
                </Badge>
                <p className="text-sm">{check.body}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Example payload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Paste or tweak this sample before exporting to JSON.
          </p>
          <Textarea
            className="font-mono text-xs leading-5"
            defaultValue={`{\n  "plan_name": "Feb content batch",\n  "timezone": "Europe/Paris",\n  "publications": [\n    {\n      "external_id": "post-001",\n      "media": { "type": "video", "filename": "reel_001.mp4" },\n      "caption": "New drop. Link in bio.",\n      "schedule_at": "2026-02-10T19:30:00+01:00",\n      "targets": ["instagram", "tiktok"]\n    }\n  ]\n}`}
            rows={9}
            spellCheck={false}
          />
          <p className="text-xs text-muted-foreground">
            The importer accepts ISO timestamps or separate date/time fields.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
