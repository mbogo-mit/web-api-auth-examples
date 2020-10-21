let myCanvas;
let h = 8;
let spacing = 4;

function setup(){
    myCanvas = createCanvas($("#audio-analysis-canvas-container").width(), h * 18 + spacing);
    myCanvas.parent('audio-analysis-canvas-container');
    if($("#audio-analysis-canvas-container").css('display') !== 'none' && datasets !== null){
        RenderAll();
    }
}

function draw(){
    if(MARK_STARTING_POSITION !== MARK_STARTING_CANVAS_POSITION || MARK_STARTING_CANVAS_ZOOM !== ZOOM){
        MARK_STARTING_CANVAS_POSITION = MARK_STARTING_POSITION;
        MARK_STARTING_CANVAS_ZOOM = ZOOM;
        console.log('draw');
        if($("#audio-analysis-canvas-container").css('display') !== 'none' && datasets !== null){
            RenderAll();
        }
        
    }
}

function RenderAll(){
    background(255);
    stroke(255);
    strokeWeight(1);
    RenderPitchesData();
    RenderBeatsData();
    RenderTatumsData();
    RenderLoudnessData();
}

function RenderPitchesData(){
    let x = 0;
    let y = 0;
    let w = 0;

    for(let i = 0; i < datasets.pitches.length; i++){
        y = i * h;
        for(let j = 0; j < datasets.pitches[i].length; j++){
            x = MARK_STARTING_CANVAS_POSITION + datasets.pitches[i][j].start_time * (MARK_SPACING * ZOOM / TIME_STEP);
            w = datasets.pitches[i][j].duration * (MARK_SPACING * ZOOM / TIME_STEP);
            if(x + w > 0 && x < width){
                fill(255 - map(datasets.pitches[i][j].value, 0, 1, 0, 255));
                rect(x,y,w,h);   

                if(i === 0){
                    //we need to render the timbre color data for these specific set of pitches
                    //console.log(datasets.timbre_colors[j][0],datasets.timbre_colors[j][1],datasets.timbre_colors[j][2]);
                    fill(datasets.timbre_colors[j][0],datasets.timbre_colors[j][1],datasets.timbre_colors[j][2]);
                    rect(x, 12 * h + spacing, w, h);
                    fill(datasets.timbre_colors[j][3],datasets.timbre_colors[j][4],datasets.timbre_colors[j][5]);
                    rect(x, 13 * h + spacing, w, h);
                    fill(datasets.timbre_colors[j][6],datasets.timbre_colors[j][7],datasets.timbre_colors[j][8]);
                    rect(x, 14 * h + spacing, w, h);
                    fill(datasets.timbre_colors[j][9],datasets.timbre_colors[j][10],datasets.timbre_colors[j][11]);
                    rect(x, 15 * h + spacing, w, h);
                    // we need to also render the uniqueness data for this specific set of pitches 
                    // fill(`rgba(0,255,0, ${map(datasets.timbre_uniqueness[j], 0, 1, 0, 1)})`);
                    // rect(x, 14 * h + spacing, w, h);

                    
                }
            }
            
            
        }
    }
}

function RenderBeatsData(){
    let x = 0; 
    let y = 16 * h + spacing;
    let w = 0;
    for(let i = 0; i < datasets.beats.length; i++){
        x = MARK_STARTING_CANVAS_POSITION + datasets.beats[i].start * 1000 * (MARK_SPACING * ZOOM / TIME_STEP);
        w = datasets.beats[i].duration * 1000 * (MARK_SPACING * ZOOM / TIME_STEP);
        if(x + w > 0 && x < width){
            fill(`rgba(69, 137, 255, ${datasets.beats[i].confidence})`);
            rect(x,y,w,h);
        }
        
    }
}

function RenderTatumsData(){
    let x = 0; 
    let y = 17 * h + spacing;
    let w = 0;
    for(let i = 0; i < datasets.tatums.length; i++){
        x = MARK_STARTING_CANVAS_POSITION + datasets.tatums[i].start * 1000 * (MARK_SPACING * ZOOM / TIME_STEP);
        w = datasets.tatums[i].duration * 1000 * (MARK_SPACING * ZOOM / TIME_STEP);
        if(x + w > 0 && x < width){
            fill(`rgba(137, 46, 255, ${datasets.tatums[i].confidence})`);
            rect(x,y,w,h);
        }
        
    }
}

function RenderLoudnessData(){
    let x1 = 0; 
    let y1 = 0;
    let x2 = 0; 
    let y2 = 0;

    let loudness_length = datasets.loudness.length;
    datasets.loudness_min = -55;
    //datasets.loudness_max = 0;

    stroke(211, 51, 255);
    strokeWeight(2);
    curveTightness(0.5);

    noFill();
    beginShape();
    x1 = MARK_STARTING_CANVAS_POSITION + datasets.loudness[0].start_time * (MARK_SPACING * ZOOM / TIME_STEP);
    y1 = (12 * h) - map(datasets.loudness[0].start_value, datasets.loudness_min, datasets.loudness_max, 0, 12 * h);
    curveVertex(x1, y1);
    for(let i = 0; i < loudness_length; i++){
        x1 = MARK_STARTING_CANVAS_POSITION + datasets.loudness[i].start_time * (MARK_SPACING * ZOOM / TIME_STEP);
        y1 = (12 * h) - map(datasets.loudness[i].start_value, datasets.loudness_min, datasets.loudness_max, 0, 12 * h);
        x2 = x1 + datasets.loudness[i].max_time * (MARK_SPACING * ZOOM / TIME_STEP);
        y2 = (12 * h) - map(datasets.loudness[i].max_value, datasets.loudness_min, datasets.loudness_max, 0, 12 * h);
        curveVertex(x1, y1);
        //curveVertex(x2, y2);
        //line(x1,y1,x2,y2);
        //next we have to draw a line between this segments max value and the beginning value of the next segment if the next segment exists
        /*if(i + 1 < datasets.loudness.length){
            x1 = x2;
            y1 = y2;
            x2 = datasets.loudness[i + 1].start_time * (MARK_SPACING * ZOOM / TIME_STEP);
            y2 = (12 * h) - map(datasets.loudness[i + 1].start_value, datasets.loudness_min, datasets.loudness_max, 0, 12 * h);
            line(x1,y1,x2,y2);
        }*/
    }
    /*x1 = datasets.loudness[loudness_length - 1].start_time * (MARK_SPACING * ZOOM / TIME_STEP);
    y1 = (12 * h) - map(datasets.loudness[loudness_length - 1].start_value, datasets.loudness_min, datasets.loudness_max, 0, 12 * h);
    x2 = x1 + datasets.loudness[loudness_length - 1].max_time * (MARK_SPACING * ZOOM / TIME_STEP);
    y2 = (12 * h) - map(datasets.loudness[loudness_length - 1].max_value, datasets.loudness_min, datasets.loudness_max, 0, 12 * h);
    */
    curveVertex(x1, y1);
    endShape();
}