/* Twitterbot Project By Anusha Nandam and Katherine Mittleider
Purpose of Twitterbot: Encouraging Animators to keep up the good work on their animations
We are using the Wordnik API in order to interact with users on Twitter.
A couple of people have even followed and direct messaged us!
We have 5 functions: post, like, retweet #, reply to users posts, following users
Post: We post encouraging words to animators on our feed by pulling from the Wordnik API
Like: Posts are liked if the word animation is found within the post somewhere
Retweet: The bot retweets a post with the hashtag animation
Reply: We comment on someone's post who uses #animation using our personal comment function and utilizing the Wordnik API for unique comments
Follow: Follow users who use #animation in their posts
*/

// DEBUG
var debug = false; // if we don't want it to post to Twitter! Useful for debugging!

// Personal WordnikAPIKey given to us 
var WordnikAPIKey = 'iuk6pxx6m1qp639eze74shlzw4nuyh39pe8nykbo1tetq2278';
var request = require('request');
var inflection = require('inflection');
var encourage; //encouraging adjective of the day prebuilt string stored here
var personal; //personalized comment interacting with animators store prebuilt strings here

// Blacklist
var wordfilter = require('wordfilter');

// Twitter Essentials
// Twitter Library
var Twit = require('twit');

// Include configuration file
var T = new Twit(require('./config.js'));

// Helper function for arrays, picks a random thing
Array.prototype.pick = function() {
    return this[Math.floor(Math.random() * this.length)];
}
Array.prototype.remove = function() {
    var what, a = arguments,
        L = a.length,
        ax;
    while (L && this.length) {
        what = a[--L];
        while ((ax = this.indexOf(what)) !== -1) {
            this.splice(ax, 1);
        }
    }
    return this;
};

// URL from Wordnik to get a synonym for the word amazing
function adjUrl() {
    return "https://api.wordnik.com/v4/word.json/amazing/relatedWords?useCanonical=false&relationshipTypes=synonym&api_key=iuk6pxx6m1qp639eze74shlzw4nuyh39pe8nykbo1tetq2278";
}

// Post a status update
function tweet() {

    var tweetText = encourage.pick(); //each status update has a unique adjective from the Wordnik API and uses the encourage pre-filled statement

    if (debug)
        console.log('Debug mode: ', tweetText); //doesn't post to Twitter
    else
        T.post('statuses/update', { //status update on Twitter
            status: tweetText
        }, function(err, reply) {
            if (err != null) {
                console.log('Error: ', err); // in the case something goes wrong with the status update
            } else {
                console.log('Tweeted: ', tweetText); //successful tweet!
            }
        });
}

//LIKING
function likes() {
    T.get('search/tweets', {
            q: 'animation', //likes posts with the word animation mentioned in it
            count: 8
        },
        function(err, data, response) {
            var likeId = data.statuses[0].id_str;
            T.post('favorites/create', { //post gets liked
                    id: likeId
                },
                function(err, data, response) {
                    console.log("Liked a post!") //successfully liked!
                });
            console.log(data);
        });
}

//RETWEET #animation
//This function finds the latest tweet with the #animation hashtag, and retweets it.
function retweetLatestHashtag() {
    // This is the URL of a search for the latest tweets on the '#animation' hashtag.
    var animationSearch = {
        q: "#animation",
        count: 10,
        result_type: "recent"
    };
    T.get('search/tweets', animationSearch, function(error, data) {
        // log out any errors and responses
        console.log(error, data);
        // If our search request to the server had no errors...
        if (!error) {

            // ...then we grab the ID of the tweet we want to retweet...
            var retweetId = data.statuses[0].id_str;
            // ...and then we tell Twitter we want to retweet it!
            T.post('statuses/retweet/' + retweetId, {}, function(error, response) {
                if (response) {
                    console.log('Success! Check your bot, it should have retweeted something.')
                }
                // If there was an error with our Twitter call, we print it out here.
                if (error) {
                    console.log('There was an error with Twitter:', error);
                }
            })
        }
        // However, if our original search request had an error, we want to print it out here.
        else {
            console.log('There was an error with your hashtag search:', error);
        }
    });
}

/// Function to reply to twitter users interested in animation
function animationReply() {

    var animationSearch = {
        q: "#animation",
        count: 10,
        result_type: "recent"
    }; // Looks for the latest tweets with the animation hashtag


    T.get('search/tweets', animationSearch, function(error, data) {
        // log out any errors and responses
        console.log(error, data);
        // If our search request to the server had no errors...
        if (!error) {
            // ...then we grab the ID of the tweet we want to retweet...
            var userName = data.statuses[0].user.screen_name;
            // ...and then we tell Twitter we want to retweet it!
            T.post('statuses/update', {
                status: "@" + userName + " " + personal.pick()
            }, function(err, response) { // Uses the username to create a new tweet and replies.


                if (response) {
                    console.log('Success! Check your bot, it should have replied.')
                }
                // If there was an error with our Twitter call, we print it out here.
                if (error) {
                    console.log('There was an error with Twitter:', error);
                }
            })
        }
        // However, if our original search request had an error, we want to print it out here.
        else {
            console.log('There was an error with your hashtag search:', error);
        }
    });
}

