"use client";

import { useState, useEffect, useRef } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Cpu, Play, RefreshCw, Layers, Database, Award, Info, 
  Activity, Flame, Sparkles, Sliders, Server, Binary, 
  Terminal, ShieldCheck, ShieldAlert, CheckCircle2, ChevronRight
} from "lucide-react";

interface ModelInfo {
  model_loaded: boolean;
  categories: string[];
  model_path: string;
  model_exists: boolean;
}

interface TrainingStatus {
  is_training: boolean;
  progress: number;
  epoch: number;
  total_epochs: number;
  loss: number;
  accuracy: number;
  status: string;
  message: string;
}

export default function ModelTuningPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [startingTrain, setStartingTrain] = useState(false);
  const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);
  const [trainStatus, setTrainStatus] = useState<TrainingStatus | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  
  // Hyperparameters
  const [epochs, setEpochs] = useState<number>(25);
  const [batchSize, setBatchSize] = useState<number>(32);
  const [learningRate, setLearningRate] = useState<number>(0.001);

  const logsEndRef = useRef<HTMLDivElement>(null);
  const lastEpochRef = useRef<number>(0);
  const lastStatusRef = useRef<string>("");

  // Fetch status and info
  const fetchModelTuningData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const response = await fetchWithAuth('/api/admin/model-tuning');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setModelInfo(data.info);
          setTrainStatus(data.status);
          
          // Reactively generate console logs based on current training status
          if (data.status.is_training) {
            updateLogsFromStatus(data.status);
          } else if (data.status.status === "completed" && lastStatusRef.current !== "completed") {
            setConsoleLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] [SUCCESS] Model training completed successfully!`,
              `[${new Date().toLocaleTimeString()}] [INFO] Best weights saved to: ${data.info.model_path}`,
              `[${new Date().toLocaleTimeString()}] [INFO] MobileNetV2 loaded successfully and active.`
            ]);
            toast({
              title: "🎉 Fine-Tuning Completed!",
              description: "MobileNetV2 offline model has been updated successfully.",
            });
            // Standard confetti trigger
            try {
              const confetti = (await import("canvas-confetti")).default;
              confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            } catch (e) {
              console.warn(e);
            }
          } else if (data.status.status === "failed" && lastStatusRef.current !== "failed") {
            setConsoleLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] [ERROR] Model training failed: ${data.status.message}`
            ]);
            toast({
              title: "❌ Fine-Tuning Failed",
              description: data.status.message || "An error occurred during training.",
              variant: "destructive",
            });
          }
          
          lastStatusRef.current = data.status.status;
        }
      }
    } catch (error) {
      console.error("Failed to fetch model tuning data:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Generate logs on the client console corresponding to the API status variables
  const updateLogsFromStatus = (status: TrainingStatus) => {
    const timeStr = new Date().toLocaleTimeString();
    
    // Status phase transitions logs
    if (status.status !== lastStatusRef.current) {
      if (status.status === "starting") {
        setConsoleLogs([
          `[${timeStr}] [SYSTEM] Initializing MobileNetV2 Fine-Tuning task...`,
          `[${timeStr}] [INFO] Hyperparameters: Epochs=${status.total_epochs}, BatchSize=${batchSize}, LR=${learningRate}`,
          `[${timeStr}] [INFO] Connecting to dataset pipeline...`
        ]);
        lastEpochRef.current = 0;
      } else if (status.status === "downloading") {
        setConsoleLogs(prev => [...prev, `[${timeStr}] [DATA] Downloading/Checking TrashNet dataset from mirrors...`]);
      } else if (status.status === "preparing") {
        setConsoleLogs(prev => [...prev, `[${timeStr}] [DATA] Extracting, split validation set, and applying data augmentation transforms...`]);
      } else if (status.status === "training") {
        setConsoleLogs(prev => [
          ...prev, 
          `[${timeStr}] [TRAIN] Loaded MobileNetV2 architecture with ImageNet weights.`,
          `[${timeStr}] [TRAIN] Swapped classification head to accommodate ${modelInfo?.categories.length || 6} categories.`,
          `[${timeStr}] [TRAIN] Start training loop on hardware device...`
        ]);
      }
    }

    // Log epoch completion
    if (status.status === "training" && status.epoch > lastEpochRef.current) {
      setConsoleLogs(prev => [
        ...prev,
        `[${timeStr}] [EPOCH ${status.epoch}/${status.total_epochs}] Loss = ${status.loss.toFixed(4)} | Val Accuracy = ${status.accuracy.toFixed(2)}% | Progress = ${status.progress.toFixed(1)}%`
      ]);
      lastEpochRef.current = status.epoch;
    }
  };

  // Scroll to bottom of terminal
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [consoleLogs]);

  // Polling setup: Poll fast (2s) when training, slow (10s) when idle
  useEffect(() => {
    fetchModelTuningData(true);
    
    const intervalTime = trainStatus?.is_training ? 2000 : 10000;
    const interval = setInterval(() => {
      fetchModelTuningData(false);
    }, intervalTime);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [trainStatus?.is_training]);

  // Trigger fine-tuning
  const handleStartTraining = async () => {
    setStartingTrain(true);
    setConsoleLogs([
      `[${new Date().toLocaleTimeString()}] [SYSTEM] Requesting fine-tune process...`
    ]);
    
    try {
      const response = await fetchWithAuth('/api/admin/model-tuning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          epochs,
          batch_size: batchSize,
          learning_rate: learningRate
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "🚀 Fine-Tuning Initiated",
            description: "MobileNetV2 training has started in the background.",
          });
          lastEpochRef.current = 0;
          lastStatusRef.current = "starting";
          fetchModelTuningData(false);
        } else {
          throw new Error(data.error || "Failed to start training");
        }
      } else {
        const err = await response.json();
        throw new Error(err.error || "Internal Server Error");
      }
    } catch (err: any) {
      toast({
        title: "❌ Failed to start training",
        description: err.message || "Please make sure Python server is running.",
        variant: "destructive"
      });
      setConsoleLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] [ERROR] Failed to start training: ${err.message}`
      ]);
    } finally {
      setStartingTrain(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <RefreshCw className="h-10 w-10 animate-spin text-emerald-600 mb-4" />
        <p className="text-gray-500 font-medium">Querying ML microservice settings...</p>
      </div>
    );
  }

  const isTrainingActive = trainStatus?.is_training ?? false;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 text-left">
      <title>ML Model Fine-Tuning | Admin Panel</title>
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-700 to-cyan-700 p-6 sm:p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyem0wLTMwVjBoLTEydjRoMTJ6TTI0IDI0aDEydi0ySDI0djJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-32 translate-x-32"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full w-max text-xs font-semibold">
              <Cpu className="h-3.5 w-3.5 text-amber-300" />
              <span>Offline PyTorch Classification Model</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">MobileNetV2 Fine-Tuning Console 🛠️</h1>
            <p className="text-white/70 text-sm">Fine-tune the Waste Classification model and watch neural network training logs in real-time.</p>
          </div>
          <Button
            onClick={() => fetchModelTuningData(true)}
            className="bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/20 text-white rounded-xl px-5 py-2.5 font-medium transition-all"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync Status
          </Button>
        </div>
      </div>

      {/* Model Overview & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-md rounded-2xl relative overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Server className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-gray-900 m-0">Offline Model Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex justify-between items-center py-1">
              <span className="text-xs font-semibold text-gray-400 uppercase">Load Status</span>
              {modelInfo?.model_loaded ? (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 animate-pulse">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Ready & Active
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200">
                  <ShieldAlert className="h-3.5 w-3.5 text-rose-600" /> Not Loaded
                </span>
              )}
            </div>

            <div className="flex justify-between items-center py-1 border-t border-gray-50">
              <span className="text-xs font-semibold text-gray-400 uppercase">Weights File</span>
              <span className="text-xs font-mono font-bold text-gray-700 truncate max-w-[150px]">
                {modelInfo?.model_exists ? "waste_classifier.pth (Exists)" : "None (Using ImageNet)"}
              </span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-gray-50">
              <span className="text-xs font-semibold text-gray-400 uppercase">Neural Network</span>
              <span className="text-xs font-bold text-gray-800">MobileNetV2</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-md rounded-2xl md:col-span-2">
          <CardHeader className="pb-3 border-b border-gray-50 flex flex-row items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Layers className="h-4 w-4" />
            </div>
            <CardTitle className="text-sm font-bold text-gray-900 m-0">Tuning Category Classes</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap gap-2.5">
              {modelInfo?.categories.map((cat, idx) => (
                <div key={idx} className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-gray-55 to-gray-50/50 hover:bg-gray-100 border border-gray-200/80 shadow-xs rounded-xl transition-all">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">{cat}</span>
                </div>
              ))}
              {!modelInfo?.categories.length && (
                <p className="text-xs text-gray-400 italic">No classes loaded.</p>
              )}
            </div>
            <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-xl flex gap-2">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-800 leading-relaxed font-medium">
                The offline classifier acts as a smart local fallback when your primary Gemini API reaches rate limits or is offline. Fine-tuning ensures high local classification accuracy.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Settings & Scanning Overlay */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Hyperparameter Settings Panel - Takes 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-md rounded-2xl">
            <CardHeader className="pb-4 border-b border-gray-50 flex flex-row items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                <Sliders className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-bold text-gray-900 m-0">Tuning Hyperparameters</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {/* Epochs input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Epochs (Training Rounds)</label>
                  <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">{epochs}</span>
                </div>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={epochs}
                  onChange={(e) => setEpochs(Math.max(5, Math.min(100, parseInt(e.target.value) || 5)))}
                  disabled={isTrainingActive || startingTrain}
                  className="rounded-xl border-gray-200/80 bg-gray-50/50 h-11 focus-visible:ring-emerald-500 font-medium"
                />
                <span className="text-[10px] text-gray-400 block leading-normal">Sets the total iterations through the dataset. Higher epochs yield better accuracy but take longer.</span>
              </div>

              {/* Batch Size input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wide block">Batch Size</label>
                <select
                  value={batchSize}
                  onChange={(e) => setBatchSize(parseInt(e.target.value))}
                  disabled={isTrainingActive || startingTrain}
                  className="w-full rounded-xl border border-gray-200/80 bg-gray-50/50 h-11 p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                >
                  <option value={8}>8 images</option>
                  <option value={16}>16 images</option>
                  <option value={32}>32 images</option>
                  <option value={64}>64 images</option>
                </select>
                <span className="text-[10px] text-gray-400 block leading-normal">Number of training samples processed per training step.</span>
              </div>

              {/* Learning Rate input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-600 uppercase tracking-wide">Learning Rate (Alpha)</label>
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">{learningRate}</span>
                </div>
                <Input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  max="0.01"
                  value={learningRate}
                  onChange={(e) => setLearningRate(Math.max(0.0001, Math.min(0.01, parseFloat(e.target.value) || 0.001)))}
                  disabled={isTrainingActive || startingTrain}
                  className="rounded-xl border-gray-200/80 bg-gray-50/50 h-11 focus-visible:ring-emerald-500 font-medium"
                />
                <span className="text-[10px] text-gray-400 block leading-normal">Controls how much the model weights are adjusted with respect to the loss gradient.</span>
              </div>

              {/* Start training trigger */}
              <Button
                size="lg"
                onClick={handleStartTraining}
                disabled={isTrainingActive || startingTrain}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl h-12 font-bold transition-all shadow-md hover:shadow-lg mt-4 flex items-center justify-center gap-2"
              >
                {isTrainingActive ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" /> Training in Progress...
                  </>
                ) : startingTrain ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" /> Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4.5 w-4.5 fill-current" /> Initiate Fine-Tuning
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Visual Scanning Animation & Progress - Takes 3 cols */}
        <div className="lg:col-span-3">
          <Card className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-md rounded-2xl h-full flex flex-col justify-between overflow-hidden relative min-h-[400px]">
            {/* Animated Laser beam overlay during training */}
            {isTrainingActive && (
              <div className="absolute inset-0 bg-green-500/5 backdrop-blur-[0.5px] pointer-events-none z-10 animate-pulse duration-1000">
                {/* Horizontal Sweeping Line */}
                <div className="w-full h-[3px] bg-gradient-to-r from-transparent via-green-400 to-transparent shadow-[0_0_15px_rgba(74,222,128,0.8)] absolute top-0 animate-[scan_3s_ease-in-out_infinite]" />
              </div>
            )}

            <CardHeader className="pb-4 border-b border-gray-50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-600">
                  <Activity className="h-4 w-4" />
                </div>
                <CardTitle className="text-base font-bold text-gray-900 m-0">Model Tuning Status & Metrics</CardTitle>
              </div>
              {isTrainingActive && (
                <div className="flex items-center gap-2 text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                  <span>SCANNING NEURAL NET</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="p-6 flex-1 flex flex-col justify-around gap-6 relative">
              {/* If Training IS active */}
              {isTrainingActive ? (
                <div className="space-y-6 w-full animate-in fade-in duration-500">
                  {/* Neural Blueprint representation */}
                  <div className="relative w-full h-40 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center overflow-hidden shadow-inner">
                    {/* Simulated Neural Network grid */}
                    <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#22c55e_1.5px,transparent_1.5px)] [background-size:16px_16px]" />
                    
                    <div className="relative flex justify-around items-center w-full px-6 z-10">
                      {/* Input nodes */}
                      <div className="space-y-3">
                        {[1, 2, 3].map(n => (
                          <div key={n} className="h-3 w-3 rounded-full bg-emerald-500 animate-ping duration-1000" style={{ animationDelay: `${n * 150}ms` }} />
                        ))}
                      </div>
                      <div className="h-0.5 w-12 bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse shrink-0" />
                      
                      {/* Hidden layer node cards */}
                      <div className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-center text-white min-w-[120px] shadow-lg">
                        <Cpu className="h-6 w-6 text-green-400 mx-auto mb-1 animate-pulse" />
                        <span className="text-[10px] font-bold uppercase tracking-wider block">MobileNetV2</span>
                        <span className="text-[9px] text-green-300 font-semibold block">Tuning Head...</span>
                      </div>
                      
                      <div className="h-0.5 w-12 bg-gradient-to-r from-teal-400 to-emerald-500 animate-pulse shrink-0" />
                      {/* Output node */}
                      <div className="h-4.5 w-4.5 rounded-full bg-teal-400 animate-ping duration-700" />
                    </div>
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500 uppercase">Tuning Progress</span>
                      <span className="font-extrabold text-emerald-600">{Math.round(trainStatus?.progress || 0)}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden border border-gray-200/50">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500 ease-out shadow-sm"
                        style={{ width: `${trainStatus?.progress || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-semibold">
                      <span>Epoch {trainStatus?.epoch} / {trainStatus?.total_epochs}</span>
                      <span>Phase: {trainStatus?.status.toUpperCase()}</span>
                    </div>
                  </div>

                  {/* Active Tuning Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-emerald-500"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block text-left">Training Loss</span>
                      <p className="text-2xl font-extrabold text-emerald-600 mt-1 text-left">
                        {trainStatus?.loss.toFixed(4) || "0.0000"}
                      </p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-blue-500"></div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide block text-left">Validation Accuracy</span>
                      <p className="text-2xl font-extrabold text-blue-600 mt-1 text-left">
                        {trainStatus?.accuracy.toFixed(2) || "0.00"}%
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* IDLE State visual placeholder */
                <div className="flex flex-col items-center justify-center text-center py-8 space-y-4 animate-in fade-in duration-500">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl animate-pulse-soft" />
                    <div className="h-20 w-20 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-3xl flex items-center justify-center shadow-lg hover:rotate-6 transition-all duration-300">
                      <Binary className="h-10 w-10 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-800 text-lg">System Idle & Ready</h3>
                    <p className="text-xs text-gray-500 max-w-sm mt-1 mx-auto leading-relaxed">
                      Select your epochs and parameters, then trigger **Initiate Fine-Tuning** to re-train the local MobileNetV2 waste classification layers.
                    </p>
                  </div>
                  <div className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    Last status message: {trainStatus?.message || "Idle"}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Real-time Logs Terminal Console */}
      <Card className="bg-slate-950 border border-slate-900 shadow-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-slate-900 border-b border-slate-800 py-3.5 px-5 flex flex-row items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Terminal className="h-4.5 w-4.5 text-emerald-400" />
            <span className="font-mono text-xs font-bold text-slate-200">MobileNetV2 Fine-Tuning Live Console Logs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${isTrainingActive ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`} />
            <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest">{isTrainingActive ? "Tuning active" : "Disconnected"}</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 bg-slate-950/95">
          <div className="h-64 overflow-y-auto font-mono text-xs text-left text-slate-300 space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            {consoleLogs.map((log, index) => {
              let textClass = "text-slate-300";
              if (log.includes("[SYSTEM]")) textClass = "text-amber-400 font-semibold";
              if (log.includes("[ERROR]")) textClass = "text-red-400 font-bold";
              if (log.includes("[SUCCESS]")) textClass = "text-green-400 font-bold";
              if (log.includes("[EPOCH")) textClass = "text-emerald-300 font-semibold";
              
              return (
                <div key={index} className={`leading-relaxed whitespace-pre-wrap ${textClass}`}>
                  {log}
                </div>
              );
            })}
            
            {consoleLogs.length === 0 && (
              <div className="text-slate-500 italic text-center py-20">
                Console is ready. Training logs will be piped here in real-time when fine-tuning begins.
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
