/**
 * Created by Andrey Klochkov on 20.03.15.
 */
function SearchAnalysisAlgorithm(){
    if ( SearchAnalysisAlgorithm.prototype._singletonInstance )
        return SearchAnalysisAlgorithm.prototype._singletonInstance;
    SearchAnalysisAlgorithm.prototype._singletonInstance = this;
}

SearchAnalysisAlgorithm.prototype.GetPopularityColor = function(salesRankConclusionValue){
    var salesRankConclusion = parseInt(salesRankConclusionValue);
    if (salesRankConclusion < 3) return 'red';
    if (salesRankConclusion < 8) return 'yellow';
    return 'green';
};

SearchAnalysisAlgorithm.prototype.GetPotentialColor = function(monthlyRevBook){
    if (monthlyRevBook < 3) return 'red';
    if (monthlyRevBook < 8) return 'yellow';
    return 'green';
};

SearchAnalysisAlgorithm.prototype.GetCompetitionColor = function(totalResults){
    if (totalResults < 500) return 'green';
    if (totalResults < 1500) return 'yellow';
    return 'red';
};

SearchAnalysisAlgorithm.prototype.SetBullets = function(object){
    this.SetPopularityBullet(object.salesRankConclusionValue);
    this.SetPotentialBullet(object.monthlyRevBook);
    this.SetCompetitionBullet();
};

SearchAnalysisAlgorithm.prototype.SetPopularityBullet = function(value){
    var popularityColor = this.GetPopularityColor(value);
    $('#bullet-1').removeClass().addClass('bullet-' + popularityColor);
    $('#bullet-1').tooltipster('content', this.GetPopularityTooltip(popularityColor));
};

SearchAnalysisAlgorithm.prototype.SetPotentialBullet = function(value){
    var potentialColor = this.GetPotentialColor(value);
    $('#bullet-2').removeClass().addClass('bullet-' + potentialColor);
    $('#bullet-2').tooltipster('content', this.GetPotentialTooltip(potentialColor));
};

SearchAnalysisAlgorithm.prototype.SetCompetitionBullet = function(){
    var _this = this;
    Popup.sendMessage({type: "get-TotalResults"}, function(response){
        var competitionColor =  _this.GetCompetitionColor(parseInt(response.TotalResults));
        $('#bullet-3').removeClass().addClass('bullet-' + competitionColor);
        $('#bullet-3').tooltipster('content', _this.GetCompetitionTooltip(competitionColor));
    });
};

SearchAnalysisAlgorithm.prototype.GetPopularityTooltip = function(val){
    if(val == 'green') return 'This is a popular keyword and there are a number of books here performing well.';
    if(val == 'yellow') return 'Caution: There are only a small number of books performing well for this keyword.';
    return 'Warning: This keyword is not very popular.';
};

SearchAnalysisAlgorithm.prototype.GetPotentialTooltip = function(val){
    if(val == 'green') return 'The revenue potential of books under this keyword looks very good.';
    if(val == 'yellow') return 'Caution: The revenue potential of books under this keyword looks a little average.';
    return 'Warning: The revenue potential of books under this keyword is rather low.';
};

SearchAnalysisAlgorithm.prototype.GetCompetitionTooltip = function(val){
    if(val == 'green') return 'You can easily compete here for a first page ranking.';
    if(val == 'yellow') return 'Caution: There is some healthy competition here.';
    return 'Warning: The competition here is very strong.';
};