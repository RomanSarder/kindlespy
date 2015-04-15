/**
 * Created by Andrey Klochkov on 15.04.2015.
 */

function BrowserDetector() {
}

BrowserDetector.isFirefox = function() {
    return typeof InstallTrigger !== 'undefined';
};

BrowserDetector.isChrome = function() {
    return !!window.chrome && !BrowserDetector.isOpera();
};

BrowserDetector.isOpera = function() {
    return !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
};

BrowserDetector.isSafari = function() {
    return Object.prototype.toString.call(window.HTMLElement).indexOf('Constructor') > 0;
};

BrowserDetector.isIE = function() {
    return /*@cc_on!@*/false || !!document.documentMode;
};


function ApiLoader() {
}

ApiLoader.load = function(callback) {
    var api;
    if (BrowserDetector.isChrome() || BrowserDetector.isOpera()) api = 'Chrome';
    else if (BrowserDetector.isFirefox()) api = 'Firefox';
    else {
        console.error('Unsupported browser');
        return;
    }

    $.getScript('../browser-api/' + api + '.js', function(script, textStatus){
        callback();
    });
};
