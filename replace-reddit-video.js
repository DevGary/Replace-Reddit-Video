﻿// TODO: Doesn't work in feed
// TODO: Doesn't work if post loaded as modal instead of individual page

setTimeout(function () {

    let redditNativeVideoElements = document.getElementsByTagName("video");
    console.log(redditNativeVideoElements);

    for (const redditNativeVideoElement of redditNativeVideoElements) {
        replaceRedditVideoPlayer(redditNativeVideoElement);
    }

}, 1);

function replaceRedditVideoPlayer(redditNativeVideoElement) {

    let redditNativeVideoElementsSourceHtml = redditNativeVideoElement.getElementsByTagName("source")[0].outerHTML;

    let videoUrlId = redditNativeVideoElementsSourceHtml.split("src=\"https://v.redd.it/")[1].split("/")[0];
    let videoFallbackUrl = "https://v.redd.it/" + videoUrlId + "/DASH_480.mp4?source=fallback";
    let videoUrl = videoFallbackUrl;

    let containerElementId = "replace-reddit-video-container";
    let videoElementId = "replace-reddit-video-video";

    let videoContainerElement = document.createElement("div");
    videoContainerElement.setAttribute("class", containerElementId);

    let video = document.createElement("video");
    video.setAttribute("class", videoElementId);

    video.autoplay = true;
    video.loop = true;
    video.controls = true;

    let sourceMP4 = document.createElement("source");
    sourceMP4.type = "video/mp4";
    sourceMP4.src = videoUrl;

    video.appendChild(sourceMP4);

    videoContainerElement.appendChild(video);

    redditNativeVideoElement.parentElement.parentElement.parentElement.replaceWith(videoContainerElement);

    console.log(`Replaced video ${videoUrl}`)
}