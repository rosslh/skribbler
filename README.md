### Features
1. Possible answers are shown below the game screen, with answers that are confirmed to have been used before bolded
2. If enabled, the script will automatically guess plausible answers
3. The input field turns green if input is a valid guess, orange/red if not
4. Input field has a characters remaining indicator
5. When drawing, links to Google image results for the topic are provided for easy reference
6. Move audio button to the right so that it doesn't cover the countdown clock

### How it works (read before installing)
* This script builds up a database of encountered correct answers so it can provide possible answers as you play.
* In order to connect to this database, you must create an account (just username/password, no email). The account creation/login is done through Javascript prompts at [skribbl.io](https://skribbl.io) once this script is installed.
    * Please use a unique password. Login details are sent over HTTPS and passwords are hashed on my end so I can't see them, but skirbbl.io might be able to read them before they're sent to my server (this shouldn't be possible in userscript managers that use sandboxing).
* Any answers you encounter when playing the game get added to a personal list of confirmed answers
    * People are only shown their own words list plus the words lists of trusted users (just the maintainer, Ross Hill for now). This is to prevent naughty users from feeding the database incorrect answers

### Installation
* Make sure you have a userscript manager extension installed
    * this script works on Violentmonkey, Tampermonkey, and Greasemonkey on Firefox
    * untested on other browsers
* Go here: https://raw.githubusercontent.com/rosslh/skribbler/master/skribbler.user.js
* The script should start to install automatically. If not, please manually enter that url into your userscript manager.

### Feedback
* If you encounter any problems or have a feature request, please [submit an issue](https://github.com/rosslh/skribbler/issues/new)!
