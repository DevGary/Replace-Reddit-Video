function save() {
    let feedVideoAutoplay = document.getElementById('feedVideoAutoplay').checked;
    let feedVideoSound = document.getElementById('feedVideoSound').checked;
    let commentVideoAutoplay = document.getElementById('commentVideoAutoplay').checked;
    let commentVideoSound = document.getElementById('commentVideoSound').checked;
    let forceDirectVideo = document.getElementById('forceDirectVideo').checked;
    let forceHighestQuality = document.getElementById('forceHighestQuality').checked;
    
    chrome.storage.sync.set({
        feedVideoAutoplay: feedVideoAutoplay,
        feedVideoSound: feedVideoSound,
        commentVideoAutoplay: commentVideoAutoplay,
        commentVideoSound: commentVideoSound,
        forceDirectVideo: forceDirectVideo,
        forceHighestQuality: forceHighestQuality
    }, function() {
        
        // Update status to let user know options were saved.
        let status = document.getElementById('status');
        status.textContent = 'Options saved.';
        setTimeout(function() {
            status.textContent = '';
        }, 1500);
    });
}

function restore() {
    // TODO: Refactor out defaults
    chrome.storage.sync.get({
        feedVideoAutoplay: true,
        feedVideoSound: false,
        commentVideoAutoplay: true,
        commentVideoSound: false,
        forceDirectVideo: false,
        forceHighestQuality: true
    }, function(items) {
        document.getElementById('feedVideoAutoplay').checked = items.feedVideoAutoplay;
        document.getElementById('feedVideoSound').checked = items.feedVideoSound;
        document.getElementById('commentVideoAutoplay').checked = items.commentVideoAutoplay;
        document.getElementById('commentVideoSound').checked = items.commentVideoSound;
        document.getElementById('forceDirectVideo').checked = items.forceDirectVideo;
        document.getElementById('forceHighestQuality').checked = items.forceHighestQuality;
    });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);