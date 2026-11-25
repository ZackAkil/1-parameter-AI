/**
 * Renders the 1D ambient light decision boundary SVG chart.
 */

function svgEl(tag, attrs = {}) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, val] of Object.entries(attrs)) {
    el.setAttribute(key, String(val));
  }
  return el;
}

/**
 * Renders the 1D boundary chart for either manual or learned threshold models.
 * @param {SVGElement} svg
 * @param {{
 *   ambientLight: number,
 *   model: { threshold: number, direction: 'below_is_on' | 'above_is_on' } | null,
 *   trainingData?: Array<{ x: number, label: 0 | 1 }>,
 *   showDataRows?: boolean
 * }} options
 */
export function renderBoundaryChart(
  svg,
  { ambientLight, model, trainingData = [], showDataRows = false }
) {
  const width = 600;
  const padX = 30;
  const plotW = width - padX * 2;
  const axisY = 72;
  const xToPx = (x) => padX + (x / 100) * plotW;

  svg.replaceChildren();

  const monoFont = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

  // Shaded regions when a decision boundary is active
  if (model) {
    const bx = xToPx(model.threshold);
    const leftIsOn = model.direction === 'below_is_on';
    const leftW = Math.max(0, bx - padX);
    const rightW = Math.max(0, padX + plotW - bx);

    svg.appendChild(
      svgEl('rect', {
        x: padX,
        y: 18,
        width: leftW,
        height: 82,
        fill: leftIsOn ? '#fef3c7' : '#efefec',
        opacity: 0.7,
      })
    );

    svg.appendChild(
      svgEl('rect', {
        x: bx,
        y: 18,
        width: rightW,
        height: 82,
        fill: leftIsOn ? '#efefec' : '#fef3c7',
        opacity: 0.7,
      })
    );

    // Region labels when no training data rows are displayed
    if (!showDataRows) {
      if (leftW >= 44) {
        const leftLabel = svgEl('text', {
          x: padX + leftW / 2,
          y: 48,
          'text-anchor': 'middle',
          'font-family': monoFont,
          'font-size': 10,
          'font-weight': 600,
          'letter-spacing': '0.08em',
          fill: leftIsOn ? '#b45309' : '#52524e',
        });
        leftLabel.textContent = leftIsOn ? 'ON' : 'OFF';
        svg.appendChild(leftLabel);
      }

      if (rightW >= 44) {
        const rightLabel = svgEl('text', {
          x: bx + rightW / 2,
          y: 48,
          'text-anchor': 'middle',
          'font-family': monoFont,
          'font-size': 10,
          'font-weight': 600,
          'letter-spacing': '0.08em',
          fill: leftIsOn ? '#52524e' : '#b45309',
        });
        rightLabel.textContent = leftIsOn ? 'OFF' : 'ON';
        svg.appendChild(rightLabel);
      }
    }
  }

  // Axis line and ticks
  svg.appendChild(
    svgEl('line', {
      x1: padX,
      y1: axisY,
      x2: padX + plotW,
      y2: axisY,
      stroke: '#111111',
      'stroke-width': 1.25,
    })
  );

  for (const tick of [0, 25, 50, 75, 100]) {
    const tx = xToPx(tick);
    svg.appendChild(
      svgEl('line', {
        x1: tx,
        y1: axisY - 4,
        x2: tx,
        y2: axisY + 4,
        stroke: '#111111',
        'stroke-width': 1.25,
      })
    );
    const label = svgEl('text', {
      x: tx,
      y: axisY + 20,
      'text-anchor': 'middle',
      'font-family': monoFont,
      'font-size': 10,
      fill: '#666661',
    });
    label.textContent = `${tick}%`;
    svg.appendChild(label);
  }

  // Current ambient light marker
  const curX = xToPx(ambientLight);
  svg.appendChild(
    svgEl('line', {
      x1: curX,
      y1: 22,
      x2: curX,
      y2: axisY + 8,
      stroke: '#666661',
      'stroke-width': 1,
      'stroke-dasharray': '2 2',
    })
  );

  const sunMarker = svgEl('text', {
    x: curX,
    y: 15,
    'text-anchor': 'middle',
    'font-size': 13,
  });
  sunMarker.textContent = '☀️';
  svg.appendChild(sunMarker);

  // Training data points and row labels (ML mode)
  if (showDataRows) {
    for (const point of trainingData) {
      const cx = xToPx(point.x);
      const isOn = point.label === 1;
      svg.appendChild(
        svgEl('circle', {
          cx,
          cy: isOn ? axisY - 22 : axisY + 22,
          r: 5,
          fill: isOn ? '#f59e0b' : '#52524e',
          stroke: isOn ? '#92400e' : '#111111',
          'stroke-width': 1.25,
        })
      );
    }

    const onLabel = svgEl('text', {
      x: padX,
      y: axisY - 36,
      'font-family': monoFont,
      'font-size': 9.5,
      'font-weight': 600,
      'letter-spacing': '0.06em',
      fill: '#b45309',
    });
    onLabel.textContent = 'ON';
    svg.appendChild(onLabel);

    const offLabel = svgEl('text', {
      x: padX,
      y: axisY + 44,
      'font-family': monoFont,
      'font-size': 9.5,
      'font-weight': 600,
      'letter-spacing': '0.06em',
      fill: '#52524e',
    });
    offLabel.textContent = 'OFF';
    svg.appendChild(offLabel);
  }

  // Decision boundary line
  if (model) {
    const bx = xToPx(model.threshold);
    svg.appendChild(
      svgEl('line', {
        x1: bx,
        y1: 16,
        x2: bx,
        y2: 102,
        stroke: '#dc2626',
        'stroke-width': 2,
      })
    );

    const bLabel = svgEl('text', {
      x: bx,
      y: 12,
      'text-anchor': 'middle',
      'font-family': monoFont,
      'font-size': 10.5,
      'font-weight': 600,
      fill: '#dc2626',
    });
    bLabel.textContent = `θ=${model.threshold}%`;
    svg.appendChild(bLabel);
  }
}
