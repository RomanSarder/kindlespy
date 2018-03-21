/**
 * Created by Andrey Klochkov on 22.03.18.
 */

function LoginTab(){
    if ( LoginTab.prototype._singletonInstance )
        return LoginTab.prototype._singletonInstance;
    LoginTab.prototype._singletonInstance = this;

    this.username = $('#username');
    this.password = $('#password');
    this.loginButton = $('#login-button');
    this.resetPassword = $('#reset-password');
    this.storage = Api.storage;
}

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
    var tableHead = "<label class=\"sort-column\" id=\"no\" style=\"padding-right:6px;\">#</label><label class=\"sort-column\" id=\"title-book\" style=\"padding-right:175px;\"> Kindle Book Title</label><label class=\"sort-column\" id=\"searchf\" style=\"padding-right:20px;\">More</label><label class=\"sort-column\" id=\"pageno\" style=\"padding-right:8px;\">Page(s)</label><label class=\"sort-column\" id=\"price\" style=\"padding-right:30px;\">Price</label><label class=\"sort-column\" id=\"est-sales\" style=\"padding-right:20px;\" >Est. Sales</label><label class=\"sort-column\" id=\"sales-rev\" style=\"padding-right:15px;\" >Monthly Rev.</label><label class=\"sort-column\" id=\"reviews\" style=\"padding-right:10px;\" >Reviews</label><label class=\"sort-column\" id=\"sales-rank\" >Sales Rank</label>"
    var infoHtml = "<div class=\"info-item\"><span style=\"font-size:11px\">Results:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result1\">1-20</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Sales Rank:</span><div style=\"font-size:16px;font-weight:bold; margin-top:-6px;\" id=\"result2\">2,233</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Monthly Rev:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result3\">$7,000.00</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. Price:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result4\">$7.95</div></div><div class=\"info-item\"><span style=\"font-size:11px\">Avg. No. Reviews:</span><div style=\"font-size:16px;font-weight:bold;margin-top:-6px;\" id=\"result5\">31</div></div>";

    return { info: infoHtml, header: tableHead };
};
