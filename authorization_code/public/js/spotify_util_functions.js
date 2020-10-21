function TransferPlayBackToThisBrowser(){
    if(TOKEN == null || DEVICE_ID == null){return}

    $.ajax({
        type: "PUT",
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        url: `https://api.spotify.com/v1/me/player`,
        data: JSON.stringify({
            "device_ids": [DEVICE_ID],
        }),
        complete: function(response){
            console.log(response);
        },
        contentType: 'application/json',
        dataType: 'json'
    });

}

function ResumePlayBack(){
    // first we have to check if resume is a disallowed action
    if(TOKEN == null){return}
    
    $.ajax({
        type: "PUT",
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        url: `https://api.spotify.com/v1/me/player/play`,
        data: JSON.stringify({}),
        complete: function(response){
            console.log(response);
        },
        contentType: 'application/json',
        dataType: 'json'
    });
}

function PausePlayBack(){
    // first we have to check if pausing is a disallowed action
    if(TOKEN == null){return}

    $.ajax({
        type: "PUT",
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        url: `https://api.spotify.com/v1/me/player/pause`,
        data: JSON.stringify({}),
        complete: function(response){
            console.log(response);
        },
        contentType: 'application/json',
        dataType: 'json'
    });
}

function SkipPlayBackToNextTrack(){
    // first we have to check if pausing is a disallowed action
    if($("#playback-control-skip-next").hasClass('disallowed')){return}

    if(TOKEN == null){return}

    $.ajax({
        type: "POST",
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        url: `https://api.spotify.com/v1/me/player/next`,
        data: JSON.stringify({}),
        complete: function(response){
            console.log(response);
        },
        contentType: 'application/json',
        dataType: 'json'
    });
}

function SkipPlayBackToPreviousTrack(){
    // first we have to check if pausing is a disallowed action
    if($("#playback-control-skip-previous").hasClass('disallowed')){return}

    if(TOKEN == null){return}

    $.ajax({
        type: "POST",
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        url: `https://api.spotify.com/v1/me/player/previous`,
        data: JSON.stringify({}),
        complete: function(response){
            console.log(response);
        },
        contentType: 'application/json',
        dataType: 'json'
    });
}

function StartUserPlayBack(spotifyURI = "", offset = {}, position_ms = 0){
    // need to change this to a playlist context so that if the user selects a track out of order of the
    // playlist it knows where to go to next so the only thing that should actually change is the offset

    if(TOKEN == null){return}
    
    $.ajax({
        type: "PUT",
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        url: `https://api.spotify.com/v1/me/player/play`,
        data: JSON.stringify({
            uris: [spotifyURI],
        }),
        complete: function(response){
            console.log(response);
        },
        contentType: 'application/json',
        dataType: 'json'
    });
}

function GetTrackAudioAnalysis(){
    // first we have to check if resume is a disallowed action
    if(TOKEN == null || SPOTIFY_ID == null){return}
    
    $.ajax({
        type: "GET",
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        url: `https://api.spotify.com/v1/audio-analysis/${SPOTIFY_ID}`,
        data: JSON.stringify({}),
        complete: function(response){
            console.log(response);
        },
        contentType: 'application/json',
        dataType: 'json'
    });
}

function GetDatasetsAudioAnalysis(){
    // first we have to check if resume is a disallowed action
    if(SPOTIFY_ID == null){return}
    
    $.ajax({
        type: "GET",
        headers: {},
        url: `http://localhost:8888/audio-analysis/${SPOTIFY_ID}`,
        data: JSON.stringify({}),
        complete: function(response){
            console.log(response.responseJSON);
            datasets = response.responseJSON;
        },
        contentType: 'application/json',
        dataType: 'json'
    });
}