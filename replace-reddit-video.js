// Since this is "hacky" code, most things are surrounded with try/catch

let containerElementId = "replace-reddit-video-container";
let videoElementId = "replace-reddit-video-video";
let replacedIdentifier = "replaced-by-replace-reddit-video";

let feedVideoAutoplay = true;
let feedVideoSound = false;
let commentVideoAutoplay = true;
let commentVideoSound = false;
let forceDirectVideo = false;
let forceHighestQuality = true;

chrome.storage.sync.get(null, function(items) {
    feedVideoAutoplay = items.feedVideoAutoplay !== undefined ? items.feedVideoAutoplay : feedVideoAutoplay;
    feedVideoSound = items.feedVideoSound !== undefined ? items.feedVideoSound : feedVideoSound;
    commentVideoAutoplay = items.commentVideoAutoplay !== undefined ? items.commentVideoAutoplay : commentVideoAutoplay;
    commentVideoSound = items.commentVideoSound !== undefined ? items.commentVideoSound : commentVideoSound;
    forceDirectVideo = items.forceDirectVideo !== undefined ? items.forceDirectVideo : forceDirectVideo;
    forceHighestQuality = items.forceHighestQuality !== undefined ? items.forceHighestQuality : forceHighestQuality;
});

setTimeout(function () {
    try {
        let redditNativeVideoElements = document.getElementsByTagName("video");

        for (const redditNativeVideoElement of redditNativeVideoElements) {
            replaceRedditVideoPlayer(redditNativeVideoElement);
        }

        let mutationObserver = new MutationObserver(videoElementAddedCallback);
        mutationObserver.observe(document.body, {childList: true, subtree: true, attributes: true});
        
        if (feedVideoAutoplay) {
            enableFeedAutoplay();
        }
    } 
    catch (e) {
    }
}, 1);

function enableFeedAutoplay() {

    if (!isOnCommentsPage()) {

        // TODO: Throttle events to reduce computational usage
        document.addEventListener('scroll', function (e) {

            if (isOnCommentsPage()) return;

            let windowHeight = window.innerHeight;
            let videoElems = document.getElementsByClassName(videoElementId);

            for (let i = 0; i < videoElems.length; i++) {

                let videoElem = videoElems[i];
                let videoElemOffsetTop = videoElem.getBoundingClientRect().top;

                let videoSelected = false;
                if (!isOnCommentsPage() && !videoSelected && videoElemOffsetTop > 0 && videoElemOffsetTop < windowHeight * 0.35) {
                    videoElem.play();
                    videoSelected = true;
                } else {
                    videoElem.pause();
                }
            }
        });
    }
    
    window.addEventListener('blur', function() {
        if (!isOnCommentsPage()) pauseAllVideosExcept();
    });
}

function replaceRedditVideoPlayer(redditNativeVideoElem) {

    try {
        if (redditNativeVideoElem.classList.contains(videoElementId)) return;

        let redditNativeVideoElementsSourceHtml = redditNativeVideoElem.getElementsByTagName("source")[0].outerHTML;
        let videoUrl = redditNativeVideoElementsSourceHtml.split("src=\"")[1].split("\"")[0];

        let videoContainerElem = document.createElement("div");
        videoContainerElem.setAttribute("class", containerElementId);

        let videoElem = document.createElement("video");
        videoElem.setAttribute("class", `${videoElementId}`);

        // Always show controls if not autoplaying
        if (!shouldAutoplay()) {
            videoElem.controls = true;
        }
        else {
            videoElem.addEventListener("mouseover", function () {
                videoElem.controls = true;
            }, false);
        }

        videoElem.autoplay = shouldAutoplay();
        videoElem.muted = !shouldAutoSound();
        videoElem.loop = true;
        videoElem.preload = "metadata";
        
        videoContainerElem.appendChild(videoElem);

        if (!forceDirectVideo && isHLSPlaylist(videoUrl) && Hls.isSupported()) {
            playAsHLSPlaylist(redditNativeVideoElem, videoElem, videoContainerElem, videoUrl);
        }
        else {
            playAsHTMLVideo(redditNativeVideoElem, videoElem, videoContainerElem, videoUrl);
        }
    } catch (e) {
    }
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

function isHLSPlaylist(videoUrl) {
    return videoUrl.includes("HLSPlaylist.m3u8");
}

function playAsHLSPlaylist(redditNativeVideoElem, videoElem, videoContainerElem, videoUrl) {
    replaceRedditVideoElem(redditNativeVideoElem, videoContainerElem);

    if (Hls.isSupported()) {
        let hls = new Hls();
        
        hls.attachMedia(videoElem);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {

            let availableLevels;
            hls.loadSource(videoUrl);

            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {

                availableLevels = data.levels;

                if (forceHighestQuality) {
                    if (data.levels !== undefined) {
                        hls.firstLevel = data.levels.length - 1;
                    }
                }

                if (videoElem.autoplay) {
                    pauseAllVideosExcept(videoElem);
                    videoElem.play()
                }

                if (feedVideoSound) {
                    setTimeout(function () {
                        videoElem.muted = false;
                    }, 250);
                }
            })

            hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {

                if (availableLevels !== undefined) {

                    let maxLevel = availableLevels.length - 1;

                    if (forceHighestQuality && data.level !== maxLevel) {

                        hls.currentLevel = availableLevels.length - 1;
                    }
                }
            })
        });
    }
}

