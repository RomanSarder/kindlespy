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