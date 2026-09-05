// Global variable to store the gallery object. The gallery object is
// a container for all the visualisations.
var gallery;

function setup() {
  // Create a canvas to fill the content div from index.html.
  canvasContainer = select('#app');
  var c = createCanvas(1024, 576);
  c.parent('app');

  // Create a new gallery object.
  gallery = new Gallery();

  // Add the visualisation objects here.
  gallery.addVisual(new TechDiversityRace());
  gallery.addVisual(new TechDiversityGender());
  gallery.addVisual(new PayGapByJob2017());
  gallery.addVisual(new PayGapTimeSeries());
  gallery.addVisual(new ClimateChange());

  /* Start own code */
  gallery.addVisual(new WaffleVis());
  gallery.addVisual(new BubbleVis());
  gallery.addVisual(new WorkoutHeatmap());
  gallery.addVisual(new OccupationRadar());

  // Select the first visualization by default
  gallery.selectVisual(gallery.visuals[0].id);
  /* End own code */
}

function draw() {
  /* Start own code */
  background('#343640');
  /* End own code */

  if (gallery.selectedVisual != null) {
    gallery.selectedVisual.draw();
  }
}