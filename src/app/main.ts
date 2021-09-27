import { PostElemWrapperFactory } from "./model/post-elem-wrapper-factory";
import { ReplaceRedditVideoManager } from "./component/replace-reddit-video-manager";
import { ReplaceRedditVideoElem } from "./model/replace-reddit-video-elem";
import { RedditVideoPostElemWrapper } from "./model/reddit-video-post-elem-wrapper";

let feedVideoAutoplay = true;
let feedVideoSound = false;
let commentVideoAutoplay = true;
let commentVideoSound = false;
let forceDirectVideo = false;
let forceHighestQuality = true;
let postElemFactory = new PostElemWrapperFactory();
let replaceRedditVideoManager = new ReplaceRedditVideoManager(document);

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
    videoPostElems.forEach(e => setupRedditVideoPostElemWrapper(e));
    replaceRedditVideoManager.replaceElements(videoPostElems);
    
    let mutationObserver = new MutationObserver(videoElementAddedCallback);
    mutationObserver.observe(document.body, {childList: true, subtree: true, attributes: true});

    if (feedVideoAutoplay) {
        enableFeedAutoplay();
    }
}

function setupRedditVideoPostElemWrapper(wrapper: RedditVideoPostElemWrapper) {
    wrapper.autoplay = shouldAutoplay();
    wrapper.muted = !shouldAutoSound();
    wrapper.forceDirectVideoPlayer = forceDirectVideo;
    wrapper.forceHighestQuality = forceHighestQuality;
}

function enableFeedAutoplay() {

    if (!isOnCommentsPage()) {

        let lastOnScrollEvent = 0;
        // TODO: [!!!] Don't autoplay if manually paused
        document.addEventListener('scroll', function (e) {

            if (isOnCommentsPage()) return;
            let now = new Date().getTime();
            
            if (now - lastOnScrollEvent < 250) return;
            lastOnScrollEvent = now;
            
            let windowHeight = window.innerHeight;
            let videoElemWrappers = postElemFactory.createManyFromDocument(document);

            let selectedVideoElem: ReplaceRedditVideoElem;

            for (let i = 0; i < videoElemWrappers.length; i++) {
                
                let replaceRedditVideoElem = videoElemWrappers[i].getReplaceRedditVideoElem();
                
                if (replaceRedditVideoElem?.videoElem !== undefined) {
           
                    if (selectedVideoElem === undefined) {

                        let headerHeight = document.getElementsByTagName("header")[0].offsetHeight;
                        let videoElemOffsetTopFromVisibleContainer = replaceRedditVideoElem.videoElem.getBoundingClientRect().top - headerHeight;
                        
                        console.log(`videoElemOffsetTop= ${videoElemOffsetTopFromVisibleContainer}, windowHeight = ${windowHeight}`)
                        if (!isOnCommentsPage() && videoElemOffsetTopFromVisibleContainer > 0 && videoElemOffsetTopFromVisibleContainer < windowHeight * 0.55) {
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
                            setupRedditVideoPostElemWrapper(videoPostElem);
                            replaceRedditVideoManager.replaceElements([videoPostElem]);
                        } catch (e) {

                        }
                    }
                });
            }
        }
    );
}