function animationFollow() {
    var animationSearch = { //#animation is searched so that our bot can follow people who use this hashtag
        q: "#animation",
        count: 10,
        result_type: "recent" //looking for recent uses of #animation
    };

    // Initiate your search using the animationSearch
    T.get('search/tweets', animationSearch, function(error, data) {
        // If there is no error, proceed
        if (!error) {
            // Loop through the returned tweets
            for (let i = 0; i < data.statuses.length; i++) {
                // Get the screen_name from the returned data
                let screen_name = data.statuses[i].user.screen_name;


                // Follow that user
                T.post('friendships/create', {
                    screen_name
                }, function(err, response) {
                    if (err) {
                        console.log('There was an error with Twitter: ', err);
                    } else {
                        console.log(screen_name, ': **FOLLOWED**'); //successfully followed!
                    }
                });
            }
        } else {
            console.log('There was an error with your hashtag search: ', error);
        }
    })
}

function runBot() {
    console.log(" "); // for better readability
    var d = new Date();
    var ds = d.toLocaleDateString() + " " + d.toLocaleTimeString();
    console.log(ds); // date/time of the request	

    //pulls from the URL from Wordnik that searches for synonyms for the word amazing
    request(adjUrl(), function(err, response, data) {
        if (err != null) return; // program quits if no data
        adjective = eval(data);

        // Filter out the bad adjectives via the wordfilter

        for (var i = 0; i < adjective.length; i++) {
            if (wordfilter.blacklisted(adjective[i].word)) {
                console.log("Blacklisted: " + adjective[i].word);
                adjective.remove(adjective[i]);
                i--;
            }
        }

        /*The encourage section is used for tweeting status updates. 
        Wordnik is used so that the status update is different for every post.
        This is important because Twitter doesn't allowe the same status to be posted twice.
        Also, there is a unique post posted on our feed since an adjective is pulled from the Wordnik API */

        encourage = [

            "Encouragement for my Fellow Animators: YOU ARE " + adjective[0].words.pick() + "!"

        ];

        /*The personal section is to reply to users in the comments section.
        These comments are made to users who use #animation within their posts.
        This part is important because it shows how our bot communicates with the people on Twitter.
        Users get personalized comments based on randomization of these statements and an adjective from the Wordnik API.
        */

        personal = [

            "I can see all the hard work that you have been pouring into your " + adjective[0].words.pick() + " animation.",
            "I am impressed by all of the " + adjective[0].words.pick() + " animations that you have created.",
            "Keep up the " + adjective[0].words.pick() + " work on all of your future animations!",
            "You are doing " + adjective[0].words.pick() + " on all of your animations and I am rooting for you.",
            "YES! You are doing " + adjective[0].words.pick() + " work and I'm looking forward to your future projects!",
            "I usually don't comment, but I wanted to say that you are doing " + adjective[0].words.pick() + " work!",
            "WOW! Your animation looks so " + adjective[0].words.pick() + "!",
            "I really like the technique you used in your animation and think you did an " + adjective[0].words.pick() + " job!",
            "I look forward to seeing " + adjective[0].words.pick() + " animations like yours everyday!",
            "Your work is simply " + adjective[0].words.pick() + "!",
            "This animation looks really " + adjective[0].words.pick() + " and I can't wait to see your future projects!",
            "I love all of the work you do and I just wanted to say that your animations are " + adjective[0].words.pick() + "!",
            "There's only one word to describe this animation: " + adjective[0].words.pick() + "!",
            "I love all the intricate detail you put into your" + adjective[0].words.pick() + " animation!",
            "Your hard work on this " + adjective[0].words.pick() + " animation definitely shows!"

        ];

        // rand could be equal to a random integer from 0 to 10
        // All 5 functions have an equal chance of getting picked
        var rand = Math.floor(Math.random() * 11);

        if (rand <= 2) {
            console.log("-------Tweet something");
            tweet();

        } else if (rand <= 4) {
            console.log("-------Retweet something based on #animation");
            retweetLatestHashtag();

        } else if (rand <= 6) {
            console.log("-------Like something if the word animation is in a tweet");
            likes();

        } else if (rand <= 8) {
            console.log("-------Comment something @someone based on #animation");
            animationReply();

        } else {
            console.log("-------Follow someone who uses #animation");
            animationFollow();
        }
    });
}

// Run the bot
runBot();

// The bot will perform one of the five functions every hour
setInterval(runBot, 1000 * 60 * 60);