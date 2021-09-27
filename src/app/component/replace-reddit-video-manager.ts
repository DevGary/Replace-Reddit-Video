import { RedditVideoPostElemWrapper } from "../model/reddit-video-post-elem-wrapper";
import { MediaPlaybackListener } from "../model/interfaces/media-playback-listener";
import { ReplaceRedditVideoElem } from "../model/replace-reddit-video-elem";

export class ReplaceRedditVideoManager {

    private document: Document;
    
    public constructor(document: Document) {
        this.document = document;
    }
    
    public replaceElements(videoPostElemWrappers: RedditVideoPostElemWrapper[]) {

        let thisClass = this;
        
        Array.from(videoPostElemWrappers)
            .filter(m => m.shouldReplace())
            .forEach(m => {
                m.replaceRedditVideoPlayer();
                
                try {
                    m.getReplaceRedditVideoElem().addMediaPlaybackListener(new class implements MediaPlaybackListener {
                        onPlayRequested(elementId: string): void {
                            thisClass.pauseAllVideosExcept(elementId);
                        }

                        onPlaying(elementId: string): void {
                            thisClass.pauseAllVideosExcept(elementId);
                        }

                        onPaused(elementId: string): void {
                        }
                    })
                }
                catch (e) {
                    console.log(e);
                }
            }
        );
    }

    public pauseAllVideosExcept(elementId?: string) {
        Array.from(document.getElementsByTagName(ReplaceRedditVideoElem.TAG))
            .filter<ReplaceRedditVideoElem>(ReplaceRedditVideoElem.isTypeOf)
            .filter(m => m.id !== elementId)
            .forEach(m => m.pause())
    }
}