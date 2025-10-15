import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, HelpCircle, Plus, Users, TrendingUp, MessageSquare, Share2, ArrowLeft, Sparkles } from 'lucide-react';

const PolisMultiPoll = () => {
  const [currentView, setCurrentView] = useState('home');
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [activeView, setActiveView] = useState('vote');
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [votes, setVotes] = useState({});
  const [showNewStatement, setShowNewStatement] = useState(false);
  const [newStatement, setNewStatement] = useState('');
  const [hoverSide, setHoverSide] = useState(null);
  const [revealedStats, setRevealedStats] = useState({});
  const [dismissedHomeBanner, setDismissedHomeBanner] = useState(false);
  const [showPostPollPrompt, setShowPostPollPrompt] = useState(false);
  const [hasCompletedFirstPoll, setHasCompletedFirstPoll] = useState(false);
  const [showDemographicsForm, setShowDemographicsForm] = useState(false);
  const [demographics, setDemographics] = useState({
    gender: null,
    ageGroup: null,
    ethnicity: null,
    politicalParty: null
  });
  const [hasDemographics, setHasDemographics] = useState(false);
  const [showWhyWeAsk, setShowWhyWeAsk] = useState(false);

  const polls = [
    {
      id: 'work-culture',
      title: 'Team Work Culture',
      emoji: '💼',
      description: 'Share your thoughts on ideal work culture and team dynamics',
      participants: 36,
      statementCount: 15,
      isClosed: false,
      closedDate: null,
      question: "What's your ideal approach to work culture?",
      statements: [
        { id: 1, text: "We should move our team standup to async updates", author: "Alex", agree: 23, disagree: 8, pass: 5 },
        { id: 2, text: "Remote work should be the default option", author: "Jamie", agree: 31, disagree: 4, pass: 1 },
        { id: 3, text: "We need more time for deep work without meetings", author: "Sam", agree: 28, disagree: 3, pass: 5 },
        { id: 4, text: "Team bonding activities should be mandatory", author: "Taylor", agree: 12, disagree: 19, pass: 5 },
        { id: 5, text: "We should adopt a 4-day work week", author: "Morgan", agree: 29, disagree: 5, pass: 2 },
        { id: 6, text: "All meetings should have a clear agenda sent 24 hours in advance", author: "Casey", agree: 34, disagree: 1, pass: 1 },
        { id: 7, text: "Casual Friday dress code should extend to the whole week", author: "Jordan", agree: 26, disagree: 7, pass: 3 },
        { id: 8, text: "We should have designated 'no meeting' days each week", author: "Riley", agree: 30, disagree: 4, pass: 2 },
        { id: 9, text: "Performance reviews should happen quarterly instead of annually", author: "Avery", agree: 18, disagree: 14, pass: 4 },
        { id: 10, text: "We should eliminate email and use only Slack/Teams", author: "Skylar", agree: 15, disagree: 17, pass: 4 },
        { id: 11, text: "Every employee should have a personal development budget", author: "Drew", agree: 32, disagree: 2, pass: 2 },
        { id: 12, text: "Open office layouts are better than private offices", author: "Reese", agree: 8, disagree: 24, pass: 4 },
        { id: 13, text: "We should track work hours strictly", author: "Sage", agree: 6, disagree: 26, pass: 4 },
        { id: 14, text: "Unlimited PTO is better than fixed vacation days", author: "Parker", agree: 22, disagree: 10, pass: 4 },
        { id: 15, text: "All company decisions should be made transparently", author: "Quinn", agree: 27, disagree: 6, pass: 3 },
      ]
    },
    {
      id: 'climate-action',
      title: 'Climate Action',
      emoji: '🌍',
      description: 'Discuss priorities and approaches to addressing climate change',
      participants: 52,
      statementCount: 12,
      isClosed: false,
      closedDate: null,
      question: "What should be our priorities for climate action?",
      statements: [
        { id: 101, text: "Governments should ban single-use plastics immediately", author: "Emma", agree: 38, disagree: 10, pass: 4 },
        { id: 102, text: "Carbon taxes are the most effective climate solution", author: "Liam", agree: 28, disagree: 18, pass: 6 },
        { id: 103, text: "Individual action is more important than policy changes", author: "Sophia", agree: 15, disagree: 32, pass: 5 },
        { id: 104, text: "Nuclear energy should be part of the solution", author: "Noah", agree: 24, disagree: 22, pass: 6 },
        { id: 105, text: "Companies should be required to be carbon neutral by 2030", author: "Olivia", agree: 35, disagree: 12, pass: 5 },
        { id: 106, text: "We need to focus on adaptation rather than prevention", author: "Ethan", agree: 12, disagree: 35, pass: 5 },
        { id: 107, text: "Electric vehicles should receive government subsidies", author: "Ava", agree: 30, disagree: 16, pass: 6 },
        { id: 108, text: "Meat consumption should be heavily taxed", author: "Mason", agree: 18, disagree: 26, pass: 8 },
        { id: 109, text: "Climate education should be mandatory in schools", author: "Isabella", agree: 42, disagree: 6, pass: 4 },
        { id: 110, text: "Renewable energy should replace all fossil fuels by 2035", author: "Lucas", agree: 32, disagree: 14, pass: 6 },
        { id: 111, text: "Flying should become significantly more expensive", author: "Mia", agree: 16, disagree: 28, pass: 8 },
        { id: 112, text: "Local food production is key to sustainability", author: "James", agree: 38, disagree: 8, pass: 6 },
      ]
    },
    {
      id: 'ai-future',
      title: 'AI & The Future',
      emoji: '🤖',
      description: 'Explore perspectives on artificial intelligence and its impact',
      participants: 28,
      statementCount: 10,
      isClosed: true,
      closedDate: '2025-10-01',
      question: "How should we approach AI development and regulation?",
      statements: [
        { id: 201, text: "AI development should be heavily regulated from the start", author: "Chris", agree: 22, disagree: 4, pass: 2 },
        { id: 202, text: "Universal Basic Income is necessary as AI replaces jobs", author: "Pat", agree: 18, disagree: 8, pass: 2 },
        { id: 203, text: "AI will create more jobs than it destroys", author: "Sam", agree: 10, disagree: 14, pass: 4 },
        { id: 204, text: "We should pause AI development until we understand the risks", author: "Alex", agree: 12, disagree: 14, pass: 2 },
        { id: 205, text: "AI decision-making should always be explainable", author: "Jordan", agree: 24, disagree: 2, pass: 2 },
        { id: 206, text: "Companies should be liable for harm caused by their AI", author: "Taylor", agree: 26, disagree: 1, pass: 1 },
        { id: 207, text: "AI should never make life-or-death decisions", author: "Morgan", agree: 20, disagree: 6, pass: 2 },
        { id: 208, text: "Open-source AI is safer than proprietary AI", author: "Casey", agree: 14, disagree: 10, pass: 4 },
        { id: 209, text: "AI will solve more problems than it creates", author: "Riley", agree: 12, disagree: 12, pass: 4 },
        { id: 210, text: "Humans will always need to verify AI decisions", author: "Avery", agree: 22, disagree: 4, pass: 2 },
      ]
    }
  ];

  const BATCH_SIZE = 10;
  const MIN_VOTES_REQUIRED = 10;

  const currentPoll = polls.find(p => p.id === selectedPoll);
  const statements = currentPoll?.statements || [];

  const votedCount = Object.keys(votes).length;
  const canSeeResults = votedCount >= MIN_VOTES_REQUIRED;

  const batchStart = currentBatch * BATCH_SIZE;
  const batchEnd = Math.min(batchStart + BATCH_SIZE, statements.length);
  const currentBatchStatements = statements.slice(batchStart, batchEnd);
  const batchProgress = currentStatementIndex - batchStart;
  const hasMoreBatches = batchEnd < statements.length;
  
  const currentStatement = currentBatchStatements[batchProgress];
  const totalVotes = statements.reduce((sum, s) => sum + s.agree + s.disagree + s.pass, 0);
  const participantCount = currentPoll?.participants || 0;

  const handleVote = (voteType) => {
    const newVotes = {...votes, [currentStatement.id]: voteType};
    setVotes(newVotes);
    setRevealedStats({...revealedStats, [currentStatement.id]: true});
    
    const newVotedCount = Object.keys(newVotes).length;
    const hasMetMinimum = newVotedCount >= MIN_VOTES_REQUIRED;
    
    setTimeout(() => {
      if (currentStatementIndex < batchEnd - 1) {
        setCurrentStatementIndex(currentStatementIndex + 1);
      } else if (hasMetMinimum) {
        if (!hasDemographics) {
          setShowDemographicsForm(true);
        } else {
          setActiveView('results');
          if (!hasCompletedFirstPoll && newVotedCount >= statements.length) {
            setShowPostPollPrompt(true);
            setHasCompletedFirstPoll(true);
          }
        }
      }
    }, 1000);
  };

  const handleNextBatch = () => {
    setCurrentBatch(currentBatch + 1);
    setCurrentStatementIndex(batchEnd);
    setActiveView('vote');
  };

  const handleSubmitStatement = () => {
    if (newStatement.trim()) {
      alert(`Statement submitted: "${newStatement}"\n\nIn a real app, this would be added to the conversation for others to vote on.`);
      setShowNewStatement(false);
      setNewStatement('');
    }
  };

  const handleSelectPoll = (pollId) => {
    setSelectedPoll(pollId);
    setCurrentView('poll');
    
    const poll = polls.find(p => p.id === pollId);
    const userVotedCount = Object.keys(votes).length;
    
    if (poll.isClosed) {
      setActiveView('results');
    } else if (userVotedCount >= MIN_VOTES_REQUIRED) {
      setActiveView('results');
    } else {
      setActiveView('vote');
    }
    
    setCurrentStatementIndex(0);
    setCurrentBatch(0);
    setVotes({});
    setRevealedStats({});
  };

  const handleBackToHome = () => {
    setCurrentView('home');
    setSelectedPoll(null);
  };

  const generatePersonalInsight = () => {
    const userVotes = Object.entries(votes);
    if (userVotes.length === 0) return null;

    const agreeCount = userVotes.filter(([_, vote]) => vote === 'agree').length;
    const disagreeCount = userVotes.filter(([_, vote]) => vote === 'disagree').length;
    const passCount = userVotes.filter(([_, vote]) => vote === 'pass').length;

    const totalVotesCount = userVotes.length;
    const agreePercent = (agreeCount / totalVotesCount) * 100;
    const disagreePercent = (disagreeCount / totalVotesCount) * 100;
    const passPercent = (passCount / totalVotesCount) * 100;

    let profile = "";
    let description = "";
    let emoji = "";

    if (agreePercent > 70) {
      profile = "The Optimist";
      emoji = "🌟";
      description = "You see the potential in new ideas and are open to change. Your positive outlook helps build consensus and move conversations forward. You believe in giving proposals a chance and trust in collaborative progress.";
    } else if (disagreePercent > 60) {
      profile = "The Critical Thinker";
      emoji = "🔍";
      description = "You carefully evaluate proposals and aren't afraid to voice concerns. Your thoughtful skepticism helps identify potential issues before they become problems. You value thorough analysis and considered decision-making.";
    } else if (passPercent > 40) {
      profile = "The Thoughtful Observer";
      emoji = "🤔";
      description = "You take time to consider multiple perspectives before committing. Your nuanced thinking recognizes that complex issues rarely have simple answers. You value gathering more information before making decisions.";
    } else if (Math.abs(agreeCount - disagreeCount) <= 2) {
      profile = "The Balanced Evaluator";
      emoji = "⚖️";
      description = "You approach each statement on its own merits, without a predetermined stance. Your balanced perspective helps bridge different viewpoints and find common ground. You see both opportunities and risks in new proposals.";
    } else {
      profile = "The Engaged Contributor";
      emoji = "💡";
      description = "You actively participate in shaping the conversation with clear positions. Your willingness to take stands helps define the boundaries of discussion and moves the group toward actionable decisions.";
    }

    return { profile, emoji, description };
  };

  const personalInsight = generatePersonalInsight();

  const handleShareProfile = () => {
    if (!personalInsight) return;
    
    const shareText = `I'm ${personalInsight.profile} ${personalInsight.emoji} on this ${currentPoll?.title} discussion! What's your voting profile? Take the poll!`;
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: 'My Voting Profile',
        text: shareText,
        url: shareUrl
      }).catch(() => {});
    } else {
      const fullText = `${shareText}\n${shareUrl}`;
      navigator.clipboard.writeText(fullText).then(() => {
        alert('✅ Share text copied to clipboard!');
      }).catch(() => {
        alert('Share link: ' + shareUrl);
      });
    }
  };

  const handleDemographicsSubmit = () => {
    setHasDemographics(true);
    setShowDemographicsForm(false);
    setActiveView('results');
    
    const newVotedCount = Object.keys(votes).length;
    if (!hasCompletedFirstPoll && newVotedCount >= statements.length) {
      setShowPostPollPrompt(true);
      setHasCompletedFirstPoll(true);
    }
  };

  const allDemographicsComplete = Object.values(demographics).every(v => v !== null);

  if (currentView === 'home') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8 pt-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Sparkles size={32} className="text-purple-400 sm:w-10 sm:h-10" />
              <h1 className="text-2xl sm:text-4xl font-bold text-white">Opinion Polls</h1>
            </div>
            <button className="bg-white hover:bg-gray-100 text-purple-900 font-semibold px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg transition-colors text-sm sm:text-base whitespace-nowrap">
              Sign Up
            </button>
          </div>
          
          <p className="text-purple-200 text-base sm:text-lg text-center mb-8 sm:mb-12">Choose a topic and share your perspective</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {polls.map(poll => (
              <div
                key={poll.id}
                className={`bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-1 cursor-pointer ${
                  poll.isClosed ? 'opacity-75' : ''
                }`}
                onClick={() => handleSelectPoll(poll.id)}
              >
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-5 sm:p-6 text-white relative">
                  {poll.isClosed && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                      CLOSED
                    </div>
                  )}
                  <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{poll.emoji}</div>
                  <h3 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{poll.title}</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">{poll.description}</p>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">
                    <div className="flex items-center gap-1">
                      <Users size={14} className="sm:w-4 sm:h-4" />
                      <span>{poll.participants} {poll.isClosed ? 'voted' : 'participants'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare size={14} className="sm:w-4 sm:h-4" />
                      <span>{poll.statementCount} statements</span>
                    </div>
                  </div>
                  <button className={`w-full font-semibold py-2.5 sm:py-3 rounded-lg transition-colors text-sm sm:text-base ${
                    poll.isClosed 
                      ? 'bg-gray-600 hover:bg-gray-700 text-white'
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}>
                    {poll.isClosed ? 'View Results' : 'Vote Now'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!dismissedHomeBanner && (
            <div className="mt-8 sm:mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="text-3xl sm:text-4xl flex-shrink-0">💡</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">Never miss a poll</h3>
                  <p className="text-purple-100 text-sm sm:text-base mb-3 sm:mb-4">
                    Sign up to get notified about new polls and save your voting insights
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button className="bg-white text-purple-600 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-purple-50 transition-colors text-sm sm:text-base">
                      Sign Up Free
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setDismissedHomeBanner(true);
                      }}
                      className="bg-white/20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-white/30 transition-colors text-sm sm:text-base"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const consensusStatements = [
    { text: statements[2]?.text || "Sample consensus", agreement: 89 },
    { text: statements[1]?.text || "Sample consensus", agreement: 86 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        {showDemographicsForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-slideUp max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <div className="text-5xl sm:text-6xl mb-4">🎯</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  Help us understand our community
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Answer 4 quick questions to unlock your personalized voting profile
                </p>
              </div>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={demographics.gender || ''}
                    onChange={(e) => setDemographics({...demographics, gender: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Age Group
                  </label>
                  <select
                    value={demographics.ageGroup || ''}
                    onChange={(e) => setDemographics({...demographics, ageGroup: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="under-18">Under 18</option>
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55-64">55-64</option>
                    <option value="65+">65+</option>
                    <option value="prefer-not-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ethnicity
                  </label>
                  <select
                    value={demographics.ethnicity || ''}
                    onChange={(e) => setDemographics({...demographics, ethnicity: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="white">White/Caucasian</option>
                    <option value="black">Black/African</option>
                    <option value="hispanic">Hispanic/Latino</option>
                    <option value="asian">Asian</option>
                    <option value="middle-eastern">Middle Eastern</option>
                    <option value="mixed">Mixed/Multiple</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Political Affiliation
                  </label>
                  <select
                    value={demographics.politicalParty || ''}
                    onChange={(e) => setDemographics({...demographics, politicalParty: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select...</option>
                    <option value="very-liberal">Very Liberal</option>
                    <option value="liberal">Liberal</option>
                    <option value="moderate">Moderate</option>
                    <option value="conservative">Conservative</option>
                    <option value="very-conservative">Very Conservative</option>
                    <option value="independent">Independent</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <button
                  onClick={handleDemographicsSubmit}
                  disabled={!allDemographicsComplete}
                  className={`w-full font-semibold py-3 sm:py-3.5 rounded-lg transition-colors text-sm sm:text-base ${
                    allDemographicsComplete
                      ? 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {allDemographicsComplete ? 'See My Results' : 'Complete all fields'}
                </button>
              </div>

              <div className="text-center text-xs text-gray-500 space-x-3">
                <button 
                  onClick={() => setShowWhyWeAsk(true)}
                  className="hover:text-gray-700 underline"
                >
                  Why we ask
                </button>
                <span>•</span>
                <button className="hover:text-gray-700 underline">
                  Privacy Policy
                </button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Your votes remain anonymous. We only use demographics to show group trends.
              </p>
            </div>
          </div>
        )}

        {showWhyWeAsk && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Why we ask for demographics</h3>
              <div className="space-y-3 text-gray-700 text-sm">
                <p>
                  <strong>Understanding diverse perspectives:</strong> These questions help us understand how different groups view important topics.
                </p>
                <p>
                  <strong>Better insights:</strong> We can show you how your views compare to others in your demographic group.
                </p>
                <p>
                  <strong>Improving our analysis:</strong> Demographic data helps us identify consensus and differences across communities.
                </p>
                <p>
                  <strong>Your privacy:</strong> All responses are anonymous and used only for aggregate analysis. We never link your demographics to your individual votes.
                </p>
              </div>
              <button
                onClick={() => setShowWhyWeAsk(false)}
                className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        )}

        {showPostPollPrompt && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-slideUp">
              <div className="text-center mb-6">
                <div className="text-5xl sm:text-6xl mb-4">🎉</div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                  You completed your first poll!
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  Create a free account to unlock more features
                </p>
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">💾</span>
                  </div>
                  <span className="text-sm sm:text-base">Save your voting profiles across topics</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🔔</span>
                  </div>
                  <span className="text-sm sm:text-base">Get notified about new polls</span>
                </div>
                <div className="flex items-center gap-3 text-gray-700">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📊</span>
                  </div>
                  <span className="text-sm sm:text-base">Track your insights and voting patterns</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 sm:py-3.5 rounded-lg transition-colors text-sm sm:text-base">
                  Create Free Account
                </button>
                <button 
                  onClick={() => setShowPostPollPrompt(false)}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 sm:py-3.5 rounded-lg transition-colors text-sm sm:text-base"
                >
                  Continue Without Account
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mb-4 sm:mb-6 pt-4">
          <button
            onClick={handleBackToHome}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors mb-4 text-sm sm:text-base"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            Back to all polls
          </button>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">{currentPoll?.emoji}</div>
            <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{currentPoll?.title}</h1>
              {currentPoll?.isClosed && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">CLOSED</span>
              )}
            </div>
            <p className="text-purple-200 text-sm sm:text-base">{currentPoll?.description}</p>
          </div>
        </div>

        {currentPoll?.isClosed && (
          <div className="mb-4 sm:mb-6 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-3 sm:p-4">
            <p className="text-yellow-100 text-center text-sm sm:text-base">
              <strong>This poll closed on {currentPoll.closedDate}.</strong> You're viewing final results.
            </p>
          </div>
        )}

        {!currentPoll?.isClosed && (
          <div className="flex gap-2 mb-4 sm:mb-6 bg-white/10 p-1 rounded-lg backdrop-blur">
            <button
              onClick={() => setActiveView('vote')}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-md transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                activeView === 'vote' ? 'bg-white text-purple-900 font-semibold' : 'text-white'
              }`}
            >
              <MessageSquare size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden xs:inline">Vote</span>
            </button>
            <button
              onClick={() => canSeeResults && setActiveView('results')}
              disabled={!canSeeResults}
              className={`flex-1 py-2 px-3 sm:px-4 rounded-md transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base ${
                activeView === 'results' 
                  ? 'bg-white text-purple-900 font-semibold' 
                  : !canSeeResults
                    ? 'text-white/40 cursor-not-allowed'
                    : 'text-white'
              }`}
            >
              <TrendingUp size={16} className="sm:w-[18px] sm:h-[18px]" />
              <span className="hidden xs:inline">Results</span>
              {!canSeeResults && <span className="text-xs sm:text-sm">({votedCount}/{MIN_VOTES_REQUIRED})</span>}
            </button>
          </div>
        )}

        {activeView === 'vote' && !currentPoll?.isClosed && (
          <div className="space-y-4">
            <div className="flex gap-1">
              {currentBatchStatements.map((stmt, index) => {
                const absoluteIndex = batchStart + index;
                return (
                  <div key={stmt.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        absoluteIndex < currentStatementIndex 
                          ? 'w-full bg-white' 
                          : absoluteIndex === currentStatementIndex 
                            ? 'bg-white animate-progress' 
                            : 'w-0 bg-white/50'
                      }`}
                      style={
                        absoluteIndex === currentStatementIndex && revealedStats[currentStatement?.id]
                          ? { width: '100%', transition: 'width 0.8s linear' }
                          : {}
                      }
                    ></div>
                  </div>
                );
              })}
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl p-4 sm:p-5 shadow-lg border-2 border-white/20">
              <p className="text-white text-base sm:text-lg font-bold text-center">
                {currentPoll?.question}
              </p>
            </div>

            {!showNewStatement && currentStatement ? (
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-4 sm:p-6 bg-gray-50 border-b-4 border-purple-200">
                  <p className="text-lg sm:text-xl font-medium text-gray-800 text-center leading-relaxed">
                    "{currentStatement.text}"
                  </p>
                </div>

                <div className="flex h-64 sm:h-80 relative">
                  <button
                    onClick={() => handleVote('disagree')}
                    onMouseEnter={() => setHoverSide('disagree')}
                    onMouseLeave={() => setHoverSide(null)}
                    disabled={revealedStats[currentStatement.id]}
                    className={`flex-1 flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                      revealedStats[currentStatement.id] 
                        ? 'bg-red-500 cursor-default' 
                        : hoverSide === 'disagree' 
                          ? 'flex-[1.2] bg-red-500' 
                          : 'bg-red-400'
                    }`}
                    style={revealedStats[currentStatement.id] ? {
                      animation: 'pulse 0.5s ease-in-out'
                    } : {}}
                  >
                    <div className={`transition-all duration-300 ${
                      revealedStats[currentStatement.id] 
                        ? 'scale-110' 
                        : hoverSide === 'disagree' && !revealedStats[currentStatement.id] 
                          ? 'scale-125' 
                          : 'scale-100'
                    }`}>
                      <ThumbsDown size={48} className="text-white mb-3 sm:w-16 sm:h-16 sm:mb-4" />
                      <p className="text-white font-bold text-xl sm:text-2xl">Disagree</p>
                      {revealedStats[currentStatement.id] && (
                        <div className="mt-3 sm:mt-4 animate-fadeIn">
                          <p className="text-white/80 text-xs sm:text-sm mb-1">Others voted:</p>
                          <p className="text-white font-black text-4xl sm:text-5xl">
                            {Math.round((currentStatement.disagree / (currentStatement.agree + currentStatement.disagree + currentStatement.pass)) * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </button>

                  <div className="w-1 bg-white relative z-10"></div>

                  <button
                    onClick={() => handleVote('agree')}
                    onMouseEnter={() => setHoverSide('agree')}
                    onMouseLeave={() => setHoverSide(null)}
                    disabled={revealedStats[currentStatement.id]}
                    className={`flex-1 flex flex-col items-center justify-center transition-all relative overflow-hidden ${
                      revealedStats[currentStatement.id] 
                        ? 'bg-green-500 cursor-default' 
                        : hoverSide === 'agree' 
                          ? 'flex-[1.2] bg-green-500' 
                          : 'bg-green-400'
                    }`}
                    style={revealedStats[currentStatement.id] ? {
                      animation: 'pulse 0.5s ease-in-out'
                    } : {}}
                  >
                    <div className={`transition-all duration-300 ${
                      revealedStats[currentStatement.id] 
                        ? 'scale-110' 
                        : hoverSide === 'agree' && !revealedStats[currentStatement.id] 
                          ? 'scale-125' 
                          : 'scale-100'
                    }`}>
                      <ThumbsUp size={48} className="text-white mb-3 sm:w-16 sm:h-16 sm:mb-4" />
                      <p className="text-white font-bold text-xl sm:text-2xl">Agree</p>
                      {revealedStats[currentStatement.id] && (
                        <div className="mt-3 sm:mt-4 animate-fadeIn">
                          <p className="text-white/80 text-xs sm:text-sm mb-1">Others voted:</p>
                          <p className="text-white font-black text-4xl sm:text-5xl">
                            {Math.round((currentStatement.agree / (currentStatement.agree + currentStatement.disagree + currentStatement.pass)) * 100)}%
                          </p>
                        </div>
                      )}
                    </div>
                  </button>
                </div>
                
                <style jsx>{`
                  @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                  }
                  @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                  }
                  .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out;
                  }
                  .animate-slideUp {
                    animation: slideUp 0.3s ease-out;
                  }
                `}</style>

                <div className="p-3 sm:p-4 flex gap-2 sm:gap-3 border-t border-gray-200">
                  <button
                    onClick={() => handleVote('pass')}
                    className="flex-1 py-2.5 sm:py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                  >
                    <HelpCircle size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">Pass</span>
                  </button>
                  <button
                    onClick={() => setShowNewStatement(true)}
                    className="flex-1 py-2.5 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-sm sm:text-base"
                  >
                    <Plus size={18} className="sm:w-5 sm:h-5" />
                    <span className="hidden xs:inline">Add Statement</span>
                  </button>
                </div>
              </div>
            ) : showNewStatement ? (
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Add Your Statement</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Share a statement for others to vote on. Keep it clear and focused on one idea.
                </p>
                <textarea
                  value={newStatement}
                  onChange={(e) => setNewStatement(e.target.value)}
                  placeholder="Example: We should have more flexible meeting schedules"
                  className="w-full p-4 border-2 border-gray-300 rounded-xl focus:border-purple-500 focus:outline-none resize-none mb-4"
                  rows="4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowNewStatement(false);
                      setNewStatement('');
                    }}
                    className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitStatement}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-colors"
                  >
                    Submit Statement
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {activeView === 'results' && (
          <div className="space-y-4">
            {currentPoll?.isClosed && votedCount > 0 && votedCount < statements.length && (
              <div className="bg-blue-500/20 border-2 border-blue-500/50 rounded-xl p-4 sm:p-6">
                <p className="text-blue-100 text-center text-sm sm:text-base">
                  You voted on <strong>{votedCount} of {statements.length} statements</strong> before this poll closed.
                </p>
              </div>
            )}

            {personalInsight && votedCount > 0 && (
              <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-8 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-5xl">{personalInsight.emoji}</span>
                    <div>
                      <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wide">Your Voting Profile</h3>
                      <h2 className="text-3xl font-bold">{personalInsight.profile}</h2>
                    </div>
                  </div>
                  
                  <p className="text-lg text-purple-50 leading-relaxed mb-6">
                    {personalInsight.description}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleShareProfile}
                      className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
                    >
                      <Share2 size={18} className="sm:w-5 sm:h-5" />
                      Share My Profile
                    </button>
                    <button className="text-white/90 hover:text-white text-sm underline">
                      💾 Sign up to save this profile
                    </button>
                  </div>
                </div>
              </div>
            )}

            {hasMoreBatches && (
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg text-white">
                <div className="flex items-start gap-4">
                  <MessageSquare size={32} className="flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">There's More! 🎯</h3>
                    <p className="text-purple-100 mb-4">
                      There are more statements to vote on. Vote on the next batch of 10 to continue contributing to the conversation.
                    </p>
                    <button
                      onClick={handleNextBatch}
                      className="bg-white text-purple-600 px-6 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                    >
                      Vote on Next Batch
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!hasMoreBatches && votedCount === statements.length && (
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg text-white">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">🎉</div>
                    <div>
                      <h3 className="text-xl font-bold">You've voted on all statements!</h3>
                      <p className="text-green-100">Thank you for your complete participation.</p>
                    </div>
                  </div>
                  {personalInsight && (
                    <button
                      onClick={handleShareProfile}
                      className="bg-white text-green-600 px-5 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2 flex-shrink-0"
                    >
                      <Share2 size={18} />
                      Share
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg">
                <Users size={20} className="text-purple-600 mb-1 sm:mb-2 sm:w-6 sm:h-6" />
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{participantCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Participants</p>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg">
                <MessageSquare size={20} className="text-purple-600 mb-1 sm:mb-2 sm:w-6 sm:h-6" />
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{statements.length}</p>
                <p className="text-xs sm:text-sm text-gray-600">Statements</p>
              </div>
              <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg">
                <TrendingUp size={20} className="text-purple-600 mb-1 sm:mb-2 sm:w-6 sm:h-6" />
                <p className="text-xl sm:text-2xl font-bold text-gray-800">{totalVotes}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Votes</p>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                <TrendingUp className="text-green-600" size={20} />
                Strong Consensus
              </h3>
              <div className="space-y-3">
                {consensusStatements.map((stmt, i) => (
                  <div key={i} className="bg-green-50 border-2 border-green-500 rounded-lg p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3 sm:gap-4">
                      <p className="text-gray-800 flex-1 text-sm sm:text-base">"{stmt.text}"</p>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xl sm:text-2xl font-bold text-green-600">{stmt.agreement}%</p>
                        <p className="text-xs text-green-700">agreement</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">All Statements</h3>
              <div className="space-y-3">
                {statements.map((stmt) => {
                  const total = stmt.agree + stmt.disagree + stmt.pass;
                  const agreePercent = (stmt.agree / total) * 100;
                  const disagreePercent = (stmt.disagree / total) * 100;
                  const passPercent = (stmt.pass / total) * 100;
                  
                  return (
                    <div key={stmt.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                      <p className="text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base">"{stmt.text}"</p>
                      <div className="flex gap-2 h-2 sm:h-3 rounded-full overflow-hidden">
                        <div style={{ width: `${agreePercent}%` }} className="bg-green-500"></div>
                        <div style={{ width: `${disagreePercent}%` }} className="bg-red-500"></div>
                        <div style={{ width: `${passPercent}%` }} className="bg-gray-400"></div>
                      </div>
                      <div className="flex justify-between mt-2 text-xs sm:text-sm">
                        <span className="text-green-700 font-medium">{stmt.agree} agree</span>
                        <span className="text-red-700 font-medium">{stmt.disagree} disagree</span>
                        <span className="text-gray-600 font-medium">{stmt.pass} pass</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PolisMultiPoll;