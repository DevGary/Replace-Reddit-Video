import { PostElemWrapperBase } from "./post-elem-wrapper-base";
import { PostElemWrapperType } from "./post-elem-wrapper-type";

export class OtherPostElemWrapper extends PostElemWrapperBase {
    getPostElemWrapperType(): PostElemWrapperType {
        return PostElemWrapperType.Other;
    }
}