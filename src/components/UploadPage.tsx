import { useState, useEffect } from 'react';
import { Upload, FileText, Database, ChevronRight, Loader2, Cpu, Zap, Brain, CheckCircle2 } from 'lucide-react';

// 🛑 STEP 1: PASTE YOUR NGROK URL HERE
// Leave empty to use mock data for testing
// Set to "" to test UI without backend, or paste your active ngrok URL
const API_URL: string = "https://unexcited-nondepreciatively-justice.ngrok-free.dev";

interface UploadPageProps {
  isDarkMode: boolean;
  onNavigate: (page: string) => void;
}

export default function UploadPage({ isDarkMode, onNavigate }: UploadPageProps) {
  const [dragActive, setDragActive] = useState(false);
  // CHANGED: We now store the actual File object, not just the name string
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [progress, setProgress] = useState(0);

  // Loading stages with messages
  const loadingStages = [
    { icon: Upload, text: "Uploading sequences to GPU cluster...", color: "cyan" },
    { icon: Cpu, text: "Initializing Nucleotide Transformer model...", color: "blue" },
    { icon: Brain, text: "Processing DNA sequences on GPU...", color: "purple" },
    { icon: Zap, text: "Running taxonomic classification...", color: "pink" },
    { icon: Database, text: "Matching against marine databases...", color: "indigo" },
    { icon: CheckCircle2, text: "Finalizing results...", color: "green" }
  ];

  // Simulate loading progress
  useEffect(() => {
    if (isLoading) {
      setLoadingStage(0);
      setProgress(0);

      const stageInterval = setInterval(() => {
        setLoadingStage(prev => {
          if (prev < loadingStages.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 3000); // Change stage every 3 seconds

      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev < 95) {
            return prev + Math.random() * 3;
          }
          return prev;
        });
      }, 200); // Update progress smoothly

      return () => {
        clearInterval(stageInterval);
        clearInterval(progressInterval);
      };
    } else {
      setProgress(0);
      setLoadingStage(0);
    }
  }, [isLoading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Store the full File object
      const files = Array.from(e.dataTransfer.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      // Store the full File object
      const files = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...files]);
    }
  };

  // --- 🛑 STEP 2: THE AI CONNECTION LOGIC ---
  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file first');
      return;
    }

    setIsLoading(true);

    try {
      // If no API URL is set, use mock data for testing
      if (!API_URL || (typeof API_URL === 'string' && API_URL.trim() === "")) {
        console.log("⚠️ No API URL configured - Using mock data");
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Mock data
        const mockData = {
          metadata: {
            sampleName: uploadedFiles[0].name,
            totalSequences: 150,
            processingTime: "2.8s",
            avgConfidence: 89
          },
          taxonomy_summary: [
            { name: 'Alveolata', value: 45, color: '#22D3EE' },
            { name: 'Chlorophyta', value: 32, color: '#10B981' },
            { name: 'Fungi', value: 15, color: '#A78BFA' },
            { name: 'Metazoa', value: 28, color: '#F59E0B' },
            { name: 'Rhodophyta', value: 18, color: '#EC4899' },
            { name: 'Unknown', value: 12, color: '#64748B' }
          ],
          sequences: [
            { accession: 'SEQ_001', taxonomy: 'Alveolata; Dinoflagellata; Gymnodiniales', length: 1842, confidence: 0.94, overlap: 87, cluster: 'C1' },
            { accession: 'SEQ_002', taxonomy: 'Chlorophyta; Chlorophyceae; Chlamydomonadales', length: 1654, confidence: 0.89, overlap: 92, cluster: 'C2' },
            { accession: 'SEQ_003', taxonomy: 'Metazoa; Arthropoda; Copepoda', length: 2103, confidence: 0.96, overlap: 94, cluster: 'C3' },
            { accession: 'SEQ_004', taxonomy: 'Unknown; Novel Cluster A', length: 1723, confidence: 0.42, overlap: 34, cluster: 'N1' },
            { accession: 'SEQ_005', taxonomy: 'Rhodophyta; Florideophyceae; Ceramiales', length: 1889, confidence: 0.91, overlap: 88, cluster: 'C4' },
          ],
          cluster_data: [
            { x: 12.5, y: 8.3, z: 45, cluster: 'Alveolata', color: '#22D3EE' },
            { x: -8.2, y: 15.1, z: 32, cluster: 'Chlorophyta', color: '#10B981' },
            { x: 3.4, y: -12.7, z: 28, cluster: 'Metazoa', color: '#F59E0B' },
            { x: -15.8, y: -5.2, z: 18, cluster: 'Rhodophyta', color: '#EC4899' },
            { x: 18.3, y: 2.1, z: 15, cluster: 'Fungi', color: '#A78BFA' },
            { x: -2.1, y: -18.5, z: 12, cluster: 'Unknown', color: '#64748B' },
          ]
        };

        // Complete the progress bar
        setProgress(100);
        setLoadingStage(loadingStages.length - 1);

        // Wait a moment to show completion
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Save mock data
        localStorage.setItem('analysisResults', JSON.stringify(mockData));
        console.log("💾 Saved mock data to localStorage");

        // Navigate to results
        onNavigate('output');
        return;
      }

      const formData = new FormData();
      // We send the first file in the list to the backend
      formData.append('file', uploadedFiles[0]);

      console.log("🚀 Sending to Backend...");
      console.log("📁 File:", uploadedFiles[0].name);
      console.log("🔗 API URL:", API_URL);

      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      );

      // Create the fetch promise
      const fetchPromise = fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      });

      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]) as Response;

      console.log("📡 Response Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Server Error Response:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log("📦 Received Result:", result);

      if (result.status === "success") {
        console.log("✅ Analysis Complete!");
        console.log("📊 Data Structure:", {
          hasMetadata: !!result.data?.metadata,
          hasTaxonomySummary: !!result.data?.taxonomy_summary,
          hasSequences: !!result.data?.sequences,
          hasClusterData: !!result.data?.cluster_data,
          sequenceCount: result.data?.sequences?.length || 0
        });

        // Complete the progress bar
        setProgress(100);
        setLoadingStage(loadingStages.length - 1);

        // Wait a moment to show completion
        await new Promise(resolve => setTimeout(resolve, 1000));

        // SAVE DATA TO LOCAL STORAGE (So the Output Page can read it)
        localStorage.setItem('analysisResults', JSON.stringify(result.data));
        console.log("💾 Saved to localStorage");

        // Navigate to results
        onNavigate('output');
      } else {
        console.error("❌ Server returned error:", result.message);
        throw new Error("Server Error: " + (result.message || "Unknown error"));
      }
    } catch (error) {
      console.error("❌ Connection Failed:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      
      // Auto-fallback to mock data
      console.log("⚠️ Falling back to mock data...");
      
      const mockData = {
        metadata: {
          sampleName: uploadedFiles[0].name,
          totalSequences: 150,
          processingTime: "Mock",
          avgConfidence: 89
        },
        taxonomy_summary: [
          { name: 'Alveolata', value: 45, color: '#22D3EE' },
          { name: 'Chlorophyta', value: 32, color: '#10B981' },
          { name: 'Fungi', value: 15, color: '#A78BFA' },
          { name: 'Metazoa', value: 28, color: '#F59E0B' },
          { name: 'Rhodophyta', value: 18, color: '#EC4899' },
          { name: 'Unknown', value: 12, color: '#64748B' }
        ],
        sequences: [
          { accession: 'SEQ_001', taxonomy: 'Alveolata; Dinoflagellata; Gymnodiniales', length: 1842, confidence: 0.94, overlap: 87, cluster: 'C1' },
          { accession: 'SEQ_002', taxonomy: 'Chlorophyta; Chlorophyceae; Chlamydomonadales', length: 1654, confidence: 0.89, overlap: 92, cluster: 'C2' },
          { accession: 'SEQ_003', taxonomy: 'Metazoa; Arthropoda; Copepoda', length: 2103, confidence: 0.96, overlap: 94, cluster: 'C3' },
          { accession: 'SEQ_004', taxonomy: 'Unknown; Novel Cluster A', length: 1723, confidence: 0.42, overlap: 34, cluster: 'N1' },
          { accession: 'SEQ_005', taxonomy: 'Rhodophyta; Florideophyceae; Ceramiales', length: 1889, confidence: 0.91, overlap: 88, cluster: 'C4' },
        ],
        cluster_data: [
          { x: 12.5, y: 8.3, z: 45, cluster: 'Alveolata', color: '#22D3EE' },
          { x: -8.2, y: 15.1, z: 32, cluster: 'Chlorophyta', color: '#10B981' },
          { x: 3.4, y: -12.7, z: 28, cluster: 'Metazoa', color: '#F59E0B' },
          { x: -15.8, y: -5.2, z: 18, cluster: 'Rhodophyta', color: '#EC4899' },
          { x: 18.3, y: 2.1, z: 15, cluster: 'Fungi', color: '#A78BFA' },
          { x: -2.1, y: -18.5, z: 12, cluster: 'Unknown', color: '#64748B' },
        ]
      };

      // Complete the progress bar
      setProgress(100);
      setLoadingStage(loadingStages.length - 1);

      // Wait a moment to show completion
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Save mock data
      localStorage.setItem('analysisResults', JSON.stringify(mockData));
      console.log("💾 Saved mock data to localStorage (API failed)");

      // Show a notification that mock data is being used
      alert(`⚠️ API Connection Failed\n\nError: ${errorMessage}\n\n✅ Using mock data for demonstration.\n\nTo connect to your backend:\n1. Ensure backend is running\n2. Update API_URL in UploadPage.tsx\n3. Check CORS settings\n\nClick OK to view mock results.`);

      // Navigate to results with mock data
      onNavigate('output');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Massive Text Hero Section */}
      <div className="relative overflow-hidden py-20 md:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            {/* Main Headline - Massive Typography */}
            <h1 className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-bold leading-none tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}>
              <span className="block">Transform</span>
              <span className={`block ${
                isDarkMode 
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-cyan-600 to-purple-600'
              }`}>
                eDNA Sequences
              </span>
              <span className="block">Into Insights</span>
            </h1>

            {/* Subtitle */}
            <p className={`text-lg sm:text-xl md:text-2xl max-w-3xl mx-auto leading-relaxed ${
              isDarkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              AI-Powered biodiversity classification using Nucleotide Transformer and comprehensive marine databases
            </p>

            {/* CTA */}
            <div className="pt-8">
              <a 
                href="#upload"
                className={`inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full transition-all ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                }`}
              >
                Upload Sequences
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Section */}
      <div id="upload" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className={`text-2xl md:text-3xl mb-3 font-bold ${
            isDarkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Upload Your Data
          </h2>
          <p className={`text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Upload your eDNA sequence files for AI-powered taxonomic classification
          </p>
        </div>

        {/* Upload Area */}
        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          <div
            className={`relative border-2 border-dashed rounded-xl p-8 transition-all ${
              dragActive
                ? isDarkMode
                  ? 'border-cyan-400 bg-cyan-500/10'
                  : 'border-blue-500 bg-blue-50'
                : isDarkMode
                ? 'border-slate-600 bg-slate-800/50'
                : 'border-slate-300 bg-white/50'
            } backdrop-blur-md`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <Upload className={`w-16 h-16 mx-auto mb-4 ${
                isDarkMode ? 'text-cyan-400' : 'text-blue-500'
              }`} />
              <h3 className={`text-lg mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                Drag & Drop Files
              </h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                or click to browse
              </p>
              <input
                type="file"
                multiple
                accept=".fasta,.fa,.fna"
                onChange={handleFileInput}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className={`inline-block px-6 py-3 rounded-lg cursor-pointer transition-all ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Choose Files
              </label>
              <p className={`text-xs mt-4 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                Supported formats: .fasta, .fa, .fna
              </p>
            </div>
          </div>

          {/* Info Panel */}
          <div className={`rounded-xl p-8 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h3 className={`text-lg mb-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Upload Guidelines
            </h3>
            <ul className={`space-y-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <li className="flex items-start gap-2">
                <Database className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Upload FASTA formatted files containing DNA sequences</span>
              </li>
              <li className="flex items-start gap-2">
                <FileText className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Multiple files can be uploaded at once</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Sequences will be classified using Nucleotide Transformer AI</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span>Results will include taxonomic classification and confidence scores</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className={`rounded-xl p-6 mb-8 ${
            isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
          } backdrop-blur-md`}>
            <h3 className={`text-lg mb-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Uploaded Files ({uploadedFiles.length})
            </h3>
            <div className="space-y-2">
              {uploadedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isDarkMode ? 'bg-slate-700/50' : 'bg-slate-100/50'
                  }`}
                >
                  <FileText className="w-5 h-5" />
                  <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>{file.name}</span>
                </div>
              ))}
            </div>

            {/* ANALYZE BUTTON WITH ENHANCED LOADING STATE */}
            {!isLoading ? (
              <button
                onClick={handleAnalyze}
                className={`mt-6 w-full px-8 py-4 rounded-lg transition-all flex items-center justify-center gap-2 font-semibold ${
                  isDarkMode
                    ? 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-500/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30'
                }`}
              >
                Analyze Sequences
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <div className={`mt-6 w-full rounded-xl p-8 ${
                isDarkMode 
                  ? 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700' 
                  : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200'
              }`}>
                {/* GPU Processing Animation */}
                <div className="space-y-6">
                  {/* Current Stage Display */}
                  <div className="flex items-center justify-center gap-4">
                    {(() => {
                      const CurrentIcon = loadingStages[loadingStage].icon;
                      const stageColor = loadingStages[loadingStage].color;
                      return (
                        <>
                          <div className={`relative ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                            <CurrentIcon className="w-8 h-8 animate-pulse" />
                            <div className={`absolute inset-0 animate-ping opacity-20`}>
                              <CurrentIcon className="w-8 h-8" />
                            </div>
                          </div>
                          <div className="flex-1">
                            <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                              {loadingStages[loadingStage].text}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Stage {loadingStage + 1} of {loadingStages.length}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className={`h-3 rounded-full overflow-hidden ${
                      isDarkMode ? 'bg-slate-700' : 'bg-slate-200'
                    }`}>
                      <div
                        className={`h-full transition-all duration-500 ease-out ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500'
                            : 'bg-gradient-to-r from-blue-500 via-cyan-500 to-purple-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      >
                        <div className="h-full w-full animate-pulse opacity-50 bg-white"></div>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Processing...
                      </span>
                      <span className={`font-mono ${isDarkMode ? 'text-cyan-400' : 'text-blue-600'}`}>
                        {Math.round(progress)}%
                      </span>
                    </div>
                  </div>

                  {/* Stage Indicators */}
                  <div className="flex justify-between items-center gap-2">
                    {loadingStages.map((stage, idx) => {
                      const StageIcon = stage.icon;
                      const isComplete = idx < loadingStage;
                      const isCurrent = idx === loadingStage;
                      return (
                        <div
                          key={idx}
                          className={`flex flex-col items-center gap-1 transition-all ${
                            isComplete || isCurrent ? 'opacity-100' : 'opacity-30'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            isComplete
                              ? isDarkMode
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-green-500/20 text-green-600'
                              : isCurrent
                              ? isDarkMode
                                ? 'bg-cyan-500/20 text-cyan-400 animate-pulse'
                                : 'bg-blue-500/20 text-blue-600 animate-pulse'
                              : isDarkMode
                              ? 'bg-slate-700 text-slate-500'
                              : 'bg-slate-200 text-slate-400'
                          }`}>
                            {isComplete ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <StageIcon className={`w-5 h-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* GPU Activity Indicator */}
                  <div className={`flex items-center justify-center gap-2 text-sm ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    <Zap className="w-4 h-4 animate-pulse text-yellow-500" />
                    <span className="font-mono">GPU Active</span>
                    <div className="flex gap-1">
                      <span className="w-1 h-4 bg-green-500 animate-pulse rounded"></span>
                      <span className="w-1 h-4 bg-green-500 animate-pulse rounded" style={{ animationDelay: '0.2s' }}></span>
                      <span className="w-1 h-4 bg-green-500 animate-pulse rounded" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sample Data Section */}
        <div className={`rounded-xl p-6 ${
          isDarkMode ? 'bg-slate-800/50' : 'bg-white/50'
        } backdrop-blur-md`}>
          <h3 className={`text-lg mb-4 font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Don't have data? Try our sample
          </h3>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Load a sample dataset to explore Taxaformer's capabilities
          </p>
          <button
            onClick={() => alert("Logic for sample data loading goes here (Optional for Hackathon)")}
            className={`px-6 py-3 rounded-lg border-2 transition-all ${
              isDarkMode
                ? 'border-slate-600 hover:border-cyan-400 bg-transparent hover:bg-cyan-500/10 text-slate-300 hover:text-white'
                : 'border-slate-300 hover:border-blue-500 bg-transparent hover:bg-blue-50 text-slate-700 hover:text-blue-700'
            }`}
          >
            Load Sample Data
          </button>
        </div>
      </div>
    </div>
  );
}
