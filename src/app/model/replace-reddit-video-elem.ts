import { Level, LEVEL_SWITCHED_Data, MANIFEST_PARSED_Data } from "../util/types";
import { MediaPlaybackListener } from "./interfaces/media-playback-listener";
import { PlayableMediaElement } from "./interfaces/playable-media-element";
const { v4: uuidv4 } = require('uuid');

import '@webcomponents/custom-elements'

const Hls = require('hls.js')
// @ts-ignore
import { BufferAppendingData } from "hls.js";

export class ReplaceRedditVideoElem extends HTMLElement implements PlayableMediaElement {

    public static TAG = "replace-reddit-video";
    public static PLAYER_TAG = "replace-reddit-video-player";
    
    autoplay: boolean;
    muted: boolean;
    forceMaxQuality: boolean;
    
    videoElem: HTMLVideoElement;
    
    private mediaPlaybackListeners: MediaPlaybackListener[];

    static isTypeOf(elem: Element): elem is ReplaceRedditVideoElem {
        return elem instanceof ReplaceRedditVideoElem;
    }

    constructor(autoplay: boolean, muted: boolean, forceHlsMaxQuality: boolean) {
        super();
        
        this.mediaPlaybackListeners = [];
        this.id = uuidv4();
        this.classList.add(ReplaceRedditVideoElem.TAG);
        
        this.autoplay = autoplay;
        this.muted = muted;
        this.forceMaxQuality = forceHlsMaxQuality;
        
        this.init();
    }

    private init() {

        let instance = this;

        let videoElem = document.createElement("video");

        videoElem.setAttribute("class", `${ReplaceRedditVideoElem.PLAYER_TAG}`);

        // Always show controls if not autoplaying
        if (!this.autoplay) {
            videoElem.controls = true;
        }
        else {
            videoElem.addEventListener("mouseover", function () {
                videoElem.controls = true;
            }, false);
        }

        videoElem.autoplay = this.autoplay;
        videoElem.volume = 0.5;
        videoElem.muted = this.muted;
        videoElem.loop = true;
        videoElem.preload = "metadata";
        videoElem.addEventListener("play", function() {
            instance.onPlay();
        });

        this.appendChild(videoElem);

        this.videoElem = videoElem;
    }

    public setupForHLSVideo(hlsVideoUrl: string) {
        
        // TODO: DEBUG ONLY
        // hlsVideoUrl = "https://v.redd.it/cm7xn5rinen71/HLSPlaylist.m3u8?a=1634215314%2CZTAzMzg4YzRkNTY4MjBlODFmNGQyNWY2NDQxMTk2MjFkZjZmYjcwYWEzZGU0ZDU3MTcwZjc2YTJiZmVjN2YyZA%3D%3D&amp;v=1&amp;f=hd";
        console.log("Setting up for HLS Video")
        
        let hls = new Hls();

        let videoElem = this.videoElem;
        
        hls.attachMedia(videoElem);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {

            let availableLevels: Level[];
            hls.loadSource(hlsVideoUrl);
            console.log(`Attempting to play with HLS: ${hlsVideoUrl}`);

            hls.on(Hls.Events.MANIFEST_PARSED, (event: any, data: MANIFEST_PARSED_Data) => {

                availableLevels = data.levels;

                if (this.forceMaxQuality) {
                    if (data.levels !== undefined) {
                        hls.firstLevel = data.levels.length - 1;
                    }
                }

                if (videoElem.autoplay) {
                    this.play();
                }

                if (!this.muted) {
                    setTimeout(function () {
                        videoElem.muted = false;
                    }, 250);
                }
            })

            hls.on(Hls.Events.LEVEL_SWITCHED, (event: any, data: LEVEL_SWITCHED_Data) => {

                if (availableLevels !== undefined) {

                    let maxLevel = availableLevels.length - 1;

                    console.log(`Trying to switch to level ${data.level}`);

                    if (this.forceMaxQuality && data.level !== maxLevel) {

                        console.log(`Forced to switch to max level ${maxLevel}`);
                        hls.currentLevel = availableLevels.length - 1;
                    }
                    else {
                        console.log(`Switched to level ${data.level}`);
                    }
                }
            })

            hls.on(Hls.Events.ERROR, function (event: any, data: { details: string; fatal: any; type: any; }) {
                console.log("HLS ERROR:");
                console.table(data);

                // TODO: Investigate this. 
                // Sometimes the player encounters a levelLoadError and cannot recover so the current solution is to reinitialize the player
                // I have only encountered it in the feed and I have autoplay on so perhaps the hacky auto play/pause code is causing issues
                if (data.details === "levelLoadError") {
                    console.log('levelLoadError encountered, trying to reinitiate hls player');
                    hls.destroy();
                    this.playWithHLSPlayer(videoElem.getAttribute("video_url"));
                }
                else if (data.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // try to recover network error
                            console.log('fatal network error encountered, try to recover');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.log('fatal media error encountered, try to recover');
                            hls.recoverMediaError();
                            break;
                        default:
                            console.log('fatal network error encountered, cannot recover');
                            hls.destroy();
                            break;
                    }
                }
            });
        });
    }

    public setupForHTML5Video(videoSources: HTMLSourceElement[]) {
        console.log("Setting up for HTML 5 Video")

        for (let i = 0; i < videoSources.length; i++) {
            this.videoElem.appendChild(videoSources[i]);
        }
    }

    addMediaPlaybackListener(mediaPlaybackListener: MediaPlaybackListener) {
        this.mediaPlaybackListeners.push(mediaPlaybackListener);
    }
    
    play(): void {
        this.mediaPlaybackListeners.forEach(l => {
            l.onPlayRequested(this.id);
        });

        this.videoElem?.play().then(r => {
            
            this.onPlay();
        })
    }

    private onPlay() {
        this.mediaPlaybackListeners.forEach(l => {
            try {
                l.onPlaying(this.id);
            }
            catch (e) {

            }
        })
    }
    
    pause(): void {

        this.videoElem?.pause();

        this.mediaPlaybackListeners.forEach(l => {
            try {
                l.onPaused(this.id);
            }
            catch (e) {
                
            }
        })
    }
}

customElements.define(ReplaceRedditVideoElem.TAG, ReplaceRedditVideoElem);
