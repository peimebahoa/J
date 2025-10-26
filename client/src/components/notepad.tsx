import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CalendarCheck2, NotebookPen, Trash2 } from "lucide-react";

const STORAGE_KEY = "prime-webs-notepad";

type StoredNote = {
  content: string;
  timestamp: number;
};

function formatTimestamp(timestamp: number | null) {
  if (!timestamp) {
    return "Not saved yet";
  }

  return new Date(timestamp).toLocaleString();
}

export function Notepad() {
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [lastSaved, setLastSaved] = useState<number | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const skipFirstSave = useRef(true);

  useEffect(() => {
    try {
      const storedValue = localStorage.getItem(STORAGE_KEY);
      if (storedValue) {
        const parsed: StoredNote = JSON.parse(storedValue);
        setContent(parsed.content ?? "");
        setLastSaved(parsed.timestamp ?? null);
      }
    } catch (error) {
      console.error("Failed to load notepad contents", error);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    if (skipFirstSave.current) {
      skipFirstSave.current = false;
      return;
    }

    const timestamp = Date.now();
    const payload: StoredNote = { content, timestamp };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      setLastSaved(timestamp);
    } catch (error) {
      console.error("Failed to save notepad contents", error);
    }
  }, [content, hasLoaded]);

  const handleClear = () => {
    setContent("");
    setLastSaved(null);
    localStorage.removeItem(STORAGE_KEY);
    toast({
      title: "Notepad cleared",
      description: "Your notes have been removed from this device.",
    });
  };

  return (
    <Card className="border-dashed border-muted-foreground/30">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-xl">
            <span className="rounded-lg bg-primary/10 p-2 text-primary">
              <NotebookPen className="h-5 w-5" />
            </span>
            Workspace Notepad
          </CardTitle>
          <CardDescription>
            Jot down ideas, deployment notes, or to-dos. Notes are stored locally on this device.
          </CardDescription>
        </div>
        <Badge variant="outline" className="flex items-center gap-1 text-xs">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          {formatTimestamp(lastSaved)}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Write anything you want to remember while working on your sites..."
          className="min-h-[220px] resize-vertical"
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Notes auto-save to your browser. Clearing your browser data will remove them.
          </span>
          <Button variant="ghost" size="sm" onClick={handleClear} className="text-destructive hover:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default Notepad;
