import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PieChart, Plus, X } from "lucide-react";

export function InteractivePolls({ streamId }: { streamId?: string }) {
  const [polls, setPolls] = useState<any[]>([
    {
      id: '1',
      question: 'What genre should I play next?',
      options: ['House', 'Techno', 'Drum&Bass', 'Trance'],
      votes: [45, 32, 28, 15],
      totalVotes: 120,
      voted: false,
    }
  ]);
  const [showCreate, setShowCreate] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });

  const handleVote = (pollId: string, optionIndex: number) => {
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId && !poll.voted) {
        const newVotes = [...poll.votes];
        newVotes[optionIndex]++;
        return { ...poll, votes: newVotes, totalVotes: poll.totalVotes + 1, voted: true };
      }
      return poll;
    }));
  };

  const addPoll = () => {
    if (newPoll.question && newPoll.options.every(o => o)) {
      setPolls(prev => [...prev, {
        id: String(Date.now()),
        question: newPoll.question,
        options: newPoll.options,
        votes: new Array(newPoll.options.length).fill(0),
        totalVotes: 0,
        voted: false,
      }]);
      setNewPoll({ question: '', options: ['', ''] });
      setShowCreate(false);
    }
  };

  return (
    <div className="space-y-4">
      {polls.map(poll => (
        <Card key={poll.id} className="geometric-clip" data-testid={`poll-${poll.id}`}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <PieChart className="w-4 h-4 mr-2" />
                {poll.question}
              </span>
              <Badge variant="secondary">{poll.totalVotes} votes</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {poll.options.map((option: string, idx: number) => {
              const percentage = poll.totalVotes > 0 ? (poll.votes[idx] / poll.totalVotes) * 100 : 0;
              return (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{option}</span>
                    <span className="text-sm text-muted-foreground">{percentage.toFixed(0)}%</span>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full relative overflow-hidden"
                    onClick={() => handleVote(poll.id, idx)}
                    disabled={poll.voted}
                    data-testid={`vote-${poll.id}-${idx}`}
                  >
                    <Progress value={percentage} className="absolute inset-0 h-full" />
                    <span className="relative">{poll.votes[idx]} votes</span>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {showCreate ? (
        <Card className="geometric-clip">
          <CardHeader><CardTitle>Create Poll</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input
              placeholder="Poll question"
              value={newPoll.question}
              onChange={(e) => setNewPoll(prev => ({ ...prev, question: e.target.value }))}
              data-testid="input-poll-question"
            />
            {newPoll.options.map((opt, idx) => (
              <Input
                key={idx}
                placeholder={`Option ${idx + 1}`}
                value={opt}
                onChange={(e) => {
                  const options = [...newPoll.options];
                  options[idx] = e.target.value;
                  setNewPoll(prev => ({ ...prev, options }));
                }}
                data-testid={`input-poll-option-${idx}`}
              />
            ))}
            <Button onClick={() => setNewPoll(prev => ({ ...prev, options: [...prev.options, ''] }))} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Option
            </Button>
            <div className="flex gap-2">
              <Button onClick={addPoll} className="flex-1" data-testid="button-create-poll">Create</Button>
              <Button onClick={() => setShowCreate(false)} variant="outline">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button onClick={() => setShowCreate(true)} className="w-full" variant="outline" data-testid="button-new-poll">
          <Plus className="w-4 h-4 mr-2" />
          Create Poll
        </Button>
      )}
    </div>
  );
}
