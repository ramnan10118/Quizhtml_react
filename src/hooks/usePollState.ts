import { useState, useCallback } from 'react';
import { Poll, PollState, PollResults, PollCreateData } from '@/types/polling';

const initialState: PollState = {
  currentPoll: null,
  pollHistory: [],
  participants: new Map(),
  isHost: false,
  canVote: false,
  hasVoted: false,
};

export function usePollState(isHost: boolean = false) {
  const [pollState, setPollState] = useState<PollState>({
    ...initialState,
    isHost,
  });

  const setCurrentPoll = useCallback((poll: Poll | null) => {
    setPollState(prev => ({
      ...prev,
      currentPoll: poll,
      hasVoted: false,
      canVote: !isHost && poll?.isActive || false,
    }));
  }, [isHost]);

  const addParticipant = useCallback((socketId: string, teamName: string) => {
    setPollState(prev => {
      const newParticipants = new Map(prev.participants);
      newParticipants.set(socketId, teamName);
      return {
        ...prev,
        participants: newParticipants,
      };
    });
  }, []);

  const removeParticipant = useCallback((socketId: string) => {
    setPollState(prev => {
      const newParticipants = new Map(prev.participants);
      newParticipants.delete(socketId);
      return {
        ...prev,
        participants: newParticipants,
      };
    });
  }, []);

  const updatePoll = useCallback((poll: Poll) => {
    setPollState(prev => ({
      ...prev,
      currentPoll: poll,
      canVote: !prev.isHost && poll.isActive && !prev.hasVoted,
    }));
  }, []);

  const addToPollHistory = useCallback((poll: Poll) => {
    setPollState(prev => ({
      ...prev,
      pollHistory: [poll, ...prev.pollHistory],
    }));
  }, []);

  const setVoteStatus = useCallback((hasVoted: boolean, optionIndex?: number) => {
    setPollState(prev => ({
      ...prev,
      hasVoted,
      canVote: !hasVoted && prev.currentPoll?.isActive || false,
    }));
  }, []);

  const closePoll = useCallback(() => {
    setPollState(prev => {
      if (prev.currentPoll) {
        const closedPoll: Poll = {
          ...prev.currentPoll,
          isActive: false,
          closedAt: Date.now(),
        };
        
        return {
          ...prev,
          currentPoll: closedPoll,
          pollHistory: [closedPoll, ...prev.pollHistory],
          canVote: false,
        };
      }
      return prev;
    });
  }, []);

  const resetPollState = useCallback(() => {
    setPollState(prev => ({
      ...prev,
      currentPoll: null,
      hasVoted: false,
      canVote: false,
    }));
  }, []);

  const getParticipantCount = useCallback(() => {
    return pollState.participants.size;
  }, [pollState.participants]);

  const getCurrentVoteCount = useCallback((poll: Poll): number => {
    return poll.votes.size;
  }, []);

  const getPollResults = useCallback((poll: Poll): PollResults => {
    const voteCounts = new Array(poll.options.length).fill(0);
    const voterNames: Record<number, string[]> = {};
    
    // Initialize voter names arrays
    for (let i = 0; i < poll.options.length; i++) {
      voterNames[i] = [];
    }
    
    // Count votes and collect voter names
    poll.votes.forEach((optionIndex, teamName) => {
      if (optionIndex >= 0 && optionIndex < poll.options.length) {
        voteCounts[optionIndex]++;
        voterNames[optionIndex].push(teamName);
      }
    });

    return {
      pollId: poll.id,
      question: poll.question,
      options: poll.options,
      voteCounts,
      totalVotes: poll.votes.size,
      voterNames,
    };
  }, []);

  return {
    pollState,
    setCurrentPoll,
    addParticipant,
    removeParticipant,
    updatePoll,
    addToPollHistory,
    setVoteStatus,
    closePoll,
    resetPollState,
    getParticipantCount,
    getCurrentVoteCount,
    getPollResults,
  };
}