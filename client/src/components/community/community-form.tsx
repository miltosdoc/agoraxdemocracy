/**
 * Community Creation Form
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';

export function CommunityForm() {
  const [, navigate] = useLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('autonomous');
  const [governanceModel, setGovernanceModel] = useState('no_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const resp = await api.post('/api/communities', {
        name,
        description,
        type,
        governanceModel,
      });
      navigate(`/communities/${resp.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create community');
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Δημιουργία Κοινότητας</CardTitle>
        <CardDescription>
          Δημιουργήστε μια νέα κοινότητα για διαβούλευση και ψηφοφορία.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Όνομα *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="π.χ. Πολίτες Αθήνας"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Περιγραφή</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Περιγράψτε την κοινότητα..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Τύπος</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="autonomous">Αυτόνομη</SelectItem>
                <SelectItem value="managed">Διαχειριζόμενη</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="governance">Μοντέλο Διακυβέρνησης</Label>
            <Select value={governanceModel} onValueChange={setGovernanceModel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_admin">Χωρίς Διαχειριστές</SelectItem>
                <SelectItem value="admin_team">Ομάδα Διαχειριστών</SelectItem>
                <SelectItem value="hybrid">Υβριδικό</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded text-sm">{error}</div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Δημιουργία...' : 'Δημιουργία Κοινότητας'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/communities')}>
              Ακύρωση
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
