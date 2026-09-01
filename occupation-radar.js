/* Start own code */
/* Radar chart: Premier League 2023/24 club performance profiles.
   Supports comparing up to 3 clubs simultaneously — each rendered
   in its own colour with semi-transparent fill so overlapping
   shapes remain readable. */
function OccupationRadar() {
  this.name = 'PL Club Profiles';
  this.id   = 'occupation-radar';
  this.loaded = false;

  // Up to 3 HTML <select> dropdowns, one per team slot.
  this.selects = [];
  this.clubs   = [];

  // ── Per-team colours ────────────────────────────────────────────
  // Purple / Coral / Cyan — distinct and accessible against the dark
  // canvas background.
  this.teamColors = [
    { r: 156, g:  93, b: 240, hex: '#9c5df0' },  // Team 1 — purple
    { r: 255, g: 107, b: 107, hex: '#ff6b6b' },  // Team 2 — coral
    { r:  72, g: 219, b: 251, hex: '#48dbfb' }   // Team 3 — cyan
  ];

  this.axisKeys = [
    'goals_scored', 'goals_conceded', 'possession',
    'pass_accuracy', 'shots_per_game', 'xG', 'clean_sheets', 'points'
  ];
  this.axisLabels = [
    'Goals Scored', 'Goals Conceded', 'Possession %',
    'Pass Acc %', 'Shots/Game', 'xG', 'Clean Sheets', 'Points'
  ];

  // goals_conceded is "better when lower" — invert so fewer conceded
  // pushes the vertex further from the centre.
  this.invertAxis = [false, true, false, false, false, false, false, false];

  // Universal 0–100 domain: rings read as literal values 20/40/60/80/100.
  this.axisDomains = [
    { min: 0, max: 100 }, { min: 0, max: 100 },
    { min: 0, max: 100 }, { min: 0, max: 100 },
    { min: 0, max: 100 }, { min: 0, max: 100 },
    { min: 0, max: 100 }, { min: 0, max: 100 }
  ];

  this.animStart    = null;
  this.animDuration = 900;

  // Holds {points, club, colorIndex} for each active team so the
  // hover handler can search across all rendered shapes.
  this.lastPointsAll = [];

  this.resetAnimation = function () { this.animStart = null; };
  this.easeOutCubic   = function (t) { return 1 - pow(1 - t, 3); };

  // ── Data loading ─────────────────────────────────────────────────
  this.preload = function () {
    var self = this;
    this.data = loadTable(
      './data/premier-league/premier-league-2023-24.csv', 'csv', 'header',
      function () { self.loaded = true; }
    );
  };

  // ── Helpers ──────────────────────────────────────────────────────
  this.positionSelect = function (sel, canvasX, canvasY) {
    var canvasElt = document.querySelector('#app canvas');
    if (canvasElt) {
      var rect = canvasElt.getBoundingClientRect();
      sel.position(rect.left + window.scrollX + canvasX,
                   rect.top  + window.scrollY + canvasY);
    } else {
      sel.position(canvasX, canvasY);
    }
  };

  // Reposition all three dropdowns to stay pinned to the right edge of
  // the canvas. Called every draw frame so they track the canvas during
  // the sidebar slide-in/out transition.
  this.repositionSelects = function () {
    var selectYs = [20, 56, 92];
    for (var s = 0; s < this.selects.length; s++) {
      this.positionSelect(this.selects[s], width - 218, selectYs[s]);
    }
  };

  this.getFraction = function (club, axisIndex) {
    var key    = this.axisKeys[axisIndex];
    var domain = this.axisDomains[axisIndex];
    if (domain.max === domain.min) return 0.5;
    var t = constrain(map(club[key], domain.min, domain.max, 0, 1), 0, 1);
    return this.invertAxis[axisIndex] ? 1 - t : t;
  };

  this.axisAngle = function (index) {
    return -HALF_PI + index * (TWO_PI / this.axisKeys.length);
  };

  // Returns array of {club, colorIndex} for every non-None selection.
  this.getSelectedClubs = function () {
    var NONE   = '\u2014 None \u2014';
    var result = [];
    for (var s = 0; s < this.selects.length; s++) {
      var val = this.selects[s].value();
      if (!val || val === NONE) continue;
      for (var c = 0; c < this.clubs.length; c++) {
        if (this.clubs[c].name === val) {
          result.push({ club: this.clubs[c], colorIndex: s });
          break;
        }
      }
    }
    return result;
  };

  // ── Setup / Destroy ──────────────────────────────────────────────
  this.setup = function () {
    if (!this.loaded) return;

    textSize(13);

    // Parse CSV rows into club objects.
    this.clubs = [];
    for (var i = 0; i < this.data.getRowCount(); i++) {
      var club = { name: this.data.getString(i, 'club') };
      for (var k = 0; k < this.axisKeys.length; k++) {
        club[this.axisKeys[k]] = this.data.getNum(i, this.axisKeys[k]);
      }
      this.clubs.push(club);
    }

    // Remove any leftover dropdowns from a previous visit.
    for (var s = 0; s < this.selects.length; s++) this.selects[s].remove();
    this.selects = [];

    var self     = this;
    var selectYs = [20, 56, 92];   // vertical positions on canvas

    for (var s = 0; s < 3; s++) {
      var sel = createSelect();
      // Leave 20 px on left for the coloured dot drawn on canvas.
      this.positionSelect(sel, width - 218, selectYs[s]);
      sel.style('font-size',        '12px');
      sel.style('width',            '200px');
      sel.style('padding',          '3px 8px');
      sel.style('background-color', '#2c2f36');
      sel.style('color',            '#ffffff');
      sel.style('border',           '1px solid ' + this.teamColors[s].hex);
      sel.style('border-radius',    '4px');

      // Slots 2 & 3 have a "None" option so they're optional.
      if (s > 0) sel.option('\u2014 None \u2014');

      for (var c = 0; c < this.clubs.length; c++) {
        sel.option(this.clubs[c].name);
      }

      // Default: Team 1 = first club, Teams 2-3 = None.
      if (s === 0) sel.value(this.clubs[0].name);

      (function () {
        sel.changed(function () { self.resetAnimation(); });
      })();

      this.selects.push(sel);
    }

    this.center = { x: width / 2 - 20, y: height / 2 + 18 };
    this.radius = min(width, height) * 0.28;
  };

  this.destroy = function () {
    for (var s = 0; s < this.selects.length; s++) this.selects[s].remove();
    this.selects = [];
    this.resetAnimation();
  };

  // ── Main draw ────────────────────────────────────────────────────
  this.draw = function () {
    if (!this.loaded) {
      noStroke(); fill(255);
      textAlign(CENTER, CENTER); textSize(16);
      text('Loading Premier League Data…', width / 2, height / 2);
      return;
    }

    if (this.selects.length === 0) this.setup();

    // Keep dropdowns pinned to the canvas right edge on every frame so
    // they follow correctly when the sidebar slides in or out.
    this.repositionSelects();

    if (this.animStart === null) this.animStart = millis();
    var elapsed  = millis() - this.animStart;
    var progress = constrain(elapsed / this.animDuration, 0, 1);
    var eased    = this.easeOutCubic(progress);

    // Title + underline
    noStroke(); fill(255);
    textAlign(LEFT, TOP); textSize(24);
    text('PL Club Profiles 2023/24', 20, 16);
    stroke(255); strokeWeight(3);
    line(20, 48, 120, 48);

    // Coloured team-slot indicators next to each dropdown.
    this.drawDropdownIndicators();

    this.drawGrid();

    var selected = this.getSelectedClubs();
    if (selected.length === 0) return;

    // Render shapes back-to-front so Team 1 sits on top.
    this.lastPointsAll = [];
    for (var s = selected.length - 1; s >= 0; s--) {
      var entry  = selected[s];
      var points = this.drawShape(entry.club, eased, entry.colorIndex);
      // Store for hover; push in forward order so Team 1 is checked first.
      this.lastPointsAll.unshift({ points: points, club: entry.club, colorIndex: entry.colorIndex });
    }

    this.drawLegend(selected);
    this.drawHoverTooltip(eased);
  };

  // ── Small coloured squares drawn on canvas beside each dropdown ──
  this.drawDropdownIndicators = function () {
    var ys = [20, 56, 92];
    for (var s = 0; s < 3; s++) {
      var c = this.teamColors[s];
      noStroke(); fill(c.r, c.g, c.b);
      rect(width - 224, ys[s] + 4, 10, 10, 2);
    }
  };

  // ── Grid (rings + spokes + ring labels) ─────────────────────────
  this.drawGrid = function () {
    var levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    var n      = this.axisKeys.length;

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
      var a  = this.axisAngle(i);
      var x2 = this.center.x + this.radius * cos(a);
      var y2 = this.center.y + this.radius * sin(a);
      stroke(84, 88, 101);
      line(this.center.x, this.center.y, x2, y2);
      noStroke(); fill(210);
      textAlign(CENTER, CENTER); textSize(11);
      text(this.axisLabels[i],
           this.center.x + (this.radius + 26) * cos(a),
           this.center.y + (this.radius + 26) * sin(a));
    }

    // Ring value labels along the top spoke (goals_scored axis).
    var topAngle = this.axisAngle(0);
    for (var l = 0; l < levels.length; l++) {
      var domain    = this.axisDomains[0];
      var ringValue = lerp(domain.min, domain.max, levels[l]);
      var rx = this.center.x + this.radius * levels[l] * cos(topAngle);
      var ry = this.center.y + this.radius * levels[l] * sin(topAngle);
      noStroke(); fill(130);
      textAlign(CENTER, CENTER); textSize(9);
      text(nf(ringValue, 0, 0), rx - 10, ry);
    }
  };

  // ── Draw one team's radar shape ──────────────────────────────────
  this.drawShape = function (club, eased, colorIndex) {
    var c      = this.teamColors[colorIndex];
    var n      = this.axisKeys.length;
    var points = [];

    for (var i = 0; i < n; i++) {
      var a = this.axisAngle(i);
      var r = this.radius * this.getFraction(club, i) * eased;
      points.push({ x: this.center.x + r * cos(a), y: this.center.y + r * sin(a) });
    }

    // Semi-transparent filled polygon
    noStroke(); fill(c.r, c.g, c.b, 55);
    beginShape();
    for (var i = 0; i < points.length; i++) vertex(points[i].x, points[i].y);
    endShape(CLOSE);

    // Coloured outline
    stroke(c.r, c.g, c.b); strokeWeight(2); noFill();
    beginShape();
    for (var i = 0; i < points.length; i++) vertex(points[i].x, points[i].y);
    endShape(CLOSE);

    // Vertex dots
    noStroke(); fill(c.r, c.g, c.b);
    for (var i = 0; i < points.length; i++) ellipse(points[i].x, points[i].y, 7, 7);

    return points;
  };

  // ── Legend (bottom-left, one row per active team) ────────────────
  this.drawLegend = function (selected) {
    var padX = 20;
    var rowH = 26;
    var startY = height - 16 - selected.length * rowH;

    for (var s = 0; s < selected.length; s++) {
      var c    = this.teamColors[selected[s].colorIndex];
      var rowY = startY + s * rowH;

      // Coloured swatch
      noStroke(); fill(c.r, c.g, c.b, 200);
      rect(padX, rowY, 14, 14, 3);

      // Thin coloured border on swatch
      noFill(); stroke(c.r, c.g, c.b); strokeWeight(1);
      rect(padX, rowY, 14, 14, 3);

      // Club name
      noStroke(); fill(255);
      textAlign(LEFT, CENTER); textSize(13);
      text(selected[s].club.name, padX + 22, rowY + 7);
    }
  };

  // ── Hover tooltip (team-aware) ───────────────────────────────────
  this.drawHoverTooltip = function (eased) {
    if (this.lastPointsAll.length === 0 || eased < 1) return;

    var units      = ['', '', '%', '%', '', '', '', ' pts'];
    var HOVER_DIST = 12;

    // Find the closest vertex across all rendered teams.
    var bestDist  = Infinity;
    var bestEntry = null;
    var bestAxis  = -1;

    for (var t = 0; t < this.lastPointsAll.length; t++) {
      var entry = this.lastPointsAll[t];
      for (var i = 0; i < entry.points.length; i++) {
        var pt = entry.points[i];
        var d  = dist(mouseX, mouseY, pt.x, pt.y);
        if (d < HOVER_DIST && d < bestDist) {
          bestDist  = d;
          bestEntry = entry;
          bestAxis  = i;
        }
      }
    }

    if (!bestEntry) return;

    var pt = bestEntry.points[bestAxis];
    var c  = this.teamColors[bestEntry.colorIndex];

    // Highlight the hovered dot with a glowing ring.
    push();
    noFill();
    stroke(c.r, c.g, c.b); strokeWeight(2);
    ellipse(pt.x, pt.y, 16, 16);
    stroke(c.r, c.g, c.b, 80); strokeWeight(4);
    ellipse(pt.x, pt.y, 22, 22);
    pop();

    var value = bestEntry.club[this.axisKeys[bestAxis]];
    var label = bestEntry.club.name + '  \u2502  ' +
                this.axisLabels[bestAxis] + ':  ' +
                value.toFixed(1) + units[bestAxis];

    push();
    textSize(13);
    var bw = textWidth(label) + 24;
    var bh = 30;
    var tx = constrain(mouseX + 14, 10, width  - bw - 10);
    var ty = constrain(mouseY - bh - 12, 10, height - bh - 10);

    // Tooltip box with team-coloured border
    noStroke(); fill(30, 32, 40, 230);
    stroke(c.r, c.g, c.b); strokeWeight(1.5);
    rect(tx, ty, bw, bh, 5);

    // Small team-colour dot inside tooltip
    noStroke(); fill(c.r, c.g, c.b);
    ellipse(tx + 10, ty + bh / 2, 7, 7);

    noStroke(); fill(255);
    textAlign(LEFT, CENTER);
    text(label, tx + 18, ty + bh / 2);
    pop();
  };
}
/* End own code */