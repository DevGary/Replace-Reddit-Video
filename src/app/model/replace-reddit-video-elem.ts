import { Utils } from "../util/utils";
import { Hls } from "../../lib/hls-js/hls";
import { Level, LEVEL_SWITCHED_Data, MANIFEST_PARSED_Data } from "../../lib/hls-js/util/types";
import { MediaPlaybackListener } from "./interfaces/media-playback-listener";
import { PlayableMediaElement } from "./interfaces/playable-media-element";
const { v4: uuidv4 } = require('uuid');
import '@webcomponents/custom-elements'

// TODO: Refactor so this is only an element 
// Refactor out replacement code, source generation, dont nest original native reddit player in this element
export class ReplaceRedditVideoElem extends HTMLElement implements PlayableMediaElement {

    public static TAG = "replace-reddit-video";
    
    redditVideoElem: Element;

    autoplay: boolean;
    muted: boolean;
    
    forceDirectVideoPlayer: boolean;
    forceHighestQuality: boolean;
    
    videoElem: HTMLVideoElement;
    
    private mediaPlaybackListeners: MediaPlaybackListener[];
    
    constructor(redditVideoElem: Element) {
    
        super();
        
        this.mediaPlaybackListeners = [];
        this.id = uuidv4();
        this.classList.add(ReplaceRedditVideoElem.getReplacementVideoElementContainerClass());
        
        this.redditVideoElem = redditVideoElem;
        
        // TODO
        this.autoplay = false;
        this.muted = true;
    }

    static isTypeOf(elem: Element): elem is ReplaceRedditVideoElem {
        return elem instanceof ReplaceRedditVideoElem;
    }
    
    private getReplacementVideoElementClass() {
        return "replace-reddit-video-video";
    }

    public static getReplacementVideoElementContainerClass() {
        return "replace-reddit-video-container";
    }

    private getReplacedIdentifier() {
        return "replaced-by-replace-reddit-video";
    }
    
    
    private playWithHLSPlayer(redditNativeVideoElem: any, videoUrl: string) {
        let hls = new Hls();

        let videoElem = this.videoElem;
        
        hls.attachMedia(videoElem);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {

            let availableLevels: Level[];
            hls.loadSource(videoUrl);
            console.log(`Attempting to play with HLS: ${videoUrl}`);

            hls.on(Hls.Events.MANIFEST_PARSED, (event: any, data: MANIFEST_PARSED_Data) => {

                availableLevels = data.levels;

                if (this.forceHighestQuality) {
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

                    if (this.forceHighestQuality && data.level !== maxLevel) {

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
                    this.playWithHLSPlayer(redditNativeVideoElem, videoElem.getAttribute("video_url"));
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

    private getRedditVideoUrlFromRedditVideoElem(redditVideoElem: any) {

        let redditNativeVideoElementsSourceHtml = redditVideoElem.getElementsByTagName("source")[0].outerHTML;
        let videoUrl = redditNativeVideoElementsSourceHtml.split("src=\"")[1].split("\"")[0];

        return videoUrl;
    }

    public replace() {

        try {
            let redditVideoElem = this.redditVideoElem;
            
            if (redditVideoElem.classList.contains(this.getReplacementVideoElementClass())) return;

            let videoUrl = this.getRedditVideoUrlFromRedditVideoElem(redditVideoElem);
            this.initReplaceRedditVideoElem();

            this.replaceWithHTMLPlayer(redditVideoElem, videoUrl);

            if (!this.forceDirectVideoPlayer && Utils.isHLSPlaylist(videoUrl) && Hls.isSupported()) {
                this.replaceWithHLSPlayer(redditVideoElem, videoUrl);
            }
            else {
                this.replaceWithHTMLPlayer(redditVideoElem, videoUrl);
            }
        } catch (e) {
        }
    }

    private initReplaceRedditVideoElem() {

        let instance = this;
        
        this.setAttribute("class", ReplaceRedditVideoElem.getReplacementVideoElementContainerClass());

        let videoElem = document.createElement("video");
        
        videoElem.setAttribute("class", `${this.getReplacementVideoElementClass()}`);

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
        videoElem.muted = this.muted;
        videoElem.loop = true;
        videoElem.preload = "metadata";
        videoElem.addEventListener("play", function() {
            instance.onPlay();
        });

        this.appendChild(videoElem);
        
        this.videoElem = videoElem;
    }

    private replaceWithHLSPlayer(redditNativeVideoElem: any, videoUrl: string) {

        this.replaceRedditVideoElem(redditNativeVideoElem);

        this.playWithHLSPlayer(redditNativeVideoElem, videoUrl);
    }


    private replaceWithHTMLPlayer(redditNativeVideoElem: any, videoUrl: string) {

        let videoElem = this.videoElem;
        
        let videoUrlId = Utils.parseRedditVideoIdFromRedditVideoUrl(videoUrl);
        let potentialFallbackUrlSources = Utils.buildPotentialFallbackUrlVideoSources(videoUrlId);

        for (let i = 0; i < potentialFallbackUrlSources.length; i++) {
            videoElem.appendChild(potentialFallbackUrlSources[i]);
        }

        this.replaceRedditVideoElem(redditNativeVideoElem);
    }

    private replaceRedditVideoElem(redditNativeVideoElem: any) {
        // TODO: Find out if there is better way to destroy and cleanup old player?
        if (redditNativeVideoElem.classList.contains(this.getReplacementVideoElementClass())) return;

        this.disableRedditNativeVideoElem(redditNativeVideoElem);
        
        redditNativeVideoElem.parentElement.replaceWith(this);
        
        this.parentElement.append(redditNativeVideoElem);
        
        this.style.height = redditNativeVideoElem.offsetHeight + "px";

        // For some reason, if we completely remove the element, the audio will start/stop playing on scroll.
        // There is probably some function triggered on scroll that re-initializes the video if it is gone 
        redditNativeVideoElem.style.display = "none";
    }
    
    private disableRedditNativeVideoElem(redditNativeVideoElem: any) {
        redditNativeVideoElem.children[0].src = this.getReplacedIdentifier(); // Prevents old player from playing
        redditNativeVideoElem.src = this.getReplacedIdentifier(); // Prevents old player from playing
        // @ts-ignore
        redditNativeVideoElem.play = new function() {}; // Prevents old player from playing
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
