function RID(){
    let rid = "";//stands for random Id
    let a = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
    for(var i = 0; i < 10; i++){
        let rn = Math.floor(Math.random() * a.length);
        rid += a.substring(rn, rn + 1);
    }
    return rid;
}

function extractDeltaX(e) {
    if (e.wheelDelta) {
        return e.wheelDelta;
    }

    if (e.originalEvent && e.originalEvent.deltaX) {
        return e.originalEvent.deltaX;
    }
}

function InitializeTimeLineMarks(playback_duration){
    PLAYBACK_DURATION = playback_duration;
    let numberOfMarks = Math.floor(playback_duration / TIME_STEP);
    $("#timeline-mover").css("left",`${MARK_STARTING_POSITION}px`);
    for(let i = 0; i < numberOfMarks; i++){
        let mark_time = ConvertMillisecondsToMarkTimeString(i * TIME_STEP);
        let mark_position = (i * MARK_SPACING * ZOOM);
        $("#time-line-container #timeline-mover").append(`<span style='left: ${mark_position}px;' class='time-mark' mark='${i}'>${mark_time}</span>`)
    }

    // we also have to calcuate values for the scroll bar 
    const song_pixel_length = ConvertTimeToPixels(PLAYBACK_DURATION);
    const scrollbar_percent = (($("#second-container").width() - 165.5) / song_pixel_length) * 100;
    $("#scroll-bar").css('width', `${scrollbar_percent}%`);

    // we also need to set the "playback-duration-time" dom element html
    $("#playback-duration-time").html(ConvertMillisecondsToTimeString(PLAYBACK_DURATION));
}

function ScrollTimeline(){
    $("#timeline-mover, #timeline-mark-container-mover, .channel-layer-timeline-mover").css("left",`${MARK_STARTING_POSITION}px`);
}

function SkewTimeline(){
    //this function recalculates the positon of all the time marks based on a changing zoom value
    $('.time-mark').each(function(i){
        let mark_position = (i * MARK_SPACING * ZOOM);
        $(this).css('left',`${mark_position}px`)
    });

    const song_pixel_length = ConvertTimeToPixels(PLAYBACK_DURATION);
    const scrollbar_percent = (($("#second-container").width() - 165.5) / song_pixel_length) * 100;
    $("#scroll-bar").css('width', `${scrollbar_percent}%`);

    //additionally we need to update the position and width of the effect-cards in the channel-layer-timelines
    UpdatePositionAndWidthOfEffectsCardInTimeline();
}

function UpdatePositionAndWidthOfEffectsCardInTimeline(){
    $(".draggable-effect-card").each(function(){
        let start_pos = CalculateLeftPositionInChannelLayerTimelineFromSongTime(Number($(this).attr('start-time')));
        let end_pos = CalculateLeftPositionInChannelLayerTimelineFromSongTime(Number($(this).attr('end-time')));
        $(this).css({
            'left': `${start_pos}px`,
            'width': `${end_pos - start_pos}px`,
        });
    });
}

function CSSPixelsToNumber(str){
    return Number(str.slice(0,-2))
}


/*
function UpdateTimeLineMarksPositions(){
    //this function recalculates the positon of all the time marks based on a changing zoom value
    $('.time-mark').each(function(i){
        let mark_position = MARK_STARTING_POSITION + (i * MARK_SPACING * ZOOM) + TIME_MARK_ABSOLUTE_OFFSET;
        $(this).css('left',`${mark_position}px`)
    });

    const song_pixel_length = ConvertTimeToPixels(PLAYBACK_DURATION);
    const scrollbar_percent = (($("#second-container").width() - 165.5) / song_pixel_length) * 100;
    $("#scroll-bar").css('width', `${scrollbar_percent}%`);
}
*/

