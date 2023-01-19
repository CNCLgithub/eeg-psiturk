/*
 * Requires:
 *     psiturk.js
 *     utils.js
 *     instrunctions.js
 *     static/data/condlist.json
 */


// Initalize psiturk object
var psiTurk = new PsiTurk(uniqueId, adServerLoc, mode);

// Names of elements used in the experiment
var PROGRESS = "progress";
var FULL_CONTAINER= "full-container";
var PAGESIZE = 500;

// Define global experiment variables
var SCALE_COMPLETE = false; // users do not need to repeat scaling
var SUBJECT_ID = "";
var N_TRIALS = 10;
var START_INSTRUCTION = 0;

// Debug Variables
var SKIP_INSTRUCTIONS = false;
var SKIP_QUIZ = true;
//var SKIP_INSTRUCTIONS = true;
//var SKIP_QUIZ = true;

// TODO: Change all `condlist` to `imgcondlist`
// not used anymore -- Chloe 11/11/22
// var fixcrosslist = fixCrossList();
// var imgcondlist = imgCondList();

// All pages to be loaded
var pages = [
    "trial.html",
    "page.html",
    "quiz.html",
    "restart.html",
    "postquestionnaire.html"
];

const init = (async () => {
    await psiTurk.preloadPages(pages);
})()

psiTurk.preloadPages(pages);


/****************
 * Subject ID  *
 ****************/

var SubjectID = function(condlist) {
    while (true) {
        SUBJECT_ID = prompt("Please enter Participant Number to proceed:");
        // a small check on length
        if (SUBJECT_ID.length != 0) {
            psiTurk.recordTrialData({
                'participant_num': SUBJECT_ID,
            });
            console.log("participant_num recorded:", SUBJECT_ID);
            InstructionRunner(condlist);
            return;
        }
        alert("Make sure you enter the Participant Number correctly, please try again.");
    }
}


/****************
 * Instructions  *
 ****************/

var InstructionRunner = function(condlist) {
    psiTurk.showPage('page.html');

    var start_instruction_page = START_INSTRUCTION;
    var nTrials = condlist.length;
    var ninstruct = instructions.length;

    // Plays next instruction or exits.
    // If there is another page, it is reach via callback in `page.showPage`
    var show_instruction_page = function(i) {

        if (i < ninstruct) {
            // constructing Page using the the instructions.js
            var page = new Page(...instructions[i],
                                header_text = "Instructions");

            page.showPage(function() {
                // page.clearResponse();
                show_instruction_page(i + 1);
            });
        } else {
            end_instructions();
        }
    };

    var end_instructions = function() {
        psiTurk.finishInstructions();
        quiz(function() {
            InstructionRunner(condlist);
        },
            function() {
                currentview = new Experiment(condlist);
            })
    };
    if (SKIP_INSTRUCTIONS) {
        end_instructions();
    } else {
        // start the loop
        show_instruction_page(start_instruction_page);
    };
};


/*********
 * Quiz  *
 *********/

// Describes the comprehension check
var loop = 1;
var quiz = function(goBack, goNext) {
    function record_responses() {
        var allRight = true;
        $('select').each(function(i, val) {
            psiTurk.recordTrialData({
                'phase': "INSTRUCTQUIZ",
                'question': this.id,
                'answer': this.value
            });

            if (this.id === 'trueFalse1' && this.value != 'c') {
                allRight = false;
            } else if (this.id === 'trueFalse2' && this.value != 'a') {
                allRight = false;
            }

        });
        return allRight
    };
    if (SKIP_QUIZ) {
        goNext();
    } else {
        psiTurk.showPage('quiz.html')
        $('#continue').click(function() {
            if (record_responses()) {
                // Record that the user has finished the instructions and
                // moved on to the experiment. This changes their status code
                // in the database.
                psiTurk.recordUnstructuredData('instructionloops', loop);
                psiTurk.finishInstructions();
                //console.log('Finished instructions');
                // Move on to the experiment
                goNext();
            } else {
                // Otherwise, replay the instructions...
                loop++;
                psiTurk.showPage('restart.html');
                $('.continue').click(
                    function() {
                        goBack();
                        // psiTurk.doInstructions(instructionPages, goBack) TODO REMOVE?
                    });
            }
        });

    };
};

/**************
 * Experiment *
 **************/


var Experiment = function(condlist, trials) {
    psiTurk.showPage('trial.html');
    shuffle(condlist);

    // all images are used in standard trials that can be automatically preloaded (as well as being used in trials 
    // that use timeline variables), so we can preload all image files with the auto_preload option
    var preload = {
        type: jsPsychPreload,
        auto_preload: true,
    };

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
    trials.push(preload, participant_id, instructions);
    

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

// Task object to keep track of the current phase
var currentview;

/*******************
 * Run Task
 ******************/


// madness TODO fix
var dataset;

$(window).on('load', async () => {
    await init;
    
    function load_condlist() {
        $.ajax({
            dataType: 'json',
            url: "static/data/condlist.json",
            async: false,
            success: function(data) {
                // condlist = data[condition];

                condlist = data;
                condlist = condlist.slice(0, N_TRIALS);
                var trials = [];

                var jsPsych = initJsPsych({
                    show_progress_bar: true,
                    on_trial_finish: function () {
                        psiTurk.recordTrialData(jsPsych.data.getLastTrialData());
                    },
                    on_finish: function () {
                        psiTurk.saveData();
                    }
                });

                // SubjectID(condlist);
                Experiment(condlist, trials);
                jsPsych.run(trials);
            },
            error: function() {
                setTimeout(500, do_load)
            },
            failure: function() {
                setTimeout(500, do_load)
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
