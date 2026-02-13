import { usePredictions } from '../hooks/usePredictions';
import { useCycles } from '../hooks/useCycles';
import { TrendingUp, Calendar, Activity, Target } from 'lucide-react';

export function InsightsPage() {
  const { prediction, currentCycleDay, daysUntilPeriod, statistics } = usePredictions();
  const { cycles } = useCycles();

  const hasData = cycles.length > 0;

  return (
    <div className="p-6 pb-20 sm:pb-6 space-y-4">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Insights</h1>

      {!hasData ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center transition-colors duration-200">
          <Calendar className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-600 dark:text-gray-400">
            Start logging your period to see insights and predictions.
          </p>
        </div>
      ) : (
        <>
          {/* Current Status */}
          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl p-6 transition-colors duration-200">
            <h2 className="text-sm font-medium text-rose-800 dark:text-rose-300 mb-4">Current Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-colors duration-200">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {currentCycleDay ?? '-'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Cycle Day</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm transition-colors duration-200">
                <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                  {daysUntilPeriod !== null ? daysUntilPeriod : '-'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Days Until Period</p>
              </div>
            </div>
          </div>

          {/* Prediction Confidence */}
          {prediction && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Prediction</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                  <span
                    className={`text-sm font-medium capitalize px-2 py-0.5 rounded ${
                      prediction.confidence === 'high'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : prediction.confidence === 'medium'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {prediction.confidence}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Based on</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {prediction.basedOnCycles} cycles
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Predicted cycle length</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {prediction.cycleLength} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Predicted period length</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {prediction.periodLength} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cycle Statistics */}
          {statistics && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-rose-500 dark:text-rose-400" />
                <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Cycle Statistics</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  label="Average Cycle"
                  value={`${statistics.averageCycleLength} days`}
                />
                <StatCard
                  label="Average Period"
                  value={`${statistics.averagePeriodLength} days`}
                />
                <StatCard
                  label="Shortest Cycle"
                  value={`${statistics.shortestCycle} days`}
                />
                <StatCard
                  label="Longest Cycle"
                  value={`${statistics.longestCycle} days`}
                />
                <StatCard
                  label="Variation"
                  value={`\u00B1${statistics.cycleLengthVariation.toFixed(1)} days`}
                />
                <StatCard
                  label="Cycles Tracked"
                  value={statistics.totalCyclesTracked.toString()}
                />
              </div>
            </div>
          )}

          {/* Cycle History */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-rose-500 dark:text-rose-400" />
              <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">Recent Cycles</h2>
            </div>
            <div className="space-y-3">
              {cycles
                .slice(-6)
                .reverse()
                .map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        Cycle {cycle.cycleNumber}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Started {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {cycle.cycleLength ? (
                        <p className="text-sm text-gray-900 dark:text-gray-100">
                          {cycle.cycleLength} days
                        </p>
                      ) : (
                        <p className="text-sm text-rose-500 dark:text-rose-400">Current</p>
                      )}
                      {cycle.periodLength && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {cycle.periodLength} day period
                        </p>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 transition-colors duration-200">
      <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
