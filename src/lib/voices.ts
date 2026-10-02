// Wren's ElevenLabs voices. The server only speaks with voices listed here, so the public
// /api/tts route can't be used to spend credits on arbitrary voices. Voice IDs aren't secret.

export type VoiceOption = { key: string; label: string; elevenLabsId: string };

export const VOICES: VoiceOption[] = [
  { key: "jessica", label: "Jessica", elevenLabsId: "r1KmysJdVYZjJCm4mL3b" },
  { key: "jane", label: "Jane", elevenLabsId: "RILOU7YmBhvwJGDGjNmP" },
  { key: "clara", label: "Clara", elevenLabsId: "tMXujoAjiboschVOhAnk" },
];

export const DEFAULT_VOICE_KEY = "jessica";

export function voiceByKey(key: string | undefined | null): VoiceOption | undefined {
  return VOICES.find((v) => v.key === key);
}