function SetTimelineMarkTrianglePosition(current_song_time){
    current_song_time = Number(current_song_time);
    CURRENT_SONG_TIME = current_song_time;
    if(TIMELINE_MARK_PLAYING){
        current_song_time += 1000;
        // console.log(`traveling to: ${current_song_time}`);
    }else{
        // console.log(`time at: ${current_song_time}`)
    }

    let posLeft = ConvertTimeToPixels(current_song_time);
    $("#timeline-mark-triangle").css("left", `${posLeft - 10}px`);
    $("#timeline-mark-stick").css("left", `${posLeft}px`);
    
    if(posLeft + MARK_STARTING_POSITION < 0){
        $("#timeline-mark-triangle, #timeline-mark-stick").addClass("hide");
    }else{
        $("#timeline-mark-triangle, #timeline-mark-stick").removeClass("hide");
    }

    if(TIMELINE_MARK_PLAYING && posLeft + $("#timeline-mark-container-mover").position().left > window.innerWidth - (MARK_SPACING * ZOOM)){
        ScrollToTimeInSong(current_song_time - TIMELINE_MARK_TIME_STEP);
    }
}


function SetSongPlayBackTime(playback_slider, current_song_time){
    playback_slider.noUiSlider.set([null, current_song_time]);
    SetSongPlayBackTimeText(current_song_time);
}

function SetSongPlayBackTimeText(current_song_time){
    // now we need to update the "playback-current-time" dom element
    ConvertMillisecondsToTimeString(current_song_time);
    $("#playback-current-time").html(ConvertMillisecondsToTimeString(current_song_time));
}

function ConvertMillisecondsToTimeString(current_song_time){
    let totalSeconds = current_song_time / 1000; // converting to seconds
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = (totalSeconds % 60).toFixed(1);
    return `${hours > 0 ? hours + ":" : ""}${minutes > 9 ? minutes + ":" : "0" + minutes + ":"}${seconds > 9 ? seconds : "0" + seconds}`;
}

function ConvertMillisecondsToMarkTimeString(milliseconds){
    let totalSeconds = Number((milliseconds / 1000).toFixed(1)); // converting to seconds
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    let minutes = Math.floor(totalSeconds / 60);
    let seconds = totalSeconds % 60;
    return `${hours > 0 ? hours + "h" : ""}${minutes}m${seconds}s`;
}


function UpdateScrollbarPosition(newLeft){
    $("#scroll-bar").css("left", `${newLeft}px`);
    // we need to take this new left value and we need to calculate how much time shift there needs to be because we are scrolling through the song
    let percentage_of_song = newLeft / $("#scroll-bar-background").width();
    // the mark starting position will be the negative of the (percentag of song * song length) then we need to convert this time to pixels by dividing by (time/pixels) => (TIME_STEP) / (MARK_SPACING * ZOOM) 
    MARK_STARTING_POSITION = - ConvertTimeToPixels(percentage_of_song * PLAYBACK_DURATION);
    //because we changed the MARK_STARTING_POSITION variable we need to update the time marks positions
    ScrollTimeline();
    //SetTimelineMarkTrianglePosition(CURRENT_SONG_TIME);
}

function ScrollToTimeInSong(song_time){
    let percentage_of_song = song_time / PLAYBACK_DURATION;
    let scrollbarLeft = $("#scroll-bar-background").width() * percentage_of_song;
    let maxLeft = $("#scroll-bar-background").width() - $("#scroll-bar").width();
    UpdateScrollbarPosition(scrollbarLeft > maxLeft ? maxLeft : scrollbarLeft);
}

function UpdateMyWebPlayerUI(state){
    let playback_slider = document.getElementById("playback-slider");
    playback_slider.noUiSlider.set([null, state.position]);
}

