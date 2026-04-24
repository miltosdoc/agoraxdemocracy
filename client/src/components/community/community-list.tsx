/**
 * Community List Component
 * 
 * Displays a list of communities the user is a member of, with options to:
 * - View community details
 * - Create a new community
 * - Join existing communities
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, TrendingUp } from 'lucide-react';
import { Link } from 'wouter';

interface Community {
  id: number;
  name: string;
  description?: string;
  type: string;
  governanceModel?: string;
  memberCount?: number;
  democracyScore?: number;
}

export function CommunityList() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCommunities();
  }, []);

  async function fetchCommunities() {
    try {
      const res = await fetch('/api/communities');
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (error) {
      console.error('Failed to fetch communities:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Κοινότητες</h2>
        <Button asChild>
          <Link href="/communities/new">
            <Plus className="mr-2 h-4 w-4" />
            Δημιουργία Κοινότητας
          </Link>
        </Button>
      </div>

      {communities.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Δεν υπάρχουν κοινότητες ακόμα.</p>
            <Button asChild className="mt-4">
              <Link href="/communities/new">Δημιούργησε την πρώτη κοινότητα</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {communities.map((community) => (
            <Card key={community.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{community.name}</span>
                  <Badge variant={community.type === 'managed' ? 'default' : 'secondary'}>
                    {community.type === 'managed' ? 'Διαχειριζόμενη' : 'Αυτόνομη'}
                  </Badge>
                </CardTitle>
                <CardDescription>{community.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="mr-1 h-4 w-4" />
                    {community.memberCount || 0} μέλη
                  </div>
                  {community.democracyScore && (
                    <div className="flex items-center">
                      <TrendingUp className="mr-1 h-4 w-4" />
                      Βαθμός: {community.democracyScore}
                    </div>
                  )}
                </div>
                <Button asChild className="mt-4 w-full" variant="outline">
                  <Link href={`/communities/${community.id}`}>Προβολή Κοινότητας</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
