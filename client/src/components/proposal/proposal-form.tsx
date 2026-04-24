/**
 * Proposal Form Component
 * 
 * Form for creating new proposals within a community.
 * Collects: question (problem), solution, category, and optional description.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProposalFormProps {
  communityId?: number;  // Optional for demo mode
}

const CATEGORIES = [
  { value: 'education', label: 'Εκπαίδευση' },
  { value: 'healthcare', label: 'Υγεία' },
  { value: 'infrastructure', label: 'Υποδομές' },
  { value: 'environment', label: 'Περιβάλλον' },
  { value: 'economy', label: 'Οικονομία' },
  { value: 'governance', label: 'Διακυβέρνηση' },
  { value: 'other', label: 'Άλλο' },
];

export function ProposalForm({ communityId }: ProposalFormProps) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const targetCommunityId = communityId || 1;  // Default to main community
  const [formData, setFormData] = useState({
    question: '',
    solution: '',
    category: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/communities/${targetCommunityId}/proposals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to create proposal');
      }

      const proposal = await res.json();
      setLocation(`/proposals/${proposal.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Υπόβαλε Πρόταση</CardTitle>
        <CardDescription>
          Υποβάλετε μια πρόταση για την κοινότητά σας. Κάθε πρόταση πρέπει να περιλαμβάνει ένα ερώτημα (το πρόβλημα) και μια λύση.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="question">
              Ερώτημα <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="question"
              placeholder="Ποιο πρόβλημα θέλετε να λύσετε;"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="min-h-[120px]"
              required
            />
            <p className="text-sm text-muted-foreground">
              Περιγράψτε το πρόβλημα ή το ζήτημα που θέλετε να διερευνήσετε.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="solution">
              Λύση <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="solution"
              placeholder="Ποια είναι η προτεινόμενη λύση;"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="min-h-[120px]"
              required
            />
            <p className="text-sm text-muted-foreground">
              Περιγράψτε την προτεινόμενη λύση ή δράση.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Κατηγορία</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Επιλέξτε κατηγορία" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Ακύρωση
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Υποβολή...
                </>
              ) : (
                'Υποβολή Προβουλευματος'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
