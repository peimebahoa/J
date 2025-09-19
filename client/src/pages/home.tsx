import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  User, 
  Calendar, 
  Shield, 
  Settings, 
  Key, 
  Bell,
  Monitor,
  Smartphone,
  Activity,
  Plus,
  Globe,
  Edit,
  Trash2,
  ExternalLink,
  Code,
  Upload,
  RefreshCw,
  Sparkles,
  Zap
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ProfileDialog } from "@/components/profile-dialog";
import type { Website, ScriptTemplate } from "@shared/schema";

// Create Website Dialog Component
function CreateWebsiteDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const createWebsiteMutation = useMutation({
    mutationFn: async (data: { name: string; subdomain: string; description?: string }) => {
      const response = await apiRequest("POST", "/api/websites", data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Website Created",
        description: "Your website has been created successfully!",
      });
      setOpen(false);
      setName("");
      setSubdomain("");
      setDescription("");
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create website",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !subdomain.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and subdomain are required",
        variant: "destructive",
      });
      return;
    }
    createWebsiteMutation.mutate({ name, subdomain, description });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-create-website">
          <Plus className="w-4 h-4 mr-2" />
          Create Website
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Website</DialogTitle>
          <DialogDescription>
            Create a new website. You can choose a script template later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Website Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Website"
              data-testid="input-website-name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subdomain">Subdomain</Label>
            <Input
              id="subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="my-awesome-site"
              data-testid="input-subdomain"
            />
            <p className="text-sm text-muted-foreground">
              Your website will be available at: {subdomain || 'your-subdomain'}.yoursite.com
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of your website"
              data-testid="textarea-description"
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createWebsiteMutation.isPending} data-testid="button-submit-website">
              {createWebsiteMutation.isPending ? "Creating..." : "Create Website"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Script Selection Dialog Component
function ScriptSelectionDialog({ 
  website, 
  onSuccess 
}: { 
  website: Website; 
  onSuccess: () => void; 
}) {
  const [open, setOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: scripts = [] } = useQuery({
    queryKey: ["/api/scripts"],
  });

  const changeScriptMutation = useMutation({
    mutationFn: async (scriptName: string) => {
      const response = await apiRequest("POST", `/api/websites/${website.id}/change-script`, { scriptName });
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Script Changed",
        description: `Website script has been updated successfully!`,
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to change script",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedScript) {
      toast({
        title: "Validation Error",
        description: "Please select a script",
        variant: "destructive",
      });
      return;
    }
    changeScriptMutation.mutate(selectedScript);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" data-testid={`button-change-script-${website.id}`}>
          <Code className="w-4 h-4 mr-1" />
          {website.currentScript ? "Change Script" : "Select Script"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Script for {website.name}</DialogTitle>
          <DialogDescription>
            Choose a script template to deploy to your website. This will replace any existing files.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="script">Available Scripts</Label>
            <Select value={selectedScript} onValueChange={setSelectedScript}>
              <SelectTrigger data-testid="select-script">
                <SelectValue placeholder="Select a script template" />
              </SelectTrigger>
              <SelectContent>
                {(scripts as (ScriptTemplate & { fileExists: boolean })[]).map((script) => (
                  <SelectItem 
                    key={script.id} 
                    value={script.fileName}
                    disabled={!script.fileExists}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{script.displayName}</span>
                      {!script.fileExists && (
                        <Badge variant="destructive" className="ml-2">Missing File</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {(scripts as any[]).length === 0 && (
              <p className="text-sm text-muted-foreground">
                No scripts available. Upload scripts to /allscripts folder first.
              </p>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={changeScriptMutation.isPending || !selectedScript}
              data-testid="button-apply-script"
            >
              {changeScriptMutation.isPending ? "Applying..." : "Apply Script"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Website Card Component
function WebsiteCard({ website }: { website: Website }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteWebsiteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/websites/${website.id}`);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Website Deleted",
        description: "Your website has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/websites"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete website",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this website? This action cannot be undone.")) {
      deleteWebsiteMutation.mutate();
    }
  };

  const websiteUrl = `https://${website.subdomain}.yoursite.com`;

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-accent/5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground" data-testid={`text-website-name-${website.id}`}>
                  {website.name}
                </h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground" data-testid={`text-subdomain-${website.id}`}>
                    {website.subdomain}.yoursite.com
                  </span>
                </div>
              </div>
            </div>
            
            {website.description && (
              <p className="text-sm text-muted-foreground mb-4 bg-muted/30 p-3 rounded-lg">{website.description}</p>
            )}
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Template:</span>
                {website.currentScript ? (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {website.currentScript}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="border-dashed">
                    No template
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                {website.isActive ? (
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Activity className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                ) : (
                  <Badge variant="destructive">Inactive</Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Folder:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  /{website.subdomain}/
                </Badge>
              </div>
            </div>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:bg-primary hover:text-primary-foreground transition-colors"
              data-testid={`button-visit-${website.id}`}
            >
              <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Visit Site
              </a>
            </Button>
            <ScriptSelectionDialog 
              website={website} 
              onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/websites"] })} 
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={deleteWebsiteMutation.isPending}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
            data-testid={`button-delete-${website.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const queryClient = useQueryClient();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: websites = [], isLoading: websitesLoading } = useQuery({
    queryKey: ["/api/websites"],
    enabled: isAuthenticated,
  });

  const { data: scripts = [] } = useQuery({
    queryKey: ["/api/scripts"],
    enabled: isAuthenticated,
  });

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/logout");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Goodbye!",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials = `${(user as any).firstName?.[0] || ''}${(user as any).lastName?.[0] || ''}`.toUpperCase() || 'U';
  const fullName = `${(user as any).firstName || ''} ${(user as any).lastName || ''}`.trim() || 'User';

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-card/50 backdrop-blur-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Prime Webs
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <ProfileDialog />
              <span className="text-sm font-medium" data-testid="text-welcome">
                Welcome, {(user as any).firstName || 'User'}
              </span>
              <Button 
                variant="ghost"
                onClick={handleLogout}
                className="text-sm hover:bg-destructive/10 hover:text-destructive transition-colors"
                data-testid="button-logout"
              >
                <Activity className="w-4 h-4 mr-1" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <Sparkles className="w-8 h-8 text-primary" />
                <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent" data-testid="text-dashboard-header">
                  Your Website Dashboard
                </h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Build, deploy, and manage your web presence with powerful tools
              </p>
            </div>
            {(websites as Website[]).length === 0 && (
              <CreateWebsiteDialog 
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/websites"] })} 
              />
            )}
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Your Website</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-total-websites">
                    {(websites as Website[]).length > 0 ? '1 Created' : 'None yet'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-green-500/5">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Available Templates</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-available-scripts">
                    {(scripts as ScriptTemplate[]).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-blue-500/5">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Website Status</p>
                  <p className="text-2xl font-bold text-foreground" data-testid="text-active-websites">
                    {(websites as Website[]).filter((w: Website) => w.isActive).length > 0 ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Website Management Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Your Website</h2>
              <p className="text-sm text-muted-foreground mt-1">
                You can create one website with Prime Webs. Make it count!
              </p>
            </div>
            {(websites as Website[]).length > 0 ? (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/websites"] })}
                data-testid="button-refresh-websites"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            ) : (
              <CreateWebsiteDialog 
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/websites"] })} 
              />
            )}
          </div>
          
          {websitesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-muted rounded w-full mb-2"></div>
                    <div className="h-3 bg-muted rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (websites as Website[]).length === 0 ? (
            <Card className="hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-card to-accent/10">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3">Ready to build something amazing?</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your website and get a dedicated folder with your chosen subdomain. 
                  Deploy professional templates instantly and start building your online presence.
                </p>
                <CreateWebsiteDialog 
                  onSuccess={() => queryClient.invalidateQueries({ queryKey: ["/api/websites"] })} 
                />
                <div className="mt-6 text-xs text-muted-foreground">
                  ✨ One website per account • Automatic folder creation • Instant deployment
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(websites as Website[]).map((website: Website) => (
                <WebsiteCard key={website.id} website={website} />
              ))}
            </div>
          )}
        </div>

        {/* Instructions Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="w-5 h-5 mr-2" />
                How to Add Scripts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                To add script templates that can be deployed to your websites:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                <li>Create a ZIP file containing your website files (HTML, CSS, JS, etc.)</li>
                <li>Upload the ZIP file to the <code className="bg-muted px-1 rounded">/allscripts</code> folder</li>
                <li>The script will automatically appear in the script selection menu</li>
                <li>You can then deploy it to any of your websites</li>
              </ol>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Note:</strong> When you change a website's script, all existing files in that website's 
                  folder will be replaced with the contents of the selected script.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}