// Speech recognition hook — wraps expo-speech-recognition into
// a clean, reusable interface.
//
// Think of this like a "translator" that sits between your
// phone's microphone and your app. You speak, and it:
// 1. Captures the audio (saved as a .wav file)
// 2. Converts speech to text in real-time (interim results)
// 3. Gives you the final transcript when you stop
//
// Usage:
//   const { start, stop, transcript, isRecording, audioUri } = useSpeechRecognition();
//   // Tap mic → start()
//   // Show transcript on screen while recording
//   // Tap stop → stop()
//   // Use audioUri to upload the recording, transcript for the text

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

interface UseSpeechRecognitionOptions {
  /**
   * Hint strings to bias the speech engine toward specific words
   * (e.g. children's names). Callers should memoize this array
   * with useMemo to avoid unnecessary useCallback recreation.
   *
   * - iOS: maps to SFSpeechRecognitionRequest.contextualStrings
   * - Android: maps to EXTRA_BIASING_STRINGS (API 33+)
   */
  contextualStrings?: string[];
}

interface UseSpeechRecognitionResult {
  /** Start listening. Requests permissions if needed. */
  start: () => Promise<void>;
  /** Stop listening and finalize the transcript. */
  stop: () => void;
  /** The current transcript — updates in real-time as you speak. */
  transcript: string;
  /** Whether the mic is actively listening. */
  isRecording: boolean;
  /** The local file path of the recorded audio (available after stop). */
  audioUri: string | null;
  /** Any error that occurred during recording. */
  error: string | null;
  /** Reset everything back to initial state (for re-recording). */
  reset: () => void;
}

export function useSpeechRecognition(
  options?: UseSpeechRecognitionOptions,
): UseSpeechRecognitionResult {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Accumulates finalized (done) speech segments across pauses.
  // Using a ref instead of state so the event handler always
  // reads the latest value — no stale closure problem.
  // Think of it like a "finished pile" of transcript pages.
  const finalizedRef = useRef('');

  // ─── Event Listeners ──────────────────────────────────
  //
  // These hooks automatically register/unregister listeners
  // when the component mounts/unmounts. They're provided by
  // expo-speech-recognition and work like React's useEffect.

  // Fired when the recognition engine starts listening.
  useSpeechRecognitionEvent('start', () => {
    setIsRecording(true);
    setError(null);
  });

  // Fired when the recognition engine stops (either by
  // calling stop() or when it times out).
  useSpeechRecognitionEvent('end', () => {
    setIsRecording(false);
  });

  // Fired whenever the engine has new text to show.
  // `event.isFinal` means the engine is confident and done
  // processing that chunk. Interim results (isFinal=false)
  // are "best guesses" that may change.
  //
  // In continuous mode, each pause creates a NEW segment —
  // previous segments are NOT included in the event. So we
  // accumulate finalized segments in `finalizedRef` and
  // always show: [all finished segments] + [current segment].
  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (!text) return;

    if (event.isFinal) {
      // This segment is done — add it to the finished pile.
      // Add a space between segments so words don't smash together.
      finalizedRef.current = finalizedRef.current
        ? `${finalizedRef.current} ${text}`
        : text;
      setTranscript(finalizedRef.current);
    } else {
      // Still in-progress — show the pile + what they're saying now.
      setTranscript(
        finalizedRef.current
          ? `${finalizedRef.current} ${text}`
          : text
      );
    }
  });

  // Fired if something goes wrong — mic access denied,
  // network error (for cloud recognition), etc.
  useSpeechRecognitionEvent('error', (event) => {
    setError(event.message);
    setIsRecording(false);
  });

  // Fired when the audio file is done being written.
  // Before this event, the file may be incomplete.
  useSpeechRecognitionEvent('audioend', (event) => {
    if (event.uri) {
      setAudioUri(event.uri);
    }
  });

  // ─── Actions ──────────────────────────────────────────

  const start = useCallback(async () => {
    // Reset state from any previous recording
    finalizedRef.current = '';
    setTranscript('');
    setAudioUri(null);
    setError(null);

    // Check permissions first. On iOS, this triggers the
    // native "Allow microphone?" and "Allow speech recognition?"
    // dialogs if the user hasn't already granted them.
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      setError('Microphone permission is required to record.');
      return;
    }

    // Start the recognition engine with our config:
    ExpoSpeechRecognitionModule.start({
      lang: 'en-US',

      // Show text as the user speaks (not just at the end).
      interimResults: true,

      // Keep listening until we call stop() — don't auto-stop
      // after a pause in speech.
      continuous: true,

      // Add periods and commas automatically.
      addsPunctuation: true,

      // Bias the speech engine toward children's names so it
      // recognizes "Xiomara" instead of guessing "see a Mara."
      // If empty/undefined, the engine uses default vocabulary.
      ...(options?.contextualStrings?.length && {
        contextualStrings: options.contextualStrings,
      }),

      // Save the audio to a local file so we can upload it
      // to Supabase Storage later.
      recordingOptions: {
        persist: true,
        outputFileName: `recording_${Date.now()}.wav`,
      },
    });
  }, [options?.contextualStrings]);

  const stop = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const reset = useCallback(() => {
    finalizedRef.current = '';
    setTranscript('');
    setAudioUri(null);
    setError(null);
    setIsRecording(false);
  }, []);

  return {
    start,
    stop,
    transcript,
    isRecording,
    audioUri,
    error,
    reset,
  };
}
