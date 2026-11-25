/**
 * Pure logic for a 1-parameter threshold classifier.
 * Learns a single scalar boundary (threshold) from 1D labeled examples.
 */

/**
 * Predicts light state (1 = ON, 0 = OFF) for a given ambient light value.
 * @param {{ threshold: number, direction: 'below_is_on' | 'above_is_on' }} model
 * @param {number} x
 * @returns {0 | 1}
 */
export function predict(model, x) {
  if (model.direction === 'below_is_on') {
    return x < model.threshold ? 1 : 0;
  }
  return x >= model.threshold ? 1 : 0;
}

/**
 * Learns the optimal 1-parameter decision boundary from captured training data.
 * Minimizes classification error; breaks ties by maximizing margin to the nearest point.
 * @param {Array<{ x: number, label: 0 | 1 }>} data
 * @returns {{
 *   status: 'learned' | 'need_both_classes',
 *   threshold?: number,
 *   direction?: 'below_is_on' | 'above_is_on',
 *   accuracy?: number,
 *   correct?: number,
 *   total?: number,
 *   message?: string
 * }}
 */
export function learnDecisionBoundary(data) {
  const hasOn = data.some((d) => d.label === 1);
  const hasOff = data.some((d) => d.label === 0);

  if (!hasOn || !hasOff) {
    return {
      status: 'need_both_classes',
      message: 'Capture at least one ON and one OFF example to learn a boundary.',
    };
  }

  const uniqueXs = [...new Set(data.map((d) => d.x))].sort((a, b) => a - b);
  const candidates = [];

  for (let i = 0; i < uniqueXs.length - 1; i++) {
    candidates.push((uniqueXs[i] + uniqueXs[i + 1]) / 2);
  }
  candidates.push(Math.max(0, uniqueXs[0] - 5));
  candidates.push(Math.min(100, uniqueXs[uniqueXs.length - 1] + 5));

  let best = null;

  for (const threshold of candidates) {
    const margin = Math.min(...data.map((d) => Math.abs(d.x - threshold)));

    for (const direction of ['below_is_on', 'above_is_on']) {
      let errors = 0;
      for (const point of data) {
        if (predict({ threshold, direction }, point.x) !== point.label) {
          errors++;
        }
      }

      if (
        !best ||
        errors < best.errors ||
        (errors === best.errors && margin > best.margin)
      ) {
        best = { threshold, direction, errors, margin };
      }
    }
  }

  const total = data.length;
  const correct = total - best.errors;

  return {
    status: 'learned',
    threshold: Number(best.threshold.toFixed(1)),
    direction: best.direction,
    accuracy: correct / total,
    correct,
    total,
  };
}

/**
 * Formats a human-readable summary of a 1-parameter threshold rule.
 * @param {{ threshold: number, direction: 'below_is_on' | 'above_is_on' }} model
 * @returns {string}
 */
export function formatRuleSummary(model) {
  const op = model.direction === 'below_is_on' ? '<' : '>=';
  return `ON when Ambient Light ${op} ${model.threshold}%`;
}

/**
 * Formats a 1-parameter threshold rule as classic conditional code.
 * @param {{ threshold: number, direction: 'below_is_on' | 'above_is_on' }} model
 * @returns {string}
 */
export function formatRuleCode(model) {
  const op = model.direction === 'below_is_on' ? '<' : '>=';
  return [
    'function decideLight(ambientLight) {',
    `  const threshold = ${model.threshold};`,
    `  return ambientLight ${op} threshold ? 'ON' : 'OFF';`,
    '}',
  ].join('\n');
}

