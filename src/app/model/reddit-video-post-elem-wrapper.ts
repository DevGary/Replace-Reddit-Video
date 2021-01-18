import { PostElemWrapperBase } from "./post-elem-wrapper-base";
import { PostElemWrapperType } from "./post-elem-wrapper-type";
import { ReplaceRedditVideoElem } from "./replace-reddit-video-elem";

export class RedditVideoPostElemWrapper extends PostElemWrapperBase {
    
    public getRedditVideoElem(): Element {
        return this.postElem.getElementsByTagName("video").item(0);
    }
  
    getPostElemWrapperType(): PostElemWrapperType {
        return PostElemWrapperType.Reddit_Video;
    }

    static isTypeOf(elem: PostElemWrapperBase): elem is RedditVideoPostElemWrapper {
        return elem instanceof RedditVideoPostElemWrapper;
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
        let replaceRedditVideoElem = new ReplaceRedditVideoElem(this.getRedditVideoElem());
        console.log(`Replacing Reddit Video Player for postId: ${this.getPostId()}`);
        replaceRedditVideoElem.replace();
    }
}