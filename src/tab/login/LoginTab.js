/**
 * Created by Andrey Klochkov on 22.03.18.
 */

//LoginTab.debug = true;
//LoginTab.simulateLoginSuccess = true;
//LoginTab.simulateTrialExpired = false;
//LoginTab.simulateAccountInactive = true;

// Wordpress root URL
const wpRoot = 'https://www.publishingaltitude.com';
//test Wordpress
//const wpRoot = 'https://www.5minpub.co';

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
    this.expiredTitle = $('#expired-text');
    this.expiredButton = $('#unlock-account-button');
    this.noDataButton = $('#no-data-button');
    this.noSupportButton = $('#no-support-button')
    this.cancelledTitle = $('#cancelled-text');
    this.cancelledButton = $('#unlock-cancelled-account-button');
    this.loginFooter = $('#login-footer');
    this.username = $('#username');
    this.password = $('#password');
    this.loginButton = $('#login-button');
    this.unlockAccountButton = $('#unlock-account-button');
    this.unlockCancelledAccountButton = $('#unlock-cancelled-account-button');
    this.resetPassword = $('#reset-password');
    this.learnMoreAboutKdspy = $('#learn-more-about-kdspy');
    this.learnMoreAboutNoSupport = $('#learn-more-about-no-support');
    this.learnMoreAboutNoData = $('#learn-more-about-no-data');
    this.loginFailedMessage = $('#login-failed-message');
    this.storage = Api.storage;

    //validation form
    this.inputForm = $('.validate-input .input');

    this.loginButton.click(function(){_this.onLoginClick();});
    this.unlockAccountButton.click(function(){Api.openNewTab('https://www.kdspy.com/upgrade.php');});
    this.unlockCancelledAccountButton.click(function(){Api.openNewTab('https://www.kdspy.com/activate.php');});
    this.resetPassword.click(function(){Api.openNewTab('https://www.publishingaltitude.com/wp-login.php?action=lostpassword');});
    this.noDataButton.click(function(){Api.openNewTab('https://www.publishingaltitude.com/support/');});
    this.noSupportButton.click(function(){Api.openNewTab('https://s3-us-west-2.amazonaws.com/kindlespy/kindlestore.html');});
    this.learnMoreAboutKdspy.click(function(){Api.openNewTab('https://www.kdspy.com/upgrade/');});
    this.learnMoreAboutNoSupport.click(function(){Api.openNewTab('https://www.kdspy.com/help/location/');});
    this.learnMoreAboutNoData.click(function(){Api.openNewTab('https://www.kdspy.com/help/data/');});
    $("#username,#password").keyup(function(event) {
        const enterKeyCode = 13;
        if (event.keyCode === enterKeyCode) {
            _this.loginButton.click();
        }
    });

    //validation form
    $('.validate-form .input').each(function () {
        $(this).focus(function () {
            _this.hideValidate(this);
        });
    });
}

LoginTab.prototype.getUserAccessLevel = function() {
    var _this = this;

    var loginDataPromise = _this.getLoginData();

    var wlmAuthPromise = $.get(wlmAuthEndPoint)
        .then(function (result) {
            if (result.success === 1) return result.lock;
            throw 'wlm auth failed';
        })
        .then(function (lock) {
            var stringForHash = lock + wlmApiKey;
            var md5 = Helper.md5(stringForHash);

            return $.ajax({
                url: wlmAuthEndPoint,
                type: 'POST',
                data: {key: md5, support_emulation: 1},
                contentType: 'application/x-www-form-urlencoded'
            });
        });

    var loginDataTmp;
    var isTrialExpired = true;
    var isAccountInactive = false;

    return Promise.all([loginDataPromise, wlmAuthPromise])
        .then(function ([loginData, subscriptionInfo]) {
            loginDataTmp = loginData;
            return $.get(wlmMemberInfoEndPoint + loginData.userId)
        })
        .then(function (result) {
            var levels = result.member[0].Levels;
            var accessLevels = Object.values(levels)
                .filter(function(item){return typeof(item) !== "string"})
                .map(function(item){return {name: item.Name, isExpired: item.Expired, isCancelled: item.Cancelled}});

            if(accessLevels.some(function(item){return item.name === kindleSpyLevel})
                ||accessLevels.some(function(item){return item.name === kindleSpyTrialLevel && !item.isExpired})) isTrialExpired = false;

            if(accessLevels.some(function(item){return item.name === kindleSpyLevel && item.isCancelled === "1"})) isAccountInactive = true;

            loginDataTmp.lastAccessCheck = Date.now();
            if (typeof LoginTab.simulateTrialExpired !== 'undefined' ) isTrialExpired = LoginTab.simulateTrialExpired;
            loginDataTmp.isTrialExpired = isTrialExpired;

            if (typeof LoginTab.simulateAccountInactive !== 'undefined' ) isAccountInactive = LoginTab.simulateAccountInactive;
            loginDataTmp.isAccountInactive = isAccountInactive;
            return _this.setLoginData(loginDataTmp);
        })
        .then(function(){
            return {isTrialExpired: isTrialExpired, isAccountInactive: isAccountInactive};
        })
        .catch(function (error) {
            console.log('get access level failed: ');
            console.log(error);
        });
};

