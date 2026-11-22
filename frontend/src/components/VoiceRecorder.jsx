import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, RotateCcw, Volume2, AlertCircle, Loader2 } from 'lucide-react';

const VoiceRecorder = ({ onAudioRecorded, isSubmitting, onSwitchToText }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [permissionError, setPermissionError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const audioPlayerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    setPermissionError(null);
    audioChunksRef.current = [];
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setAudioBlob(null);
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support audio recording. Please switch to text mode.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        // Pass blob and duration to parent
        onAudioRecorded(blob, recordingDuration);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250); // Slice every 250ms
      setIsRecording(true);
      setRecordingDuration(0);

      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone error:', err);
      let msg = 'Microphone permission denied or microphone is not available.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Please allow microphone access in your browser settings, or switch to text mode.';
      } else if (err.message) {
        msg = err.message;
      }
      setPermissionError(msg);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const resetRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    onAudioRecorded(null, 0);
  };

  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins}:${rem < 10 ? '0' : ''}${rem}`;
  };

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white space-y-5 border border-slate-800 shadow-inner">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Voice Answer Mode
          </span>
        </div>
        <button
          type="button"
          onClick={onSwitchToText}
          className="text-xs text-indigo-300 hover:text-white transition underline underline-offset-2"
        >
          Switch to Text Answer
        </button>
      </div>

      {permissionError ? (
        <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Microphone Unavailable</p>
            <p>{permissionError}</p>
            <button
              type="button"
              onClick={onSwitchToText}
              className="mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold text-[11px] transition"
            >
              Use Text Answer Instead
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 space-y-4">
          {/* Animated Waveform / Pulse Indicator */}
          {isRecording ? (
            <div className="flex items-center gap-1.5 h-12">
              {[40, 70, 95, 60, 85, 50, 90, 75, 45].map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-rose-500 rounded-full animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDuration: `${0.4 + (i % 3) * 0.2}s`
                  }}
                />
              ))}
            </div>
          ) : audioUrl ? (
            <div className="text-center space-y-2">
              <span className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> Recording Ready ({formatTime(recordingDuration)})
              </span>
              <audio
                ref={audioPlayerRef}
                src={audioUrl}
                controls
                className="w-full max-w-sm rounded-lg h-9"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-slate-400">
              <Mic className="w-7 h-7" />
            </div>
          )}

          {/* Timer Display */}
          <div className="text-2xl font-black font-mono tracking-wider">
            {formatTime(recordingDuration)}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {!isRecording && !audioUrl && (
              <button
                type="button"
                onClick={startRecording}
                disabled={isSubmitting}
                className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition disabled:opacity-50"
              >
                <Mic className="w-4 h-4" /> Start Recording
              </button>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs flex items-center gap-2 border border-slate-700 shadow-md transition animate-pulse"
              >
                <Square className="w-4 h-4 text-rose-400" /> Stop Recording
              </button>
            )}

            {audioUrl && !isRecording && (
              <button
                type="button"
                onClick={resetRecording}
                disabled={isSubmitting}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Re-record
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-400 text-center max-w-sm">
            Speak naturally. Your answer will be transcribed and analyzed for communication pacing and key technical concepts.
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
