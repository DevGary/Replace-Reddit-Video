// Since this is "hacky" code, surround everything with try/catch

let containerElementId = "replace-reddit-video-container";
let videoElementId = "replace-reddit-video-video";

setTimeout(function () {

    try {

        let redditNativeVideoElements = document.getElementsByTagName("video");
        console.log(redditNativeVideoElements);

        for (const redditNativeVideoElement of redditNativeVideoElements) {
            replaceRedditVideoPlayer(redditNativeVideoElement);
        }

        let mutationObserver = new MutationObserver(videoElementAddedCallback);
        mutationObserver.observe(document.body, {childList: true, subtree: true});
    } catch (e) {
        console.error(e);
    }


}, 1);

function replaceRedditVideoPlayer(redditNativeVideoElement) {

    try {
        if (redditNativeVideoElement.classList.contains(videoElementId)) return;

        let redditNativeVideoElementsSourceHtml = redditNativeVideoElement.getElementsByTagName("source")[0].outerHTML;
        let videoUrlId = redditNativeVideoElementsSourceHtml.split("src=\"https://v.redd.it/")[1].split("/")[0];

        let videoContainerElement = document.createElement("div");
        videoContainerElement.setAttribute("class", containerElementId);

        let video = document.createElement("video");
        video.setAttribute("class", videoElementId);

        video.autoplay = true;
        video.loop = true;
        video.controls = true;

        let potentialFallbackUrlSources = createPotentialFallbackUrlVideoSources(videoUrlId);

        for (let i = 0; i < potentialFallbackUrlSources.length; i++) {
            video.appendChild(potentialFallbackUrlSources[i]);
        }

        videoContainerElement.appendChild(video);

        redditNativeVideoElement.parentElement.parentElement.parentElement.replaceWith(videoContainerElement);
    } catch (e) {
        console.error(e);
    }
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

                                console.log("New Reddit Video Player element added to DOM")
                                console.log(videoElement);
                                try {
                                    replaceRedditVideoPlayer(videoElement);
                                } catch (e) {

                                }
                            }
                        }
                    }
                });
            }
        }
    );
}