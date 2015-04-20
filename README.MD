# KindleSpy

[KindleSpy](http://www.kdspy.com/) is the ultimate amazon spy tool.

It's a browser plugin for chrome, opera and firefox.

## Pre-requirements
### Firefox
* Python version 2.* from [python.org](https://www.python.org/)
* Mozilla [SDK](https://developer.mozilla.org/en-US/Add-ons/SDK/Tutorials/Installation). The direct [link](https://ftp.mozilla.org/pub/mozilla.org/labs/jetpack/jetpack-sdk-latest.zip).
* Firefox browser

Note: [jpm](https://developer.mozilla.org/en-US/Add-ons/SDK/Tools/jpm) tool will replace cfx soon, it doesn't require Python but will need node.js instead.

### Chrome
* Chrome browser

## Install
### Firefox
1. Run command window `cmd`
2. Go to SDK folder and run `bin\activate`
3. Go to the project folder `cd project_folder`
4. Use `cfx run` command to run a new instance of Firefox with the add-on installed
5. You can use the `cfx run --profiledir=c:\firefox-sdk\profile` to store profile data and use it in future

### Chrome
1. Open [extensions](chrome://extensions) page in chrome
2. Turn on the **developer mode**
3. Click **Load unpacked extension...** to pop up a file-selection dialog
4. Navigate to project_folder\data folder

# Packaging
### Firefox
The command **cfx xpi** from the mozilla SDK can be used to package the add-on into an XPI file for distribution

### Chrome
Packaging of chrome extension is described [here](https://developer.chrome.com/extensions/packaging)