function ResumeSongPlayback(){
    $("#playback-state-container").attr("state","pause");
    $("#timeline-mark-container").addClass("unselectable");
    player.seek(Number(CURRENT_SONG_TIME)).then(() => {
        player.resume().then(() => {
            //closing any containers and settings divs that may get in the way of seeing the preview song
            ToggleLeftContainer(false);
            CloseSettings();
            $("#playback-slider").attr('disabled', true);
            ShowPreviewOverlay(true);
            TIMELINE_MARK_PLAYING = true;
            RunTimelineMark(false);
            RUN_TIMELINE_MARK_INTERVAL = setInterval(RunTimelineMark, TIMELINE_MARK_TIME_STEP);
        });
    });
    
}

function PauseSongPlayback(){
    $("#playback-state-container").attr("state","play");
    $("#timeline-mark-container").removeClass("unselectable");
    player.pause().then(() => {
        $("#playback-slider").removeAttr('disabled');
        ShowPreviewOverlay(false);
        clearInterval(RUN_TIMELINE_MARK_INTERVAL);
        TIMELINE_MARK_PLAYING = false;
        SetTimelineMarkTrianglePosition(CURRENT_SONG_TIME);
    });
}

function ShowPreviewOverlay(show){
    if(show){
        $("#song-preview-cover").addClass('show');
    }else{
        $("#song-preview-cover").removeClass('show');
    }
}

function RunTimelineMark(addTimeInterval = true){
    let playback_slider = document.getElementById("playback-slider");
    playback_slider.noUiSlider.set([null, Number(CURRENT_SONG_TIME) + (addTimeInterval ? TIMELINE_MARK_TIME_STEP : 0)]);
}

function ToggleLeftContainer(open){

    if(open != undefined){
        if(open){
            $("#my-left-container").addClass('open');
        }else{
            $("#my-left-container").removeClass('open');
        }
        return;
    }
    
    if($("#my-left-container").hasClass('open')){
        $("#my-left-container").removeClass('open');
    }else{
        $("#my-left-container").addClass('open');
    }
}

function CloseSettings(){
    $("#my-settings-container").removeClass('open loading');
    // by closing settings we will also want to unfocus any effect card that the settings was referring too
    $(".draggable-effect-card").removeClass('focus');
}

function AddChannelToEditor(type){
    let html = "";
    let rid = RID();
    if(type == 'lightbulb'){
        html += ejs.render(Templates.channels[type],{id: rid});
    }else if(type == 'led-strip'){
        html += ejs.render(Templates.channels[type],{id: rid});
    }else if(type == 'led-pillow'){
        html += ejs.render(Templates.channels[type],{id: rid});
    }else if(type == 'led-blanket'){
        html += ejs.render(Templates.channels[type],{id: rid});
    }else if(type == 'audio-analysis'){
        GetTrackAudioAnalysis();
    }

    $("#channel-container").append(html);

    //adding event listener for the name input element 
    $(`#channel-container #${rid} .input-channel-name`).on('input', ChannelNameChanged);
    //initializing channel options dropdown
    $(`[data-target="channel-options-dropdown-${rid}"]`).dropdown();

    Editor.update({
        type: 'add-channel',
        data: {
            id: rid,
            type: type,
            name: "",
            index: $("#channel-container .channel").length - 1,
        }
    });
    
}

