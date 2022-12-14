// Handles media presentation and scale handling.

class Page {


    /*******************
     * Public Methods  *
     *******************/

    constructor(text, mediatype, mediadata, show_response,
                next_delay = 0.0, header_text = "", fixCrossType = "", jitter = 0.0) {

        // page specific variables
        this.text = text;
        this.header_text = header_text

        this.mediatype = mediatype;
        this.mediadata = mediadata;

        this.show_response = show_response;
        this.next_delay = next_delay; // delay for showing next button in seconds

        // html elements
        this.scale_region = document.getElementById("scale_region");
        this.response_region = document.getElementById("response_region");
        this.query = document.getElementById("query");
        this.probe_reminder = document.getElementById("probe_reminder");
        this.nextbutton = document.getElementById("nextbutton");
        this.mediascreen = document.getElementById("mediascreen");
        // this.fix_cross = document.getElementById("fix-cross");
        this.header = document.getElementById("page_header");
        this.message = document.getElementById("message");
        this.progress = document.getElementById("progress");

        this.nextbutton.disabled = true;
        this.nextbutton.style.display = 'none';
        // this.nextbutton.style.visibility="hidden";
        this.response_region.style.display = 'none';

        this.query.style.display = 'none';
        // this.query.style.display = 'block';
        // this.query.style.visibility = "hidden";
        this.query.style.color = 'black';
        this.mediascreen.innerHTML = "";
        // this.fix_cross.innerHTML = "";
        this.response = undefined;
        this.fixCrossType = fixCrossType;
        this.jitter = jitter;
    }

    // Loads content to the page
    // The `callback` argument can be used to handle page progression
    // or subject responses
    showPage(callback) {        
        var me = this;
        if (this.show_response) {
            document.onkeyup = function(evt) {
                // this is how you progress to the next trial
                // configure key for EEG
                if (me.response == "j" || me.response == "f"){
                    callback();
                }
            };
        } else {
            // create callback to progress when done
            this.nextbutton.onclick = function() {
                callback();
            };
        }

        this.addText();
        this.addMedia();
    }
    
    retrieveResponse() {
        var resp = this.response;
        this.response = undefined;
        return resp;
    }

    /************
     * Helpers  *
     ***********/

    // injects text into page's inner html
    addText() {
        this.message.innerHTML = this.text;
        this.header.innerHTML = this.header_text
        if (this.text === "") {
            this.message.style.display = 'none';
        } else {
            this.message.style.display = 'block';
        }
    }

    // formats html for media types
    addMedia() {
        this.mediascreen.style.backgroundColor = 'white';
        this.scale_region.style.display = 'none';

        if (this.mediatype === 'image') {
            this.showImage();
        } else if (this.mediatype === 'stim_img') {
            this.showStimImage();
        } else if (this.mediatype === 'movie') {
            this.showMovie();
        } else if (this.mediatype == 'scale'){
            this.scalePage();
        } else if (this.mediatype == 'contrast'){
            this.adjustContrast();
        } else if (this.mediatype == 'fullscreen'){
            this.goFullscreen();
        } else {
            this.mediascreen.style.height = '0px';
            this.showEmpty();
        }
    };


    // Makes the response query visable
    addResponse(callback = this.enableResponse) {
        this.renderResponse()
        if (this.show_response) {
            callback();
        // if no response required, then simply allow to go further
        } else {
            this.allowNext();
        }
    }

    renderResponse() {
        this.response_region.style.display = "block";
        if (this.show_response) {
            this.query.style.display = "block";
            this.query.style.visibility = "visible";
        }
    }

    delResponse() {
        if (this.show_response) {
            this.query.style.visibility = "hidden"
        }
    }

    // allows the subject to continue with an optional delay
    allowNext() {
        this.nextbutton.disabled = false;
        this.nextbutton.style.display = "block";
        this.nextbutton.style.display = "block";
        // sleep(this.next_delay*1000).then(() => {
        // });
    }

    // TODO: Yihan edit here
    // The form will automatically enable the next button
    // when the subject successfully responds
    enableResponse() {
        var me = this;
        document.onkeydown = function(evt) {
            evt = evt || window.event;
            var r = evt.key;
            if (r === "j" || r === "f" ){
                me.response = r;
            }
        };
    }

    showStimImageCallback(ctx = this) {
        document.onkeydown = function(evt) {
            const { key: r } = evt || window.event;
            if (r === "j" || r === "f" ){
                // record key response
                ctx.response = r;

                // hide response section while stim is shown
                ctx.delResponse();

                // TODO: fix how the stimImage is rendered
                // TODO: stim dissapears after keydown, instead of timeout
                // show stim image
                ctx.renderStimImage();
            }
        };
    }

