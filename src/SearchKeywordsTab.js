/**
 * Created by Andrey Klochkov on 02.04.15.
 */

function SearchKeywordsTab(){
    if ( SearchKeywordsTab.prototype._singletonInstance )
        return SearchKeywordsTab.prototype._singletonInstance;
    SearchKeywordsTab.prototype._singletonInstance = this;

    //this.Analysis = new SearchAnalysisAlgorithm();
}

SearchKeywordsTab.prototype.Load = function(data){

}

