function PayGapTimeSeries() {

  // Name for the visualisation to appear in the menu bar.
  this.name = 'Pay gap: 1997-2017';

  // Each visualisation must have a unique ID with no special
  // characters.
  this.id = 'pay-gap-timeseries';

  // Title to display above the plot.
  this.title = 'Gender Pay Gap: Average difference.';

  // Names for each axis.
  this.xAxisLabel = 'year';
  this.yAxisLabel = '%';

  var marginSize = 35;

  // Layout object to store all common plot layout parameters and
  // methods.
  this.layout = {
    marginSize: marginSize,

    // Locations of margin positions. Left and bottom have double margin
    // size due to axis and tick labels.
    leftMargin: marginSize * 2,
    rightMargin: width - marginSize,
    // Extra offset (on top of the usual marginSize) so the plot starts
    // below the top-left title and its underline, instead of the two
    // overlapping.
    topMargin: marginSize + 40,
    bottomMargin: height - marginSize * 2,
    pad: 5,

    plotWidth: function () {
      return this.rightMargin - this.leftMargin;
    },

    plotHeight: function () {
      return this.bottomMargin - this.topMargin;
    },

    // Boolean to enable/disable background grid.
    grid: true,

    // Number of axis tick labels to draw so that they are not drawn on
    // top of one another.
    numXTickLabels: 10,
    numYTickLabels: 8,
  };

  // Colours used for the line and gradient fill beneath it. Kept local
  // to this file so the shared helper-functions.js stays untouched.
  this.lineColour = color('#9c5df0');          // purple line
  this.gradientTopColour = [156, 93, 240];      // matches lineColour, for the area fill
  this.textColour = 255;                        // white axis text/numbers
  this.gridColour = '#545865';                  // thinner, muted grid lines

  // --- Entrance animation state ---
  this.animStart = null;    // millis() timestamp for when the animation began
  this.animDuration = 1200; // how long the left-to-right sweep-in takes, in ms

  // Called from destroy() so that navigating away and back replays the
  // animation from scratch, instead of it only ever playing once.
  this.resetAnimation = function () {
    this.animStart = null;
  };

  // Simple ease-out-cubic: fast start, smooth settle at the end.
  this.easeOutCubic = function (t) {
    return 1 - pow(1 - t, 3);
  };

  // Property to represent whether data has been loaded.
  this.loaded = false;

  // Preload the data. This function is called automatically by the
  // gallery when a visualisation is added.
  this.preload = function () {
    var self = this;
    this.data = loadTable(
      './data/pay-gap/all-employees-hourly-pay-by-gender-1997-2017.csv', 'csv', 'header',
      // Callback function to set the value
      // this.loaded to true.
      function (table) {
        self.loaded = true;
      });

  };

  this.setup = function () {
    // Font defaults.
    textSize(16);

    // Set min and max years: assumes data is sorted by date.
    this.startYear = this.data.getNum(0, 'year');
    this.endYear = this.data.getNum(this.data.getRowCount() - 1, 'year');

    // Find min and max pay gap for mapping to canvas height.
    this.minPayGap = 0;         // Pay equality (zero pay gap).
    this.maxPayGap = max(this.data.getColumn('pay_gap'));

    // ==========================================
    // PERFORMANCE: pre-compute everything that doesn't change frame to
    // frame, instead of rebuilding it 60 times a second inside draw().
    // ==========================================

    // Cache the raw data + its pixel positions once.
    this.points = [];
    for (var i = 0; i < this.data.getRowCount(); i++) {
      var yearVal = this.data.getNum(i, 'year');
      var payGapVal = this.data.getNum(i, 'pay_gap');
      this.points.push({
        'year': yearVal,
        'payGap': payGapVal,
        'x': this.mapYearToWidth(yearVal),
        'y': this.mapPayGapToHeight(payGapVal)
      });
    }

    this.numYears = this.endYear - this.startYear;
    this.xLabelSkip = ceil(this.numYears / this.layout.numXTickLabels);

    // Cache the gradient object — its coordinates and colour stops never
    // change, so building it once avoids expensive canvas API calls
    // every single frame.
    var ctx = drawingContext;
    var r = this.gradientTopColour[0];
    var g = this.gradientTopColour[1];
    var b = this.gradientTopColour[2];

    this.cachedGradient = ctx.createLinearGradient(
      0, this.layout.topMargin,
      0, this.layout.bottomMargin
    );
    this.cachedGradient.addColorStop(0, 'rgba(' + r + ',' + g + ',' + b + ',0.55)');
    this.cachedGradient.addColorStop(1, 'rgba(' + r + ',' + g + ',' + b + ',0)');
  };

  this.destroy = function () {
    this.resetAnimation();
  };

  this.draw = function () {
    if (!this.loaded) {
      console.log('Data not yet loaded');
      return;
    }

    // ==========================================
    // 0. ADVANCE / COMPUTE THE ENTRANCE ANIMATION
    // ==========================================
    if (this.animStart === null) {
      this.animStart = millis();
    }
    var elapsed = millis() - this.animStart;
    var progress = constrain(elapsed / this.animDuration, 0, 1);
    var eased = this.easeOutCubic(progress);
    var isAnimating = progress < 1;

    // How far across the plot (in x-pixels) the sweep has revealed so far.
    var revealX = map(eased, 0, 1, this.layout.leftMargin, this.layout.rightMargin);
    // Title/axis/labels fade in alongside the sweep.
    var fadeAlpha = eased * 255;

    // Draw the title above the plot.
    this.drawTitle(fadeAlpha);

    // Draw all y-axis labels (white text, local to this file).
    this.drawYAxisTickLabelsWhite(fadeAlpha);

    // Draw x and y axis (white lines, local to this file).
    this.drawAxisWhite(fadeAlpha);

    // Draw x and y axis labels (white text, local to this file).
    this.drawAxisLabelsWhite(fadeAlpha);

    // Points, numYears, and xLabelSkip were pre-computed once in setup()
    // to avoid rebuilding them (and re-reading the CSV table) every frame.
    var points = this.points;

    // Draw the soft gradient area beneath the line (drawn first, so the
    // line and hover marker render on top of it). Clipped to the sweep.
    this.drawGradientArea(points, revealX);

    // Loop over all rows and draw a line from the previous value to
    // the current, clipped to however far the sweep has reached.
    for (var i = 0; i < points.length; i++) {
      var current = points[i];

      if (i > 0) {
        var previous = points[i - 1];

        var prevX = previous.x;
        var currX = current.x;

        if (prevX <= revealX) {
          var segEndX = min(currX, revealX);
          // Interpolate the y-value at segEndX so the sweep's leading
          // edge lands exactly on the line instead of jumping.
          var segT = (segEndX - prevX) / (currX - prevX);
          var segEndY = lerp(previous.y, current.y, segT);

          stroke(this.lineColour);
          strokeWeight(2);
          line(prevX, previous.y, segEndX, segEndY);

          // Draw the tick label marking the start of the previous year,
          // once the sweep has reached that far.
          if (i % this.xLabelSkip == 0 && prevX <= revealX) {
            this.drawXAxisTickLabelWhite(previous.year, fadeAlpha);
          }
        }
      }
    }

    // Hover: find the nearest data point to the mouse and show its
    // exact year/pay-gap values. Disabled while still animating in.
    if (!isAnimating) {
      this.drawHoverTooltip(points);
    }
  };

  this.drawTitle = function (alpha) {
    fill(255, alpha);
    noStroke();
    textAlign(LEFT, TOP);
    textSize(24);

    // Match the waffle chart: title pinned to the top-left corner of
    // the canvas (not relative to the plot margins).
    text(this.title, 20, 16);

    // Underline matching the waffle chart's exact style/length
    // (20 -> 120, i.e. 100px), so both visualisations look consistent.
    stroke(255, alpha);
    strokeWeight(3);
    line(20, 48, 120, 48);

    // Restore default text size used elsewhere in this file.
    textSize(16);
  };


  // --- Local, white-styled replacements for the shared axis helpers ---
  // (kept in this file so helper-functions.js is left untouched)

  this.drawAxisWhite = function (alpha) {
    stroke(255, 255, 255, alpha);

    // x-axis
    line(this.layout.leftMargin,
      this.layout.bottomMargin,
      this.layout.rightMargin,
      this.layout.bottomMargin);

    // y-axis
    line(this.layout.leftMargin,
      this.layout.topMargin,
      this.layout.leftMargin,
      this.layout.bottomMargin);
  };

  this.drawAxisLabelsWhite = function (alpha) {
    fill(255, 255, 255, alpha);
    noStroke();
    textAlign('center', 'center');

    // Draw x-axis label.
    text(this.xAxisLabel,
      (this.layout.plotWidth() / 2) + this.layout.leftMargin,
      this.layout.bottomMargin + (this.layout.marginSize * 1.5));

    // Draw y-axis label.
    push();
    translate(this.layout.leftMargin - (this.layout.marginSize * 1.5),
      this.layout.bottomMargin / 2);
    rotate(- PI / 2);
    text(this.yAxisLabel, 0, 0);
    pop();
  };

  this.drawYAxisTickLabelsWhite = function (alpha) {
    var range = this.maxPayGap - this.minPayGap;
    var yTickStep = range / this.layout.numYTickLabels;

    fill(255, 255, 255, alpha);
    noStroke();
    textAlign('right', 'center');

    for (var i = 0; i <= this.layout.numYTickLabels; i++) {
      var value = this.minPayGap + (i * yTickStep);
      var y = this.mapPayGapToHeight(value);

      text(value.toFixed(0),
        this.layout.leftMargin - this.layout.pad,
        y);

      if (this.layout.grid) {
        stroke(this.gridColour);
        strokeWeight(0.5);
        line(this.layout.leftMargin, y, this.layout.rightMargin, y);
      }
    }
  };

  this.drawXAxisTickLabelWhite = function (value, alpha) {
    var x = this.mapYearToWidth(value);

    fill(255, 255, 255, alpha);
    noStroke();
    textAlign('center', 'center');

    text(value,
      x,
      this.layout.bottomMargin + this.layout.marginSize / 2);

    if (this.layout.grid) {
      stroke(this.gridColour);
      strokeWeight(0.5);
      line(x,
        this.layout.topMargin,
        x,
        this.layout.bottomMargin);
    }
  };

  // Fills the area under the curve with a vertical gradient that fades
  // from a solid colour at the top to transparent near the bottom —
  // matching the reference "area chart" style. Clipped to revealX so it
  // grows in step with the entrance animation's left-to-right sweep.
  // Uses the gradient object cached in setup() to avoid recreating it
  // every frame, which was the main source of the loading-time lag.
  this.drawGradientArea = function (points, revealX) {
    if (points.length === 0) return;

    push();
    noStroke();
    drawingContext.fillStyle = this.cachedGradient;

    beginShape();
    var lastX = points[0].x;
    var lastY = points[0].y;

    for (var i = 0; i < points.length; i++) {
      var px = points[i].x;
      var py = points[i].y;

      if (px > revealX) {
        // Interpolate so the area's leading edge lines up exactly with
        // the line's leading edge instead of jumping between points.
        var t = (revealX - lastX) / (px - lastX);
        var clippedY = lerp(lastY, py, constrain(t, 0, 1));
        vertex(revealX, clippedY);
        break;
      }

      vertex(px, py);
      lastX = px;
      lastY = py;

      if (i === points.length - 1) {
        // Reached the final point without being clipped — sweep is done.
        vertex(px, py);
      }
    }

    // Close the shape down to the baseline so the fill forms a solid area.
    var closingX = min(lastX, revealX);
    vertex(closingX, this.layout.bottomMargin);
    vertex(points[0].x, this.layout.bottomMargin);
    endShape(CLOSE);
    pop();
  };

  // Finds the data point whose x-position is closest to the mouse and,
  // if the mouse is within the plot area, draws a highlighted marker
  // and a tooltip showing that point's year and pay gap.
  this.drawHoverTooltip = function (points) {
    if (points.length === 0) return;

    var withinPlot = mouseX >= this.layout.leftMargin &&
      mouseX <= this.layout.rightMargin &&
      mouseY >= this.layout.topMargin &&
      mouseY <= this.layout.bottomMargin;

    if (!withinPlot) return;

    // Find the closest point by x-distance.
    var closestIndex = 0;
    var closestDist = Infinity;
    for (var i = 0; i < points.length; i++) {
      var d = abs(mouseX - points[i].x);
      if (d < closestDist) {
        closestDist = d;
        closestIndex = i;
      }
    }

    var point = points[closestIndex];
    var px = point.x;
    var py = point.y;

    // Dotted white crosshair guides, dropping from the point down to the
    // x-axis and across to the y-axis.
    var ctx = drawingContext;
    push();
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 1;

    // Vertical guide: point down to the x-axis.
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, this.layout.bottomMargin);
    ctx.stroke();

    // Horizontal guide: point across to the y-axis.
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(this.layout.leftMargin, py);
    ctx.stroke();

    ctx.restore();
    pop();

    // Highlight marker on the line.
    push();
    noStroke();
    fill(255);
    ellipse(px, py, 8, 8);
    fill(this.gradientTopColour[0], this.gradientTopColour[1], this.gradientTopColour[2]);
    ellipse(px, py, 5, 5);
    pop();

    // Tooltip box showing exact x/y values.
    var label = point.year + ':  ' + point.payGap.toFixed(1) + '%';

    push();
    textSize(13);
    var tWidth = textWidth(label);
    var boxW = tWidth + 20;
    var boxH = 26;
    var tx = constrain(px + 12, this.layout.leftMargin, this.layout.rightMargin - boxW);
    var ty = constrain(py - boxH - 10, this.layout.topMargin, this.layout.bottomMargin - boxH);

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

  this.mapYearToWidth = function (value) {
    return map(value,
      this.startYear,
      this.endYear,
      this.layout.leftMargin,   // Draw left-to-right from margin.
      this.layout.rightMargin);
  };

  this.mapPayGapToHeight = function (value) {
    return map(value,
      this.minPayGap,
      this.maxPayGap,
      this.layout.bottomMargin, // Smaller pay gap at bottom.
      this.layout.topMargin);   // Bigger pay gap at top.
  };
}