const Templates = {
    channels: {
        "lightbulb":`
        <div id="<%= id %>" class="channel" type="lightbulb" class="col m12">
            <div class="card white darken-1 z-depth-0">
                <div class="row my-row">
                    <div class="col m12">
                        <div class="channel-header">
                            <div class="channel-image-container">
                                <img height="18px" src="/static/images/lightbulbiconpicture.png"/>
                            </div>
                            <div class="channel-name">
                                <input class="input-channel-name validate" placeholder="Untitled" type="text" onchange="ChannelNameChanged()" />
                            </div>
                            <div class="channel-options-dropdown-container right">
                                <i class="expand-more material-icons dropdown-trigger" data-target="channel-options-dropdown-<%= id %>">expand_more</i>
                                <ul id='channel-options-dropdown-<%= id %>' class='dropdown-content'>
                                    <li><a href="#!">Duplicate</a></li>
                                    <li><a href="#!">Delete</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="padding-left: 10px;" class="row my-row">
                    <div class="col m1 channel-layer-names-container">
                        <div class="channel-layer-name" type="color">Color</div>
                        <div class="channel-layer-name" type="brightness">Brightness</div>
                    </div>
                    <div class=" col m1 channel-layer-timelines-container">
                        <div class="channel-layer-timeline" type="color">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                        <div class="channel-layer-timeline" type="brightness">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `,
        "led-strip": `
        <div id="<%= id %>" class="channel" type="led-strip" class="col m12">
            <div class="card white darken-1 z-depth-0">
                <div class="row my-row">
                    <div class="col m12">
                        <div class="channel-header">
                            <div class="channel-image-container">
                                <img height="18px" src="/static/images/ledstripiconpicture.png"/>
                            </div>
                            <div class="channel-name">
                            <input class="input-channel-name validate" placeholder="Untitled" type="text" onchange="ChannelNameChanged()" />
                            </div>
                        </div>
                    </div>
                </div>
                <div style="padding-left: 10px;" class="row my-row">
                    <div class="col m1 channel-layer-names-container">
                        <div class="channel-layer-name" type="colors">Colors</div>
                        <div class="channel-layer-name" type="brightness">Brightness</div>
                    </div>
                    <div class=" col m1 channel-layer-timelines-container">
                        <div class="channel-layer-timeline" type="colors">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                        <div class="channel-layer-timeline" type="brightness">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `,
        "led-pillow": `
        <div id="<%= id %>" class="channel" type="led-pillow" class="col m12">
            <div class="card white darken-1 z-depth-0">
                <div class="row my-row">
                    <div class="col m12">
                        <div class="channel-header">
                            <div class="channel-image-container">
                                <img height="18px" src="/static/images/pillowiconpicture.png"/>
                            </div>
                            <div class="channel-name">
                            <input class="input-channel-name validate" placeholder="Untitled" type="text" onchange="ChannelNameChanged()" />
                            </div>
                        </div>
                    </div>
                </div>
                <div style="padding-left: 10px;" class="row my-row">
                    <div class="col m1 channel-layer-names-container">
                        <div class="channel-layer-name" type="text-graphics">Text/Graphics</div>
                        <div class="channel-layer-name" type="background">Background</div>
                        <div class="channel-layer-name" type="brightness">Brightness</div>
                    </div>
                    <div class=" col m1 channel-layer-timelines-container">
                        <div class="channel-layer-timeline" type="text-graphics">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                        <div class="channel-layer-timeline" type="background">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                        <div class="channel-layer-timeline" type="brightness">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        `,
        "led-blanket": `
        <div id="<%= id %>" class="channel" type="led-blanket" class="col m12">
            <div class="card white darken-1 z-depth-0">
                <div class="row my-row">
                    <div class="col m12">
                        <div class="channel-header">
                            <div class="channel-image-container">
                                <img height="18px" src="/static/images/blanketiconpicture.png"/>
                            </div>
                            <div class="channel-name">
                            <input class="input-channel-name validate" placeholder="Untitled" type="text" onchange="ChannelNameChanged()" />
                            </div>
                        </div>
                    </div>
                </div>
                <div style="padding-left: 10px;" class="row my-row">
                    <div class="col m1 channel-layer-names-container">
                        <div class="channel-layer-name" type="text-graphics">Text/Graphics</div>
                        <div class="channel-layer-name" type="background">Background</div>
                        <div class="channel-layer-name" type="brightness">Brightness</div>
                    </div>
                    <div class=" col m1 channel-layer-timelines-container">
                        <div class="channel-layer-timeline" type="text-graphics">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                        <div class="channel-layer-timeline" type="background">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                        <div class="channel-layer-timeline" type="brightness">
                            <div class="channel-layer-timeline-mover">
                            
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div> 
        `,
    },
    "draggable-effect-card": `
    <div id="<%= id %>" class="draggable-effect-card" channel-type="<%= channel_type %>" effect-type="<%= effect_type %>" settings-type="<%= settings_type %>" effect-name="<%= effect_name %>">
        <div class="left-handle"></div>
        <div onclick="FocusOnThisEffectCard('<%= id %>')" class="draggable-effect-card-name truncated-info grey-text text-darken-3"><%= effect_name %></div>
        <div class="right-handle"></div>
    </div>
    `,
    "settings-breadcrumb-navbar": `
    <nav>
        <div class="nav-wrapper">
            <div class="col s12">
                <a href="#!" class="breadcrumb"><%= effect_type %></a>
                <a href="#!" class="breadcrumb"><%= effect_name %></a>
            </div>
        </div>
    </nav>
    `,
    settings: {
        color: {
            solid_color: `
                <div id="color-picker-<%= id %>" class="color-picker"></div>
                <div id="current-color-in-picker"></div>
            `,
        },
        brightness: {
            constant_brightness: `
                <div id="color-picker-<%= id %>" class='color-picker'></div>
            `,
        }
    }
};