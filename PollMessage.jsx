import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function PollMessage({ message, currentUserEmail, onVote }) {
  const totalVotes = Object.values(message.poll_votes || {}).flat().length;
  const userVote = Object.entries(message.poll_votes || {}).find(([_, voters]) => voters.includes(currentUserEmail))?.[0];

  return (
    <Card className="bg-blue-50 border-blue-200 my-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-blue-900">{message.poll_question}</CardTitle>
        <p className="text-xs text-blue-700">{totalVotes} vote(s) total</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {message.poll_options.map((option, index) => {
          const votesForOption = message.poll_votes?.[option]?.length || 0;
          const votePercentage = totalVotes > 0 ? (votesForOption / totalVotes) * 100 : 0;
          const isVotedByMe = userVote === option;

          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-slate-700">{option}</span>
                <span className="text-xs text-slate-500">{votesForOption} vote(s)</span>
              </div>
              <Progress value={votePercentage} className="w-full h-2 mb-2" />
              <Button
                size="sm"
                variant={isVotedByMe ? 'default' : 'outline'}
                onClick={() => onVote(message.id, option)}
                disabled={isVotedByMe}
                className={`w-full ${isVotedByMe ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
              >
                {isVotedByMe ? 'Voted' : 'Vote'}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}