LoginTab.prototype.onLoginClick = function() {
    var _this = this;

    if (_this.loginButton.prop('disabled')) return;
    if (!_this.isFormValid()) return;

    const loginSuccessAction = function() {
        Popup.instance.checkAndStartKdspy();
    };
    const loginErrorAction = function(error) {
        _this.loginFailedMessage.show();
        console.log('login failed: ');
        console.log(error);
    };

    if (typeof LoginTab.simulateLoginSuccess !== 'undefined') {
        if (LoginTab.simulateLoginSuccess) {
            _this.setLoginData({isLoggedIn: true, login: 'dummy_user', userId: 999999})
                .then(function(){
                    loginSuccessAction();
                });
        }
        else loginErrorAction('simulated login error');
        return;
    }

    _this.loginButton.prop('disabled', true);

    var authPromise = $.post(wpAuthEndPoint, {username: _this.username.val(), password: _this.password.val()})
        .then(function (result) {
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
        .then(loginSuccessAction)
        .catch(loginErrorAction)
        .finally(function(){
            _this.loginButton.prop('disabled', false);
        });
};

LoginTab.prototype.onLogoutClick = function() {
    return this.setLoginData(defaultLoginData);
};

var defaultLoginData = {
    userId: -1,
    isLoggedIn: false,
    login: '',
    isTrialExpired: false,
    isAccountInactive: false,
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

LoginTab.prototype.load = function(){
    this.loginContent.show();
    this.loginFooter.show();
};

LoginTab.prototype.showTrialExpired = function(){
    this.trialExpiredContent.show();
    this.loginFooter.show();
};

LoginTab.prototype.showAccountInactive = function(){
    this.trialExpiredContent.show();
    this.cancelledTitle.show();
    this.cancelledButton.show();
    this.expiredTitle.hide();
    this.expiredButton.hide();

    this.loginFooter.show();
};

LoginTab.prototype.showCancelledContent = function(){
    this.cancelledContent.show();
    this.loginFooter.show();
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
    var _this = this;

    this.isCheckAccessNeeded(function (isCheckAccessNeeded) {
        if (!isCheckAccessNeeded) {
            _this.getLoginData()
                .then(function (loginData) {
                    callback(loginData.isTrialExpired);
                });
        } else {
            _this.getUserAccessLevel()
                .then(function (accessLevelInfo) {
                    callback(accessLevelInfo.isTrialExpired);
                });
        }
    });
};

LoginTab.prototype.isAccountInactive = function(callback) {
    callback = Helper.valueOrDefault(callback, function() {});
    var _this = this;

    this.isCheckAccessNeeded(function (isCheckAccessNeeded) {
        if (!isCheckAccessNeeded) {
            _this.getLoginData()
                .then(function (loginData) {
                    callback(loginData.isAccountInactive);
                });
        } else {
            _this.getUserAccessLevel()
                .then(function (accessLevelInfo) {
                    callback(accessLevelInfo.isAccountInactive);
                });
        }
    });
};

//validation form
LoginTab.prototype.isFormValid = function() {
    var check = true;
    var input = this.inputForm;

    for (var i = 0; i < input.length; i++) {
        if (this.validate(input[i]) === false) {
            this.showValidate(input[i]);
            check=false;
        }
    }

    return check;
};

LoginTab.prototype.validate = function(input) {
    var input = $(input);

    if(input.attr('type') == 'email' || input.attr('name') == 'email') {
        if(input.val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
            return false;
        }
    }
    else {
        if(input.val().trim() == ''){
            return false;
        }
    }
};

LoginTab.prototype.showValidate = function(input) {
    var thisAlert = $(input).parent();
    $(thisAlert).addClass('alert-validate');
};

LoginTab.prototype.hideValidate = function(input) {
    var thisAlert = $(input).parent();
    $(thisAlert).removeClass('alert-validate');
};