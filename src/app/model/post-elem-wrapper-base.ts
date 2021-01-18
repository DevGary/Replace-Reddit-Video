import { PostElemWrapperType } from "./post-elem-wrapper-type";
import { PostElemWrapper } from "./post-elem-wrapper";

export abstract class PostElemWrapperBase implements PostElemWrapper {
    postElem: Element;

    abstract getPostElemWrapperType(): PostElemWrapperType;
    
    constructor(postElem: Element) {
        this.postElem = postElem;
    }
    
    getPostId(): string {
        return this.postElem.id.replace("t3_", "").replace("item-", "");
    }
}