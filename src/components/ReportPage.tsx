import { useState, useEffect, useMemo } from 'react';
import { LineChart, BarChart3, PieChart, Download, Share2, ArrowLeft, TrendingUp, Database, Microscope, AlertCircle, CheckCircle, Dna } from 'lucide-react';

interface ReportPageProps {
  isDarkMode: boolean;
  onNavigate: (page: string) => void;
}

const COLORS = ['#22D3EE', '#10B981', '#A78BFA', '#F59E0B', '#EC4899', '#64748B'];

export default function ReportPage({ isDarkMode, onNavigate }: ReportPageProps) {
  const [loading, setLoading] = useState(true);
  const [analysisData, setAnalysisData] = useState<any>(null);

  // --- LOAD DATA FROM LOCALSTORAGE ---
  useEffect(() => {
    const savedData = localStorage.getItem('analysisResults');
    console.log('🔍 Report Page - Checking localStorage...');
    console.log('📦 Raw savedData:', savedData ? 'Data exists' : 'No data');
    
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('📊 Report Page - Loaded Data:', parsed);
        console.log('📊 Data keys:', Object.keys(parsed));
        console.log('📊 Sequences count:', parsed.sequences?.length || 0);
        setAnalysisData(parsed);
      } catch (e) {
        console.error("❌ Failed to parse report data:", e);
      }
    } else {
      console.warn('⚠️ No data in localStorage with key "analysisResults"');
    }
    setLoading(false);
  }, []);

  // --- CALCULATE COMPREHENSIVE DEEP ANALYSIS ---
  const stats = useMemo(() => {
    if (!analysisData) {
      return {
        total: 0,
        taxaCount: 0,
        avgConfidence: 0,
        novelCount: 0,
        taxonomyData: [],
        topTaxa: [],
        diversityMetrics: {
          shannonIndex: 0,
          simpsonIndex: 0,
          evenness: 0
        },
        confidenceDistribution: {
          high: 0,
          medium: 0,
          low: 0
        },
        taxonomicLevels: {
          kingdom: 0,
          phylum: 0,
          class: 0,
          order: 0,
          family: 0,
          genus: 0,
          species: 0
        },
        sequenceStats: {
          avgLength: 0,
          minLength: 0,
          maxLength: 0,
          totalBases: 0
        },
        noveltyInsights: {
          novelClusters: 0,
          potentialNewSpecies: 0,
          lowConfidenceCount: 0
        },
        qualityMetrics: {
          excellentQuality: 0,
          goodQuality: 0,
          poorQuality: 0
        }
      };
    }

    // Get sequences
    const sequences = analysisData.sequences || [];
    const total = sequences.length;

    // Calculate average confidence
    const avgConfidence = total > 0
      ? (sequences.reduce((acc: number, seq: any) => acc + (Number(seq.confidence) || 0), 0) / total * 100).toFixed(1)
      : '0.0';

    // Count novel/unknown sequences
    const novelCount = sequences.filter((seq: any) => 
      (seq.taxonomy || '').toLowerCase().includes('unknown') || 
      (seq.cluster || '').startsWith('N') ||
      (seq.confidence || 0) < 0.5
    ).length;

    // Aggregate taxonomy data
    const taxMap = new Map<string, { count: number; totalConfidence: number }>();
    
    sequences.forEach((seq: any) => {
      const taxonomy = seq.taxonomy || 'Unknown';
      const parts = taxonomy.split(';');
      // Get the first level (phylum/kingdom)
      const taxon = parts.length > 0 ? parts[0].trim() : 'Unknown';
      
      const existing = taxMap.get(taxon) || { count: 0, totalConfidence: 0 };
      taxMap.set(taxon, {
        count: existing.count + 1,
        totalConfidence: existing.totalConfidence + (Number(seq.confidence) || 0)
      });
    });

    // Convert to array and sort by count
    const taxonomyData = Array.from(taxMap.entries())
      .map(([name, data], idx) => ({
        phylum: name,
        count: data.count,
        percentage: ((data.count / total) * 100).toFixed(1),
        avgConfidence: ((data.totalConfidence / data.count) * 100).toFixed(1),
        color: COLORS[idx % COLORS.length]
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Get top taxa for detailed table
    const topTaxa = Array.from(taxMap.entries())
      .map(([name, data]) => ({
        taxon: name,
        phylum: name.split(';')[0] || name,
        sequences: data.count,
        confidence: ((data.totalConfidence / data.count) * 100).toFixed(1)
      }))
      .sort((a, b) => b.sequences - a.sequences)
      .slice(0, 5);

    // === DEEP ANALYSIS METRICS ===

    // 1. Diversity Metrics (Shannon & Simpson Index)
    const shannonIndex = taxMap.size > 0 ? Array.from(taxMap.values()).reduce((sum, { count }) => {
      const p = count / total;
      return sum - (p * Math.log(p));
    }, 0).toFixed(2) : '0.00';

    const simpsonIndex = taxMap.size > 0 ? (1 - Array.from(taxMap.values()).reduce((sum, { count }) => {
      const p = count / total;
      return sum + (p * p);
    }, 0)).toFixed(2) : '0.00';

    const evenness = taxMap.size > 1 ? (Number(shannonIndex) / Math.log(taxMap.size)).toFixed(2) : '0.00';

    // 2. Confidence Distribution
    const confidenceDistribution = {
      high: sequences.filter((s: any) => (s.confidence || 0) >= 0.8).length,
      medium: sequences.filter((s: any) => (s.confidence || 0) >= 0.5 && (s.confidence || 0) < 0.8).length,
      low: sequences.filter((s: any) => (s.confidence || 0) < 0.5).length
    };

    // 3. Taxonomic Level Completeness
    const taxonomicLevels = sequences.reduce((acc: any, seq: any) => {
      const parts = (seq.taxonomy || '').split(';').filter((p: string) => p.trim());
      const levels = ['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'];
      parts.forEach((_: any, idx: number) => {
        if (idx < levels.length && levels[idx]) {
          acc[levels[idx]]++;
        }
      });
      return acc;
    }, { kingdom: 0, phylum: 0, class: 0, order: 0, family: 0, genus: 0, species: 0 });

    // 4. Sequence Statistics
    const lengths = sequences.map((s: any) => s.length || 0).filter((l: number) => l > 0);
    const sequenceStats = {
      avgLength: lengths.length > 0 ? Math.round(lengths.reduce((a: number, b: number) => a + b, 0) / lengths.length) : 0,
      minLength: lengths.length > 0 ? Math.min(...lengths) : 0,
      maxLength: lengths.length > 0 ? Math.max(...lengths) : 0,
      totalBases: lengths.reduce((a: number, b: number) => a + b, 0)
    };

    // 5. Novelty Insights
    const novelClusters = new Set(
      sequences
        .filter((s: any) => (s.cluster || '').startsWith('N'))
        .map((s: any) => s.cluster)
    ).size;

    const potentialNewSpecies = sequences.filter((s: any) => 
      (s.confidence || 0) < 0.6 && 
      (s.confidence || 0) > 0.3 && 
      (s.taxonomy || '').toLowerCase().includes('unknown')
    ).length;

    const lowConfidenceCount = sequences.filter((s: any) => (s.confidence || 0) < 0.5).length;

    // 6. Quality Metrics (based on confidence + overlap)
    const qualityMetrics = {
      excellentQuality: sequences.filter((s: any) => 
        (s.confidence || 0) >= 0.85 && (s.overlap || 0) >= 80
      ).length,
      goodQuality: sequences.filter((s: any) => 
        (s.confidence || 0) >= 0.65 && (s.confidence || 0) < 0.85 && (s.overlap || 0) >= 60
      ).length,
      poorQuality: sequences.filter((s: any) => 
        (s.confidence || 0) < 0.65 || (s.overlap || 0) < 60
      ).length
    };

    return {
      total,
      taxaCount: taxMap.size,
      avgConfidence,
      novelCount,
      taxonomyData,
      topTaxa,
      diversityMetrics: {
        shannonIndex: Number(shannonIndex),
        simpsonIndex: Number(simpsonIndex),
        evenness: Number(evenness)
      },
      confidenceDistribution,
      taxonomicLevels,
      sequenceStats,
      noveltyInsights: {
        novelClusters,
        potentialNewSpecies,
        lowConfidenceCount
      },
      qualityMetrics
    };
  }, [analysisData]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className={`text-lg ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          Generating Report...
        </div>
      </div>
    );
  }

  // No data state
  if (!analysisData || stats.total === 0) {
    console.warn('⚠️ No data available for report');
    console.log('analysisData:', analysisData);
    console.log('stats.total:', stats.total);
    
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
        <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          No Analysis Data Found
        </h2>
        <p className={`mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Please upload and analyze a sequence file first to generate a report.
        </p>
        {analysisData && (
          <div className={`mb-4 text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Debug: Data exists but has {stats.total} sequences
          </div>
        )}
        <button
          onClick={() => onNavigate('upload')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Upload
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* --- HEADER --- */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <button
                onClick={() => onNavigate('output')}
                className={`flex items-center gap-2 mb-4 text-sm font-semibold transition-colors ${
                  isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ArrowLeft className="w-4 h-4" /> Back to Results
              </button>
              <h1 className={`text-3xl md:text-4xl mb-2 font-bold ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                Analysis Report
              </h1>
              <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Comprehensive taxonomic classification results
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  // Share functionality
                  if (navigator.share) {
                    navigator.share({
                      title: 'Taxaformer Analysis Report',
                      text: `Analysis complete: ${stats.total} sequences, ${stats.taxaCount} taxa identified`
                    });
                  }
                }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-900'
                }`}
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button
                onClick={() => {
                  // Export to JSON
                  const dataStr = JSON.stringify(analysisData, null, 2);
                  const dataBlob = new Blob([dataStr], { type: 'application/json' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `taxaformer-report-${Date.now()}.json`;
                  link.click();
                }}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* --- SUMMARY CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'Total Sequences', 
              value: stats.total.toString(), 
              change: 'Analyzed', 
              icon: BarChart3 
            },
            { 
              label: 'Taxa Identified', 
              value: stats.taxaCount.toString(), 
              change: 'Unique', 
              icon: PieChart 
            },
            { 
              label: 'Confidence Avg', 
              value: `${stats.avgConfidence}%`, 
              change: 'Score', 
              icon: LineChart 
            },
            { 
              label: 'Novel/Unknown', 
              value: stats.novelCount.toString(), 
              change: stats.novelCount > 0 ? 'Found' : 'None', 
              icon: BarChart3 
            }
          ].map((stat, idx) => (
            <div
              key={idx}
              className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
              } backdrop-blur-md`}
            >
              <div className="flex items-start justify-between mb-3">
                <stat.icon className={`w-8 h-8 ${
                  isDarkMode ? 'text-cyan-400' : 'text-blue-500'
                }`} />
                <span className={`text-xs px-2 py-1 rounded ${
                  isDarkMode ? 'bg-cyan-500/20 text-cyan-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className={`text-2xl font-bold mb-1 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                {stat.value}
              </div>
              <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* === DEEP ANALYSIS SECTION === */}
        <div className={`rounded-xl p-6 mb-8 ${
          isDarkMode ? 'bg-gradient-to-br from-cyan-900/30 to-blue-900/30 border border-cyan-500/20' : 'bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200'
        }`}>
          <div className="flex items-center gap-3 mb-6">
            <Microscope className={`w-6 h-6 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Deep Analysis Insights
            </h2>
          </div>

          {/* Diversity Metrics */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className={`rounded-lg p-5 ${
              isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Shannon Index
                </h3>
              </div>
              <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                {stats.diversityMetrics.shannonIndex.toFixed(2)}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Higher values indicate greater diversity. Range: 0-5+
              </p>
              <div className={`mt-3 text-xs font-semibold ${
                stats.diversityMetrics.shannonIndex > 2.5 
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : stats.diversityMetrics.shannonIndex > 1.5
                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  : isDarkMode ? 'text-orange-400' : 'text-orange-600'
              }`}>
                {stats.diversityMetrics.shannonIndex > 2.5 ? '✓ High Diversity' : 
                 stats.diversityMetrics.shannonIndex > 1.5 ? '○ Moderate Diversity' : '△ Low Diversity'}
              </div>
            </div>

            <div className={`rounded-lg p-5 ${
              isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Database className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Simpson Index
                </h3>
              </div>
              <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {stats.diversityMetrics.simpsonIndex.toFixed(2)}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Probability that two individuals are different species. Range: 0-1
              </p>
              <div className={`mt-3 text-xs font-semibold ${
                stats.diversityMetrics.simpsonIndex > 0.8 
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : stats.diversityMetrics.simpsonIndex > 0.5
                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  : isDarkMode ? 'text-orange-400' : 'text-orange-600'
              }`}>
                {stats.diversityMetrics.simpsonIndex > 0.8 ? '✓ Highly Diverse' : 
                 stats.diversityMetrics.simpsonIndex > 0.5 ? '○ Moderately Diverse' : '△ Low Diversity'}
              </div>
            </div>

            <div className={`rounded-lg p-5 ${
              isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Evenness
                </h3>
              </div>
              <div className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {stats.diversityMetrics.evenness.toFixed(2)}
              </div>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                How evenly species are distributed. Range: 0-1
              </p>
              <div className={`mt-3 text-xs font-semibold ${
                stats.diversityMetrics.evenness > 0.7 
                  ? isDarkMode ? 'text-green-400' : 'text-green-600'
                  : stats.diversityMetrics.evenness > 0.4
                  ? isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  : isDarkMode ? 'text-orange-400' : 'text-orange-600'
              }`}>
                {stats.diversityMetrics.evenness > 0.7 ? '✓ Balanced Community' : 
                 stats.diversityMetrics.evenness > 0.4 ? '○ Somewhat Balanced' : '△ Dominated by Few'}
              </div>
            </div>
          </div>

          {/* Confidence & Quality Distribution */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className={`rounded-lg p-5 ${
              isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Confidence Distribution
              </h3>
              <div className="space-y-3">
                {[
                  { label: 'High Confidence', value: stats.confidenceDistribution.high, color: '#10B981', range: '≥80%' },
                  { label: 'Medium Confidence', value: stats.confidenceDistribution.medium, color: '#F59E0B', range: '50-80%' },
                  { label: 'Low Confidence', value: stats.confidenceDistribution.low, color: '#EF4444', range: '<50%' }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between mb-1">
                      <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {item.label} <span className="text-xs opacity-60">({item.range})</span>
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {item.value} ({((item.value / stats.total) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}>
                      <div
                        className="h-full transition-all"
                        style={{ 
                          width: `${(item.value / stats.total) * 100}%`,
                          backgroundColor: item.color
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-lg p-5 ${
              isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Overall Quality Assessment
              </h3>
              <div className="space-y-3">
                {[
                  { 
                    label: 'Excellent Quality', 
                    value: stats.qualityMetrics.excellentQuality, 
                    icon: CheckCircle, 
                    color: '#10B981',
                    desc: 'High confidence + overlap' 
                  },
                  { 
                    label: 'Good Quality', 
                    value: stats.qualityMetrics.goodQuality, 
                    icon: CheckCircle, 
                    color: '#3B82F6',
                    desc: 'Moderate confidence' 
                  },
                  { 
                    label: 'Needs Review', 
                    value: stats.qualityMetrics.poorQuality, 
                    icon: AlertCircle, 
                    color: '#F59E0B',
                    desc: 'Low confidence/overlap' 
                  }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <item.icon className="w-4 h-4" style={{ color: item.color }} />
                      <div>
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                          {item.label}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.desc}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                        {item.value}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {((item.value / stats.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sequence & Novelty Stats */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className={`rounded-lg p-5 ${
              isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <Dna className={`w-5 h-5 ${isDarkMode ? 'text-cyan-400' : 'text-cyan-600'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Sequence Statistics
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Avg Length', value: `${stats.sequenceStats.avgLength.toLocaleString()} bp` },
                  { label: 'Min Length', value: `${stats.sequenceStats.minLength.toLocaleString()} bp` },
                  { label: 'Max Length', value: `${stats.sequenceStats.maxLength.toLocaleString()} bp` },
                  { label: 'Total Bases', value: `${(stats.sequenceStats.totalBases / 1000000).toFixed(2)} Mb` }
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className={`text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {item.label}
                    </div>
                    <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-lg p-5 ${
              isDarkMode ? 'bg-slate-800/70' : 'bg-white/70'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  Novelty Detection
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Novel Clusters Found', value: stats.noveltyInsights.novelClusters },
                  { label: 'Potential New Species', value: stats.noveltyInsights.potentialNewSpecies },
                  { label: 'Uncertain Classifications', value: stats.noveltyInsights.lowConfidenceCount }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {item.label}
                    </span>
                    <span className={`text-lg font-bold ${
                      item.value > 0 
                        ? isDarkMode ? 'text-purple-400' : 'text-purple-600'
                        : isDarkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Taxonomic Level Completeness */}
        <div className={`rounded-xl p-6 mb-8 ${
          isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
        } backdrop-blur-md`}>
          <h3 className={`text-lg mb-6 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Taxonomic Classification Completeness
          </h3>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Number of sequences with classification at each taxonomic level
          </p>
          <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
            {Object.entries(stats.taxonomicLevels).map(([level, count], idx) => (
              <div key={idx} className="text-center">
                <div className={`text-xs uppercase font-semibold mb-2 ${
                  isDarkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  {level}
                </div>
                <div className="relative h-32 flex flex-col justify-end">
                  <div
                    className={`w-full rounded-t-lg transition-all ${
                      isDarkMode ? 'bg-gradient-to-t from-cyan-500 to-cyan-400' : 'bg-gradient-to-t from-blue-500 to-blue-400'
                    }`}
                    style={{ 
                      height: `${stats.total > 0 ? ((count as number) / stats.total * 100) : 0}%`,
                      minHeight: count > 0 ? '10%' : '0%'
                    }}
                  />
                </div>
                <div className={`text-lg font-bold mt-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {count as number}
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {stats.total > 0 ? ((count as number / stats.total) * 100).toFixed(0) : 0}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- CHARTS --- */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Taxonomic Distribution */}
          <div className={`rounded-xl p-6 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h3 className={`text-lg mb-6 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Taxonomic Distribution
            </h3>
            <div className="space-y-4">
              {stats.taxonomyData.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between mb-2">
                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                      {item.phylum}
                    </span>
                    <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                      {item.count} ({item.percentage}%)
                    </span>
                  </div>
                  <div className={`h-2 rounded-full overflow-hidden ${
                    isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                  }`}>
                    <div
                      className="h-full transition-all"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence Distribution */}
          <div className={`rounded-xl p-6 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h3 className={`text-lg mb-6 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Confidence Distribution
            </h3>
            <div className="h-64 flex items-end justify-between gap-2">
              {stats.taxonomyData.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{ 
                      height: `${item.avgConfidence}%`,
                      backgroundColor: item.color
                    }}
                  />
                  <span className={`text-xs mt-2 text-center ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {item.phylum.substring(0, 8)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* --- DETAILED RESULTS TABLE --- */}
        <div className={`rounded-xl p-6 ${
          isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
        } backdrop-blur-md`}>
          <h3 className={`text-lg mb-6 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Top Identified Taxa
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${
                  isDarkMode ? 'border-slate-700' : 'border-slate-200'
                }`}>
                  <th className={`text-left py-3 px-4 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Taxon
                  </th>
                  <th className={`text-left py-3 px-4 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Phylum
                  </th>
                  <th className={`text-left py-3 px-4 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Sequences
                  </th>
                  <th className={`text-left py-3 px-4 ${
                    isDarkMode ? 'text-slate-300' : 'text-slate-700'
                  }`}>
                    Avg Confidence
                  </th>
                </tr>
              </thead>
              <tbody>
                {stats.topTaxa.map((row, idx) => (
                  <tr
                    key={idx}
                    className={`border-b ${
                      isDarkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-slate-200 hover:bg-slate-100/50'
                    }`}
                  >
                    <td className={`py-3 px-4 font-medium ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}>
                      {row.taxon}
                    </td>
                    <td className={`py-3 px-4 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {row.phylum}
                    </td>
                    <td className={`py-3 px-4 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      {row.sequences}
                    </td>
                    <td className={`py-3 px-4 ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-700'
                    }`}>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs ${
                        Number(row.confidence) >= 90
                          ? isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700'
                          : Number(row.confidence) >= 70
                          ? isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'
                          : isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {row.confidence}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Metadata Info */}
        {analysisData.metadata && (
          <div className={`mt-8 rounded-xl p-6 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h3 className={`text-lg mb-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Analysis Metadata
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sample Name
                </div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {analysisData.metadata.sampleName || 'N/A'}
                </div>
              </div>
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Processing Time
                </div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {analysisData.metadata.processingTime || 'N/A'}
                </div>
              </div>
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Total Sequences
                </div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {analysisData.metadata.totalSequences || stats.total}
                </div>
              </div>
              <div>
                <div className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Avg Confidence
                </div>
                <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {analysisData.metadata.avgConfidence || stats.avgConfidence}%
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
