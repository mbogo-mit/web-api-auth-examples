$(document).ready(function(){

    PLAYBACK_DURATION = Number($("#song-info-container").attr("duration_ms"));

    // make sure that all materialize event listeners are initialized
    $('.tabs').tabs();
    $('#channel-options-tabs > .tab > a ').click(function(){
        setTimeout(function(){$('.tabs').tabs('updateTabIndicator');}, 100);
    });
    $('.dropdown-trigger').dropdown();
    $('.collapsible').collapsible();

    //make sure the body is in the correct position
    $("body").scrollTop(0);

    let playback_slider = document.getElementById('playback-slider');
    noUiSlider.create(playback_slider, {
        start: [0,0],
        connect: true,
        step: 1,
        range: {
            'min': 0,
            'max': PLAYBACK_DURATION
        }
    });

    playback_slider.noUiSlider.on('update', function(values){
        SetTimelineMarkTrianglePosition(values[1]);
        SetSongPlayBackTimeText(values[1]);
        
        if(!TIMELINE_MARK_PLAYING && !DRAGGING_TIMELINE_MARK){
            // this means that the user is adjust the play back using the playback slider. so we want to focus the timeline mark in the center of the screen if we can and if we can't just making sure it is on the screen
            // we need to calculate how much time can be shown in our view port
            let view_port_duration = ConvertPixelsToTime(window.innerWidth - TIME_MARK_ABSOLUTE_OFFSET);
            let song_time_to_scroll_to = CURRENT_SONG_TIME - (view_port_duration / 2);
            ScrollToTimeInSong(song_time_to_scroll_to < 0 ? 0 : song_time_to_scroll_to);
        }

    });

    playback_slider.noUiSlider.on('end', function(values){

        if($("#playback-state-container").attr('state') !== "play"){
            // the player is playing
            // we need to clear the current interval and set a new one
            clearInterval(RUN_TIMELINE_MARK_INTERVAL);
            // we remove the unselectable class so that we can position the timeline mark exactly where we want with no transition
            TIMELINE_MARK_PLAYING = false;
            $('#timeline-mark-container').removeClass('unselectable');
            SetTimelineMarkTrianglePosition(CURRENT_SONG_TIME);// positioning the timeline mark
            $('#timeline-mark-container').addClass('unselectable');
            player.seek(Number(CURRENT_SONG_TIME)).then(() => {
                TIMELINE_MARK_PLAYING = true;
                RunTimelineMark(false);
                RUN_TIMELINE_MARK_INTERVAL = setInterval(RunTimelineMark, TIMELINE_MARK_TIME_STEP);
            });
        }
        
    })

    let volume_slider = document.getElementById('volume-slider');
    noUiSlider.create(volume_slider, {
        start: [0,0],
        connect: true,
        step: 0.01,
        range: {
            'min': 0,
            'max': 1
        }
    });

    volume_slider.noUiSlider.on('end', function(values){
        player.setVolume(values[1]).then(() => {
            console.log('Volume updated!');
        });
    });

    let zoom_slider = document.getElementById('zoom-slider');
    noUiSlider.create(zoom_slider, {
        start: [1,1],
        connect: true,
        step: 0.01,
        range: {
            'min': 1,
            'max': 10,
        }
    });

    zoom_slider.noUiSlider.on('update', function(values){
        ZOOM = Number(values[1]);
        // every time the user changes the zoom we need to set the scroll bar back to zero 
        UpdateScrollbarPosition(0);
        SkewTimeline();
        SetTimelineMarkTrianglePosition(CURRENT_SONG_TIME);
    });

    $('#channel-container').on('wheel',function(e){
        let deltaX = extractDeltaX(e)
        if(deltaX != undefined){
            let min = 0;
            let max = $("#scroll-bar-background").width() - $("#scroll-bar").width();

            let scrollbar_left_start = $("#scroll-bar").position().left - 170.5;
            let newLeft = scrollbar_left_start + deltaX;
            if(newLeft < min){
                newLeft = min;
            }else if(newLeft > max){
                newLeft = max;
            }

            UpdateScrollbarPosition(newLeft);
        }
    })

    InitializeTimeLineMarks(PLAYBACK_DURATION);

    interact('#timeline-mark-triangle').draggable({
        listeners: {
            start (event) {
              if(!$("#timeline-mark-container").hasClass("unselectable")){
                DRAGGING_TIMELINE_MARK = true;  
                //make sure there are no wierd highlighting when the user is dragging
                window.getSelection().removeAllRanges(); 
                timeline_mark_triangle_change_x = 0;
                timeline_mark_triangle_left_start = $("#timeline-mark-triangle").position().left;
              }else{
                DRAGGING_TIMELINE_MARK = false;
              }
            },
            move (event) {
                if(!$("#timeline-mark-container").hasClass("unselectable")){
                    DRAGGING_TIMELINE_MARK = true;
                    //make sure there are no wierd highlighting when the user is dragging
                    window.getSelection().removeAllRanges();
                    let min = -10;
                    let max = window.innerWidth - TIME_MARK_ABSOLUTE_OFFSET;
                    let scroll_padding = 30;
                    
                    timeline_mark_triangle_change_x += event.dx;
                    let newLeft = timeline_mark_triangle_left_start + timeline_mark_triangle_change_x;
                    if(newLeft < min){
                        newLeft = min;
                    }else if((newLeft + 10) + MARK_STARTING_POSITION > max - scroll_padding){
                        // we need to auto scroll and calculate how much the scroll bar needs to move to get our desired effect
                        ScrollToTimeInSong(CURRENT_SONG_TIME - ConvertPixelsToTime((newLeft + 10) + MARK_STARTING_POSITION - ((newLeft + 10) + MARK_STARTING_POSITION - (max - scroll_padding))));
                    }

                    // now that we have moved the timeline stick we need to calculate the time that the timeline-mark-stick is at
                    let current_song_time = ConvertPixelsToTime(newLeft + 10);
                    SetSongPlayBackTime(document.getElementById('playback-slider'), current_song_time);
                }else{
                    DRAGGING_TIMELINE_MARK = false;
                }
            },
      
            end (event){
                timeline_mark_triangle_change_x = 0;
                timeline_mark_triangle_left_start = 0;
                DRAGGING_TIMELINE_MARK = false;
            }
        }
    });

    interact('#scroll-bar').draggable({
        listeners: {
            start (event) {
              //make sure there are no wierd highlighting when the user is dragging
              window.getSelection().removeAllRanges(); 
              scrollbar_change_x = 0;
              scrollbar_left_start = $("#scroll-bar").position().left - 170.5;
            },
            move (event) {
                //make sure there are no wierd highlighting when the user is dragging
                window.getSelection().removeAllRanges();
                let min = 0;
                let max = $("#scroll-bar-background").width() - $("#scroll-bar").width();
                
                scrollbar_change_x += event.dx;
                let newLeft = scrollbar_left_start + scrollbar_change_x
                if(newLeft < min){
                    newLeft = min;
                }else if(newLeft > max){
                    newLeft = max;
                }

                UpdateScrollbarPosition(newLeft);
            },
      
            end (event){
                scrollbar_change_x = 0;
                scrollbar_left_start = 0;
            }
        }
    });


    interact('.effect-card').draggable({
        listeners: {
            start (event) {
                $('.channel-layer-timeline').removeClass('open');
                //make sure there are no wierd highlighting when the user is dragging
                window.getSelection().removeAllRanges();
                DRAGGING_EFFECT_CARD_RID = RID();
                let card_width = MARK_SPACING * ZOOM;
                let position = {
                    top: event.clientY - (27 / 2),
                    left: event.clientX - (card_width / 2),
                }

                let channel_type = $(event.target).attr('channel-type');
                let effect_type = $(event.target).attr('effect-type');
                let effect_name = $(event.target).attr('effect-name');
                let settings_type = $(event.target).attr('settings-type');

                let html = ejs.render(Templates["draggable-effect-card"],{
                    id: DRAGGING_EFFECT_CARD_RID,
                    channel_type: channel_type,
                    effect_type: effect_type,
                    effect_name: effect_name,
                    settings_type: settings_type,
                });

                $("body").append(html);

                $(`#${DRAGGING_EFFECT_CARD_RID}`).css({
                    top: `${position.top}px`,
                    left: `${position.left}px`,
                    width: `${card_width}px`,
                });

                $(`#${DRAGGING_EFFECT_CARD_RID}`).addClass('moving');

                // now that we have added this draggable effect card to the dom we have to visually open the channels layer timelines that this effect card can be dropped into
                $(`.channel[type='${channel_type}'] .channel-layer-timeline[type='${effect_type}']`).addClass('open');
            },
            move (event) {
                //make sure there are no wierd highlighting when the user is dragging
                let position = $(`#${DRAGGING_EFFECT_CARD_RID}`).offset();
                window.getSelection().removeAllRanges();
                let newTopPosition = position.top + event.dy;
                let newLeftPosition = position.left;
                // if the user is still in the left container then left positioning should just be normal and we will not try to adjust values for an effect card to stay in an appropriate space in the editor
                if($("#my-left-container").hasClass('open')){
                    newLeftPosition += event.dx;
                }else{// other wise we won't let the effect card become any smaller than the TIME_MARK_ABSOLUTE_OFFSET so it won't follow the mouse if it mouse gets any smaller than that
                    newLeftPosition += (event.clientX < TIME_MARK_ABSOLUTE_OFFSET && event.dx > 0 ? 0 : event.dx);
                }
                let card_width = MARK_SPACING * ZOOM;
                let isValidPosition = false;

                if(position.left + event.dx > 0.25 * window.innerWidth && $("#my-left-container").hasClass('open')){
                    ToggleLeftContainer();
                }

                let setHover = false;

                // we have to detect if we are hovering over an open channel-layer-timeline
                $('.channel-layer-timeline.open').removeClass('hover');
                // we are not going to try to detect what a persons effect card is hovering on until the toggle left container closes
                if(!$("#my-left-container").hasClass('open')){
                    $('.channel-layer-timeline.open').each(function(){
                        if(setHover){return;}
    
                        let rect = $(this).get(0).getBoundingClientRect();
                        //now we have to check if the mouse position is inside of this 
                        if(rect.y < event.clientY && event.clientY < rect.y + rect.height){
                            $(this).addClass('hover');
                            newTopPosition = rect.y + 2;//adding two because that is how much padding the ".channel-layer-timeline" has
                            if(newLeftPosition < TIME_MARK_ABSOLUTE_OFFSET){// if the user is inside a channel-layer that they can drop a effect card into we need to make sure that the card stays inside the box horizontally as well
                                newLeftPosition = TIME_MARK_ABSOLUTE_OFFSET;
                            }
                            setHover = true;
                        }
                    });
                }
                

                let start_time = null;
                let end_time = null;

                // if we haven't set a channel-layer-timeline as hovered then we need to make sure that the effect card has the same y value as the mouse beceause past functions may have caused these two values to be missaligned
                if(!setHover){// setting the effect-card position back to where the users mouse is because the users mouse is outside a channel layer that cna recieve this specific effect-card
                    newTopPosition = event.clientY - (27 / 2);
                    //let card_width = MARK_SPACING * ZOOM;
                    newLeftPosition = event.clientX - (card_width / 2);
                }else{
                   // this means that the effect-card is in a channel-layer that it is allowed to be in and so now we are going to calculate its start time and consequently emd time
                    start_time = CalculateSongTimeFromAbsolutePosition(newLeftPosition);
                    // all effect cards default as being 500ms long
                    end_time = start_time + 500;

                    // we are not going to check that this effect-card can fit where the user is currently placing it and if it doesn't see if
                    // we can make adjustments to the effect card data to make it fit and then return all the data this effect card needs to render properly
                    let channel_id = $('.channel-layer-timeline.open.hover').parents('.channel').attr('id');
                    let new_effect_card_data = TryToFitNewEffectCard({
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
                    });

                    newLeftPosition = new_effect_card_data.left;
                    start_time = new_effect_card_data.start_time;
                    end_time = new_effect_card_data.end_time;
                    card_width = new_effect_card_data.width;
                    isValidPosition = new_effect_card_data.isValidPosition;
                }

                $(`#${DRAGGING_EFFECT_CARD_RID}`).css({
                    top: `${newTopPosition}px`,
                    left: `${newLeftPosition}px`,
                    width: `${card_width}px`,
                });

                if(isValidPosition){
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).addClass('valid-position');
                }else{
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).removeClass('valid-position');
                }

                if(start_time != null && end_time != null){
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('start-time',start_time);
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('end-time',end_time);
                }
            },
      
            end (event){
                // before we delete the dragging effect card we need to take its data and pass it into a .channel-layer-timeline if there is one that is open and hovered ".open.hover"
                if($('.channel-layer-timeline.open.hover').length > 0 && $(`#${DRAGGING_EFFECT_CARD_RID}`).hasClass('valid-position')){
                    let copy = $(`#${DRAGGING_EFFECT_CARD_RID}`).clone();
                    copy.removeClass('valid-position moving');// this is a class name that would have been in the orginial dom element that we don't want carrying over to this copy of the dom element
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).remove();
                    // before we add this copy to the approate channel layer we need to calculate its position from its start time attribute
                    let leftPosition = CalculateLeftPositionInChannelLayerTimelineFromSongTime(Number(copy.attr('start-time')));
                    copy.css({
                        'left': `${leftPosition}px`,
                        'top': '0px',
                        'z-index': '1',
                    });
                    $('.channel-layer-timeline.open.hover .channel-layer-timeline-mover').append(copy);
                    
                    let channel_id = $('.channel-layer-timeline.open.hover').parents('.channel').attr('id');

                    // now we need to upate the Editor object with this new effect card data
                    Editor.update({
                        type: 'add-effect-card',
                        data: {
                            channel_id: channel_id,
                            effect_card: {
                                id: copy.attr('id'),
                                name: copy.attr('effect-name'),
                                start_time: Number(copy.attr('start-time')),
                                end_time: Number(copy.attr('end-time')),
                                channel_type: copy.attr('channel-type'),
                                effect_type: copy.attr('effect-type'),
                                settings_type: copy.attr('settings-type'),
                            },
                        },
                    });

                }else{// if we couldn't find a channel layer to drop the draggable-effect-card into then all we need to do is remove it from the dom
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).remove();
                }
                
                Editor.clearUnavailableTimesArrayForChannels(); // this holds old data on where all the unavailable times in specific channels are but these values may have changed after the user drag and tried to drop an effect card in
                DRAGGING_EFFECT_CARD_RID = null;
                $('.channel-layer-timeline').removeClass('open hover');
                
            }
        }
    });

    interact('.channel-layer-timeline-mover .draggable-effect-card .draggable-effect-card-name').draggable({
        listeners: {
            start (event) {
                $('.channel-layer-timeline').removeClass('open');
                //make sure there are no wierd highlighting when the user is dragging
                window.getSelection().removeAllRanges();
                DRAGGING_EFFECT_CARD_RID = $(event.target).parents('.draggable-effect-card').attr('id');
                let effect_card_absolute_position = $(`#${DRAGGING_EFFECT_CARD_RID}`).get(0).getBoundingClientRect();
                $(`#${DRAGGING_EFFECT_CARD_RID}`).addClass('absolute-position moving');
                $(`#${DRAGGING_EFFECT_CARD_RID}`).css({
                    left: `${effect_card_absolute_position.left}px`,
                    top: `${effect_card_absolute_position.top}px`,
                });
                let $effect_card = $(`#${DRAGGING_EFFECT_CARD_RID}`);
                let channel_type = $effect_card.attr('channel-type');
                let effect_type = $effect_card.attr('effect-type');

                // now that we have added this draggable effect card to the dom we have to visually open the channels layer timelines that this effect card can be dropped into
                $(`.channel[type='${channel_type}'] .channel-layer-timeline[type='${effect_type}']`).addClass('open');
            },
            move (event) {
                //make sure there are no wierd highlighting when the user is dragging
                let position = $(`#${DRAGGING_EFFECT_CARD_RID}`).offset();
                window.getSelection().removeAllRanges();
                let newTopPosition = position.top + event.dy;
                let newLeftPosition = position.left;
                let card_width = CSSPixelsToNumber($(`#${DRAGGING_EFFECT_CARD_RID}`).css('width'));
                // if the user is still in the left container then left positioning should just be normal and we will not try to adjust values for an effect card to stay in an appropriate space in the editor
                if($("#my-left-container").hasClass('open')){
                    newLeftPosition += event.dx;
                }else{// other wise we won't let the effect card become any smaller than the TIME_MARK_ABSOLUTE_OFFSET so it won't follow the mouse if it mouse gets any smaller than that
                    newLeftPosition += (event.clientX < TIME_MARK_ABSOLUTE_OFFSET && event.dx > 0 ? 0 : event.dx);
                }
                let isValidPosition = false;

                let setHover = false;

                // we have to detect if we are hovering over an open channel-layer-timeline
                $('.channel-layer-timeline.open').removeClass('hover');
                if(!$("#my-left-container").hasClass('open')){
                    $('.channel-layer-timeline.open').each(function(){
                        if(setHover){return;}
    
                        let rect = $(this).get(0).getBoundingClientRect();
                        //now we have to check if the mouse position is inside of this 
                        if(rect.y < event.clientY && event.clientY < rect.y + rect.height){
                            $(this).addClass('hover');
                            newTopPosition = rect.y + 2;//adding two because that is how much padding the ".channel-layer-timeline" has
                            if(newLeftPosition < TIME_MARK_ABSOLUTE_OFFSET){// if the user is inside a channel-layer that they can drop a effect card into we need to make sure that the card stays inside the box horizontally as well
                                newLeftPosition = TIME_MARK_ABSOLUTE_OFFSET;
                            }
                            setHover = true;
                        }
                    });
                }

                let start_time = null;
                let end_time = null;

                // if we haven't set a channel-layer-timeline as hovered then we need to make sure that the effect card has the same y value as the mouse beceause past functions may have caused these two values to be missaligned
                if(!setHover){// setting the effect-card position back to where the users mouse is because the users mouse is outside a channel layer that cna recieve this specific effect-card
                    newTopPosition = event.clientY - (27 / 2);
                    newLeftPosition = event.clientX - (card_width / 2);
                }else{
                   // this means that the effect-card is in a channel-layer that it is allowed to be in and so now we are going to calculate its start time and consequently emd time
                    start_time = CalculateSongTimeFromAbsolutePosition(newLeftPosition);
                    end_time = start_time + ConvertPixelsToTime(card_width);

                    // we are now going to check if the effect card can fit where the user is trying to place it and if it can't we will see if we can shift the effect card  to the left or right for things to fit. It the effect cards width is to big to fit in the space provided we will then say it is an invalid position
                    let channel_id = $('.channel-layer-timeline.open.hover').parents('.channel').attr('id');
                    let new_effect_card_data = TryToPositionEffectCard({
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
                    });

                    newLeftPosition = new_effect_card_data.left;
                    start_time = new_effect_card_data.start_time;
                    end_time = new_effect_card_data.end_time;
                    isValidPosition = new_effect_card_data.isValidPosition;
                }

                $(`#${DRAGGING_EFFECT_CARD_RID}`).css({
                    top: `${newTopPosition}px`,
                    left: `${newLeftPosition}px`,
                });

                if(isValidPosition){
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).addClass('valid-position');
                }else{
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).removeClass('valid-position');
                }

                if(start_time != null && end_time != null){
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('start-time',start_time);
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('end-time',end_time);
                }
            },
      
            end (event){
                // before we delete the dragging effect card we need to take its data and pass it into a .channel-layer-timeline if there is one that is open and hovered ".open.hover"
                if($('.channel-layer-timeline.open.hover').length > 0 && $(`#${DRAGGING_EFFECT_CARD_RID}`).hasClass('valid-position')){
                    let copy = $(`#${DRAGGING_EFFECT_CARD_RID}`).clone();
                    copy.removeClass('valid-position moving absolute-position');// this is a class name that would have been in the orginial dom element that we don't want carrying over to this copy of the dom element
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).remove();
                    // before we add this copy to the approate channel layer we need to calculate its position from its start time attribute
                    let leftPosition = CalculateLeftPositionInChannelLayerTimelineFromSongTime(Number(copy.attr('start-time')));
                    copy.css({
                        'left': `${leftPosition}px`,
                        'top': '0px',
                        'z-index': '1',
                    });
                    $('.channel-layer-timeline.open.hover .channel-layer-timeline-mover').append(copy);
                    
                    let channel_id = $('.channel-layer-timeline.open.hover').parents('.channel').attr('id');

                    // now we need to upate the Editor object with this new effect card data
                    Editor.update({
                        type: 'moved-effect-card',
                        data: {
                            channel_id: channel_id,
                            effect_card: {
                                id: copy.attr('id'),
                                start_time: Number(copy.attr('start-time')),
                                end_time: Number(copy.attr('end-time')),
                                effect_type: copy.attr('effect-type'),
                            },
                        },
                    });

                }else{// if we couldn't find a channel layer to drop the draggable-effect-card into then we need to place it back where it came from
                    let effect_card = Editor.getEffectCard(DRAGGING_EFFECT_CARD_RID);
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('start-time', effect_card.start_time);
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).attr('end-time', effect_card.end_time);
                    let leftPosition = CalculateLeftPositionInChannelLayerTimelineFromSongTime(effect_card.start_time);
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).removeClass('valid-position moving absolute-position');
                    $(`#${DRAGGING_EFFECT_CARD_RID}`).css({
                        'left': `${leftPosition}px`,
                        'top': '0px',
                        'z-index': '1',
                    });
                }
                
                Editor.clearUnavailableTimesArrayForChannels(); // this holds old data on where all the unavailable times in specific channels are but these values may have changed after the user drag and tried to drop an effect card in
                DRAGGING_EFFECT_CARD_RID = null;
                $('.channel-layer-timeline').removeClass('open hover');
                
            }
        }
    });


    interact('.channel-layer-timeline-mover .draggable-effect-card .left-handle').draggable({
        listeners: {
            start (event) {
                window.getSelection().removeAllRanges();
                RESIZING_EFFECT_CARD_ID = $(event.target).parent('.draggable-effect-card').attr('id');
            },
            move (event) {
                window.getSelection().removeAllRanges();
                // first thing we need to get the effect-card that is being resized
                let $effect_card = $(`#${RESIZING_EFFECT_CARD_ID}`);
                let effect_card_position_left = $effect_card.position().left;
                let effect_card_new_position_left = effect_card_position_left + event.dx;
                let new_effect_card_width = CSSPixelsToNumber($effect_card.css('width')) + (effect_card_position_left - effect_card_new_position_left);
                let effect_card_end_position = $effect_card.position().left + CSSPixelsToNumber($effect_card.css('width'));
                let minimum_effect_card_width = ConvertTimeToPixels(MINIMUM_EFFECT_CARD_DURATION);

                let dealt_with_possible_sizing_error = false;

                // before we accept the current new start position to be the new start position we need to do some checks which include
                // making sure the card duration doesn't become to small (so there is a card size min) and make sure that by changing
                // the start position we are not overlapping another card

                if(new_effect_card_width < minimum_effect_card_width) {
                    // getting ending position of card and then we are going to subtract the minimum card width to get the new card position left value
                    new_effect_card_width = minimum_effect_card_width;
                    effect_card_new_position_left = effect_card_end_position - minimum_effect_card_width;
                    dealt_with_possible_sizing_error = true;
                }

                // now that we have all the data we need, we need to update the width, left position, and start-time attribute of this effect-card
                $effect_card.css({
                    'left': `${effect_card_new_position_left}px`,
                    'width': `${new_effect_card_width}px`,
                });

                let new_start_time = CalculateSongTimeFromAbsolutePosition($effect_card.offset().left);

                if(!dealt_with_possible_sizing_error){
                    // if we haven't dealt with a sizing error we need to try to deal with one that occurs when the user makes this effect card to big and overlaps another one
                    // we are going to go through each effect card in this specific channel and find the effect card that has the closest end time value that is greater than
                    // this cards end time value. As we try to find this card we will store the start time and end time of possible candidates until we find the right one.
                    let prev_card_time = null;
                    $effect_card.siblings().each(function(){
                        if(Number($(this).attr('start-time')) < new_start_time){
                            if(prev_card_time == null){
                                prev_card_time =  {
                                    start: Number($(this).attr('start-time')),
                                    end: Number($(this).attr('end-time')),
                                }
                            }else if(Number($(this).attr('start-time')) > prev_card_time.start){
                                prev_card_time =  {
                                    start: Number($(this).attr('start-time')),
                                    end: Number($(this).attr('end-time')),
                                }
                            }
                        }
                    });

                    let adjusted_start_time = false;

                    // now that we have figure out the closest effect card that is near this effect card's right handle we need to make sure that this new_end_time is smaller
                    // than or equal to the start time of the next closest card effect
                    if(prev_card_time != null){// this means we found a card
                        if(new_start_time < prev_card_time.end){
                            new_start_time = prev_card_time.end;  
                            adjusted_start_time = true;
                        }
                    }else{
                        // if we couldn't find a card before this one we need to make sure that the new_start_time is greater than or equal to 0
                        if(new_start_time < 0){
                            new_start_time = 0;
                            adjusted_start_time = true;
                        }
                        
                    }

                    if(adjusted_start_time){
                        //calculating the new left position this effect card has to be at to not overlap with the previous effect card
                        effect_card_new_position_left = CalculateLeftPositionInChannelLayerTimelineFromSongTime(new_start_time);
                        new_effect_card_width = effect_card_end_position - effect_card_new_position_left;
                        $effect_card.css({
                            'left': `${effect_card_new_position_left}px`,
                            'width': `${new_effect_card_width}px`,
                        });
                    }
                    
                }

                $effect_card.attr('start-time', new_start_time);
                
            },
      
            end (event){
                window.getSelection().removeAllRanges();
                let $effect_card = $(`#${RESIZING_EFFECT_CARD_ID}`);
                // once the user is done resizing we need to save the new information of the effect card the user resized
                Editor.update({
                    type: 'resized-effect-card',
                    data: {
                        effect_card: {
                            id: $effect_card.attr('id'),
                            start_time: Number($effect_card.attr('start-time')),
                            end_time: Number($effect_card.attr('end-time')),
                        }
                    },
                });

                RESIZING_EFFECT_CARD_ID = null;

            }
        }
    });

    interact('.channel-layer-timeline-mover .draggable-effect-card .right-handle').draggable({
        listeners: {
            start (event) {
                window.getSelection().removeAllRanges();
                RESIZING_EFFECT_CARD_ID = $(event.target).parent('.draggable-effect-card').attr('id');
            },
            move (event) {
                window.getSelection().removeAllRanges();
                // first thing we need to get the effect-card that is being resized
                let $effect_card = $(`#${RESIZING_EFFECT_CARD_ID}`);
                let effect_card_end_position = $effect_card.position().left + CSSPixelsToNumber($effect_card.css('width'));
                let effect_card_new_end_position = effect_card_end_position + event.dx;
                let new_effect_card_width = CSSPixelsToNumber($effect_card.css('width')) + (effect_card_new_end_position - effect_card_end_position);

                let minimum_effect_card_width = ConvertTimeToPixels(MINIMUM_EFFECT_CARD_DURATION);

                let dealt_with_possible_sizing_error = false;

                // before we accept the current new end position to be the new end position we need to do some checks which include
                // making sure the card duration doesn't become to small (so there is a card size min) and make sure that by changing
                // the ending position we are not overlapping another card

                if(new_effect_card_width < minimum_effect_card_width) {
                    // getting ending position of card and then we are going to subtract the minimum card width to get the new card position left value
                    new_effect_card_width = minimum_effect_card_width;
                    dealt_with_possible_sizing_error = true;
                }

                // now that we have all the data we need, we need to update the width and end-time attribute of this effect-card
                $effect_card.css('width', new_effect_card_width);
                let new_end_time = CalculateSongTimeFromAbsolutePosition($effect_card.offset().left + CSSPixelsToNumber($effect_card.css('width')));
                if(!dealt_with_possible_sizing_error){
                    // if we haven't dealt with a sizing error we need to try to deal with one that occurs when the user makes this effect card to big and overlaps another one
                    // we are going to go through each effect card in this specific channel and find the effect card that has the closest end time value that is greater than
                    // this cards end time value. As we try to find this card we will store the start time and end time of possible candidates until we find the right one.
                    let next_card_time = null;
                    $effect_card.siblings().each(function(){
                        if(Number($(this).attr('end-time')) > new_end_time){
                            if(next_card_time == null){
                                next_card_time =  {
                                    start: Number($(this).attr('start-time')),
                                    end: Number($(this).attr('end-time')),
                                }
                            }else if(Number($(this).attr('end-time')) < next_card_time.end){
                                next_card_time =  {
                                    start: Number($(this).attr('start-time')),
                                    end: Number($(this).attr('end-time')),
                                }
                            }
                        }
                    });

                    let adjusted_end_time = false;

                    // now that we have figure out the closest effect card that is near this effect card's right handle we need to make sure that this new_end_time is smaller
                    // than or equal to the start time of the next closest card effect
                    if(next_card_time != null){// this means we found a card
                        if(new_end_time > next_card_time.start){
                            new_end_time = next_card_time.start;
                            adjusted_end_time = true;
                        }
                    }else{
                        // if we couldn't find a card after this one we need to make sure that the new_end_time is smaller than or equal to the length of the song
                        if(new_end_time > PLAYBACK_DURATION){
                            new_end_time = PLAYBACK_DURATION;
                            adjusted_end_time = true; 
                        }
                    }

                    if(adjusted_end_time){
                        // calculating new width of card effect based on the new_end_time
                        new_effect_card_width = CalculateLeftPositionInChannelLayerTimelineFromSongTime(new_end_time) - $effect_card.position().left;
                        $effect_card.css('width', new_effect_card_width);
                    }
                    
                }

                $effect_card.attr('end-time', new_end_time);
                
                
            },
      
            end (event){
                window.getSelection().removeAllRanges();
                let $effect_card = $(`#${RESIZING_EFFECT_CARD_ID}`);
                // once the user is done resizing we need to save the new information of the effect card the user resized
                Editor.update({
                    type: 'resized-effect-card',
                    data: {
                        effect_card: {
                            id: $effect_card.attr('id'),
                            start_time: Number($effect_card.attr('start-time')),
                            end_time: Number($effect_card.attr('end-time')),
                        }
                    },
                });

                RESIZING_EFFECT_CARD_ID = null;
            }
        }
    });


    /*
    interact('.channel-layer-timeline-mover .draggable-effect-card .draggable-effect-card-name').draggable({
        listeners: {
            start (event) {
                window.getSelection().removeAllRanges();
            },
            move (event) {
                window.getSelection().removeAllRanges();
                let $effect_card = $(event.target).parent('.draggable-effect-card');
                let valid_drop_zone = true;
                let new_position = $effect_card.position();
                new_position.left += event.dx;
                new_position.top += event.dy;

                // once we hav done all the checks to figure out where we can place this card and possibly change the values of new_position we set the position of the card
                $effect_card.css({
                    'left': new_position.left,
                    'top': new_position.top,
                });

            },
      
            end (event){
                window.getSelection().removeAllRanges();
                let $effect_card = $(event.target).parent('.draggable-effect-card');
                let old_start_pos = CalculateLeftPositionInChannelLayerTimelineFromSongTime(Number($effect_card.attr('start-time')));
                $effect_card.css({
                    'left': `${old_start_pos}px`,
                    'top': '0px',
                });
            }
        }
    });*/

});