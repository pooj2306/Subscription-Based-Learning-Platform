import { useState, useEffect, useRef } from 'react';
import { recordFocusSession } from '../api/engagementApi';

const MODES = {
  POMODORO_25: { label: '25m Pomodoro', minutes: 25, xp: 50, icon: '🍅' },
  DEEP_WORK_50: { label: '50m Deep Work', minutes: 50, xp: 100, icon: '🧠' },
  SHORT_15: { label: '15m Sprint', minutes: 15, xp: 30, icon: '⚡' },
  BREAK_5: { label: '5m Break', minutes: 5, xp: 0, icon: '☕' },
};

// Web Audio Ambient Noise Generator
class AmbientSoundGenerator {
  constructor() {
    this.ctx = null;
    this.noiseNode = null;
    this.gainNode = null;
    this.isPlaying = false;
  }

  start(type = 'brown') {
    if (this.isPlaying) this.stop();
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        if (type === 'brown') {
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.5;
        } else {
          output[i] = white * 0.2;
        }
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.setValueAtTime(0.08, this.ctx.currentTime);

      this.noiseNode.connect(this.gainNode);
      this.gainNode.connect(this.ctx.destination);
      this.noiseNode.start();
      this.isPlaying = true;
    } catch {
      // Audio context might be restricted
    }
  }

  stop() {
    if (this.noiseNode) {
      try { this.noiseNode.stop(); } catch { }
      this.noiseNode.disconnect();
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch { }
    }
    this.isPlaying = false;
  }
}

