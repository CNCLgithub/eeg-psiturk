/*
 * Requires:
 *     psiturk.js
 *     utils.js
 *     instrunctions.js
 *     static/data/condlist.json
 */


// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

// Define global experiment variables
var N_TRIALS = 10;

// Debug Variables
var SKIP_SUBJECT_ID = false;
var SKIP_INSTRUCTIONS = false;

// All pages to be loaded
var pages = [
    "trial.html",
    "postquestionnaire.html"
];

const init = (async () => {
    await psiTurk.preloadPages(pages);
})()

psiTurk.preloadPages(pages);

/**************
 * Experiment *
 **************/


var Experiment = function(condlist, trials) {
    // empty html template for jsPsych to use
    psiTurk.showPage('trial.html');

    // shuffle conditions
    shuffle(condlist);

    // all images are used in standard trials that can be automatically preloaded (as well as being used in trials 
    // that use timeline variables), so we can preload all image files with the auto_preload option
    var preload = {
        type: jsPsychPreload,
        auto_preload: true,
    };

    trials.push(preload);

    // ask for participant ID
    var participant_id = {
        type: jsPsychSurveyText,
        questions: [{
            prompt: 'What is your Participant ID?'
        }],
        data: {
            // add any additional data that needs to be recorded here
            type: "participant_id",
        }
    }

    // instructions trial
    var instructions = {
        type: jsPsychInstructions,
        pages: [
            "<b>Hi, thank you for volunteering to help out with our study!</b><br><br>" +
            "Please take a moment to adjust your seating so that you can comfortably watch the monitor and use the keyboard/mouse.<br>" +
            "Feel free to dim the lights as well. " +
            "Close the door or do whatever is necessary to minimize disturbance during the experiment. <br>" +
            "Please also take a moment to silence your phone so that you are not interrupted by any messages mid-experiment." +
            "<br><br>" +
            "Click <b>Next</b> when you are ready to continue.",
            "At the beginning of each instance of the task, you will briefly see a cross, followed by an image.<br><br>" +
            "<span style='color:blue'>Your task is to determine whether the cross has a longer <b>HORIZONTAL</b> bar, or a longer <b>VERTICAL</b> bar.</span><br><br>" +
            "Click <b>Next</b> to continue.",
            "In the middle of each instance of the task, please record your response with your key board.<br>" +
            "<span style='color:red'><b>You will not be able to progress until you make a selection.</b></span><br><br>" +
            "Also, please keep your hands near the <b>F and J</b> keys for comfort and accuracy. <br><br>" +
            "Click <b>Next</b> to begin the study.",
        ],
        show_clickable_nav: true,
        show_page_number: true,
        page_label: "<b>Instructions</b>",
        allow_backward: false,
    }

    // add the following trial pages to be displayed in their respective order
    if (SKIP_SUBJECT_ID == false) {trials.push(participant_id)};
    if (SKIP_INSTRUCTIONS == false) {trials.push(instructions)};
    
    for (i = 0; i < condlist.length; i++) {
        var cross = condlist[i][0];
        var stim = condlist[i][1];
        var jitter = condlist[i][2];

        // fixation cross trial
        var fix_cross = {
            type: jsPsychImageKeyboardResponse,
            stimulus: "static/data/images/" + cross + ".svg",
            choices: ['f', 'j'],
            prompt: '<p>Press "<b>F</b>" if <b>HORIZONTAL</b> is longer, otherwise press "<b>J</b>" if <b>VERTICAL</b> is longer</p>',
            maintain_aspect_ratio: true,
            stimulus_width: 350,  // size of the cross
            stimulus_duration: jitter,  // use jittered interval
            data: {
                // add any additional data that needs to be recorded here
                cross_type: cross,
                jitter_duration: jitter,
                type: "fixation",
            },
        };

        // stimulus trial
        var stim_img = {
            type: jsPsychImageKeyboardResponse,
            stimulus: "static/data/images/stims/" + stim,
            choices: "NO_KEYS",
            trial_duration: 500,
            post_trial_gap: 250, // duration between trials
            data: {
                // add any additional data that needs to be recorded here
                type: "stim_img",
            }
        };

        // display fixation cross then stimulus
        trials.push(fix_cross, stim_img);
    }

    // end message
    var end_trial = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<h2><b>Thank you for volunteering to help out with our study! :) </b></h2><br><br>" +
        "Click <b>Done</b> to submit your responses. <br>",
        choices: ['<b>Done</b>'],
    };

    // display end message
    trials.push(end_trial);
};

/*******************
 * Run Task
 ******************/

$(window).on('load', async () => {
    await init;
    
    function load_condlist() {
        $.ajax({
            dataType: 'json',
            url: "static/data/condlist.json",
            async: false,
            success: function(data) {
                condlist = data;
                condlist = condlist.slice(0, N_TRIALS);
                var trials = [];

                var jsPsych = initJsPsych({
                    show_progress_bar: true,
                    on_trial_finish: function () {
                        // record data for psiturk database after every trial
                        psiTurk.recordTrialData(jsPsych.data.getLastTrialData());
                    },
                    on_finish: function () {
                        // save all recorded data to psiturk database
                        psiTurk.saveData();
                    }
                });

                Experiment(condlist, trials);
                jsPsych.run(trials);
            }
        });

    };
  
    if (isMobileTablet()){
        console.log("mobile browser detected");
        alert(`Sorry, but mobile or tablet browsers are not supported. Please switch to a desktop browser or return the hit.`);
        return;
    }

    load_condlist();
});


// not being used for this EEG experiment -- chloë 01/19/2023
// only needed if you want a post-questionnnaire
/****************
 * Questionnaire *
 ****************/

var Questionnaire = function() {

    var error_message = "<h1>Oops!</h1><p>Something went wrong submitting your HIT. This might happen if you lose your internet connection. Press the button to resubmit.</p><button id='resubmit'>Resubmit</button>";

    record_responses = function() {

        psiTurk.recordTrialData({
            'phase': 'postquestionnaire',
            'status': 'submit'
        });

        $('textarea').each(function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });
        $('select').each(function(i, val) {
            psiTurk.recordUnstructuredData(this.id, this.value);
        });

    };

    prompt_resubmit = function() {
        document.body.innerHTML = error_message;
        $("#resubmit").click(resubmit);
    };

    resubmit = function() {
        document.body.innerHTML = "<h1>Trying to resubmit...</h1>";
        reprompt = setTimeout(prompt_resubmit, 10000);

        psiTurk.saveData({
            success: function() {
                clearInterval(reprompt);
                psiTurk.computeBonus('compute_bonus', function() {
                    finish()
                });
            },
            error: prompt_resubmit
        });
    };

    // Load the questionnaire snippet
    psiTurk.showPage('postquestionnaire.html');
    psiTurk.recordTrialData({
        'phase': 'postquestionnaire',
        'status': 'begin'
    });

    $("#next").click(function() {
        record_responses();
        psiTurk.saveData({
            success: function() {
                psiTurk.completeHIT(); // when finished saving compute bonus, the quit
                //window.location.replace(PROLIFIC_RETURN_URL); // redirecting back to Prolific
            },
            error: prompt_resubmit
        });
    });


};