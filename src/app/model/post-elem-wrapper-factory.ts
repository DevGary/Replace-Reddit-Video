import { RedditVideoPostElemWrapper } from "./reddit-video-post-elem-wrapper";
import { OtherPostElemWrapper } from "./other-post-elem-wrapper";
import { PostElemWrapper } from "./post-elem-wrapper";

export class PostElemWrapperFactory {
    
    private createFromElem(postElem: Element): PostElemWrapper {
        if (this.isRedditVideoPost(postElem)) {
            return new RedditVideoPostElemWrapper(postElem);
        } 
        
        return new OtherPostElemWrapper(postElem);
    }
    
    private isRedditVideoPost(postElem: Element) {
        return postElem.getElementsByTagName("video").length > 0;
    }
    
    public createManyFromDocument(document: Document): RedditVideoPostElemWrapper[] {
        
        let postElems = document.getElementsByClassName("Post");
        
        return Array.from(postElems)
            .map(e => this.createFromElem(e))
            .filter<RedditVideoPostElemWrapper>(RedditVideoPostElemWrapper.isTypeOf)
    }    
    
    public createFromElement(element:  Element): RedditVideoPostElemWrapper {

        if (this.isRedditVideoPost(element)) {

            let postElem = element.getElementsByTagName("video")[0].closest("div.Post");

            if (postElem !== undefined) {
                return this.createFromElem(postElem) as RedditVideoPostElemWrapper;
            }
        }
    } 
}