    scalePage() {
        this.mediascreen.innerHTML = make_img(this.mediadata, PAGESIZE) + "<br>";
        let self = this;

        if (SCALE_COMPLETE) {
	    self.mediascreen.innerHTML = "";
	    self.scale_region.innerHTML = "You have already scaled your monitor";
            self.addResponse();
        } else {
          
            self.mediascreen.innerHTML = make_img(self.mediadata, PAGESIZE) + "<br>";
            this.scale_region.style.display = 'block';
            var slider_value = document.getElementById("scale_slider");
            var scale_img = document.getElementById("img");

            slider_value.value = PAGESIZE/500*50;
            this.scaleMediascreen();

            slider_value.oninput = function(e) {
                PAGESIZE = (e.target.value / 50.0) * 500;
                scale_img.width = `${PAGESIZE}px`;
                scale_img.style.width = `${PAGESIZE}px`;
                self.scaleMediascreen();
                self.addResponse();
                SCALE_COMPLETE = true;
            }
        }
    }

    adjustContrast() {
        this.mediascreen.innerHTML = make_img(this.mediadata, PAGESIZE) + "<br>";
        let self = this;

        this.scale_region.style.display = 'block';
        var slider_value = document.getElementById("scale_slider");
        var contrast_img = document.getElementById("img");
        
        slider_value.step = 0.5;
        slider_value.value = CONTRAST/2;
        contrast_img.style.filter = `contrast(${CONTRAST}%)`;
    
        this.scaleMediascreen();

        slider_value.oninput = function(e) {
            CONTRAST = e.target.value*2;
            contrast_img.style.filter = `contrast(${CONTRAST}%)`;
            
            console.log(CONTRAST);
            self.addResponse();
        }
    }

    goFullscreen() {
        this.mediascreen.innerHTML = make_fullscreen_button();
        
        var fs_button = document.getElementById("fullscreen_button");
        let self = this;
        fs_button.onclick = function() {
            console.log("click registered for FS");
            openFullscreen();
            self.addResponse();
        }
    }

    scaleMediascreen() {
        this.mediascreen.style.width = `${PAGESIZE}px`;
        this.mediascreen.style.height = `${PAGESIZE}px`;
        this.mediascreen.style.margin = '0 auto';
    }

    // plays movie
    showMovie() {
        let me = this;
        this.showFixationCross()

        // setTimeout is being used to display the stimuli after the fixation cross
        // has been displayed for jittered amount of time
        setTimeout(() => {
            this.mediascreen.innerHTML = make_mov(this.mediadata, PAGESIZE);
            this.mediascreen.style.display = 'block';
            var video = document.getElementById('video');
            video.style.display = 'none'

            video.onended = function() {
                video.style.display = 'none';
                video.style.visibility = 'hidden';
            console.log(video.style);
                me.addResponse();
            };

            video.oncanplaythrough = function() {

                sleep(me.next_delay*1000).then(() => {
                    video.style.display = 'block'
                    video.play();
                });

            };

            // making sure there is space for rotation
            // (scaling according to PAGESIZE)
            this.scaleMediascreen();

            video.style.transform = `rotate(${this.rot_angle}deg)`;

        }, this.jitter);
    }

    showImage() {
        this.mediascreen.innerHTML = make_img(this.mediadata, PAGESIZE) + "<br>";
        this.addResponse();
    }

    renderStimImage(callback = () => {}) {
        // preload stim image
        preloadImg(this.mediadata)

        this.mediascreen.style.display = 'block';
        this.mediascreen.style.visibility = 'visible';
        this.mediascreen.innerHTML = make_stim_img(this.mediadata, PAGESIZE);

        var stimImg = document.getElementById('img');
        stimImg.style.display = 'block';

        // adjust the image to the center of the mediascreen
        this.scaleMediascreen();

        // Timeout is used here to control the time interval
        // that the image is displayed for
        setTimeout(() => {
            // remove and hide the image after the delay
            stimImg.style.display = 'none';
            stimImg.style.visibility = 'hidden';

            callback();
        }, 750);

    }
    // no longer in use -- Chloe 11/29/22
    // clearStimImage(callback = () => {}) {
    //     console.log("clearing image")
    //     setTimeout(() => {
    //         console.log("waiting 500ms")
    //     }, 500)

    //     const stimImg = document.getElementById('img');
    //     stimImg.style.display = "none";
    //     stimImg.style.visibility = "hidden";
    //     callback();
    //     console.log("clearing image: complete")
    // }

    // display stimuli images
    showStimImage() {
        let me = this;

        this.mediascreen.style.display = 'block';
        this.mediascreen.style.visibility = 'visible';

        // display fixation cross
        this.showFixationCross()

        // display the fixation cross
        setTimeout(() => {
            // hide fix cross after jittered interval
            this.mediascreen.style.visibility = 'hidden';

            // add response while fixation cross is displayed
            this.addResponse(() => this.showStimImageCallback(me));

            // this.renderStimImage(me);
        }, this.jitter)

        // this.renderStimImage();
    }

    // displays fixation cross
    showFixationCross() {
        let me = this;

        this.mediascreen.style.display = 'block';
        this.mediascreen.innerHTML = make_fix_cross(this.fixCrossType, PAGESIZE);

        // adjust the cross to the center of the mediascreen
        this.scaleMediascreen();
    }

    showEmpty() {
        this.addResponse();
    }
    showProgress(cur_idx, out_of) {
        this.progress.innerHTML = (cur_idx + 1) + " / " + (out_of);
    };
};
