/* Start own code */
/* New visualisation: a spider/radar chart comparing an occupation
   category across five normalized metrics at once. This is a
   genuinely different chart family from anything else in the
   gallery — it shows a multivariate "shape" for one entity, rather
   than a single value per item like the existing scatter and bar
   charts built from the same occupation dataset. */
function OccupationRadar() {
  this.name = 'Occupation Profile Radar';
  this.id = 'occupation-radar';
  this.loaded = false;

  this.select = null;
  this.axisLabels = ['Median Male Pay', 'Median Female Pay', '% Female', 'Pay Gap', 'Total Jobs'];

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
      './data/pay-gap/occupation-hourly-pay-by-gender-2017.csv', 'csv', 'header',
      function(table) {
        self.loaded = true;
      });
  };

  this.setup = function() {
    textSize(13);

    // Aggregate the individual job_subtype rows up to the broader
    // job_type categories, since a dropdown of every subtype would be
    // unwieldy and each job_type is a more meaningful "profile" to
    // compare. NOTE: median pay and pay gap are simple averages
    // across subtypes here, not a statistically weighted
    // recomputation — a simplification appropriate for this chart.
    var groups = {};
    for (var i = 0; i < this.data.getRowCount(); i++) {
      var jobType = this.data.getString(i, 'job_type');
      var maleN = this.data.getNum(i, 'num_jobs_male');
      var femaleN = this.data.getNum(i, 'num_jobs_female');
      var medianMale = this.data.getNum(i, 'median_male');
      var medianFemale = this.data.getNum(i, 'median_female');
      var payGap = this.data.getNum(i, 'pay_gap');

      if (!groups[jobType]) {
        groups[jobType] = {
          name: jobType,
          medianMaleSum: 0,
          medianFemaleSum: 0,
          payGapSum: 0,
          rowCount: 0,
          totalJobsMale: 0,
          totalJobsFemale: 0
        };
      }

      var g = groups[jobType];
      g.medianMaleSum += medianMale;
      g.medianFemaleSum += medianFemale;
      g.payGapSum += payGap;
      g.rowCount += 1;
      g.totalJobsMale += maleN;
      g.totalJobsFemale += femaleN;
    }

    this.categories = [];
    for (var key in groups) {
      var g = groups[key];
      var totalJobs = g.totalJobsMale + g.totalJobsFemale;
      this.categories.push({
        name: g.name,
        medianMale: g.medianMaleSum / g.rowCount,
        medianFemale: g.medianFemaleSum / g.rowCount,
        proportionFemale: (g.totalJobsFemale / totalJobs) * 100,
        payGap: g.payGapSum / g.rowCount,
        totalJobs: totalJobs
      });
    }

    this.axisDomains = [
      this.getDomain('medianMale'),
      this.getDomain('medianFemale'),
      this.getDomain('proportionFemale'),
      this.getDomain('payGap'),
      this.getDomain('totalJobs')
    ];

    this.select = createSelect();
    this.positionSelect(this.select, width - 260, 20);
    for (var i = 0; i < this.categories.length; i++) {
      this.select.option(this.categories[i].name);
    }

    this.center = { x: width / 2 + 60, y: height / 2 + 20 };
    this.radius = min(width, height) * 0.3;
  };

  this.getDomain = function(field) {
    var minV = Infinity;
    var maxV = -Infinity;
    for (var i = 0; i < this.categories.length; i++) {
      minV = min(minV, this.categories[i][field]);
      maxV = max(maxV, this.categories[i][field]);
    }
    return { min: minV, max: maxV };
  };

  this.positionSelect = function(select, canvasX, canvasY) {
    var canvasElt = document.querySelector('#app canvas');
    if (canvasElt) {
      var rect = canvasElt.getBoundingClientRect();
      select.position(rect.left + window.scrollX + canvasX,
                       rect.top + window.scrollY + canvasY);
    } else {
      select.position(canvasX, canvasY);
    }
  };

  this.destroy = function() {
    if (this.select) {
      this.select.remove();
      this.select = null;
    }
    this.resetAnimation();
  };

  this.getFraction = function(category, axisIndex) {
    var fields = ['medianMale', 'medianFemale', 'proportionFemale', 'payGap', 'totalJobs'];
    var field = fields[axisIndex];
    var domain = this.axisDomains[axisIndex];
    if (domain.max === domain.min) return 0.5;
    return map(category[field], domain.min, domain.max, 0.08, 1);
  };

  this.axisAngle = function(index) {
    var n = this.axisLabels.length;
    return -HALF_PI + index * (TWO_PI / n);
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
    text('Occupation Profile Radar', 20, 16);

    stroke(255);
    strokeWeight(3);
    line(20, 48, 120, 48);

    this.drawGrid();

    var selectedName = this.select.value();
    var selectedCategory = null;
    for (var i = 0; i < this.categories.length; i++) {
      if (this.categories[i].name === selectedName) {
        selectedCategory = this.categories[i];
        break;
      }
    }
    if (!selectedCategory) return;

    this.drawShape(selectedCategory, eased);
    this.drawHoverTooltip(selectedCategory, eased);
  };

  this.drawGrid = function() {
    var levels = [0.2, 0.4, 0.6, 0.8, 1.0];
    var n = this.axisLabels.length;

    stroke(84, 88, 101);
    strokeWeight(1);
    noFill();
    for (var l = 0; l < levels.length; l++) {
      beginShape();
      for (var i = 0; i <= n; i++) {
        var angle = this.axisAngle(i % n);
        var r = this.radius * levels[l];
        vertex(this.center.x + r * cos(angle), this.center.y + r * sin(angle));
      }
      endShape();
    }

    for (var i = 0; i < n; i++) {
      var angle = this.axisAngle(i);
      var x2 = this.center.x + this.radius * cos(angle);
      var y2 = this.center.y + this.radius * sin(angle);
      stroke(84, 88, 101);
      line(this.center.x, this.center.y, x2, y2);

      noStroke();
      fill(220);
      textAlign(CENTER, CENTER);
      textSize(12);
      var labelX = this.center.x + (this.radius + 24) * cos(angle);
      var labelY = this.center.y + (this.radius + 24) * sin(angle);
      text(this.axisLabels[i], labelX, labelY);
    }
  };

  this.drawShape = function(category, eased) {
    var n = this.axisLabels.length;
    var points = [];

    for (var i = 0; i < n; i++) {
      var angle = this.axisAngle(i);
      var fraction = this.getFraction(category, i) * eased;
      var r = this.radius * fraction;
      points.push({
        x: this.center.x + r * cos(angle),
        y: this.center.y + r * sin(angle)
      });
    }

    noStroke();
    fill(156, 93, 240, 90);
    beginShape();
    for (var i = 0; i < points.length; i++) {
      vertex(points[i].x, points[i].y);
    }
    endShape(CLOSE);

    stroke(156, 93, 240);
    strokeWeight(2);
    noFill();
    beginShape();
    for (var i = 0; i < points.length; i++) {
      vertex(points[i].x, points[i].y);
    }
    endShape(CLOSE);

    noStroke();
    fill(255);
    for (var i = 0; i < points.length; i++) {
      ellipse(points[i].x, points[i].y, 6, 6);
    }

    this.lastPoints = points;
  };

  this.drawHoverTooltip = function(category, eased) {
    if (!this.lastPoints || eased < 1) return;

    var fields = ['medianMale', 'medianFemale', 'proportionFemale', 'payGap', 'totalJobs'];
    var units = ['/hr', '/hr', '%', '% gap', ' jobs'];

    for (var i = 0; i < this.lastPoints.length; i++) {
      var p = this.lastPoints[i];
      var d = dist(mouseX, mouseY, p.x, p.y);
      if (d < 10) {
        var value = category[fields[i]];
        var label = this.axisLabels[i] + ':  ' +
                    (fields[i] === 'medianMale' || fields[i] === 'medianFemale' ? '£' : '') +
                    value.toFixed(1) + units[i];

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
        return;
      }
    }
  };
}
/* End own code */
