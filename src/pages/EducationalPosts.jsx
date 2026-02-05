import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Search, BookOpen, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import EmptyState from '@/components/ui/EmptyState';
import PostFormSheet from '@/components/posts/PostFormSheet';

export default function EducationalPosts() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const queryClient = useQueryClient();

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['educational-posts-admin'],
    queryFn: () => base44.entities.EducationalPost.list('-created_date'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.EducationalPost.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['educational-posts-admin'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }) => base44.entities.EducationalPost.update(id, { 
      status,
      published_date: status === 'published' ? format(new Date(), 'yyyy-MM-dd') : null
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['educational-posts-admin'] }),
  });

  const filteredPosts = posts.filter(post =>
    !searchQuery ||
    post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (post) => {
    setEditingPost(post);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Delete this post?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleTogglePublish = (post) => {
    const newStatus = post.status === 'published' ? 'draft' : 'published';
    toggleMutation.mutate({ id: post.id, status: newStatus });
  };

  const categoryColors = {
    recycling_tips: 'bg-emerald-100 text-emerald-700',
    environmental: 'bg-green-100 text-green-700',
    product_care: 'bg-blue-100 text-blue-700',
    news: 'bg-purple-100 text-purple-700',
    community: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="pb-24 lg:pb-8">
      <PageHeader 
        title="Educational Posts"
        subtitle={`${posts.length} posts`}
        action="New Post"
        actionIcon={Plus}
        onAction={() => {
          setEditingPost(null);
          setShowForm(true);
        }}
      />

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

        {/* Posts List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-4 bg-white border-0 shadow-sm animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </Card>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No posts"
            description="Create educational content for customers"
            action="Create Post"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="p-4 bg-white border-0 shadow-sm">
                <div className="flex gap-4">
                  {post.image_url ? (
                    <img
                      src={post.image_url}
                      alt={post.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                      <BookOpen className="w-8 h-8 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${categoryColors[post.category] || 'bg-gray-100 text-gray-700'}`}>
                        {post.category?.replace(/_/g, ' ')}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${post.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {post.status}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-gray-900 mt-2 line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {post.created_date && format(new Date(post.created_date), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(post)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTogglePublish(post)}>
                        {post.status === 'published' ? (
                          <><EyeOff className="w-4 h-4 mr-2" /> Unpublish</>
                        ) : (
                          <><Eye className="w-4 h-4 mr-2" /> Publish</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <PostFormSheet 
        open={showForm}
        onOpenChange={setShowForm}
        post={editingPost}
      />
    </div>
  );
}