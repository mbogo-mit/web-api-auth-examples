$(document).ready(function(){
    $('#browse-moods-sidenav').sidenav({edge: 'right'});
    $('.collapsible').collapsible();
});

let currentPlayBackInterval;
let currentPlayBackTime = 0;
function UpdateWebPlayerUI(state){
    console.log(state);
    // first thing is we need to figure out which actions are disallowed and if the resume button should show or pause button
    $(".playback-controls").removeClass("disallowed");

    // making sure the right action resume or pause shows up based on the state of the playback
    $('#playback-control-resume, #playback-control-pause').removeClass('active');
    if(state.paused){
        $('#playback-control-resume').addClass('active');
    }else{
        $('#playback-control-pause').addClass('active');
    }

    for(const [key, boolean] of Object.entries(state.disallows)){
        if(key == 'skipping_prev' && boolean){
            $("#playback-control-skip-previous").addClass('disallowed');
        }else if(key == 'skipping_next' && boolean){
            $("#playback-control-skip-next").addClass('disallowed');
        }
    }

    // next thing we need to do is update the current time the song is at and the final duration of the playback
    clearInterval(currentPlayBackInterval);// we don't want the time to continue on unless the playback is not paused
    $("#current-playback-time").html(moment.duration(state.position).format("hh:mm:ss"));
    $("#song-playback-time").html(moment.duration(state.duration).format("hh:mm:ss"));
    $("#playback-progress .determinate").css({'transition': 'none'});
    $("#playback-progress .determinate").css('width', `${(state.position / state.duration) * 100}%`);
    if(!state.paused){
        // if the playback is not paused we want the progress bar to animate too 100%
        $("#playback-progress .determinate").css({'transition': `width ${moment.duration(state.duration - state.position).format("ss")}s linear`});
        $("#playback-progress .determinate").css('width', '100%');

        // we want the current time to increment every second
        currentPlayBackTime = state.position;
        currentPlayBackInterval = setInterval(function(){
            currentPlayBackTime += 1000;
            $("#current-playback-time").html(moment.duration(currentPlayBackTime).format("hh:mm:ss"));
        }, 1000);
    }
    
}