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
    this.isStopped = false;
    this.pullItemsFunction = pullItemsFunction || function(startFromIndex, maxResults, responseText, ParentUrl){};
    this.getPageUrlFunction = getPageUrlFunction || function(url, page){};
}

Pager.prototype.loadNextPage = function(parentUrl, callback){
    if (this.alreadyPulled === undefined) return;
    if (this.isStopped) return;
    if (this.isInProgress) return setTimeout(this.loadNextPage.bind(this, parentUrl, callback), 100);

    this.isInProgress = true;

    var _this = this;
    var totalItemsLoaded = 0;
    var pulledItems;
    var i = this.lastPage;
    var prevPulledItems = 0;
    setTimeout(PullOnePage.bind(this), 100);

    function PullOnePage() {
        if(_this.isStopped) return;
        $.get(_this.getPageUrlFunction(parentUrl, i).trim(), function (responseText) {
            if(_this.isStopped) return;
            var startFromIndex = (i - 1) * _this.itemsPerPage + _this.alreadyPulled;
            var maxResults = _this.itemsInResult - totalItemsLoaded;
            prevPulledItems = pulledItems;
            pulledItems = _this.pullItemsFunction(startFromIndex, maxResults, responseText, parentUrl);

            if (pulledItems === undefined ||
                (prevPulledItems == 0 && pulledItems == 0)) {
                _this.isInProgress = false;
                return;
            }
            totalItemsLoaded += pulledItems;
            _this.alreadyPulled = 0;
            i++;
            if(totalItemsLoaded<_this.itemsInResult) {
                setTimeout(PullOnePage.bind(_this), 100);
            } else {
                _this.pagesLoaded++;
                _this.lastPage = i-1;
                _this.alreadyPulled = pulledItems;
                _this.isInProgress = false;
                if(callback !== undefined)
                    callback();
            }
        });
    }

};

Pager.prototype.stop = function(){
    this.isStopped = true;
};
