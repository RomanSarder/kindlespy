/**
 * Created by Andrey Klochkov on 15.09.2014.
 */

function Pager(itemsPerPage, pullItemsFunction, getPageUrlFunction){
    this.itemsInResult = 20;
    this.itemsPerPage = itemsPerPage;
    this.lastPage = 1;
    this.alreadyPulled = 0;
    this.pagesLoaded = 0;
    this.isInProgress = false;
    this.pullItemsFunction = pullItemsFunction || function(startFromIndex, maxResults, responseText, ParentUrl){};
    this.getPageUrlFunction = getPageUrlFunction || function(url, page){};
}

Pager.prototype.LoadNextPage = function(callback){
    if (this.alreadyPulled === undefined) return;
    if (this.isInProgress) setTimeout(this.LoadNextPage.bind(this, callback), 1000);

    this.isInProgress = true;

    var _this = this;
    var totalItemsLoaded = 0;
    var pulledItems;
    var i = this.lastPage;
    setTimeout(PullOnePage.bind(this), 1000);

    function PullOnePage() {
        $.get(_this.getPageUrlFunction(ParentUrl, i).trim(), function (responseText) {
            var startFromIndex = (i - 1) * _this.itemsPerPage + _this.alreadyPulled;
            var maxResults = _this.itemsInResult - totalItemsLoaded;
            pulledItems = _this.pullItemsFunction(startFromIndex, maxResults, responseText, ParentUrl);

            if (pulledItems === undefined) {
                _this.isInProgress = false;
                return;
            }
            totalItemsLoaded += pulledItems;
            _this.alreadyPulled = 0;
            i++;
            if(totalItemsLoaded<pager.itemsInResult) {
                setTimeout(PullOnePage.bind(_this), 1000);
            } else {
                _this.pagesLoaded++;
                _this.lastPage = i-1;
                _this.alreadyPulled = pulledItems;
                _this.isInProgress = false;
                if(callback !== undefined)
                    callback();
            };
        });
    }

};