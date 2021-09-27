import { PostElemWrapperBase } from "./post-elem-wrapper-base";
import { PostElemWrapperType } from "./post-elem-wrapper-type";
import { ReplaceRedditVideoElem } from "./replace-reddit-video-elem";
import { Utils } from "../util/utils";
import { Constants } from "../util/constants";
const Hls = require('hls.js')

export class RedditVideoPostElemWrapper extends PostElemWrapperBase {

    public forceDirectVideoPlayer = false;
    public autoplay = true;
    public muted = false;
    public forceHighestQuality = true;

    public getRedditNativeVideoElem(): Element {
        return this.postElem.getElementsByTagName("video").item(0);
    }
  
    getPostElemWrapperType(): PostElemWrapperType {
        return PostElemWrapperType.Reddit_Video;
    }

    static isTypeOf(elem: PostElemWrapperBase): elem is RedditVideoPostElemWrapper {
        return elem instanceof RedditVideoPostElemWrapper;
    }

    public shouldReplace(): boolean {
        if (this.isAlreadyReplaced()) return false;
        if (!this.isHlsPlaylist()) return false;
        
        return true;
    }
    
    private isHlsPlaylist(): boolean {
        let videoUrl = this.getRedditVideoUrlFromRedditVideoElem(this.getRedditNativeVideoElem());
        return Utils.isHLSPlaylist(videoUrl);
    }

    public isAlreadyReplaced(): boolean {
        return this.getReplaceRedditVideoElem() !== undefined;
    }

    public getReplaceRedditVideoElem(): ReplaceRedditVideoElem {
        let elems = this.postElem.getElementsByTagName(ReplaceRedditVideoElem.TAG);

        if (elems.length > 0) {
            return elems[0] as ReplaceRedditVideoElem;
        }
        else {
            return undefined;
        }
    }

    public replaceRedditVideoPlayer() {
        console.log(`Replacing Reddit Video Player for postId: ${this.getPostId()}`);

        let replaceRedditVideoElem = new ReplaceRedditVideoElem(this.autoplay, this.muted, this.forceHighestQuality);
        this.replace(this.getRedditNativeVideoElem(), replaceRedditVideoElem);
    }

    private getRedditVideoUrlFromRedditVideoElem(redditVideoElem: any) {

        let redditNativeVideoElementsSourceHtml = redditVideoElem.getElementsByTagName("source")[0].outerHTML;
        return redditNativeVideoElementsSourceHtml.split("src=\"")[1].split("\"")[0];
    }

    public replace(redditNativeVideoElem: any, replaceRedditVideoElem: ReplaceRedditVideoElem) {

        if (this.isAlreadyReplaced()) return;
 
        try {
            
            let videoUrl = this.getRedditVideoUrlFromRedditVideoElem(redditNativeVideoElem);
            
            this.replaceRedditNativeVideoElem(redditNativeVideoElem, replaceRedditVideoElem);

            if (!this.forceDirectVideoPlayer && Utils.isHLSPlaylist(videoUrl) && Hls.isSupported()) {

                replaceRedditVideoElem.setupForHLSVideo(videoUrl);
            }
            else {

                if (Utils.isHLSPlaylist(videoUrl)) {
                    let videoUrlId = Utils.parseRedditVideoIdFromRedditVideoUrl(videoUrl);
                    let potentialFallbackUrlSources = Utils.buildPotentialFallbackUrlVideoSources(videoUrlId);

                    debugger;
                    replaceRedditVideoElem.setupForHTML5Video(potentialFallbackUrlSources);
                }
                else {
                    debugger;
                    replaceRedditVideoElem.setupForHTML5Video([Utils.buildVideoSource(videoUrl.replace("&amp;", "&"))]);
                }
            }
        } catch (e) {
            debugger;
            console.error(e);
        }
    }

    private replaceRedditNativeVideoElem(redditNativeVideoElem: any, replaceRedditVideoElem: ReplaceRedditVideoElem) {
        // TODO: Find out if there is better way to destroy and cleanup old player?
        if (this.isAlreadyReplaced()) return;
        
        this.disableRedditNativeVideoElem(redditNativeVideoElem);

        let height = Math.max(redditNativeVideoElem.offsetHeight, redditNativeVideoElem.height);
        replaceRedditVideoElem.style.height = height + "px";

        let redditNativeVideoParentElem = redditNativeVideoElem.parentElement.parentElement;
        
        redditNativeVideoElem.parentElement.replaceWith(replaceRedditVideoElem);
        redditNativeVideoParentElem.append(redditNativeVideoElem);

        // For some reason, if we completely remove the element, the audio will start/stop playing on scroll.
        // There is probably some function triggered on scroll that re-initializes the video if it is gone 
        redditNativeVideoElem.style.display = "none";
    }

    private disableRedditNativeVideoElem(redditNativeVideoElem: any) {
        redditNativeVideoElem.children[0].src = Constants.REPLACED_IDENTIFIER; // Prevents old player from playing
        redditNativeVideoElem.src = Constants.REPLACED_IDENTIFIER; // Prevents old player from playing
        // @ts-ignore
        redditNativeVideoElem.play = new function() {}; // Prevents old player from playing
    }
}