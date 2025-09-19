import { useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, Upload, User } from "lucide-react";

export function ProfileDialog() {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch('/api/profile-picture', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload profile picture');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: "Profile picture updated successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to upload profile picture",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please select an image file",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const userInitials = `${(user as any)?.firstName?.[0] || ''}${(user as any)?.lastName?.[0] || ''}`.toUpperCase() || 'U';
  const fullName = `${(user as any)?.firstName || ''} ${(user as any)?.lastName || ''}`.trim() || 'User';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative p-0 rounded-full hover:opacity-80 transition-opacity"
          data-testid="button-profile-dialog"
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={(user as any)?.profileImageUrl || ''} alt={fullName} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-semibold text-sm">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <Camera className="w-4 h-4 text-white" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Profile Picture</span>
          </DialogTitle>
          <DialogDescription>
            Upload a new profile picture. Maximum file size is 5MB.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current/Preview Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={previewUrl || (user as any)?.profileImageUrl || ''} 
                  alt={fullName} 
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-purple-600 text-white font-bold text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {previewUrl && (
                <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-1">
                  <Upload className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>

          {/* File Selection */}
          <div className="space-y-2">
            <Label htmlFor="profile-picture">Choose new picture</Label>
            <Input
              id="profile-picture"
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="cursor-pointer"
              data-testid="input-profile-picture"
            />
            <p className="text-xs text-muted-foreground">
              Supported formats: JPG, PNG, GIF, WebP (max 5MB)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setOpen(false);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              data-testid="button-upload-picture"
            >
              {uploadMutation.isPending ? "Uploading..." : "Upload Picture"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}