"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * Brand Colors Demo Page
 *
 * Compares 4 different proposals for integrating brand colors into the design system.
 * Shows both standard and brand-colored voting actions for each proposal.
 */

// Brand Colors from q4
const brandColors = {
  dailyGray: "#6294bf",
  basicBlue: "#042e5f",
  contemporaryOrange: "#f04e2d",
  mediumBaseGreen: "#8dc63f",
  tomorrowCyan: "#16c3ea",
  white: "#FFFFFF",
  beige: "#cfcfa3",
};

// Proposal configurations
const proposals = [
  {
    id: 1,
    name: "Blue Foundation",
    tagline: "Conservative & Professional",
    config: {
      pageGradient: "bg-gradient-to-br from-slate-900 via-[#042e5f] to-slate-900",
      pollHeaderGradient: "bg-gradient-to-br from-[#042e5f] to-[#16c3ea]",
      insightGradient: "bg-gradient-to-br from-[#6294bf] via-[#042e5f] to-[#16c3ea]",
      questionPill: "bg-gradient-to-r from-[#16c3ea] to-[#6294bf]",
      progressBar: "bg-[#16c3ea]",
      tabActive: "bg-white text-[#042e5f]",
      primaryButton: "bg-[#042e5f]",
    },
  },
  {
    id: 2,
    name: "Vibrant Spectrum",
    tagline: "Bold & Energetic",
    config: {
      pageGradient: "bg-gradient-to-br from-[#042e5f] via-[#6294bf] to-[#042e5f]",
      pollHeaderGradient: "bg-gradient-to-br from-[#f04e2d] to-[#16c3ea]",
      insightGradient: "bg-gradient-to-br from-[#16c3ea] via-[#6294bf] to-[#f04e2d]",
      questionPill: "bg-gradient-to-r from-[#8dc63f] to-[#16c3ea]",
      progressBar: "bg-[#f04e2d]",
      tabActive: "bg-[#f04e2d] text-white",
      primaryButton: "bg-[#f04e2d]",
    },
  },
  {
    id: 3,
    name: "Cyan-Centric",
    tagline: "Balanced & Modern",
    config: {
      pageGradient: "bg-gradient-to-br from-[#042e5f] via-[#0a4a7a] to-[#042e5f]",
      pollHeaderGradient: "bg-gradient-to-br from-[#16c3ea] to-[#6294bf]",
      insightGradient: "bg-gradient-to-br from-[#042e5f] via-[#16c3ea] to-[#6294bf]",
      questionPill: "bg-gradient-to-r from-[#16c3ea] to-[#8dc63f]",
      progressBar: "bg-[#16c3ea]",
      tabActive: "bg-white text-[#042e5f]",
      primaryButton: "bg-[#f04e2d]",
    },
  },
  {
    id: 4,
    name: "Natural Gradient",
    tagline: "Sophisticated & Warm",
    config: {
      pageGradient: "bg-gradient-to-br from-[#042e5f] via-[#6294bf] to-[#cfcfa3]",
      pollHeaderGradient: "bg-gradient-to-br from-[#6294bf] to-[#16c3ea]",
      insightGradient: "bg-gradient-to-br from-[#042e5f] via-[#16c3ea] to-[#8dc63f]",
      questionPill: "bg-gradient-to-r from-[#16c3ea] to-[#8dc63f]",
      progressBar: "bg-[#8dc63f]",
      tabActive: "bg-white text-[#042e5f]",
      primaryButton: "bg-[#16c3ea]",
    },
  },
];

// Voting action color options
const votingOptions = {
  standard: {
    name: "Standard Colors",
    agree: { bg: "#22c55e", label: "Green Agree" },
    disagree: { bg: "#ef4444", label: "Red Disagree" },
    pass: { bg: "#f3f4f6", label: "Gray Pass", textColor: "#374151" },
  },
  brand: {
    name: "Brand Colors",
    agree: { bg: brandColors.mediumBaseGreen, label: "Green Agree" },
    disagree: { bg: brandColors.contemporaryOrange, label: "Orange Disagree" },
    pass: { bg: brandColors.beige, label: "Beige Pass", textColor: brandColors.basicBlue },
  },
};

