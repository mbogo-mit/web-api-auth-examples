function EDITOR(){
    this.data = {
        channels: {
            /* 
            // represents id
            <String> : {
                index: <Integer>, //the order that these channels appear in the ui
                type: <String>, //could be "lightbulb", "led-strip", "led-pillow", or "led-blanket",
                name: <String>, // the name the user gives the channel
                layers: {
                    // depending on the type of channel object we are using there may be different keys. In this example we will do it for a lightbulb channel
                    color: {
                        effect_card_ids: Array<String>,
                    },
                    brightness: {
                        effect_card_ids: Array<String>,
                    },
                }
            }
            */
        },
        effect_cards: {
            /*
            
            // respresents id
            <String> : {
                name: <String>
                start_time: <Integer>
                end_time: <Integer>
                type: {
                    channel_type: <String>,
                    effect_type: <String>,
                },
                settings: {
                    ejs_template_path: Array<String>
                    functions: <Object>
                    values: <Object>, // this object holds all the values that this effect card needs to define exactly how this effect will appear. Differenting  settigns will have different values that relate to how the user can interact with these effects
                }
            }
            */
    
        },
    };

    // this will hold the time ranges of every effect card in a specific channels not including the one the user is trying to move.
    // This objects keys and values will be repopulated every time the user wants to move an effect card
    this.unavailableTimesArrayForChannels = {};

    // this object will hold the data structures for all the different types of settings the different effect cards can have and the ejs template file it should point to render these settings into an easy to use settings ui.
    this.settings = {
        'lightbulb': {
            color: {
                solid_color: {
                    settings: {
                        ejs_template_path: ['color', 'solid_color'], // list of keys that points to where the ejs template is in the Template.settings object
                        functions: {
                            init: function(args){//args will have a start_time, end_time, and values
                                let colorPicker = new iro.ColorPicker(`#color-picker-${args.id}`, {
                                    // color picker options
                                    // Option guide: https://iro.js.org/guide.html#color-picker-options
                                    layout: [
                                        { 
                                        component: iro.ui.Wheel,
                                        },
                                    ],
                                    width: (0.2 * window.innerWidth) - 40,
                                    color: args.values.rgb_color_string,
                                    borderWidth: 1,
                                    borderColor: "white",
                                });

                                //adding event listener to see when the color changes
                                colorPicker.on(["color:init", "color:change"], function(color){
                                    // update the color of the effect card and color picker bar to match the color the user has chosen
                                    $(`#current-color-in-picker, #${args.id}`).css('background-color', color.rgbString);
                                    //then we save the data
                                    Editor.update({
                                        type: 'changed-effect-card-settings',
                                        data: {
                                            effect_card_id: args.id,
                                            values: {rgb_color_string: color.rgbString},
                                        }
                                    })
                                });
                            },
                            events: {// object that holds a list of functions to run a specific event is fired

                            },
                        },
                        values: {
                            rgb_color_string: 'rgb(255,0,0)',
                        },
                    }
                },
                gradient: {
                    settings: {
                        ejs_template_path: ['color', 'gradient_color'], // list of keys that points to where the ejs template is in the Template.settings object
                        functions: {
                            init: function(args){
                                
                            },
                            events: {// object that holds a list of functions to run a specific event is fired

                            },
                        },
                        values: {
                            start_rgb_color: [255, 88, 160], // pink color we use throughout ui
                            end_rgb_color: [211, 51, 255], //purpble color we use throughout ui
                            gradient_stops: [
                                // an array of objects that holds the time and color of a gradient stop
                                /* data structure of object
                                    {time: <Integer>, rgb_color: Array<Integer>}
                                */
                            ],
                        }
                    }
                }
            },
            brightness: {
                constant_brightness: {
                    settings: {
                        ejs_template_path: ['brightness', 'constant_brightness'], // list of keys that points to where the ejs template is in the Template.settings object
                        functions: {
                            init: function(args){
                                let colorPicker = new iro.ColorPicker(`#color-picker-${args.id}`, {
                                    // color picker options
                                    // Option guide: https://iro.js.org/guide.html#color-picker-options
                                    layout: [
                                        {
                                            component: iro.ui.Slider,
                                            options: {
                                                sliderType: 'value'
                                            }
                                        },
                                    ],
                                    width: (0.2 * window.innerWidth) - 40,
                                    color: args.values.rgb_color_string,
                                    borderWidth: 1,
                                    borderColor: "#ff58a1",
                                });

                                //adding event listener to see when the color changes
                                colorPicker.on(["color:init", "color:change"], function(color){
                                    // update the color of the brightness effect card the user is configuring
                                    $(`#${args.id}`).css('background-color', color.rgbString);
                                    //then we save the data
                                    Editor.update({
                                        type: 'changed-effect-card-settings',
                                        data: {
                                            effect_card_id: args.id,
                                            values: {rgb_color_string: color.rgbString},
                                        }
                                    })
                                });
                            },
                            events: {// object that holds a list of functions to run a specific event is fired

                            },
                        },
                        values: {
                            rgb_color_string: 'rgb(255,255,255)',
                        }
                    }
                }
            }
        }
    };


    this.types_of_layers = {
        'lightbulb': {
            color: {
                effect_card_ids: [],
            },
            brightness: {
                effect_card_ids: [],
            },
        },
        'led-strip': {
            colors: {
                effect_card_ids: [],
            },
            brightness: {
                effect_card_ids: [],
            },
        },
        'led-pillow': {
            'text-graphics': {
                effect_card_ids: [],
            },
            background: {
                effect_card_ids: [],
            },
            brightness: {
                effect_card_ids: [],
            },
        },
        'led-blanket': {
            'text-graphics': {
                effect_card_ids: [],
            },
            background: {
                effect_card_ids: [],
            },
            brightness: {
                effect_card_ids: [],
            },
        },
    }

    this.getEffectCard = function(id){
        return this.data.effect_cards[id];
    }

    this.InitEffectCardSettings = function(effect_card_id){
       // this function takes an effect_card_id and uses it to initialize the correct settings ui for this card
       
       //first we need to grab the correct card data
       let effect_card = this.data.effect_cards[effect_card_id];
       //first thing we will do is update the setting breadcrumb navbar with the new data
       $("#my-settings-content-breadcrumbs").html(ejs.render(Templates['settings-breadcrumb-navbar'], {effect_type: effect_card.type.effect_type , effect_name: effect_card.name}));
       //next thing we need to do is populate the '#my-settings-content' dom element with the settings ui
       let settings_ui_template = effect_card.settings.ejs_template_path.reduce((obj,key)=> obj[key], Templates.settings);
       $('#my-settings-content').html(ejs.render(settings_ui_template, {
           id: effect_card_id, 
           start_time: effect_card.start_time,
           end_time: effect_card.end_time,
           values: effect_card.settings.values
        }));

       // now that the settings template is in the ui we will initialize anything specifci that this ui needs to create the user experience
       effect_card.settings.functions.init({id: effect_card_id, start_time: effect_card.start_time, end_time: effect_card.end_time, values: effect_card.settings.values});
       //once everything has loaded we will removing the loading class from '#my-settings-container' dom element
       $('#my-settings-container').removeClass('loading');
    }


    this.update = function(args){
        if(args.type == 'add-channel'){
            this.addChannel(args.data);
        }else if(args.type == 'rename-channel'){
            this.renameChannel(args.data);
        }else if(args.type == 'remove-channel'){
            this.removeChannel(args.data);
        }else if(args.type == 'rearranged-channels'){
            this.rearrangedChannels(args.data);
        }else if(args.type == 'add-effect-card'){
            this.addEffectCard(args.data);
        }else if(args.type == 'removed-effect-card'){
            this.removedEffectCard(args.data);
        }else if(args.type == 'resized-effect-card'){
            this.resizedEffectCard(args.data);
        }else if(args.type == 'moved-effect-card'){
            this.movedEffectCard(args.data);
        }else if(args.type == 'changed-effect-card-settings'){
            this.changedEffectCardSettings(args.data);
        }
    }

    this.addChannel = function(data){
        let new_channel = {
            index: data.index,
            type: data.type,
            name: data.name == undefined ? "" : data.name,
            layers: this.types_of_layers[data.type],
        };

        this.data.channels[data.id] = new_channel;
    }

    this.renameChannel = function(data){
        this.data.channels[data.channel_id].name = data.name;
    }

    this.removeChannel = function(data){

    }
    
    this.rearrangedChannels = function(data){

    }

    this.addEffectCard = function(data){
        //adding the effect card id to the correct layer in the correct channel 
        this.data.channels[data.channel_id].layers[data.effect_card.effect_type].effect_card_ids.push(data.effect_card.id);
        // adding a new effect card to the effect cards object which can be retrieved using the id passed to the channels data
        this.data.effect_cards[data.effect_card.id] = {
            //structure of effec_card object
            name: data.effect_card.name,
            start_time: data.effect_card.start_time,
            end_time: data.effect_card.end_time,
            type: {
                channel_type: data.effect_card.channel_type,
                effect_type: data.effect_card.effect_type,
            },// data.effect_card.settings_type
            settings: this.getSettingsObject({
                channel_type: data.effect_card.channel_type,
                effect_type: data.effect_card.effect_type,
                settings_type: data.effect_card.settings_type,
            }),
        };
    }

    this.getSettingsObject = function(args){
        // rap it in json.parse and json.stringify to create a deep copy of the settings object then we return it
        let settings = this.settings[args.channel_type][args.effect_type][args.settings_type].settings;
        let settings_copy = JSON.parse(JSON.stringify(settings));
        settings_copy.functions = settings.functions;
        return settings_copy;
    }

    this.removedEffectCard = function(data){

    }

    this.resizedEffectCard = function(data){
        this.data.effect_cards[data.effect_card.id].start_time = data.effect_card.start_time;
        this.data.effect_cards[data.effect_card.id].end_time = data.effect_card.end_time;
    }

    this.movedEffectCard = function(data){
        // first thing we need to do is change the start_time and end_time of the effect_card the user just moved
        this.data.effect_cards[data.effect_card.id].start_time = data.effect_card.start_time;
        this.data.effect_cards[data.effect_card.id].end_time = data.effect_card.end_time;
        // next thing is we need to add the effect card id to the channel the user moved the card to. If that channel
        // id so happens to already have that id in it then our work is done because that means the user just moved
        // the effect card from one place in the channel to another
        if(this.data.channels[data.channel_id].layers[data.effect_card.effect_type].effect_card_ids.indexOf(data.effect_card.id) !== -1){return;}
        this.data.channels[data.channel_id].layers[data.effect_card.effect_type].effect_card_ids.push(data.effect_card.id);
        this.removeEffectCardIdFromChannel(data.effect_card.id, data.effect_card.effect_type);
    }

    this.removeEffectCardIdFromChannel = function(effect_card_id, effect_card_effect_type){
        for(const [key, value] of Object.entries(this.data.channels)){
            if(value.layers[effect_card_effect_type] != undefined){
                let index = value.layers[effect_card_effect_type].effect_card_ids.indexOf(effect_card_id);
                if(index != -1){
                    this.data.channels[key].layers[effect_card_effect_type].splice(index,1);
                }
            }
        }
    }

    this.changedEffectCardSettings = function(data){
        Object.assign(this.data.effect_cards[data.effect_card_id].settings.values, data.values);
    }

    this.clearUnavailableTimesArrayForChannels = function(){
        this.unavailableTimesArrayForChannels = {};
    }

    this.getUnavailableTimesArrayForChannel = function(args){
        // args should have keys of "effect_card_id", "effect_type", and "channel_id"
        if(this.unavailableTimesArrayForChannels[args.channel_id] == undefined){
            this.calculateUnavailableTimesArrayForChannel(args);
        }

        return this.unavailableTimesArrayForChannels[args.channel_id];
    }

    this.calculateUnavailableTimesArrayForChannel = function(args){
        // args should have keys of "effect_card_id", "effect_type", and "channel_id"
        let effect_card_ids = this.data.channels[args.channel_id].layers[args.effect_type].effect_card_ids;
        let unavailableTimesArray = [];
        for(let i = 0; i < effect_card_ids.length; i++){
            if(effect_card_ids[i] != args.effect_card_id){// we don't want to include the effect card the user is currently trying to drag around
                unavailableTimesArray.push([
                    this.data.effect_cards[effect_card_ids[i]].start_time, 
                    this.data.effect_cards[effect_card_ids[i]].end_time
                ]);
            }
        }

        // now that we have grabbed all of the unavailable times ranges we need to add them to "this.unavailableTimesArrayForChannels" object
        this.unavailableTimesArrayForChannels[args.channel_id] = unavailableTimesArray;

    }
}
