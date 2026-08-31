/* Start own code */
/* Radar chart: Premier League 2023/24 club performance profiles.
   A spider chart comparing each club across 8 metrics at once —
   a genuinely different chart family from anything else in the
   gallery, showing a multivariate "shape" per entity. */
function OccupationRadar() {
  this.name = 'PL Club Profiles';
  this.id = 'occupation-radar';
  this.loaded = false;

  this.select = null;

  // The eight axes plotted around the radar, matching the CSV columns.
  this.axisKeys = ['goals_scored', 'goals_conceded', 'possession',
    'pass_accuracy', 'shots_per_game', 'xG', 'clean_sheets', 'points'];
  this.axisLabels = ['Goals Scored', 'Goals Conceded', 'Possession %',
    'Pass Acc %', 'Shots/Game', 'xG', 'Clean Sheets', 'Points'];

  // goals_conceded is "better when lower" — we invert its fraction
  // so a club that concedes fewer goals scores higher on that axis.
  this.invertAxis = [false, true, false, false, false, false, false, false];

  this.animStart = null;
  this.animDuration = 900;

  this.resetAnimation = function () { this.animStart = null; };
  this.easeOutCubic = function (t) { return 1 - pow(1 - t, 3); };

  this.preload = function () {
    var self = this;
    this.data = loadTable(
      './data/premier-league/premier-league-2023-24.csv', 'csv', 'header',
      function () { self.loaded = true; });
  };

  this.setup = function () {
    textSize(13);

    // Parse every row into a club object.
    this.clubs = [];
    for (var i = 0; i < this.data.getRowCount(); i++) {
      var club = { name: this.data.getString(i, 'club') };
      for (var k = 0; k < this.axisKeys.length; k++) {
        club[this.axisKeys[k]] = this.data.getNum(i, this.axisKeys[k]);
      }
      this.clubs.push(club);
    }

    // Pre-compute min/max per axis for normalisation.
    this.axisDomains = [];
    for (var k = 0; k < this.axisKeys.length; k++) {
      this.axisDomains.push(this.getDomain(this.axisKeys[k]));
    }

    this.select = createSelect();
    this.positionSelect(this.select, width - 240, 20);
    for (var i = 0; i < this.clubs.length; i++) {
      this.select.option(this.clubs[i].name);
    }

    // Shift centre left so axis labels have room on the right side.
    this.center = { x: width / 2 - 20, y: height / 2 + 18 };
    this.radius = min(width, height) * 0.28;
  };

  this.getDomain = function (field) {
    var minV = Infinity;
    var maxV = -Infinity;
    for (var i = 0; i < this.clubs.length; i++) {
      minV = min(minV, this.clubs[i][field]);
      maxV = max(maxV, this.clubs[i][field]);
    }
    return { min: minV, max: maxV };
  };

  // Same canvas-relative positioning used by other charts in the repo.
  this.positionSelect = function (sel, canvasX, canvasY) {
    var canvasElt = document.querySelector('#app canvas');
    if (canvasElt) {
      var rect = canvasElt.getBoundingClientRect();
      sel.position(rect.left + window.scrollX + canvasX,
        rect.top + window.scrollY + canvasY);
    } else {
      sel.position(canvasX, canvasY);
    }
  };

  this.destroy = function () {
    if (this.select) { this.select.remove(); this.select = null; }
    this.resetAnimation();
  };

  this.getFraction = function (club, axisIndex) {
    var key = this.axisKeys[axisIndex];
    var domain = this.axisDomains[axisIndex];
    if (domain.max === domain.min) return 0.5;
    var t = map(club[key], domain.min, domain.max, 0.08, 1);
    return this.invertAxis[axisIndex] ? 1.08 - t : t;
  };

  this.axisAngle = function (index) {
    return -HALF_PI + index * (TWO_PI / this.axisKeys.length);
  };

  this.draw = function () {
    if (!this.loaded) { console.log('Data not yet loaded'); return; }

    if (this.animStart === null) this.animStart = millis();
    var elapsed = millis() - this.animStart;
    var progress = constrain(elapsed / this.animDuration, 0, 1);
    var eased = this.easeOutCubic(progress);

    // Title + underline
    noStroke(); fill(255);
    textAlign(LEFT, TOP); textSize(24);
    text('PL Club Profiles 2023/24', 20, 16);
    stroke(255); strokeWeight(3);
    line(20, 48, 120, 48);

    this.drawGrid();

    // Find selected club
    var selectedName = this.select.value();
    var selectedClub = null;
    for (var i = 0; i < this.clubs.length; i++) {
      if (this.clubs[i].name === selectedName) {
        selectedClub = this.clubs[i];
        break;
      }
    }
    if (!selectedClub) return;

    this.drawShape(selectedClub, eased);
    this.drawHoverTooltip(selectedClub, eased);
  };

  this.drawGrid = function () {
    var levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    var n = this.axisKeys.length;

    // Concentric reference rings
    stroke(84, 88, 101); strokeWeight(1); noFill();
    for (var l = 0; l < levels.length; l++) {
      beginShape();
      for (var i = 0; i <= n; i++) {
        var a = this.axisAngle(i % n);
        var r = this.radius * levels[l];
        vertex(this.center.x + r * cos(a), this.center.y + r * sin(a));
      }
      endShape();
    }

    // Spokes + axis labels
    for (var i = 0; i < n; i++) {
      var a = this.axisAngle(i);
      var x2 = this.center.x + this.radius * cos(a);
      var y2 = this.center.y + this.radius * sin(a);
      stroke(84, 88, 101);
      line(this.center.x, this.center.y, x2, y2);

      noStroke(); fill(210);
      textAlign(CENTER, CENTER); textSize(11);
      var lx = this.center.x + (this.radius + 26) * cos(a);
      var ly = this.center.y + (this.radius + 26) * sin(a);
      text(this.axisLabels[i], lx, ly);
    }
  };

  this.drawShape = function (club, eased) {
    var n = this.axisKeys.length;
    var points = [];

    for (var i = 0; i < n; i++) {
      var a = this.axisAngle(i);
      var r = this.radius * this.getFraction(club, i) * eased;
      points.push({
        x: this.center.x + r * cos(a),
        y: this.center.y + r * sin(a)
      });
    }

    // Filled polygon
    noStroke(); fill(156, 93, 240, 90);
    beginShape();
    for (var i = 0; i < points.length; i++) vertex(points[i].x, points[i].y);
    endShape(CLOSE);

    // Outline
    stroke(156, 93, 240); strokeWeight(2); noFill();
    beginShape();
    for (var i = 0; i < points.length; i++) vertex(points[i].x, points[i].y);
    endShape(CLOSE);

    // Vertex dots
    noStroke(); fill(255);
    for (var i = 0; i < points.length; i++) ellipse(points[i].x, points[i].y, 6, 6);

    this.lastPoints = points;
  };

  this.drawHoverTooltip = function (club, eased) {
    if (!this.lastPoints || eased < 1) return;

    var units = ['', '', '%', '%', '', '', '', ' pts'];

    for (var i = 0; i < this.lastPoints.length; i++) {
      if (dist(mouseX, mouseY, this.lastPoints[i].x, this.lastPoints[i].y) < 10) {
        var value = club[this.axisKeys[i]];
        var label = this.axisLabels[i] + ':  ' + value.toFixed(1) + units[i];

        push();
        textSize(13);
        var bw = textWidth(label) + 20;
        var bh = 28;
        var tx = constrain(mouseX + 14, 10, width - bw - 10);
        var ty = constrain(mouseY - bh - 12, 10, height - bh - 10);

        noStroke(); fill('#2c2f36');
        stroke('#4a4d59'); strokeWeight(1);
        rect(tx, ty, bw, bh, 4);

        noStroke(); fill(255);
        textAlign(LEFT, CENTER);
        text(label, tx + 10, ty + bh / 2);
        pop();
        return;
      }
    }
  };
}
/* End own code */