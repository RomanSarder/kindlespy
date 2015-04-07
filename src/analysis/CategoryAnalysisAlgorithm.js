/**
 * Created by Andrey Klochkov on 20.03.15.
 */
function CategoryAnalysisAlgorithm(){
    if ( CategoryAnalysisAlgorithm.prototype._singletonInstance )
        return CategoryAnalysisAlgorithm.prototype._singletonInstance;
    CategoryAnalysisAlgorithm.prototype._singletonInstance = this;
}

CategoryAnalysisAlgorithm.prototype.GetPopularityColor = function(salesRank20String){
    var salesRank = parseInt(salesRank20String);
    if (salesRank < 24999) return 'green';
    if (salesRank < 60000) return 'yellow';
    return 'red';
}

CategoryAnalysisAlgorithm.prototype.GetPotentialColor = function(avgMonthlyRevString){
    var avgMonthlyRev = parseInt(avgMonthlyRevString);
    if (avgMonthlyRev < 200) return 'red';
    if (avgMonthlyRev < 1000) return 'yellow';
    return 'green';
}

CategoryAnalysisAlgorithm.prototype.GetCompetitionColor = function(salesRank20String){
    var salesRank = parseInt(salesRank20String);
    if (salesRank < 4600) return 'red';
    if (salesRank < 14000) return 'yellow';
    return 'green';
}
CategoryAnalysisAlgorithm.prototype.SetBullets = function(object){
    this.SetPopularityBullet(object.salesRank20);
    this.SetPotentialBullet(object.avgMonthlyRev);
    this.SetCompetitionBullet(object.salesRank20);
}

CategoryAnalysisAlgorithm.prototype.SetPopularityBullet = function(value){
    var popularityColor = this.GetPopularityColor(value);
    $('#bullet-1').removeClass().addClass('bullet-' + popularityColor);
    $('#bullet-1').tooltipster('content', this.GetPopularityTooltip(popularityColor));
}

CategoryAnalysisAlgorithm.prototype.SetPotentialBullet = function(value){
    var potentialColor = this.GetPotentialColor(value);
    $('#bullet-2').removeClass().addClass('bullet-' + potentialColor);
    $('#bullet-2').tooltipster('content', this.GetPotentialTooltip(potentialColor));
}

CategoryAnalysisAlgorithm.prototype.SetCompetitionBullet = function(value){
    var competitionColor = this.GetCompetitionColor(value);
    $('#bullet-3').removeClass().addClass('bullet-' + competitionColor);
    $('#bullet-3').tooltipster('content', this.GetCompetitionTooltip(competitionColor));
}

CategoryAnalysisAlgorithm.prototype.GetPopularityTooltip = function(val){
    if(val == 'green') return 'This category is very popular and books here have good sales volumes.';
    if(val == 'yellow') return 'Caution: This category has a rather average popularity with mediocre sales volumes.';
    return 'Warning: This category is not very popular and sales volumes here are very low.';
}

CategoryAnalysisAlgorithm.prototype.GetPotentialTooltip = function(val){
    if(val == 'green') return 'The revenue potential in this category is very good.';
    if(val == 'yellow') return 'Caution: The avg. monthly revenue of these books is rather mediocre.';
    return 'Warning: The avg. monthly revenue of books here is rather low.';
}

CategoryAnalysisAlgorithm.prototype.GetCompetitionTooltip = function(val){
    if(val == 'green') return 'You can easily compete here for a first page category ranking.';
    if(val == 'yellow') return 'Caution: There is some healthy competition here.';
    return 'Warning: The competition here is very strong.';
}