function getVersion() {
    var version = 'NaN';
    var xhr = new XMLHttpRequest();
    xhr.open('GET', chrome.extension.getURL('manifest.json'), false);
    xhr.send(null);
    var manifest = JSON.parse(xhr.responseText);
    return manifest.version;
}

chrome.runtime.onMessage.addListener(function (message, sender, callback){
    if(message.action == 'getVersion')
        return callback(getVersion());
});
