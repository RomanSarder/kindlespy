/**
 * Created by Andrey Klochkov on 22.03.18.
 */

//LoginTab.debug = true;

// Wordpress root URL
const wpRoot = 'https://www.5minpub.co';
// Wordpress API
const wpAuthEndPoint = wpRoot + '/wp-json/jwt-auth/v1/token';
const userinfoEndPoint = wpRoot + '/wp-json/wp/v2/users/me';
// Wishlist member API
const wlmAuthEndPoint = wpRoot + '/?/wlmapi/2.0/json/auth';
const wlmMemberInfoEndPoint = wpRoot + '/?/wlmapi/2.0/json/members/';
const wlmApiKey =  'c4dc64af38e139488a4b82c1d1a10b44';

const kindleSpyLevel = 'KindleSpy';
const kindleSpyTrialLevel = 'KindleSpy Trial';

function LoginTab(){
    if ( LoginTab.prototype._singletonInstance )
        return LoginTab.prototype._singletonInstance;
    LoginTab.prototype._singletonInstance = this;

    var _this = this;
    this.loginContent = $('#login-content');
    this.trialExpiredContent = $('#trial-expired-content');
    this.username = $('#username');
    this.password = $('#password');
    this.loginButton = $('#login-button');
    this.resetPassword = $('#reset-password');
    this.loginFailedMessage = $('#login-failed-message');
    this.storage = Api.storage;

    this.loginButton.click(function(){_this.onLoginClick();});
}

LoginTab.prototype.getUserAccessLevel = function() {
    var _this = this;

    var loginDataPromise = _this.getLoginData();

    var wlmAuthPromise = $.get(wlmAuthEndPoint)
        .then(function (result) {
            console.log('then: ' + result);
            if (result.success === 1) return result.lock;
            throw 'wlm auth failed';
        })
        .then(function (lock) {
            var stringForHash = lock + wlmApiKey;
            console.log(stringForHash);
            var md5 = Helper.md5(stringForHash);
            console.log('lock: ' + lock);
            console.log('md5: ' + md5);

            return $.ajax({
                url: wlmAuthEndPoint,
                type: 'POST',
                data: {key: md5, support_emulation: 1},
                contentType: 'application/x-www-form-urlencoded'
            });
        });

    var loginDataTmp;
    var isTrialExpired = true;

    return Promise.all([loginDataPromise, wlmAuthPromise])
        .then(function ([loginData, subscriptionInfo]) {
            loginDataTmp = loginData;
            return $.get(wlmMemberInfoEndPoint + loginData.userId)
        })
        .then(function (result) {
            var levels = result.member[0].Levels;
            console.log(levels);
            var accessLevels = Object.values(levels)
                .filter(function(item){return typeof(item) !== "string"})
                .map(function(item){return {name: item.Name, isExpired: item.Expired}});

            if(accessLevels.some(function(item){return item.name === kindleSpyLevel})
                ||accessLevels.some(function(item){return item.name === kindleSpyTrialLevel && !item.isExpired})) isTrialExpired = false;

            loginDataTmp.lastAccessCheck = Date.now();
            loginDataTmp.isTrialExpired = isTrialExpired;
            return _this.setLoginData(loginDataTmp);
        })
        .then(function(){
            return {isTrialExpired: isTrialExpired};
        })
        .catch(function (error) {
            console.log('get access level failed: ');
            console.log(error);
        });
};

LoginTab.prototype.onLoginClick = function(){
    var _this = this;

    var authPromise = $.post(wpAuthEndPoint, {username: _this.username.val(), password: _this.password.val()})
        .then(function(result) {
            console.log(result);
            return $.ajax({
                url: userinfoEndPoint,
                type: 'GET',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + result.token);
                }
            });
        });

    var loginDataPromise = _this.getLoginData();
    return Promise.all([authPromise, loginDataPromise])
        .then(function([userinfo, loginData]) {
            loginData.isLoggedIn = true;
            loginData.login = _this.username.val();
            loginData.userId = userinfo.id;
            return _this.setLoginData(loginData);
        })
        .then(function() {
            Popup.instance.checkAndStartKdspy();
        })
        .catch(function(error) {
            console.log('login failed: ' + error);
            _this.loginFailedMessage.show();
        });
};

var defaultLoginData = {
    userId: -1,
    isLoggedIn: false,
    login: '',
    isTrialExpired: false,
    lastAccessCheck: null
};

LoginTab.prototype.getLoginData = function() {
    var _this = this;
    return new Promise(function(resolve, reject){
        _this.storage.get('loginData', function(result) {
            if (typeof result === 'undefined') result = {};
            if (typeof result.loginData === 'undefined') result.loginData = defaultLoginData;

            resolve(result.loginData);
        });
    });
};

LoginTab.prototype.setLoginData = function(loginData) {
    var _this = this;
    return new Promise(function(resolve, reject){
        _this.storage.set({loginData: loginData}, function() {
            resolve();
        });
    });
};

LoginTab.prototype.setupStaticClickListeners = function(){
    this.resetPassword.click(function(){
        Popup.instance.initResetPasswordTab();
    });
};

LoginTab.prototype.loadPageNum = function(callback){
    var _this = this;
    callback = Helper.valueOrDefault(callback, function() {});
    Api.sendMessageToActiveTab({type: "get-pageNum", tab: 'LoginTab'}, function(pageNum){
        _this.pageNum = parseInt(pageNum);
        callback();
    });
};

LoginTab.prototype.load = function(){
    this.loginContent.show();
};

LoginTab.prototype.showTrialExpired = function(){
    this.trialExpiredContent.show();
};

LoginTab.prototype.isLoggedIn = function(callback) {
    callback = Helper.valueOrDefault(callback, function() {});
    this.getLoginData()
        .then(function (loginData) {
            callback(loginData.isLoggedIn);
        });
};

LoginTab.prototype.isCheckAccessNeeded = function(callback) {
    callback = Helper.valueOrDefault(callback, function() {});
    this.getLoginData()
        .then(function (loginData) {
            var dateDiffMillis = Date.now() - Number(loginData.lastAccessCheck);
            // if previous update was < 1h ago then do nothing
            if (dateDiffMillis / 1000 / 60 / 60 < 1 && !loginData.isExpired && !LoginTab.debug) {
                return callback(false);
            }

            callback(true);
        });
};

LoginTab.prototype.isTrialExpired = function(callback) {
    callback = Helper.valueOrDefault(callback, function() {});
    this.getUserAccessLevel()
        .then(function (accessLevelInfo) {
            callback(accessLevelInfo.isTrialExpired);
        });
};
