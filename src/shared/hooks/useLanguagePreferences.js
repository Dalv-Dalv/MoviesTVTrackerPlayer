import { useEffect, useRef } from 'react';
import { useSetting } from '../store/useSettingsStore';
import { VideoPlayer } from '../services/VideoEngine';

export function useLanguagePreferences(audio, subs) {
    const [audioSettings] = useSetting('audio', null);
    const pickedBestAudio = useRef(false);
    useEffect(() => {
        if (pickedBestAudio.current || !audio || !audio.tracks?.length || !audioSettings) return;

        for (const track of audio.tracks) {
            if (track.lang !== audioSettings.preferredLanguage) continue;

            if (track.selected) break;

            VideoPlayer.setAudioTrack(track.id);
            break;
        }

        pickedBestAudio.current = true;
    }, [audio, audioSettings]);

    const [subtitleSettings] = useSetting('subtitles', null);
    const pickedBestSubs = useRef(false);
    useEffect(() => {
        if (pickedBestSubs.current || !subs || !subs.tracks?.length || !subtitleSettings) return;

        let bestPickId = null;

        for (const track of subs.tracks) {
            if (track.lang !== subtitleSettings.preferredLanguage) continue;

            if (track.selected) break;

            if (track['hearing-impaired'] === subtitleSettings.preferClosedCaptions) {
                bestPickId = track.id;
                break;
            }

            if (bestPickId !== null) continue;
            bestPickId = track.id;
        }

        if (bestPickId != null) VideoPlayer.setSubtitleTrack(bestPickId);

        pickedBestSubs.current = true;
    }, [subs, subtitleSettings]);
}
