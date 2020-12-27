function save() {
    let feedVideoSound = document.getElementById('feedVideoSound').checked;
    let commentVideoAutoplay = document.getElementById('commentVideoAutoplay').checked;
    let commentVideoSound = document.getElementById('commentVideoSound').checked;
    let forceDirectVideo = document.getElementById('forceDirectVideo').checked;
    
    chrome.storage.sync.set({
        feedVideoSound: feedVideoSound,
        commentVideoAutoplay: commentVideoAutoplay,
        commentVideoSound: commentVideoSound,
        forceDirectVideo: forceDirectVideo
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
    chrome.storage.sync.get({
        feedVideoSound: false,
        commentVideoAutoplay: true,
        commentVideoSound: false,
        forceDirectVideo: false
    }, function(items) {
        document.getElementById('feedVideoSound').checked = items.feedVideoSound;
        document.getElementById('commentVideoAutoplay').checked = items.commentVideoAutoplay;
        document.getElementById('commentVideoSound').checked = items.commentVideoSound;
        document.getElementById('forceDirectVideo').checked = items.forceDirectVideo;
    });
}

document.addEventListener('DOMContentLoaded', restore);
document.getElementById('save').addEventListener('click', save);