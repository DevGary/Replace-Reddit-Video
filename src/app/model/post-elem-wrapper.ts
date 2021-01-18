import { PostElemWrapperType } from "./post-elem-wrapper-type";

export interface PostElemWrapper {
    postElem: Element;
    
    getPostId(): string;
    getPostElemWrapperType(): PostElemWrapperType;
}