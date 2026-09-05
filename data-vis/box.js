/*Start own code*/
function Cell(cellX, cellY, cellW, cellH, categoryData) {
    this.categoryData = categoryData;

    this.isPointInside = function(mx, my){
        return (mx > cellX && mx < cellX + cellW && my > cellY && my < cellY + cellH);
    }

    this.render = function(isRaised) {
        if (!isRaised) {
            fill(this.categoryData.color);
            stroke('#343640');
            strokeWeight(1);
            rect(cellX, cellY, cellW, cellH, 2);
            return;
        }

        var growFactor = 1.15;
        var riseOffset = 4;

        var expandedW = cellW * growFactor;
        var expandedH = cellH * growFactor;
        var centerX = cellX + cellW / 2;
        var centerY = cellY + cellH / 2;
        var poppedX = centerX - expandedW / 2;
        var poppedY = (centerY - expandedH / 2) - riseOffset;

        push();
        noStroke();
        fill(0, 0, 0, 70);
        rect(poppedX + 2, poppedY + 4, expandedW, expandedH, 3);

        fill(this.categoryData.color);
        stroke(255);
        strokeWeight(1.5);
        rect(poppedX, poppedY, expandedW, expandedH, 3);
        pop();
    }
}
/* End own code */