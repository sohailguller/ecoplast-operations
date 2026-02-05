import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const categories = ['recycling_tips', 'environmental', 'product_care', 'news', 'community'];

export default function PostFormSheet({ open, onOpenChange, post }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'recycling_tips',
    image_url: '',
    status: 'draft',
  });
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        content: post.content || '',
        category: post.category || 'recycling_tips',
        image_url: post.image_url || '',
        status: post.status || 'draft',
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'recycling_tips',
        image_url: '',
        status: 'draft',
      });
    }
  }, [post, open]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const payload = {
        ...data,
        published_date: data.status === 'published' ? format(new Date(), 'yyyy-MM-dd') : null,
      };
      
      if (post) {
        return base44.entities.EducationalPost.update(post.id, payload);
      }
      return base44.entities.EducationalPost.create(payload);
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['educational-posts-admin'] });
      const previousPosts = queryClient.getQueryData(['educational-posts-admin']);
      
      queryClient.setQueryData(['educational-posts-admin'], (old = []) => {
        const payload = {
          ...newData,
          published_date: newData.status === 'published' ? format(new Date(), 'yyyy-MM-dd') : null,
        };
        
        if (post) {
          return old.map(p => p.id === post.id ? { ...p, ...payload } : p);
        }
        return [...old, { ...payload, id: `temp-${Date.now()}`, created_date: new Date().toISOString() }];
      });
      
      return { previousPosts };
    },
    onError: (err, newData, context) => {
      queryClient.setQueryData(['educational-posts-admin'], context.previousPosts);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['educational-posts-admin'] });
      onOpenChange(false);
    },
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, image_url: file_url }));
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Please fill in title and content');
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{post ? 'Edit Post' : 'New Post'}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Image Upload */}
          <div>
            <Label>Cover Image</Label>
            <div className="mt-2">
              {formData.image_url ? (
                <div className="relative w-full aspect-video bg-gray-100 rounded-xl overflow-hidden">
                  <img 
                    src={formData.image_url} 
                    alt="Cover" 
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-sm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  {uploading ? (
                    <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400" />
                      <span className="text-sm text-gray-500 mt-2">Upload cover image</span>
                    </>
                  )}
                </label>
              )}
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Post title"
              className="mt-1.5"
              required
            />
          </div>

          {/* Category */}
          <div>
            <Label>Category *</Label>
            <Select 
              value={formData.category} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Content */}
          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your post content here... (Markdown supported)"
              className="mt-1.5 resize-none min-h-[200px]"
              rows={10}
              required
            />
            <p className="text-xs text-gray-500 mt-1">Markdown formatting is supported</p>
          </div>

          {/* Status */}
          <div>
            <Label>Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-gray-900 hover:bg-gray-800"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : post ? 'Update' : 'Create Post'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}