function TryToFitNewEffectCard(opts){
    /* opts looks like this
    channel_id: channel_id,
    card_width: card_width,
    left: newLeftPosition,
    effect_card: {
        id: DRAGGING_EFFECT_CARD_RID,
        effect_type: $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('effect-type'),
        start_time: start_time,
        end_time: end_time,
    },
    mouse: {
        x: event.clientX,
        y: event.clientY,
    },
    */

    let unavailableTimesArray = Editor.getUnavailableTimesArrayForChannel({
        effect_card_id: opts.effect_card.id,
        channel_id: opts.channel_id,
        effect_type: opts.effect_card.effect_type,
    });

    let new_data = {
        left: opts.left,
        start_time: opts.effect_card.start_time,
        end_time: opts.effect_card.end_time,
        card_width: opts.card_width,
        isValidPosition: true,
    };

    let default_width = MARK_SPACING * ZOOM;
    let minimum_width = ConvertTimeToPixels(MINIMUM_EFFECT_CARD_DURATION);

    let mouseSongTime = CalculateSongTimeFromAbsolutePosition(opts.mouse.x);

    // now that we have all of the time ranges this effect card can't be at we are going to
    // loop through these values and see if we can resize this effect card to fit inside the
    // area it is given if it needs to be resized

    for(let [start, end] of unavailableTimesArray){
        // first we will check that the mouse is not in this unavailable time range because if it is then that is a dead give away that this is not a valid position
        if(mouseSongTime > start && mouseSongTime < end){
            new_data.isValidPosition = false;
            new_data.card_width = default_width;// default width of an effect card
            new_data.left = opts.mouse.x - (default_width / 2);
            new_data.start_time = CalculateSongTimeFromAbsolutePosition(new_data.left);
            new_data.end_time = CalculateSongTimeFromAbsolutePosition(new_data.left + new_data.card_width);
            return new_data;
        }

        // the next check we need to do is check if the start time of this effect card is in an unavailable time range
        if(new_data.start_time > start && new_data.start_time < end){
            new_data.start_time = end;
        }

        if(new_data.end_time > start && new_data.end_time < end){
            new_data.end_time = start;
        }

    }

    // now that we have all the data we need we will now calculate the width, left position, and if this position is a valid position
    new_data.left = CaclulateAbsoluteLeftPositionFromSongTime(new_data.start_time);
    new_data.width = CaclulateAbsoluteLeftPositionFromSongTime(new_data.end_time) - new_data.left;
    if(new_data.width < minimum_width){
        new_data.width = default_width;
        new_data.isValidPosition = false;
        new_data.end_time = CalculateSongTimeFromAbsolutePosition(new_data.left + new_data.card_width);
    }

    return new_data;

}

