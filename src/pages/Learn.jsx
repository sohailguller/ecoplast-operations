import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Search, BookOpen, Recycle, Leaf, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import EmptyState from '@/components/ui/EmptyState';
import ReactMarkdown from 'react-markdown';

export default function Learn() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['educational-posts'],
    queryFn: () => base44.entities.EducationalPost.filter(
      { status: 'published' },
      '-created_date'
    ),
  });

  const categories = ['all', 'recycling_tips', 'environmental', 'product_care', 'news', 'community'];

  const categoryIcons = {
    recycling_tips: Recycle,
    environmental: Leaf,
    product_care: Info,
    news: BookOpen,
    community: BookOpen,
  };

  const categoryColors = {
    recycling_tips: 'bg-emerald-100 text-emerald-600',
    environmental: 'bg-green-100 text-green-600',
    product_care: 'bg-blue-100 text-blue-600',
    news: 'bg-purple-100 text-purple-600',
    community: 'bg-amber-100 text-amber-600',
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = !searchQuery || 
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || post.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="pb-24 lg:pb-8">
      {/* Header */}
      <div className="px-4 py-6 bg-white border-b border-gray-100">
        <h1 className="text-2xl font-semibold text-gray-900">Learn</h1>
        <p className="text-sm text-gray-500 mt-1">Tips, guides & environmental news</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 rounded-xl h-11"
          />
        </div>

        {/* Category Tabs */}
        <div className="overflow-x-auto -mx-4 px-4">
          <Tabs value={categoryFilter} onValueChange={setCategoryFilter}>
            <TabsList className="bg-gray-100 p-1 rounded-xl h-auto w-max">
              {categories.map(cat => (
                <TabsTrigger 
                  key={cat} 
                  value={cat} 
                  className="rounded-lg text-xs py-2 px-3 capitalize whitespace-nowrap"
                >
                  {cat === 'all' ? 'All' : cat.replace(/_/g, ' ')}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Posts */}
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
            title="No articles found"
            description="Check back later for new content"
          />
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const Icon = categoryIcons[post.category] || BookOpen;
              const colorClass = categoryColors[post.category] || 'bg-gray-100 text-gray-600';
              
              return (
                <Card 
                  key={post.id}
                  className="p-4 bg-white border-0 shadow-sm cursor-pointer hover:shadow transition-shadow"
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="flex gap-4">
                    {post.image_url ? (
                      <img
                        src={post.image_url}
                        alt={post.title}
                        className="w-24 h-24 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className={`w-24 h-24 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                        <Icon className="w-8 h-8" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${colorClass}`}>
                          {post.category?.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-gray-900 mt-2 line-clamp-2">
                        {post.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {post.content?.substring(0, 100)}...
                      </p>
                      {post.published_date && (
                        <p className="text-xs text-gray-400 mt-2">
                          {format(new Date(post.published_date), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Post Detail Sheet */}
      <Sheet open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedPost && (
            <>
              <SheetHeader>
                <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize w-fit ${categoryColors[selectedPost.category] || 'bg-gray-100 text-gray-600'}`}>
                  {selectedPost.category?.replace(/_/g, ' ')}
                </div>
                <SheetTitle className="text-left text-xl mt-2">
                  {selectedPost.title}
                </SheetTitle>
              </SheetHeader>

              <div className="mt-4 space-y-4">
                {selectedPost.image_url && (
                  <img
                    src={selectedPost.image_url}
                    alt={selectedPost.title}
                    className="w-full aspect-video object-cover rounded-xl"
                  />
                )}
                
                {selectedPost.published_date && (
                  <p className="text-sm text-gray-500">
                    {format(new Date(selectedPost.published_date), 'MMMM d, yyyy')}
                  </p>
                )}
                
                <div className="prose prose-sm max-w-none text-gray-700">
                  <ReactMarkdown>{selectedPost.content}</ReactMarkdown>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}