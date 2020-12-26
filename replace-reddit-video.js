// TODO: Doesn't work in feed
// TODO: Doesn't work if post loaded as modal instead of individual page

setTimeout(function () {
    var videoUrl = document.querySelector("meta[property='og:video']").getAttribute("content");
    var videoUrlId = videoUrl.split("v.redd.it/")[1].split("/")[0];
    var videoFallbackUrl = "https://v.redd.it/" + videoUrlId + "/DASH_480.mp4?source=fallback";

    videoUrl = videoFallbackUrl;

    let containerElementId = "replace-reddit-video-container";
    let videoElementId = "replace-reddit-video-video";

    var videoContainerElement = document.createElement("div");
    videoContainerElement.setAttribute("class", containerElementId);

    var video = document.createElement("video");
    video.setAttribute("class", videoElementId);

    video.autoplay = true;
    video.loop = true;
    video.controls = true;

    var sourceMP4 = document.createElement("source");
    sourceMP4.type = "video/mp4";
    sourceMP4.src = videoUrl;

    video.appendChild(sourceMP4);

    videoContainerElement.appendChild(video);

    document.getElementsByTagName("video")[0].parentElement.parentElement.parentElement.replaceWith(videoContainerElement);

    video.play();
}, 1);