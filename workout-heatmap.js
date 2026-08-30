/* Start own code */
/* New visualisation: a 2D matrix heatmap (training category x day of
   week) built from the same workout survey data used by the waffle
   chart, but presented as a genuinely different chart type — a
   colour-encoded grid rather than a grid-of-squares-per-day. */
function WorkoutHeatmap() {
  this.name = 'Workout Heatmap';
  this.id = 'workout-heatmap';
  this.loaded = false;

  this.categories = ["Weightlifting", "Mixed/CrossFit", "Endurance/Hyrox", "Boxing", "Rest"];
  this.days = [
    { field: "mon_training", label: "Mon" },
    { field: "tue_training", label: "Tue" },
    { field: "wed_training", label: "Wed" },
    { field: "thu_training", label: "Thu" },
    { field: "fri_training", label: "Fri" },
    { field: "sat_training", label: "Sat" },
    { field: "sun_training", label: "Sun" }
  ];

  this.layout = {
    gridLeft: 160,
    gridTop: 110,
    cellW: 108,
    cellH: 50,
  };

  // Entrance animation state, same pattern used elsewhere in the app.
  this.animStart = null;
  this.animDuration = 900;

  this.resetAnimation = function() {
    this.animStart = null;
  };

  this.easeOutCubic = function(t) {
    return 1 - pow(1 - t, 3);
  };

  this.preload = function() {
    var self = this;
    this.data = loadTable(
      './data/workout-survey/Survey_Dataset_Structured.csv', 'csv', 'header',
      function(table) {
        self.loaded = true;
      });
  };

  this.setup = function() {
    textSize(13);

    // Build the category x day matrix of counts.
    this.matrix = [];
    this.maxCount = 0;
    var totalRespondents = this.data.getRowCount();

    for (var r = 0; r < this.categories.length; r++) {
      var row = [];
      for (var c = 0; c < this.days.length; c++) {
        var column = this.data.getColumn(this.days[c].field);
        var count = 0;
        for (var i = 0; i < column.length; i++) {
          if (column[i] === this.categories[r]) count++;
        }
        row.push(count);
        this.maxCount = max(this.maxCount, count);
      }
      this.matrix.push(row);
    }
    this.totalRespondents = totalRespondents;
  };

  this.destroy = function() {
    this.resetAnimation();
  };

  // Sequential colour scale (dark -> the app's purple accent),
  // matching the palette already used elsewhere in the gallery.
  this.intensityToColour = function(fraction) {
    var lowColour = color(52, 54, 64);   // matches canvas background tone
    var highColour = color(156, 93, 240); // app's purple accent
    return lerpColor(lowColour, highColour, fraction);
  };

  this.draw = function() {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    if (this.animStart === null) {
      this.animStart = millis();
    }
    var elapsed = millis() - this.animStart;
    var progress = constrain(elapsed / this.animDuration, 0, 1);
    var eased = this.easeOutCubic(progress);

    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(24);
    text('Workout Heatmap', 20, 16);

    stroke(255);
    strokeWeight(3);
    line(20, 48, 120, 48);

    // Column headers (days).
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    for (var c = 0; c < this.days.length; c++) {
      var x = this.layout.gridLeft + c * this.layout.cellW + this.layout.cellW / 2;
      text(this.days[c].label, x, this.layout.gridTop - 20);
    }

    var hoveredCell = null;

    // Grid cells.
    for (var r = 0; r < this.categories.length; r++) {
      var y = this.layout.gridTop + r * this.layout.cellH;

      // Row label.
      noStroke();
      fill(255);
      textAlign(RIGHT, CENTER);
      textSize(13);
      text(this.categories[r], this.layout.gridLeft - 14, y + this.layout.cellH / 2);

      for (var c = 0; c < this.days.length; c++) {
        var x = this.layout.gridLeft + c * this.layout.cellW;
        var count = this.matrix[r][c];
        var fraction = this.maxCount > 0 ? count / this.maxCount : 0;

        var isHovered = mouseX > x && mouseX < x + this.layout.cellW - 4 &&
                         mouseY > y && mouseY < y + this.layout.cellH - 4;
        if (isHovered) {
          hoveredCell = { row: r, col: c, count: count };
        }

        noStroke();
        fill(this.intensityToColour(fraction * eased));
        rect(x, y, this.layout.cellW - 4, this.layout.cellH - 4, 4);

        if (isHovered) {
          noFill();
          stroke(255);
          strokeWeight(2);
          rect(x, y, this.layout.cellW - 4, this.layout.cellH - 4, 4);
        }

        // Show the count directly in the cell once large enough to
        // read, so the exact numbers are visible without hovering.
        noStroke();
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(12);
        text(count, x + (this.layout.cellW - 4) / 2, y + (this.layout.cellH - 4) / 2);
      }
    }

    this.drawLegend(eased);

    if (hoveredCell) {
      this.drawTooltip(hoveredCell);
    }
  };

  // A small horizontal colour-intensity scale bar, so the mapping from
  // colour to count is explained rather than left implicit.
  this.drawLegend = function(eased) {
    var legendX = this.layout.gridLeft;
    var legendY = this.layout.gridTop + this.categories.length * this.layout.cellH + 30;
    var legendW = 300;
    var legendH = 14;

    for (var i = 0; i < legendW; i++) {
      var fraction = i / legendW;
      stroke(this.intensityToColour(fraction * eased));
      line(legendX + i, legendY, legendX + i, legendY + legendH);
    }

    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(12);
    text('0', legendX, legendY + legendH + 6);
    textAlign(RIGHT, TOP);
    text(this.maxCount + ' respondents', legendX + legendW, legendY + legendH + 6);
  };

  this.drawTooltip = function(hoveredCell) {
    var category = this.categories[hoveredCell.row];
    var day = this.days[hoveredCell.col].label;
    var pct = ((hoveredCell.count / this.totalRespondents) * 100).toFixed(1);
    var label = category + ' on ' + day + ':  ' + hoveredCell.count + ' (' + pct + '%)';

    push();
    textSize(13);
    var tWidth = textWidth(label);
    var boxW = tWidth + 20;
    var boxH = 28;
    var tx = constrain(mouseX + 14, 10, width - boxW - 10);
    var ty = constrain(mouseY - boxH - 12, 10, height - boxH - 10);

    noStroke();
    fill('#2c2f36');
    stroke('#4a4d59');
    strokeWeight(1);
    rect(tx, ty, boxW, boxH, 4);

    noStroke();
    fill(255);
    textAlign(LEFT, CENTER);
    text(label, tx + 10, ty + boxH / 2);
    pop();
  };
}
/* End own code */
