import { useEffect, useState } from 'react';
import { Sparkles, BookOpen, Heart } from 'lucide-react';
import { getRecommendations, type RecommendationsResponse, type RecommendationItem } from '../../api/recommendations';
import { Button } from '../ui/button';

interface RecommendationsProps {
  onNavigate: (view: any) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  uplifting: 'from-yellow-100 to-orange-100 text-yellow-700',
  maintenance: 'from-blue-100 to-cyan-100 text-blue-700',
  gratitude: 'from-green-100 to-emerald-100 text-green-700',
  calming: 'from-purple-100 to-pink-100 text-purple-700',
};

export default function Recommendations({ onNavigate }: RecommendationsProps) {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getRecommendations();
        setData(res);
      } catch (e: any) {
        setError(e?.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600">Loading tips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 shadow-md text-center">
          <p className="text-red-600">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline" className="mt-4 rounded-2xl">Retry</Button>
        </div>
      </div>
    );
  }

  const items: RecommendationItem[] = data?.recommendations || [];
  const avg = data?.average_mood;
  const category = data?.recommended_category;
  const badgeClass = CATEGORY_COLORS[category || ''] || 'from-gray-100 to-gray-50 text-gray-700';

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-teal-400 to-purple-400 rounded-2xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1>Daily Tips</h1>
          <p className="text-gray-600">Personalized recommendations for your well‑being</p>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-3xl p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heart className="w-5 h-5 text-teal-600" />
          <p className="text-gray-700">
            {avg != null ? <>Average Mood (7 days): <span className="font-medium">{avg.toFixed(1)} / 5.0</span></> : 'No recent mood data'}
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm bg-gradient-to-r ${badgeClass}`}>
          {category ? `Focus: ${category}` : 'General'}
        </div>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 shadow-md text-center">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <h3 className="mb-2">No tips available</h3>
          <p className="text-gray-600">Log your mood to receive personalized tips.</p>
          <Button onClick={() => onNavigate('mood-tracker')} className="mt-4 rounded-2xl">
            Track mood
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((rec) => (
            <div key={rec.id} className="bg-white rounded-3xl p-6 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <h3>{rec.title}</h3>
                <span className={`px-3 py-1 rounded-full text-xs bg-gradient-to-r ${CATEGORY_COLORS[rec.category] || 'from-gray-100 to-gray-50 text-gray-700'}`}>
                  {rec.category}
                </span>
              </div>
              <p className="text-gray-700">{rec.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


