import * as p5 from "p5";
import "p5/lib/addons/p5.sound";
import "p5/lib/addons/p5.dom";

document.body.style.overflow = "hidden";

interface Dot {
  x: number;
  y: number;
  size: number;
  sizeMax: number;
  sizeMin: number;
}

interface DotGrid {
  x: number;
  y: number;
  rows: number;
  cols: number;
  dots: Dot[];
}

const INITIAL_SIZE = 10;
const INITIAL_GAP = 10;

var sketch = function (p: p5) {
  let dots: DotGrid;
  let sizeSlider = p.createSlider(0, 1, 0.5, 0.01);
  let sizeSliderValue;

  let scaleSlider = p.createSlider(1, 5, 2, 0.01);
  let scaleSliderValue;

  let dotCountSlider = p.createSlider(1, 200, 4, 1);
  let dotCountValue;

  let dotGapSlider = p.createSlider(1, 30, 10, 1);
  let dotGapValue;

  p.createFileInput(handleFileLoad);
  let currentImage: p5.Image;
  function handleFileLoad(file) {
    // handle file load here
    if (file.type === "image") {
      p.loadImage(file.data, (image) => {
        currentImage = image;
        applyEffectConfiguration(true);
      });
    } else {
      currentImage = null;
    }
  }

  p.preload = () => {
    // const image = p.loadImage("test.jpg");
  };

  p.setup = function () {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.smooth();

    dots = createDotGrid(10, 10, 10, 20);
  };

  p.windowResized = function () {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    // generate grid again when window resize to center it
    applyEffectConfiguration(true);
  };

  function createDotGridFromImage(
    cols: number,
    rows: number,
    dotSize: number,
    gap: number,
    maxScale: number,
    image: p5.Image
  ) {
    const tileSizeCol = image.width / cols;
    const tileSizeRow = image.width / rows;

    const processor = (currentCol, currentRow, dot, dotGrid) => {
      const pixelValue = image.get(
        tileSizeCol * currentCol,
        tileSizeRow * currentRow
      );
      const pixelBrightness = p.brightness(pixelValue);
      const pixelFactor = 1 - pixelBrightness / 255;

      return {
        x: dot.x,
        y: dot.y,
        size: dot.size,
        sizeMax: dot.sizeMax * pixelFactor,
        sizeMin: dot.sizeMin * pixelFactor,
      };
    };
    return createDotGrid(cols, rows, dotSize, gap, maxScale, processor);
  }

  function createDotGrid(
    cols: number,
    rows: number,
    dotSize = 5,
    gap = 5,
    maxScale = 4,
    configurator?: (
      currentCol: number,
      currentRow: number,
      dot: Dot,
      dotGrid: DotGrid
    ) => Dot
  ): DotGrid {
    const minSize = dotSize;
    const maxSize = dotSize * maxScale;

    const gridOffsetX = (cols * (minSize + gap)) / 2;
    const gridOffsetY = (rows * (minSize + gap)) / 2;

    let dotGrid: DotGrid = {
      cols,
      rows,
      dots: [],
      x: p.width / 2 - gridOffsetX,
      y: p.height / 2 - gridOffsetY,
    };

    // use configurator function if the user provide one
    if (configurator !== undefined) {
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const dot = {
            x: dotGrid.x + i * (dotSize + gap),
            y: dotGrid.y + j * (dotSize + gap),
            sizeMax: maxSize,
            sizeMin: minSize,
            size: dotSize,
          };
          dotGrid.dots.push(configurator(i, j, dot, dotGrid));
        }
      }
      return dotGrid;
    }

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        dotGrid.dots.push({
          x: dotGrid.x + i * (dotSize + gap),
          y: dotGrid.y + j * (dotSize + gap),
          sizeMax: maxSize,
          sizeMin: minSize,
          size: dotSize,
        });
      }
    }

    return dotGrid;
  }

  function drawDotGrid(dotGrid: DotGrid) {
    // setup colours
    p.fill(230, 27, 46); // ted red
    p.strokeWeight(0);
    p.ellipseMode(p.CENTER);
    dotGrid.dots.forEach((dot) => {
      p.ellipse(dot.x, dot.y, dot.size, dot.size);
    });
  }

  function updateDotGrid(dotGrid: DotGrid) {
    const maxDist = 200;
    dotGrid.dots.forEach((dot) => {
      // scale base on mouse pos
      const mouseDist = p.dist(dot.x, dot.y, p.mouseX, p.mouseY);
      const mappedSize = p.map(
        mouseDist / maxDist,
        1,
        0,
        dot.sizeMin,
        dot.sizeMax
      );
      dot.size = p.constrain(mappedSize, dot.sizeMin, dot.sizeMax);
    });
  }

  function applyEffectConfiguration(forceUpdate?: boolean) {
    if (
      sizeSliderValue !== sizeSlider.value() ||
      scaleSliderValue !== scaleSlider.value() ||
      dotCountValue !== dotCountSlider.value() ||
      dotGapValue !== dotGapSlider.value() ||
      forceUpdate
    ) {
      sizeSliderValue = sizeSlider.value();
      scaleSliderValue = scaleSlider.value();
      dotCountValue = dotCountSlider.value();
      dotGapValue = dotGapSlider.value();

      // create the new dot grid here
      if (currentImage) {
        dots = createDotGridFromImage(
          dotCountValue,
          dotCountValue,
          INITIAL_SIZE * Number(sizeSliderValue),
          dotGapValue,
          Number(scaleSliderValue),
          currentImage
        );
      } else {
        dots = createDotGrid(
          dotCountValue,
          dotCountValue,
          INITIAL_SIZE * Number(sizeSliderValue),
          dotGapValue,
          Number(scaleSliderValue)
        );
      }
    }
  }

  p.draw = function () {
    applyEffectConfiguration();
    // p.ellipse(p.mouseX, p.mouseY, 80, 80);
    p.clear();
    updateDotGrid(dots);
    drawDotGrid(dots);
  };
};

new p5(sketch);
