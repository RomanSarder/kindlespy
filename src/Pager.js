/**
 * Created by Andrey on 15.09.2014.
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

    var pager = this;
    var totalItemsLoaded = 0;
    var pulledItems;
    var i=this.lastPage;
    setTimeout(PullOnePage.bind(this), 1000);

    function PullOnePage() {
        $.get(pager.getPageUrlFunction(ParentUrl, i).trim(), function (responseText) {
            var startFromIndex = (i - 1) * pager.itemsPerPage + pager.alreadyPulled;
            var maxResults = pager.itemsInResult - totalItemsLoaded;
            pulledItems = pager.pullItemsFunction(startFromIndex, maxResults, responseText, ParentUrl);

            if (pulledItems === undefined) {
                pager.isInProgress = false;
                return;
            }
            totalItemsLoaded += pulledItems;
            pager.alreadyPulled = 0;
            i++;
            if(totalItemsLoaded<pager.itemsInResult) {
                setTimeout(PullOnePage.bind(pager), 1000);
            } else {
                pager.pagesLoaded++;
                pager.lastPage = i-1;
                pager.alreadyPulled = pulledItems;
                pager.isInProgress = false;
                if(callback !== undefined)
                    callback();
            };
        });
    }

};