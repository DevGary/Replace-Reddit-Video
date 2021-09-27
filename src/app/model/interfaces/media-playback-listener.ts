export interface MediaPlaybackListener {
    onPlayRequested?(elementId: string): void;
    onPlaying?(elementId: string): void;
    onPaused?(elementId: string): void;
}