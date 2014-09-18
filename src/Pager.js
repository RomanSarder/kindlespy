/**
 * Created by Andrey on 15.09.2014.
 */

function Pager(itemsPerPage){
    this.itemsInResult = 20;
    this.itemsPerPage = itemsPerPage;
    this.lastPage = 1;
    this.alreadyPulled = 0;
    this.pagesLoaded = 0;
    this.isInProgress = false;
}

Pager.prototype.LoadNextPage = function(callback){
    if (this.alreadyPulled === undefined) return;
    if (this.isInProgress) setTimeout(this.LoadNextPage.bind(this, callback), 500);

    this.isInProgress = true;

    var pager = this;
    var totalItemsLoaded = 0;
    var pulledItems;
    var i=this.lastPage;
    setTimeout(PullOnePage.bind(this), 100);

    function PullOnePage() {
        $.get((ParentUrl + "?page=" + i).trim(), function (responseText) {
                    var startFromIndex = (i - 1) * pager.itemsPerPage + pager.alreadyPulled;
                    var maxResults = pager.itemsInResult - totalItemsLoaded;
                    pulledItems = ParseAuthorPage(startFromIndex, maxResults, responseText, ParentUrl);

                    if (pulledItems === undefined) {
                        pager.isInProgress = false;
                        return;
                    }
                    totalItemsLoaded += pulledItems;
                    pager.alreadyPulled = 0;
                    i++;
                    if(totalItemsLoaded<pager.itemsInResult) {
                        PullOnePage.call(pager);
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