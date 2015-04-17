/**
 * Created by Andrey Klochkov on 12.04.2015.
 */

/**
 * chrome browser API wrapper class
 */
function Api(){
}

/**
 * Add message listener
 * @param messageListener
 */
Api.addListener = function(messageListener){
    chrome.runtime.onMessage.addListener(function(request, sender, callback){
        return messageListener(request, callback);
    });
};

/**
 * Send a message to the active tab
 * @param message
 * @param callback
 */
Api.sendMessageToActiveTab = function(message, callback){
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, message, function (response) {
            if (callback !== undefined && typeof(callback) === 'function')
                return callback(response);
        });
    });
};

Api.openNewTab = function(url){
    chrome.tabs.create({url: url});
};

Api.registerOnShowEvent = function(eventListener){
    // just call it once because Chrome constructs the popup on every show
    eventListener();
};

Api.storage = chrome.storage.local;