export default function PomodoroTimer({ courseId, lessonId, onSessionComplete, compact = false }) {
  const [selectedModeKey, setSelectedModeKey] = useState('POMODORO_25');
  const [secondsLeft, setSecondsLeft] = useState(MODES.POMODORO_25.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setIsMinimized] = useState(compact);
  const [ambientSound, setAmbientSound] = useState('off'); // 'off' | 'rain' | 'binaural'
  const [rewardToast, setRewardToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const soundGenRef = useRef(null);

  useEffect(() => {
    soundGenRef.current = new AmbientSoundGenerator();
    return () => {
      soundGenRef.current?.stop();
    };
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isActive && secondsLeft === 0) {
      clearInterval(interval);
      handleFinishSession();
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const handleSelectMode = (key) => {
    setSelectedModeKey(key);
    setIsActive(false);
    setSecondsLeft(MODES[key].minutes * 60);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(MODES[selectedModeKey].minutes * 60);
  };

  const toggleAmbient = (type) => {
    if (ambientSound === type) {
      soundGenRef.current?.stop();
      setAmbientSound('off');
    } else {
      soundGenRef.current?.start(type === 'rain' ? 'brown' : 'white');
      setAmbientSound(type);
    }
  };

  const handleFinishSession = async () => {
    setIsActive(false);
    soundGenRef.current?.stop();
    setAmbientSound('off');

    const mode = MODES[selectedModeKey];
    if (mode.xp === 0) {
      // Break mode ended
      setRewardToast({
        title: 'Break Finished!',
        message: 'Ready to dive back into deep focus?',
        icon: '✨',
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await recordFocusSession({
        duration_minutes: mode.minutes,
        mode: selectedModeKey,
        course_id: courseId || null,
        lesson_id: lessonId || null,
      });

      setRewardToast({
        title: 'Focus Goal Completed! 🎉',
        message: `+${res.data.xp_earned} XP earned! Logged ${mode.minutes} focus minutes to your streak and study group.`,
        icon: '🏆',
      });

      if (onSessionComplete) {
        onSessionComplete(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
      setSecondsLeft(mode.minutes * 60);
    }
  };

  const totalSeconds = MODES[selectedModeKey].minutes * 60;
  const progressPercent = ((totalSeconds - secondsLeft) / totalSeconds) * 100;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Minimized Dock Mode
  if (isMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-slate-700 rounded-2xl shadow-2xl p-3 flex items-center gap-3 transition-all hover:scale-105">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 cursor-pointer font-bold text-sm"
        >
          <span className="text-lg animate-pulse">{MODES[selectedModeKey].icon}</span>
          <span className="font-mono text-base font-extrabold tracking-wider">{formattedTime}</span>
        </button>
        <button
          onClick={toggleTimer}
          className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition ${
            isActive ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-600 hover:bg-brand-700'
          }`}
        >
          {isActive ? '⏸' : '▶'}
        </button>
        <button
          onClick={() => setIsMinimized(false)}
          className="text-slate-400 hover:text-white text-xs px-1"
          title="Expand"
        >
          ↗
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-7 shadow-xl border border-slate-800 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-200 flex items-center justify-center text-base">
            ⏱️
          </span>
          <div>
            <h3 className="font-extrabold text-sm md:text-base tracking-tight leading-none text-white">
              Focus Mode & Pomodoro
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Track actual study time & earn XP
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition cursor-pointer"
          title="Minimize to dock"
        >
          _ Dock
        </button>
      </div>

      {/* Mode Presets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6 relative z-10">
        {Object.entries(MODES).map(([key, config]) => {
          const isSelected = selectedModeKey === key;
          return (
            <button
              key={key}
              onClick={() => handleSelectMode(key)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                isSelected
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20 border border-brand-400/40'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/5'
              }`}
            >
              <span>{config.icon}</span>
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timer Circular Display */}
      <div className="flex flex-col items-center justify-center my-4 relative z-10">
        <div className="relative w-44 h-44 flex items-center justify-center">
          {/* Circular SVG Track */}
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="88"
              cy="88"
              r="76"
              stroke="currentColor"
              strokeWidth="8"
              className="text-slate-800"
              fill="transparent"
            />
            <circle
              cx="88"
              cy="88"
              r="76"
              stroke="currentColor"
              strokeWidth="8"
              className="text-brand-500 transition-all duration-1000 ease-linear"
              strokeDasharray={2 * Math.PI * 76}
              strokeDashoffset={2 * Math.PI * 76 * (1 - progressPercent / 100)}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          {/* Time digits */}
          <div className="absolute flex flex-col items-center">
            <span className="font-mono text-4xl md:text-5xl font-black tracking-wider drop-shadow-md text-white">
              {formattedTime}
            </span>
            <span className="text-xs text-slate-400 font-semibold mt-1">
              {isActive ? '⚡ Focused Session' : 'Ready to start'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-4 relative z-10">
        <button
          onClick={toggleTimer}
          className={`px-6 py-3 rounded-2xl font-black text-sm transition-all transform active:scale-95 flex items-center gap-2 cursor-pointer shadow-lg ${
            isActive
              ? 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-amber-500/20'
              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20'
          }`}
        >
          <span>{isActive ? '⏸ Pause' : '▶ Start Focus'}</span>
        </button>

        <button
          onClick={resetTimer}
          className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-bold transition cursor-pointer"
          title="Reset timer"
        >
          ↺ Reset
        </button>

        {isActive && (
          <button
            onClick={handleFinishSession}
            disabled={submitting}
            className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
          >
            {submitting ? 'Logging...' : '✓ Finish Early'}
          </button>
        )}
      </div>

      {/* Ambient Sound Bar */}
      <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 relative z-10">
        <span className="flex items-center gap-1.5 font-semibold">
          🎧 Ambient Sound:
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => toggleAmbient('rain')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
              ambientSound === 'rain'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            🌧️ Soft Rain
          </button>
          <button
            onClick={() => toggleAmbient('binaural')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
              ambientSound === 'binaural'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            🌊 Deep Flow
          </button>
          {ambientSound !== 'off' && (
            <button
              onClick={() => toggleAmbient(ambientSound)}
              className="text-rose-400 hover:text-rose-300 text-[11px] font-bold cursor-pointer"
            >
              Mute
            </button>
          )}
        </div>
      </div>

      {/* Reward Notification Banner */}
      {rewardToast && (
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 border border-indigo-500/40 text-slate-100 text-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{rewardToast.icon}</span>
            <div>
              <p className="font-bold text-white text-sm">{rewardToast.title}</p>
              <p className="text-slate-300 text-[11px] mt-0.5">{rewardToast.message}</p>
            </div>
          </div>
          <button
            onClick={() => setRewardToast(null)}
            className="text-slate-400 hover:text-white font-black text-sm px-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
