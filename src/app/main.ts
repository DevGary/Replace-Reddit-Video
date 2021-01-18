// TODO: Convert to Typescript

import { PostElemWrapperFactory } from "./model/post-elem-wrapper-factory";
import { ReplaceRedditVideoManager } from "./component/replace-reddit-video-manager";
import { ReplaceRedditVideoElem } from "./model/replace-reddit-video-elem";

// Since this is "hacky" code, most things are surrounded with try/catch

let replacedIdentifier = "replaced-by-replace-reddit-video";

let feedVideoAutoplay = true;
let feedVideoSound = false;
let commentVideoAutoplay = true;
let commentVideoSound = false;
let forceDirectVideo = false;
let forceHighestQuality = true;
let postElemFactory = new PostElemWrapperFactory();
let replaceRedditVideoManager = new ReplaceRedditVideoManager(document);

// @ts-ignore
chrome.storage.sync.get(null, function(items) {
    feedVideoAutoplay = items.feedVideoAutoplay !== undefined ? items.feedVideoAutoplay : feedVideoAutoplay;
    feedVideoSound = items.feedVideoSound !== undefined ? items.feedVideoSound : feedVideoSound;
    commentVideoAutoplay = items.commentVideoAutoplay !== undefined ? items.commentVideoAutoplay : commentVideoAutoplay;
    commentVideoSound = items.commentVideoSound !== undefined ? items.commentVideoSound : commentVideoSound;
    forceDirectVideo = items.forceDirectVideo !== undefined ? items.forceDirectVideo : forceDirectVideo;
    forceHighestQuality = items.forceHighestQuality !== undefined ? items.forceHighestQuality : forceHighestQuality;
});

main();

function main() {
    
    let videoPostElems = postElemFactory.createManyFromDocument(document);
    replaceRedditVideoManager.replaceElements(videoPostElems);
    
    let mutationObserver = new MutationObserver(videoElementAddedCallback);
    mutationObserver.observe(document.body, {childList: true, subtree: true, attributes: true});

    if (feedVideoAutoplay) {
        enableFeedAutoplay();
    }
}

function enableFeedAutoplay() {

    if (!isOnCommentsPage()) {

        let lastOnScrollEvent = 0;
        // TODO: Throttle events to reduce computational usage
        // TODO: [!!!] Don't autoplay if manually paused
        document.addEventListener('scroll', function (e) {

            if (isOnCommentsPage()) return;
            let now = new Date().getTime();
            
            if (now - lastOnScrollEvent < 500) return;
            lastOnScrollEvent = now;
            
            let windowHeight = window.innerHeight;
            let videoElemWrappers = postElemFactory.createManyFromDocument(document);

            let selectedVideoElem: ReplaceRedditVideoElem;

            for (let i = 0; i < videoElemWrappers.length; i++) {
                
                let replaceRedditVideoElem = videoElemWrappers[i].getReplaceRedditVideoElem();
                
                if (replaceRedditVideoElem?.videoElem !== undefined) {
                    let videoElemOffsetTop = replaceRedditVideoElem.videoElem.getBoundingClientRect().top;

                    if (selectedVideoElem === undefined) {
                        if (!isOnCommentsPage() && videoElemOffsetTop > 0 && videoElemOffsetTop < windowHeight * 0.5) {
                            replaceRedditVideoElem.play();
                            selectedVideoElem = replaceRedditVideoElem;
                        }
                    }
                }
            }

            replaceRedditVideoManager.pauseAllVideosExcept(selectedVideoElem?.id)
        });
    }

    window.addEventListener('blur', function() {
        if (!isOnCommentsPage()) replaceRedditVideoManager.pauseAllVideosExcept();
    });
}

function isOnCommentsPage() {
    return window.location.href.includes("/comments/");
}

function shouldAutoplay() {
    return isOnCommentsPage() ? commentVideoAutoplay : feedVideoAutoplay;
}

function shouldAutoSound() {
    return isOnCommentsPage() ? commentVideoSound : feedVideoSound;
}

function videoElementAddedCallback(mutationRecords: MutationRecord[], mutationObserver: MutationObserver) {
    mutationRecords.forEach(mutation => {
            if (mutation.type === "childList" && typeof mutation.addedNodes === "object") {
                mutation.addedNodes.forEach((newNode: Node) => {
                    if (newNode instanceof Element && newNode.tagName) {
                        try {
                            let videoPostElem = postElemFactory.createFromElement(newNode);
                            replaceRedditVideoManager.replaceElements([videoPostElem]);
                        } catch (e) {

                        }
                    }
                });
            }
            else if (
                mutation.target instanceof Element &&
                mutation.type === 'attributes' &&
                mutation.attributeName === 'src' &&
                mutation.target.tagName === "VIDEO"
            ) {

                let mutationTargetElem = mutation.target as Element;
                // @ts-ignore
                let isNotReplacedSrcAttribute = !mutation.target.src.includes(replacedIdentifier);

                // For debugging
                if (isNotReplacedSrcAttribute) {
                    let currentReplacedSrc = mutation.target.getAttribute("replaced_src");
                    // @ts-ignore
                    let newReplacedSrc = currentReplacedSrc + " , " + mutation.target.src;

                    mutation.target.setAttribute("replaced_src", newReplacedSrc);
                }

                // @ts-ignore
                if (mutationTargetElem.style.display === "none" && isNotReplacedSrcAttribute) {
                    // @ts-ignore
                    mutationTargetElem.src = replacedIdentifier;
                }
            }
        }
    );
}