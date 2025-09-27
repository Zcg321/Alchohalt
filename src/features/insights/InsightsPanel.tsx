import React, { useMemo } from 'react';
import { useLanguage } from '../../i18n';
import type { Drink } from '../drinks/DrinkForm';
import type { Goals } from '../goals/GoalSettings';
import { stdDrinks } from '../../lib/calc';
import { Badge } from '../../components/ui/Badge';

interface Props {
  drinks: Drink[];
  goals: Goals;
}

interface TrendData {
  direction: 'improving' | 'stable' | 'worsening';
  percentage: number;
  message: string;
  type: 'success' | 'warning' | 'danger';
}

interface Insight {
  title: string;
  description: string;
  type: 'tip' | 'warning' | 'achievement' | 'pattern';
  icon: React.ReactNode;
  priority: number;
}

export default function InsightsPanel({ drinks, goals }: Props) {
  const { t } = useLanguage();

  const insights = useMemo(() => {
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    // Get recent drinks
    const recentDrinks = drinks.filter(d => d.ts > thirtyDaysAgo);
    const weekDrinks = drinks.filter(d => d.ts > sevenDaysAgo);
    
    // Analyze patterns
    const insights: Insight[] = [];
    
    // Streak analysis
    const currentStreak = getCurrentStreak(drinks);
    if (currentStreak >= 7) {
      insights.push({
        title: `${currentStreak} Day Alcohol-Free Streak!`,
        description: 'Great job maintaining your alcohol-free streak. Keep it up!',
        type: 'achievement',
        icon: <TrophyIcon />,
        priority: 1
      });
    }
    
    // Weekend pattern analysis
    const weekendPattern = analyzeWeekendPattern(recentDrinks);
    if (weekendPattern.hasPattern) {
      insights.push({
        title: 'Weekend Drinking Pattern Detected',
        description: `You tend to drink ${weekendPattern.percentage}% more on weekends. Consider planning alcohol-free weekend activities.`,
        type: 'pattern',
        icon: <CalendarIcon />,
        priority: 2
      });
    }
    
    // Craving trend analysis
    const cravingTrend = analyzeCravingTrend(recentDrinks);
    if (cravingTrend.direction === 'improving') {
      insights.push({
        title: 'Cravings Are Decreasing',
        description: `Your average craving intensity has decreased by ${cravingTrend.percentage}% over the past month. This suggests improved control.`,
        type: 'achievement',
        icon: <TrendDownIcon />,
        priority: 1
      });
    } else if (cravingTrend.direction === 'worsening') {
      insights.push({
        title: 'Cravings Are Increasing',
        description: `Your cravings have increased by ${cravingTrend.percentage}% recently. Consider stress management techniques.`,
        type: 'warning',
        icon: <TrendUpIcon />,
        priority: 3
      });
    }
    
    // HALT pattern analysis
    const haltInsight = analyzeHALTPatterns(recentDrinks);
    if (haltInsight) {
      insights.push(haltInsight);
    }
    
    // Goal progress
    const goalProgress = analyzeGoalProgress(weekDrinks, goals);
    if (goalProgress) {
      insights.push(goalProgress);
    }
    
    // Usage of alternatives
    const altUsage = analyzeAlternativeUsage(recentDrinks);
    if (altUsage) {
      insights.push(altUsage);
    }
    
    return insights.sort((a, b) => a.priority - b.priority);
  }, [drinks, goals]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold flex items-center">
          <span className="w-2 h-2 bg-purple-500 rounded-full mr-3"></span>
          Personal Insights
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
          AI-powered analysis of your drinking patterns
        </p>
      </div>
      
      <div className="card-content space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <ChartIcon />
            </div>
            <p className="text-neutral-600 dark:text-neutral-400">
              Keep logging your drinks to unlock personalized insights!
            </p>
          </div>
        ) : (
          insights.map((insight, index) => (
            <InsightCard key={index} insight={insight} />
          ))
        )}
      </div>
    </div>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const typeStyles = {
    tip: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
    achievement: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300',
    pattern: 'bg-purple-50 border-purple-200 text-purple-800 dark:bg-purple-900/20 dark:border-purple-800 dark:text-purple-300'
  };
  
  const badges = {
    tip: <Badge variant="secondary" size="sm">Tip</Badge>,
    warning: <Badge variant="warning" size="sm">Warning</Badge>,
    achievement: <Badge variant="success" size="sm">Achievement</Badge>,
    pattern: <Badge variant="primary" size="sm">Pattern</Badge>
  };

  return (
    <div className={`p-4 rounded-lg border ${typeStyles[insight.type]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {insight.icon}
          </div>
          <h3 className="font-semibold">{insight.title}</h3>
        </div>
        {badges[insight.type]}
      </div>
      <p className="text-sm opacity-90 ml-9">{insight.description}</p>
    </div>
  );
}

// Helper functions for analysis
function getCurrentStreak(drinks: Drink[]): number {
  const byDay: Record<string, number> = {};
  drinks.forEach(d => {
    const day = new Date(d.ts).toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + stdDrinks(d.volumeMl, d.abvPct);
  });
  
  let streak = 0;
  const current = new Date();
  while (true) {
    const key = current.toISOString().slice(0, 10);
    if (byDay[key] > 0) break;
    streak++;
    current.setDate(current.getDate() - 1);
    if (streak > 365) break; // Safety limit
  }
  
  return streak;
}

function analyzeWeekendPattern(drinks: Drink[]): { hasPattern: boolean; percentage: number } {
  const weekdayTotal = drinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day >= 1 && day <= 5; // Mon-Fri
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  const weekendTotal = drinks.filter(d => {
    const day = new Date(d.ts).getDay();
    return day === 0 || day === 6; // Sat-Sun
  }).reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  
  if (weekdayTotal === 0 && weekendTotal === 0) return { hasPattern: false, percentage: 0 };
  
  const avgWeekday = weekdayTotal / 5;
  const avgWeekend = weekendTotal / 2;
  
  if (avgWeekend > avgWeekday * 1.5) {
    const percentage = Math.round(((avgWeekend - avgWeekday) / avgWeekday) * 100);
    return { hasPattern: true, percentage };
  }
  
  return { hasPattern: false, percentage: 0 };
}

function analyzeCravingTrend(drinks: Drink[]): TrendData {
  const now = Date.now();
  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  
  const recent = drinks.filter(d => d.ts > twoWeeksAgo);
  const older = drinks.filter(d => d.ts <= twoWeeksAgo && d.ts > (now - 28 * 24 * 60 * 60 * 1000));
  
  if (recent.length === 0 || older.length === 0) {
    return { direction: 'stable', percentage: 0, message: '', type: 'success' };
  }
  
  const recentAvg = recent.reduce((sum, d) => sum + d.craving, 0) / recent.length;
  const olderAvg = older.reduce((sum, d) => sum + d.craving, 0) / older.length;
  
  const change = ((recentAvg - olderAvg) / olderAvg) * 100;
  
  if (change < -10) {
    return { direction: 'improving', percentage: Math.abs(change), message: '', type: 'success' };
  } else if (change > 10) {
    return { direction: 'worsening', percentage: change, message: '', type: 'warning' };
  }
  
  return { direction: 'stable', percentage: 0, message: '', type: 'success' };
}

function analyzeHALTPatterns(drinks: Drink[]): Insight | null {
  const haltCounts = { hungry: 0, angry: 0, lonely: 0, tired: 0 };
  drinks.forEach(d => {
    d.halt.forEach(h => haltCounts[h]++);
  });
  
  const total = Object.values(haltCounts).reduce((sum, count) => sum + count, 0);
  if (total < 5) return null; // Not enough data
  
  const topHalt = Object.entries(haltCounts).sort(([,a], [,b]) => b - a)[0];
  const percentage = Math.round((topHalt[1] / total) * 100);
  
  if (percentage > 40) {
    const haltMessages = {
      hungry: 'Consider keeping healthy snacks available and maintaining regular meal times.',
      angry: 'Try anger management techniques like deep breathing or physical exercise.',
      lonely: 'Reach out to friends or family, or consider joining support groups.',
      tired: 'Focus on improving sleep hygiene and getting adequate rest.'
    };
    
    return {
      title: `${topHalt[0].charAt(0).toUpperCase() + topHalt[0].slice(1)} is Your Main Trigger`,
      description: `${percentage}% of your drinking episodes involve feeling ${topHalt[0]}. ${haltMessages[topHalt[0] as keyof typeof haltMessages]}`,
      type: 'pattern',
      icon: <AlertIcon />,
      priority: 2
    };
  }
  
  return null;
}

function analyzeGoalProgress(weekDrinks: Drink[], goals: Goals): Insight | null {
  const weeklyStd = weekDrinks.reduce((sum, d) => sum + stdDrinks(d.volumeMl, d.abvPct), 0);
  const progress = (weeklyStd / goals.weeklyGoal) * 100;
  
  if (progress <= 70) {
    return {
      title: 'Excellent Weekly Progress!',
      description: `You're at ${Math.round(progress)}% of your weekly goal. You're doing great at staying within your limits.`,
      type: 'achievement',
      icon: <CheckIcon />,
      priority: 1
    };
  } else if (progress > 100) {
    return {
      title: 'Weekly Goal Exceeded',
      description: `You've exceeded your weekly goal by ${Math.round(progress - 100)}%. Consider adjusting your approach or goals.`,
      type: 'warning',
      icon: <ExclamationIcon />,
      priority: 3
    };
  }
  
  return null;
}

function analyzeAlternativeUsage(drinks: Drink[]): Insight | null {
  const withAlt = drinks.filter(d => d.alt && d.alt.trim() !== '').length;
  const total = drinks.length;
  
  if (total < 5) return null;
  
  const percentage = (withAlt / total) * 100;
  
  if (percentage > 60) {
    return {
      title: 'Great Use of Alternatives!',
      description: `You've used alternative activities in ${Math.round(percentage)}% of your entries. This shows good self-awareness and planning.`,
      type: 'achievement',
      icon: <LightbulbIcon />,
      priority: 1
    };
  } else if (percentage < 20) {
    return {
      title: 'Try Using More Alternatives',
      description: 'Consider planning alternative activities when you feel like drinking. This can help break automatic patterns.',
      type: 'tip',
      icon: <LightbulbIcon />,
      priority: 3
    };
  }
  
  return null;
}

// Icon components
function TrophyIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 2l3 6 6 .75-4.5 4.25 1 6.25L10 16l-5.5 3.25 1-6.25L1 8.75 7 8l3-6z" clipRule="evenodd" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function TrendDownIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
    </svg>
  );
}

function TrendUpIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}

function ExclamationIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
    </svg>
  );
}

function LightbulbIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );
}