function TryToPositionEffectCard(opts){
    /* opts looks like this
    channel_id: channel_id,
    card_width: card_width,
    left: newLeftPosition,
    effect_card: {
        id: DRAGGING_EFFECT_CARD_RID,
        effect_type: $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('effect-type'),
        start_time: start_time,
        end_time: end_time,
    },
    mouse: {
        x: event.clientX,
        y: event.clientY,
    },
    */

    let unavailableTimesArray = Editor.getUnavailableTimesArrayForChannel({
        effect_card_id: opts.effect_card.id,
        channel_id: opts.channel_id,
        effect_type: opts.effect_card.effect_type,
    });

    let new_data = {
        left: opts.left,
        start_time: opts.effect_card.start_time,
        end_time: opts.effect_card.end_time,
        card_width: opts.card_width,
        isValidPosition: true,
    };

    let mouseSongTime = CalculateSongTimeFromAbsolutePosition(opts.mouse.x);

    // now that we have all of the time ranges this effect card can't be at we are going to
    // loop through these values and see if we can resize this effect card to fit inside the
    // area it is given if it needs to be resized
    let changedStartTime = false;
    let changedEndTime = false;
    for(let i = 0; i < unavailableTimesArray.length; i++){
        let start = unavailableTimesArray[i][0];
        let end = unavailableTimesArray[i][1];
        let shift = null;
        let returnImmediately = false;
        // first we will check that the mouse is not in this unavailable time range because if it is then that is a dead give away that this is not a valid position
        if(mouseSongTime > start && mouseSongTime < end){
            new_data.isValidPosition = false;
            new_data.left = opts.mouse.x - (new_data.card_width / 2);
            new_data.start_time = CalculateSongTimeFromAbsolutePosition(new_data.left);
            new_data.end_time = CalculateSongTimeFromAbsolutePosition(new_data.left + new_data.card_width);
            return new_data;
        }

        // the next check we need to do is check if the start time of this effect card is in an unavailable time range
        if(new_data.start_time > start && new_data.start_time < end){
            shift = 'right';
        }

        if(new_data.end_time > start && new_data.end_time < end){
            shift = 'left';
        }

        if(new_data.start_time < start && new_data.end_time > end){
            if(start - new_data.start_time <= new_data.end_time - end ){
                shift = 'right';
            }else{
                shift = 'left';
            }
        }

        if(shift === 'left'){
            new_data.end_time = start;
            changedEndTime = true;
            new_data.start_time = new_data.end_time - ConvertPixelsToTime(new_data.card_width);
            if(new_data.start_time < 0){
                new_data.start_time = 0;
                new_data.end_time = new_data.start + ConvertPixelsToTime(new_data.card_width); 
                returnImmediately = true;
            }
            new_data.left = CaclulateAbsoluteLeftPositionFromSongTime(new_data.start_time);
            i = 0;// we need to start from the beginning and see if the shift we made in start time and consequently end time puts end time in a place where it also has to shift
        }else if(shift === 'right'){
            new_data.start_time = end;
            changedStartTime = true;
            new_data.end_time = new_data.start_time + ConvertPixelsToTime(new_data.card_width);
            if(new_data.end_time > PLAYBACK_DURATION){
                new_data.end_time = PLAYBACK_DURATION;
                new_data.start_time = new_data.end_time - ConvertPixelsToTime(new_data.card_width);
                returnImmediately = true;
            }
            new_data.left = CaclulateAbsoluteLeftPositionFromSongTime(new_data.start_time);
            i = 0;// we need to start from the beginning and see if the shift we made in start time and consequently end time puts end time in a place where it also has to shift
        }

        if(returnImmediately){
            new_data.isValidPosition = false;
            return new_data;
        }


        if(changedStartTime && changedEndTime){
            // if we changed both the start time and the end time then we know this is not a valid 
            new_data.isValidPosition = false;
            new_data.left = opts.mouse.x - (new_data.card_width / 2);
            new_data.start_time = CalculateSongTimeFromAbsolutePosition(new_data.left);
            new_data.end_time = CalculateSongTimeFromAbsolutePosition(new_data.left + new_data.card_width);
            return new_data;
        }

    }

    // if we have gotten to this point it is either because neither start time nor end time was change and in that case we can just return new_data which would be unaltered data
    // or start time or end time was changed and the object was shifted left or right but can still fit in the available spot so we return new_data which has its left, start_time, and end_time changed
    return new_data;
}

function ConvertTimeToPixels(time){
    return (time / (TIME_STEP / (MARK_SPACING * ZOOM)));
}

function ConvertPixelsToTime(pixels){
    return (pixels * TIME_STEP / (MARK_SPACING * ZOOM));
}

function ChannelNameChanged(event){
    if(event === undefined){return};
    
    Editor.update({
        type: 'rename-channel',
        data: {
            channel_id: $(event.target).parents('.channel').attr('id'),
            name: event.target.value,
        },
    })
}

function FocusOnThisEffectCard(id){
    $(".draggable-effect-card").removeClass('focus');
    $(`#${id}`).addClass('focus');
    UpdateAndOpenSettingsContainer(id);
}

function UpdateAndOpenSettingsContainer(id){
    $("#my-settings-container").addClass('open loading');
    Editor.InitEffectCardSettings(id);
}

function CalculateSongTimeFromAbsolutePosition(leftPosition){
    return ConvertPixelsToTime((leftPosition - TIME_MARK_ABSOLUTE_OFFSET) - MARK_STARTING_POSITION);
}

function CalculateLeftPositionInChannelLayerTimelineFromSongTime(song_time){
    return  ConvertTimeToPixels(song_time);
}

function CaclulateAbsoluteLeftPositionFromSongTime(song_time){
    return MARK_STARTING_POSITION + ConvertTimeToPixels(song_time) + TIME_MARK_ABSOLUTE_OFFSET;
}