// lib/utils/permissions.ts

export async function requestMicPermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop tracks immediately — we just need the permission grant
    stream.getTracks().forEach(t => t.stop());
    return true;
  } catch (err) {
    console.warn('Microphone permission denied:', err);
    return false;
  }
}

export async function getMicStream(constraints?: MediaTrackConstraints): Promise<MediaStream | null> {
  try {
    return await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,  // must be off for musical analysis
        noiseSuppression: false,
        autoGainControl: false,
        sampleRate: 44100,
        ...constraints,
      },
    });
  } catch {
    return null;
  }
}