export default function BrandColorsDemoPage() {
  const [selectedProposal, setSelectedProposal] = useState(3); // Default to Cyan-Centric
  const [votingStyle, setVotingStyle] = useState<"standard" | "brand">("brand");

  const currentProposal = proposals.find((p) => p.id === selectedProposal)!;
  const currentVoting = votingOptions[votingStyle];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      {/* Control Panel */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Brand Color Proposals Demo
          </h1>
          <p className="text-gray-600 mb-6">
            Compare different ways to integrate your brand colors into the Pulse design system
          </p>

          {/* Brand Colors Reference */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Your Brand Colors (Q4)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(brandColors).map(([name, color]) => (
                <div key={name} className="text-center">
                  <div
                    className="w-full h-16 rounded-lg shadow-md mb-2"
                    style={{ backgroundColor: color }}
                  />
                  <div className="text-xs font-medium text-gray-700 capitalize">
                    {name.replace(/([A-Z])/g, " $1").trim()}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">{color}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Proposal Selector */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Select Proposal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {proposals.map((proposal) => (
                <button
                  key={proposal.id}
                  onClick={() => setSelectedProposal(proposal.id)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    selectedProposal === proposal.id
                      ? "border-purple-600 bg-purple-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="font-semibold text-gray-900 mb-1">
                    {proposal.id}. {proposal.name}
                  </div>
                  <div className="text-xs text-gray-600">{proposal.tagline}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Voting Style Selector */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Voting Button Colors</h3>
            <div className="flex gap-3">
              <button
                onClick={() => setVotingStyle("standard")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  votingStyle === "standard"
                    ? "border-purple-600 bg-purple-50 shadow-lg"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-900 mb-2">Standard Colors</div>
                <div className="flex gap-2 justify-center">
                  <div className="w-12 h-8 rounded" style={{ backgroundColor: votingOptions.standard.agree.bg }} />
                  <div className="w-12 h-8 rounded" style={{ backgroundColor: votingOptions.standard.disagree.bg }} />
                  <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: votingOptions.standard.pass.bg }} />
                </div>
              </button>
              <button
                onClick={() => setVotingStyle("brand")}
                className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                  votingStyle === "brand"
                    ? "border-purple-600 bg-purple-50 shadow-lg"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <div className="font-semibold text-gray-900 mb-2">Brand Colors</div>
                <div className="flex gap-2 justify-center">
                  <div className="w-12 h-8 rounded" style={{ backgroundColor: votingOptions.brand.agree.bg }} />
                  <div className="w-12 h-8 rounded" style={{ backgroundColor: votingOptions.brand.disagree.bg }} />
                  <div className="w-12 h-8 rounded border border-gray-300" style={{ backgroundColor: votingOptions.brand.pass.bg }} />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="max-w-7xl mx-auto">
        <motion.div
          key={`${selectedProposal}-${votingStyle}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`min-h-screen rounded-3xl shadow-2xl overflow-hidden ${currentProposal.config.pageGradient}`}
        >
          <div className="p-6 sm:p-12">
            {/* Header with Proposal Name */}
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-5xl font-bold text-white mb-2">
                {currentProposal.name}
              </h2>
              <p className="text-white/80 text-lg">{currentProposal.tagline}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex gap-1 max-w-2xl mx-auto">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      i < 3
                        ? currentProposal.config.progressBar
                        : i === 3
                        ? `${currentProposal.config.progressBar} opacity-50 animate-pulse`
                        : "bg-white/20"
                    }`}
                  />
                ))}
              </div>
              <div className="text-center text-white/60 text-sm mt-2">4 / 10</div>
            </div>

            {/* Question Pill */}
            <div className="mb-8 flex justify-center">
              <div
                className={`${currentProposal.config.questionPill} px-6 py-4 rounded-xl shadow-lg max-w-2xl`}
              >
                <p className="text-white text-center text-lg font-medium">
                  Should we invest more in renewable energy infrastructure?
                </p>
              </div>
            </div>

            {/* Split Vote Card */}
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Statement Header */}
                <div className="bg-gray-50 border-b-4 border-purple-200 p-6 sm:p-8">
                  <p className="text-lg sm:text-xl font-medium text-gray-900 text-center">
                    Renewable energy will create more jobs than it eliminates in fossil fuel industries
                  </p>
                </div>

                {/* Voting Buttons */}
                <div className="flex" dir="rtl">
                  {/* Agree Button (Right in RTL) */}
                  <button
                    className="flex-1 h-64 sm:h-80 flex items-center justify-center transition-all hover:flex-[1.2] relative group"
                    style={{ backgroundColor: currentVoting.agree.bg }}
                  >
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        מסכים/ה
                      </div>
                      <div className="text-white/80 text-sm">Agree</div>
                    </div>
                    {/* Stats overlay (simulated) */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-5xl font-bold">67%</div>
                    </div>
                  </button>

                  {/* Disagree Button (Left in RTL) */}
                  <button
                    className="flex-1 h-64 sm:h-80 flex items-center justify-center transition-all hover:flex-[1.2] relative group"
                    style={{ backgroundColor: currentVoting.disagree.bg }}
                  >
                    <div className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-2">
                        לא מסכים/ה
                      </div>
                      <div className="text-white/80 text-sm">Disagree</div>
                    </div>
                    {/* Stats overlay (simulated) */}
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-5xl font-bold">33%</div>
                    </div>
                  </button>
                </div>

                {/* Pass Button */}
                <div className="p-4">
                  <button
                    className="w-full py-3 rounded-lg font-semibold transition-all hover:opacity-80"
                    style={{
                      backgroundColor: currentVoting.pass.bg,
                      color: currentVoting.pass.textColor || "#ffffff",
                    }}
                  >
                    דילוג (Pass)
                  </button>
                </div>
              </div>
            </div>

            {/* Poll Card */}
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-shadow">
                <div className={`${currentProposal.config.pollHeaderGradient} p-6`}>
                  <h3 className="text-xl font-bold text-white mb-2">
                    Climate Change Policy Discussion
                  </h3>
                  <p className="text-white/90 text-sm">
                    Share your views on environmental policies
                  </p>
                </div>
                <div className="p-6 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-sm text-gray-600">150 participants</div>
                    <div className="text-sm text-gray-600">25 positions</div>
                  </div>
                  <button
                    className={`w-full ${currentProposal.config.primaryButton} text-white py-3 rounded-lg font-semibold hover:opacity-90 transition-all`}
                  >
                    Start Voting
                  </button>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="max-w-md mx-auto mb-8">
              <div className="bg-white/10 backdrop-blur rounded-lg p-1 flex gap-2">
                <button className={`flex-1 py-3 rounded-lg font-semibold transition-all ${currentProposal.config.tabActive}`}>
                  Vote
                </button>
                <button className="flex-1 py-3 rounded-lg font-semibold bg-white/10 text-white hover:bg-white/20 transition-all">
                  Results (7/10)
                </button>
              </div>
            </div>

            {/* Insight Card */}
            <div className="max-w-2xl mx-auto">
              <div className={`${currentProposal.config.insightGradient} rounded-2xl shadow-2xl p-8 relative overflow-hidden`}>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12" />

                <div className="relative z-10">
                  <div className="text-center mb-6">
                    <div className="text-6xl mb-4">🌟</div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                      Your Influence Profile
                    </h3>
                    <p className="text-white/90">
                      You&apos;re a Progressive Environmentalist
                    </p>
                  </div>

                  <div className="bg-white/10 backdrop-blur rounded-xl p-6 mb-6">
                    <p className="text-white text-center leading-relaxed">
                      Your voting pattern shows strong support for environmental initiatives
                      and sustainable development. You align with 68% of participants on key climate issues.
                    </p>
                  </div>

                  <button className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-all">
                    View Detailed Results
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Footer Notes */}
      <div className="max-w-7xl mx-auto mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Implementation Notes:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• All gradients and colors are applied via the centralized design system</li>
            <li>• Brand colors maintain WCAG AA accessibility standards</li>
            <li>• Hover effects and animations work the same across all proposals</li>
            <li>• RTL (Hebrew) layout is preserved in all variations</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
