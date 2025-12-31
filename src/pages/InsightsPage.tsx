import { usePredictions } from '../hooks/usePredictions';
import { useCycles } from '../hooks/useCycles';
import { TrendingUp, Calendar, Activity, Target } from 'lucide-react';

export function InsightsPage() {
  const { prediction, currentCycleDay, daysUntilPeriod, statistics } = usePredictions();
  const { cycles } = useCycles();

  const hasData = cycles.length > 0;

  return (
    <div className="p-4 pb-20 sm:pb-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Insights</h1>

      {!hasData ? (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">
            Start logging your period to see insights and predictions.
          </p>
        </div>
      ) : (
        <>
          {/* Current Status */}
          <div className="bg-rose-50 rounded-xl p-4">
            <h2 className="text-sm font-medium text-rose-800 mb-3">Current Status</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-3">
                <p className="text-2xl font-bold text-rose-600">
                  {currentCycleDay ?? '-'}
                </p>
                <p className="text-xs text-gray-500">Cycle Day</p>
              </div>
              <div className="bg-white rounded-lg p-3">
                <p className="text-2xl font-bold text-rose-600">
                  {daysUntilPeriod !== null ? daysUntilPeriod : '-'}
                </p>
                <p className="text-xs text-gray-500">Days Until Period</p>
              </div>
            </div>
          </div>

          {/* Prediction Confidence */}
          {prediction && (
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-rose-500" />
                <h2 className="text-sm font-medium text-gray-900">Prediction</h2>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Confidence</span>
                  <span
                    className={`text-sm font-medium capitalize px-2 py-0.5 rounded ${
                      prediction.confidence === 'high'
                        ? 'bg-green-100 text-green-700'
                        : prediction.confidence === 'medium'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {prediction.confidence}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Based on</span>
                  <span className="text-sm text-gray-900">
                    {prediction.basedOnCycles} cycles
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Predicted cycle length</span>
                  <span className="text-sm text-gray-900">
                    {prediction.cycleLength} days
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Predicted period length</span>
                  <span className="text-sm text-gray-900">
                    {prediction.periodLength} days
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cycle Statistics */}
          {statistics && (
            <div className="bg-white rounded-xl p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-rose-500" />
                <h2 className="text-sm font-medium text-gray-900">Cycle Statistics</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
          <div className="bg-white rounded-xl p-4 border">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-5 h-5 text-rose-500" />
              <h2 className="text-sm font-medium text-gray-900">Recent Cycles</h2>
            </div>
            <div className="space-y-2">
              {cycles
                .slice(-6)
                .reverse()
                .map((cycle) => (
                  <div
                    key={cycle.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Cycle {cycle.cycleNumber}
                      </p>
                      <p className="text-xs text-gray-500">
                        Started {new Date(cycle.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      {cycle.cycleLength ? (
                        <p className="text-sm text-gray-900">
                          {cycle.cycleLength} days
                        </p>
                      ) : (
                        <p className="text-sm text-rose-500">Current</p>
                      )}
                      {cycle.periodLength && (
                        <p className="text-xs text-gray-500">
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
    <div className="bg-gray-50 rounded-lg p-3">
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
