/* Start own code */
/* Visualisation: Genre Popularity Heatmap
   Rows    = music genres  (from the first column of the CSV)
   Columns = countries     (from the header row of the CSV)
   Values  = popularity score 0-100 */
function WorkoutHeatmap() {
  this.name = 'Genre Popularity';
  this.id = 'workout-heatmap';
  this.loaded = false;

  // Will be populated after the CSV is parsed.
  this.genres = [];   // row labels  (e.g. "Pop", "Rock", …)
  this.countries = [];   // col labels  (e.g. "UK", "US", …)
  this.matrix = [];   // 2-D array of numbers [genre][country]
  this.maxScore = 100;  // scores are already 0-100, so cap is known

  this.layout = {
    gridLeft: 160,   // recomputed in setup() to centre horizontally
    gridTop: 110,   // title (80px) + rotated-header row (30px)
    cellW: 82,    // recomputed in setup() based on canvas width
    cellH: 38,    // recomputed in setup() based on canvas height
  };

  // Padding constants — give the grid visible breathing room on all sides.
  this.PAD_LABEL = 130;  // pixels reserved left of cells for genre labels
  this.PAD_H = 30;   // horizontal padding left & right of the full block
  this.PAD_V_BOT = 20;   // vertical padding below the legend
  this.LEGEND_H = 50;   // height needed for legend bar + text

  // Entrance animation — same pattern used elsewhere in the gallery.
  this.animStart = null;
  this.animDuration = 900;

  this.resetAnimation = function () { this.animStart = null; };

  this.easeOutCubic = function (t) { return 1 - pow(1 - t, 3); };

  // ── preload ────────────────────────────────────────────────────────────────
  this.preload = function () {
    var self = this;
    this.data = loadTable(
      './data/genre-popularity/genre-popularity.csv',
      'csv', 'header',
      function () { self.loaded = true; }
    );
  };

  // ── setup ──────────────────────────────────────────────────────────────────
  this.setup = function () {
    textSize(13);

    // Clear arrays so re-entering this visualisation doesn't double-push.
    this.genres = [];
    this.countries = [];
    this.matrix = [];

    // Country names come from the header (all columns except the first "genre")
    var columns = this.data.columns;    // array of all header strings
    this.countries = columns.slice(1);  // drop "genre" column name

    // ── Dynamic layout ─────────────────────────────────────────────────────
    // Horizontal: centre the cell grid between left and right padding.
    var availW = width - this.PAD_H - this.PAD_LABEL - this.PAD_H;
    this.layout.cellW = floor(availW / this.countries.length);
    this.layout.gridLeft = this.PAD_H + this.PAD_LABEL;

    // Vertical: fit rows into the space between the header and bottom padding.
    // (Computed after the data loop so rowCount is known.)
    var availH = height - this.layout.gridTop - this.LEGEND_H - this.PAD_V_BOT;

    // Build the matrix row-by-row.
    var rowCount = this.data.getRowCount();
    for (var r = 0; r < rowCount; r++) {
      var row = this.data.getRow(r);
      this.genres.push(row.getString('genre'));

      var vals = [];
      for (var c = 0; c < this.countries.length; c++) {
        vals.push(row.getNum(this.countries[c]));
      }
      this.matrix.push(vals);
    }

    // Now rowCount is correct — compute cellH.
    this.layout.cellH = floor(availH / rowCount);
  };

  this.destroy = function () { this.resetAnimation(); };

  // ── colour scale ───────────────────────────────────────────────────────────
  // Cold (low) → app's purple accent (high)
  this.intensityToColour = function (fraction) {
    var lowColour = color(52, 54, 64);    // matches canvas background tone
    var highColour = color(156, 93, 240);  // app's purple accent
    return lerpColor(lowColour, highColour, fraction);
  };

  // ── draw ───────────────────────────────────────────────────────────────────
  this.draw = function () {
    if (!this.loaded) { return; }

    if (this.animStart === null) { this.animStart = millis(); }
    var elapsed = millis() - this.animStart;
    var progress = constrain(elapsed / this.animDuration, 0, 1);
    var eased = this.easeOutCubic(progress);

    // Title
    noStroke();
    fill(255);
    textAlign(LEFT, TOP);
    textSize(24);
    text('Genre Popularity', 20, 16);

    stroke(255);
    strokeWeight(3);
    line(20, 48, 180, 48);

    // Subtitle
    noStroke();
    fill(200);
    textSize(13);
    textAlign(LEFT, TOP);
    text('Music genre popularity scores (0–100) by country', 20, 58);

    // Column headers (countries) — rotated 40° so they fit neatly.
    for (var c = 0; c < this.countries.length; c++) {
      var cx = this.layout.gridLeft + c * this.layout.cellW + this.layout.cellW / 2;
      var cy = this.layout.gridTop - 14;
      push();
      translate(cx, cy);
      rotate(-PI / 4.5);
      noStroke();
      fill(255);
      textAlign(LEFT, CENTER);
      textSize(12);
      text(this.countries[c], 0, 0);
      pop();
    }

    var hoveredCell = null;

    // Grid cells
    for (var r = 0; r < this.genres.length; r++) {
      var gy = this.layout.gridTop + r * this.layout.cellH;

      // Row label (genre)
      noStroke();
      fill(255);
      textAlign(RIGHT, CENTER);
      textSize(13);
      text(this.genres[r], this.layout.gridLeft - 10, gy + this.layout.cellH / 2);

      for (var c = 0; c < this.countries.length; c++) {
        var gx = this.layout.gridLeft + c * this.layout.cellW;
        var score = this.matrix[r][c];
        var fraction = score / this.maxScore;

        var isHovered = mouseX > gx && mouseX < gx + this.layout.cellW - 4 &&
          mouseY > gy && mouseY < gy + this.layout.cellH - 4;
        if (isHovered) hoveredCell = { row: r, col: c, score: score };

        // Fill cell
        noStroke();
        fill(this.intensityToColour(fraction * eased));
        rect(gx, gy, this.layout.cellW - 4, this.layout.cellH - 4, 4);

        // Hover outline
        if (isHovered) {
          noFill();
          stroke(255);
          strokeWeight(2);
          rect(gx, gy, this.layout.cellW - 4, this.layout.cellH - 4, 4);
        }

        // Score label inside the cell
        noStroke();
        fill(fraction * eased > 0.5 ? 255 : 180);
        textAlign(CENTER, CENTER);
        textSize(11);
        text(score, gx + (this.layout.cellW - 4) / 2, gy + (this.layout.cellH - 4) / 2);
      }
    }

    this.drawLegend(eased);

    if (hoveredCell) this.drawTooltip(hoveredCell);
  };

  // ── legend ─────────────────────────────────────────────────────────────────
  this.drawLegend = function (eased) {
    var legendX = this.layout.gridLeft;
    var legendY = this.layout.gridTop + this.genres.length * this.layout.cellH + 28;
    var legendW = 260;
    var legendH = 12;

    for (var i = 0; i < legendW; i++) {
      stroke(this.intensityToColour((i / legendW) * eased));
      line(legendX + i, legendY, legendX + i, legendY + legendH);
    }

    noStroke();
    fill(255);
    textSize(12);
    textAlign(LEFT, TOP);
    text('0', legendX, legendY + legendH + 5);
    textAlign(RIGHT, TOP);
    text('100  (popularity score)', legendX + legendW, legendY + legendH + 5);
  };

  // ── tooltip ────────────────────────────────────────────────────────────────
  this.drawTooltip = function (cell) {
    var genre = this.genres[cell.row];
    var country = this.countries[cell.col];
    var label = genre + ' in ' + country + ':  ' + cell.score + ' / 100';

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
