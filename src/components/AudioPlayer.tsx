'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PodcastDialogueLine } from '../lib/types';
import { audioPlayerEngine, VoiceStatus } from '../lib/tts-engine';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download,
  SkipBack,
  SkipForward,
  Volume2,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Check,
  Radio
} from 'lucide-react';

interface AudioPlayerProps {
  dialogue: PodcastDialogueLine[];
  title: string;
  onGenerateNew?: () => void;
  isGenerating?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  dialogue,
  title,
  onGenerateNew,
  isGenerating = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);

  // Voice selection and state
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hostAVoiceUri, setHostAVoiceUri] = useState<string>('');
  const [hostBVoiceUri, setHostBVoiceUri] = useState<string>('');
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus | null>(null);

  // Synchronize available voices from audio engine
  useEffect(() => {
    const updateVoices = () => {
      const vList = audioPlayerEngine.getEnglishVoices();
      setVoices(vList);
      setHostAVoiceUri(audioPlayerEngine.getHostVoiceURI('host_a'));
      setHostBVoiceUri(audioPlayerEngine.getHostVoiceURI('host_b'));
      setVoiceStatus(audioPlayerEngine.getVoiceStatus());
    };

    updateVoices();
    const unsubscribe = audioPlayerEngine.subscribeVoicesChanged(updateVoices);

    return () => {
      unsubscribe();
    };
  }, []);

  // Sync state and stop audio on unmount or when dialogue changes
  useEffect(() => {
    audioPlayerEngine.stop();
    setCurrentLineIndex(0);
    setIsPlaying(false);

    return () => {
      audioPlayerEngine.stop();
    };
  }, [dialogue]);

  const handlePlayToggle = () => {
    if (isPlaying) {
      audioPlayerEngine.pause();
      setIsPlaying(false);
    } else {
      if (audioPlayerEngine.isPaused()) {
        audioPlayerEngine.resume();
        setIsPlaying(true);
      } else {
        audioPlayerEngine.playPodcast(
          dialogue,
          currentLineIndex,
          (lineIndex) => setCurrentLineIndex(lineIndex),
          (playing) => setIsPlaying(playing)
        );
        setIsPlaying(true);
      }
    }
  };

  const handleReset = () => {
    audioPlayerEngine.stop();
    setCurrentLineIndex(0);
    setIsPlaying(false);
  };

  const handlePrevLine = () => {
    if (currentLineIndex > 0) {
      const prevIdx = currentLineIndex - 1;
      setCurrentLineIndex(prevIdx);
      audioPlayerEngine.goToLine(prevIdx);
    }
  };

  const handleNextLine = () => {
    if (currentLineIndex < dialogue.length - 1) {
      const nextIdx = currentLineIndex + 1;
      setCurrentLineIndex(nextIdx);
      audioPlayerEngine.goToLine(nextIdx);
    }
  };

  const cycleSpeed = () => {
    const speeds = [1.0, 1.25, 1.5];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIndex];
    setPlaybackRate(nextRate);
    audioPlayerEngine.setRate(nextRate);
  };

  const downloadTranscript = () => {
    const text = dialogue.map(d => `${d.speaker}:\n${d.text}\n`).join('\n');
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Orion_Discussion_${title.replace(/\W+/g, '_')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Estimate total runtime
  const totalEstimatedSeconds = useMemo(() => {
    return dialogue.reduce((acc, curr) => acc + (curr.duration || 6), 0);
  }, [dialogue]);

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentSpeaker = dialogue[currentLineIndex]?.speaker || 'Host A (Alex)';
  const isAlex = currentSpeaker.toLowerCase().includes('alex') || currentSpeaker.toLowerCase().includes('host a');

  return (
    <div className="space-y-3 w-full">
      {/* Player Card */}
      <div className="rounded-2xl p-4 bg-surface-card border border-surface-border shadow-sm space-y-3.5">
        {/* Header Info */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-foreground truncate" title={title}>
              {title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5 text-[10px] text-foregroundMuted font-mono">
              <span className="flex items-center gap-1 text-foregroundSubtle">
                <Radio className="w-3 h-3 text-accent" />
                2 Speakers
              </span>
              <span>•</span>
              <span>{dialogue.length} turns</span>
              <span>•</span>
              <span>~{formatDuration(totalEstimatedSeconds)}</span>
            </div>
          </div>

          {/* Clean Voice Settings Trigger */}
          {voiceStatus && (
            <button 
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-surface-panel hover:bg-surface-hover border border-surface-border text-[11px] font-medium text-foregroundSubtle hover:text-foreground transition-colors cursor-pointer"
              title="Configure speakers and voices"
            >
              Voices
            </button>
          )}
        </div>

        {/* Waveform Scrubber */}
        <div className="space-y-1">
          <div className="h-8 flex items-center justify-between gap-1 px-2.5 py-1 bg-surface-panel/80 rounded-xl border border-surface-border">
            {Array.from({ length: 32 }).map((_, idx) => {
              const fraction = idx / 32;
              const lineTargetIdx = Math.floor(fraction * dialogue.length);
              const isPastOrCurrent = lineTargetIdx <= currentLineIndex;
              const isTurnActive = lineTargetIdx === currentLineIndex;

              const waveHeight = isPlaying
                ? Math.max(25, Math.sin(idx * 0.7 + currentLineIndex * 1.5) * 45 + 50)
                : Math.max(20, Math.sin(idx * 0.5) * 30 + 35);

              return (
                <div
                  key={idx}
                  onClick={() => {
                    const target = Math.min(lineTargetIdx, dialogue.length - 1);
                    setCurrentLineIndex(target);
                    audioPlayerEngine.goToLine(target);
                  }}
                  className={`flex-1 rounded-full cursor-pointer transition-all duration-150 ${
                    isTurnActive && isPlaying
                      ? 'bg-accent shadow-xs'
                      : isPastOrCurrent
                      ? 'bg-accent/70'
                      : 'bg-surface-borderHover opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    height: `${waveHeight}%`,
                  }}
                  title={`Jump to turn ${lineTargetIdx + 1}`}
                />
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[10px] text-foregroundMuted px-1 font-mono">
            <span>
              Turn {currentLineIndex + 1} of {dialogue.length} ({isAlex ? 'Alex' : 'Sam'})
            </span>
            <span>{isPlaying ? 'Playing' : 'Paused'}</span>
          </div>
        </div>

        {/* Primary Controls Row */}
        <div className="flex items-center justify-between pt-1">
          {/* Main Playback Cluster */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevLine}
              disabled={currentLineIndex === 0}
              className="p-2 rounded-xl bg-surface-panel hover:bg-surface-hover border border-surface-border text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Turn"
              aria-label="Previous Turn"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>

            {/* High-Visibility, Clean Play/Pause Button */}
            <button
              onClick={handlePlayToggle}
              disabled={dialogue.length === 0}
              className="w-10 h-10 rounded-full bg-accent hover:bg-accentHover text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-white text-white" />
              ) : (
                <Play className="w-4 h-4 ml-0.5 fill-white text-white" />
              )}
            </button>

            <button
              onClick={handleNextLine}
              disabled={currentLineIndex >= dialogue.length - 1}
              className="p-2 rounded-xl bg-surface-panel hover:bg-surface-hover border border-surface-border text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Next Turn"
              aria-label="Next Turn"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleReset}
              className="p-2 rounded-xl bg-surface-panel hover:bg-surface-hover border border-surface-border text-foregroundMuted hover:text-foreground transition-colors cursor-pointer"
              title="Reset to beginning"
              aria-label="Reset to beginning"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Secondary Controls Cluster */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={cycleSpeed}
              className="px-2.5 py-1.5 rounded-xl bg-surface-panel hover:bg-surface-hover text-xs font-mono border border-surface-border text-foreground transition-colors cursor-pointer"
              title="Playback speed"
            >
              {playbackRate}x
            </button>

            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                showVoiceSettings
                  ? 'bg-accent/15 border-accent text-accent'
                  : 'bg-surface-panel hover:bg-surface-hover border-surface-border text-foreground'
              }`}
              title="Speaker Voices"
              aria-label="Speaker Voices"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Voices</span>
              {showVoiceSettings ? (
                <ChevronUp className="w-3 h-3 opacity-60" />
              ) : (
                <ChevronDown className="w-3 h-3 opacity-60" />
              )}
            </button>

            <button
              onClick={downloadTranscript}
              className="p-2 rounded-xl bg-surface-panel hover:bg-surface-hover border border-surface-border text-foregroundMuted hover:text-foreground transition-colors cursor-pointer"
              title="Download Transcript"
              aria-label="Download Transcript"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Regenerate Action Row: Professional & Understated */}
        {onGenerateNew && (
          <button
            onClick={onGenerateNew}
            disabled={isGenerating}
            className="w-full mt-2 py-2 px-3 rounded-xl bg-surface-panel hover:bg-surface-hover border border-surface-border hover:border-surface-borderHover text-xs font-medium flex items-center justify-center gap-2 transition-all text-foregroundSubtle hover:text-foreground disabled:opacity-50 cursor-pointer shadow-xs"
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-3.5 h-3.5 animate-spin text-accent" />
                <span>Generating New Discussion...</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5 opacity-70" />
                <span>Regenerate Discussion</span>
              </>
            )}
          </button>
        )}

        {/* Voice Settings Drawer */}
        {showVoiceSettings && (
          <div className="pt-3 border-t border-surface-border space-y-3 text-xs animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] text-foregroundSubtle">
              <span className="font-semibold text-foreground">Speaker Voice Settings</span>
              <span className="font-mono text-[10px] text-foregroundMuted">
                Host A &amp; Host B
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Host A (Alex) Voice Selector */}
              <div className="p-2.5 rounded-xl bg-surface-panel border border-surface-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    Host A (Alex)
                  </span>
                  <button
                    type="button"
                    onClick={() => audioPlayerEngine.previewVoice('host_a')}
                    className="px-2 py-0.5 rounded-md bg-surface-base hover:bg-surface-hover border border-surface-border text-[10px] text-foregroundSubtle hover:text-foreground transition-colors cursor-pointer"
                    title="Preview Alex voice"
                  >
                    Test
                  </button>
                </div>
                <select
                  value={hostAVoiceUri}
                  onChange={(e) => {
                    const uri = e.target.value;
                    audioPlayerEngine.setHostVoice('host_a', uri);
                    setHostAVoiceUri(audioPlayerEngine.getHostVoiceURI('host_a'));
                    setHostBVoiceUri(audioPlayerEngine.getHostVoiceURI('host_b'));
                    setVoiceStatus(audioPlayerEngine.getVoiceStatus());
                  }}
                  className="w-full bg-surface-base border border-surface-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accent truncate"
                >
                  {voices.length === 0 ? (
                    <option value="">Default System Voice</option>
                  ) : (
                    voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Host B (Sam) Voice Selector */}
              <div className="p-2.5 rounded-xl bg-surface-panel border border-surface-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-foreground flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Host B (Sam)
                  </span>
                  <button
                    type="button"
                    onClick={() => audioPlayerEngine.previewVoice('host_b')}
                    className="px-2 py-0.5 rounded-md bg-surface-base hover:bg-surface-hover border border-surface-border text-[10px] text-foregroundSubtle hover:text-foreground transition-colors cursor-pointer"
                    title="Preview Sam voice"
                  >
                    Test
                  </button>
                </div>
                <select
                  value={hostBVoiceUri}
                  onChange={(e) => {
                    const uri = e.target.value;
                    audioPlayerEngine.setHostVoice('host_b', uri);
                    setHostAVoiceUri(audioPlayerEngine.getHostVoiceURI('host_a'));
                    setHostBVoiceUri(audioPlayerEngine.getHostVoiceURI('host_b'));
                    setVoiceStatus(audioPlayerEngine.getVoiceStatus());
                  }}
                  className="w-full bg-surface-base border border-surface-border rounded-lg px-2 py-1 text-xs text-foreground focus:outline-none focus:border-accent truncate"
                >
                  {voices.length === 0 ? (
                    <option value="">Default System Voice</option>
                  ) : (
                    voices.map((v) => (
                      <option key={v.voiceURI} value={v.voiceURI}>
                        {v.name} ({v.lang})
                      </option>
                    ))
                  )}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Synchronized Script Stream */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {dialogue.map((line, idx) => {
          const isCurrent = currentLineIndex === idx && isPlaying;
          const isLineAlex = line.speaker.toLowerCase().includes('alex') || line.speaker.toLowerCase().includes('host a');

          return (
            <div
              key={line.id}
              onClick={() => {
                setCurrentLineIndex(idx);
                audioPlayerEngine.playPodcast(
                  dialogue,
                  idx,
                  (lineIdx) => setCurrentLineIndex(lineIdx),
                  (playing) => setIsPlaying(playing)
                );
              }}
              className={`p-3 rounded-2xl border transition-all cursor-pointer group ${
                isCurrent
                  ? 'bg-accent/10 border-accent shadow-sm'
                  : 'bg-surface-panel hover:bg-surface-hover border-surface-border opacity-85 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isLineAlex 
                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30' 
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                }`}>
                  {line.speaker}
                </span>

                <span className="text-[10px] font-mono text-foregroundMuted">
                  {isCurrent ? (
                    <span className="text-accent font-semibold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      Active
                    </span>
                  ) : (
                    `Turn ${idx + 1}`
                  )}
                </span>
              </div>

              <p className={`text-xs leading-relaxed ${isCurrent ? 'text-foreground font-medium' : 'text-foregroundSubtle'}`}>
                {line.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