function playAsHTMLVideo(redditNativeVideoElem, videoElem, videoContainerElem, videoUrl) {
    
    let videoUrlId = parseVideoIdFromVideoUrl(videoUrl);
    
    let potentialFallbackUrlSources = createPotentialFallbackUrlVideoSources(videoUrlId);

    for (let i = 0; i < potentialFallbackUrlSources.length; i++) {
        videoElem.appendChild(potentialFallbackUrlSources[i]);
    }

    replaceRedditVideoElem(redditNativeVideoElem, videoContainerElem);
}

function replaceRedditVideoElem(redditNativeVideoElem, videoContainerElem) {
    // TODO: Find out if there is better way to destroy and cleanup old player?
    redditNativeVideoElem.children[0].src = replacedIdentifier; // Prevents old player from playing
    redditNativeVideoElem.src = replacedIdentifier; // Prevents old player from playing
    redditNativeVideoElem.play = new function(){}; // Prevents old player from playing
  
    redditNativeVideoElem.parentElement.parentElement.parentElement.replaceWith(videoContainerElem);
    videoContainerElem.append(redditNativeVideoElem);
    
    // For some reason, if we completely remove the element, the audio will start/stop playing on scroll.
    // There is probably some function triggered on scroll that re-initializes the video if it is gone 
    redditNativeVideoElem.style.display = "none";
}

function parseVideoIdFromVideoUrl(videoUrl) {
    return videoUrl.split("https://v.redd.it/")[1].split("/")[0];
}

/**
 * Creates potential fallback urls. Since we are creating them manually, many will be invalid as
 * Reddit has changed the format of the fallback urls many times. The <video> element should
 * go through each source until it finds one that is playable.
 *
 * @param videoId
 * @param quality
 * @returns HTMLAllCollection of video source elements
 */
function createPotentialFallbackUrlVideoSources(videoId) {

    let sources = [];

    sources.push(...buildPotentialFallbackSourceAllTypes(videoId, "1080"));
    sources.push(...buildPotentialFallbackSourceAllTypes(videoId, "720"));
    sources.push(...buildPotentialFallbackSourceAllTypes(videoId, "480"));
    sources.push(...buildPotentialFallbackSourceAllTypes(videoId, "360"));
    sources.push(...buildPotentialFallbackSourceAllTypes(videoId, "240"));

    return sources;
}

function buildPotentialFallbackSourceAllTypes(videoId, quality) {

    let sources = [];

    sources.push(buildPotentialFallbackSourceTypeVersion1(videoId, quality));
    sources.push(buildPotentialFallbackSourceTypeVersion2(videoId, quality));
    sources.push(buildPotentialFallbackSourceTypeVersion3(videoId, quality));

    return sources;
}

function buildPotentialFallbackSourceTypeVersion1(videoId, quality) {
    let source = document.createElement("source");
    source.type = "video/mp4";
    source.src = `https://v.redd.it/${videoId}/DASH_${quality}.mp4?source=fallback`;

    return source;
}

function buildPotentialFallbackSourceTypeVersion2(videoId, quality) {
    let source = document.createElement("source");
    source.type = "video/mp4";
    source.src = `https://v.redd.it/${videoId}/DASH_${quality}?source=fallback`;

    return source;
}

function buildPotentialFallbackSourceTypeVersion3(videoId, quality) {
    let source = document.createElement("source");
    source.type = "video/mp4";
    source.src = `https://v.redd.it/${videoId}/DASH_9_6_M?source=fallback`;

    return source;
}

function videoElementAddedCallback(mutationRecords) {
    mutationRecords.forEach(muttn => {
            if (muttn.type === "childList" && typeof muttn.addedNodes === "object") {
                muttn.addedNodes.forEach(newNode => {
                   
                    if (newNode.tagName) {
                        let newNodeVideoElements = newNode.getElementsByTagName("video");

                        if (newNodeVideoElements.length > 0) {

                            for (const videoElement of newNodeVideoElements) {

                                try {
                                    replaceRedditVideoPlayer(videoElement);
                                } catch (e) {

                                }
                            }
                        }
                    }
                });
            }
            else if (
                muttn.type === 'attributes' && 
                muttn.attributeName === 'src' && 
                muttn.target.tagName === "VIDEO"
                ) {

                if (muttn.target.style.display === "none" && !muttn.target.src.includes(replacedIdentifier)) {
                    muttn.target.src = replacedIdentifier;
                }
            }
        }
    );
}

function pauseAllVideosExcept(videoElemException) {

    let videoElems = document.getElementsByClassName(videoElementId);

    for (let i = 0; i < videoElems.length; i++) {

        let videoElem = videoElems[i];

        if (videoElem !== videoElemException) {
            videoElem.pause();
        }
    }
}