/**
 * Debate Arguments Component
 * 
 * Displays debate arguments for a proposal with support/oppose voting.
 * Arguments are grouped by side (pro/con).
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';

interface DebateArgument {
  id: number;
  proposalId: number;
  authorId: number;
  side: 'pro' | 'con';
  text: string;
  supportCount: number;
  oppositionCount: number;
  createdAt: string;
  author?: {
    username: string;
  };
}

interface DebateArgumentsProps {
  proposalId: number;
}

export function DebateArguments({ proposalId }: DebateArgumentsProps) {
  const [arguments_, setArguments] = useState<DebateArgument[]>([]);
  const [loading, setLoading] = useState(true);
  const [newArgument, setNewArgument] = useState({ side: 'pro' as 'pro' | 'con', text: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchArguments();
  }, [proposalId]);

  async function fetchArguments() {
    try {
      const res = await fetch(`/api/proposals/${proposalId}/arguments`);
      if (res.ok) {
        const data = await res.json();
        setArguments(data);
      }
    } catch (error) {
      console.error('Failed to fetch arguments:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitArgument(e: React.FormEvent) {
    e.preventDefault();
    if (!newArgument.text.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}/arguments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArgument),
      });

      if (res.ok) {
        setNewArgument({ side: 'pro', text: '' });
        fetchArguments(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to submit argument:', error);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVote(argumentId: number, type: 'support' | 'oppose') {
    try {
      const res = await fetch(`/api/arguments/${argumentId}/${type}`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchArguments(); // Refresh the list
      }
    } catch (error) {
      console.error(`Failed to ${type} argument:`, error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  const proArguments = arguments_.filter(a => a.side === 'pro');
  const conArguments = arguments_.filter(a => a.side === 'con');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Πολιτική Συζήτηση</h3>
        <span className="text-sm text-muted-foreground">
          {arguments_.length} ορίσματα
        </span>
      </div>

      {/* New Argument Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Νέο Όρισμα</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitArgument} className="space-y-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={newArgument.side === 'pro' ? 'default' : 'outline'}
                onClick={() => setNewArgument({ ...newArgument, side: 'pro' })}
              >
                <ThumbsUp className="mr-2 h-4 w-4" />
                Υπέρ
              </Button>
              <Button
                type="button"
                variant={newArgument.side === 'con' ? 'default' : 'outline'}
                onClick={() => setNewArgument({ ...newArgument, side: 'con' })}
              >
                <ThumbsDown className="mr-2 h-4 w-4" />
                Κατά
              </Button>
            </div>
            <Textarea
              placeholder="Γράψτε το όρισμά σας..."
              value={newArgument.text}
              onChange={(e) => setNewArgument({ ...newArgument, text: e.target.value })}
              className="min-h-[80px]"
            />
            <Button type="submit" disabled={submitting || !newArgument.text.trim()}>
              {submitting ? 'Υποβολή...' : 'Υποβολή Ορίσματος'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Arguments List */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Pro Arguments */}
        <div className="space-y-4">
          <h4 className="font-semibold text-green-600 flex items-center">
            <ThumbsUp className="mr-2 h-4 w-4" />
            Υπέρ ({proArguments.length})
          </h4>
          {proArguments.map((arg) => (
            <ArgumentCard
              key={arg.id}
              argument={arg}
              onSupport={() => handleVote(arg.id, 'support')}
              onOppose={() => handleVote(arg.id, 'oppose')}
            />
          ))}
          {proArguments.length === 0 && (
            <p className="text-sm text-muted-foreground">Δεν υπάρχουν ορίσματα υπέρ ακόμα.</p>
          )}
        </div>

        {/* Con Arguments */}
        <div className="space-y-4">
          <h4 className="font-semibold text-red-600 flex items-center">
            <ThumbsDown className="mr-2 h-4 w-4" />
            Κατά ({conArguments.length})
          </h4>
          {conArguments.map((arg) => (
            <ArgumentCard
              key={arg.id}
              argument={arg}
              onSupport={() => handleVote(arg.id, 'support')}
              onOppose={() => handleVote(arg.id, 'oppose')}
            />
          ))}
          {conArguments.length === 0 && (
            <p className="text-sm text-muted-foreground">Δεν υπάρχουν ορίσματα κατά ακόμα.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ArgumentCard({
  argument,
  onSupport,
  onOppose,
}: {
  argument: DebateArgument;
  onSupport: () => void;
  onOppose: () => void;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground mb-2">
          από: {argument.author?.username || 'Άγνωστος'} •{' '}
          {new Date(argument.createdAt).toLocaleDateString('el-GR')}
        </p>
        <p className="mb-4">{argument.text}</p>
        <div className="flex items-center space-x-4 text-sm">
          <Button variant="ghost" size="sm" onClick={onSupport} className="h-8 px-2">
            <ThumbsUp className="mr-1 h-3 w-3" />
            {argument.supportCount}
          </Button>
          <Button variant="ghost" size="sm" onClick={onOppose} className="h-8 px-2">
            <ThumbsDown className="mr-1 h-3 w-3" />
            {argument.oppositionCount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
