import {
  formatRuleCode,
  formatRuleSummary,
  learnDecisionBoundary,
  predict,
} from './model.js';
import { createLampScene } from './lamp3d.js';
import { renderBoundaryChart } from './chart.js';

const DEFAULT_PROGRAMMER_THRESHOLD = 40;
const DEFAULT_PROGRAMMER_DIRECTION = 'below_is_on';
const DEFAULT_ML_STATUS = 'Toggle the light to capture training examples.';

const MODE_COPY = {
  programmer: {
    subtitle:
      'Set the ambient light threshold manually to program when the lamp turns on.',
    boundaryTitle: 'Program',
    predLabel: 'Rule Output',
  },
  ml: {
    subtitle:
      'Toggle the light at different ambient light levels to capture training data, then learn a single-threshold decision boundary.',
    boundaryTitle: 'Learn',
    predLabel: 'Model Prediction',
  },
};

const state = {
  mode: 'programmer',
  ambientLight: 50,
  lightOn: false,
  programmer: {
    threshold: DEFAULT_PROGRAMMER_THRESHOLD,
    direction: DEFAULT_PROGRAMMER_DIRECTION,
    smartMode: false,
  },
  ml: {
    recordData: false,
    trainingData: [],
    learnedModel: null,
    smartMode: false,
    statusText: DEFAULT_ML_STATUS,
    statusLearned: null,
  },
};

const modeSubtitle = document.getElementById('mode-subtitle');
const tabButtons = [...document.querySelectorAll('.tab-btn')];
const ambientSlider = document.getElementById('ambient-slider');
const ambientValue = document.getElementById('ambient-value');
const lightIndicator = document.getElementById('light-indicator');
const lamp3d = createLampScene(lightIndicator);
const toggleLightBtn = document.getElementById('toggle-light-btn');
const lightStateText = document.getElementById('light-state-text');
const predictionBar = document.getElementById('prediction-bar');
const predLabel = document.getElementById('pred-label');
const predX = document.getElementById('pred-x');
const predBadge = document.getElementById('pred-badge');
const smartLampBtn = document.getElementById('smart-lamp-btn');

const programmerCodePanel = document.getElementById('programmer-code-panel');
const codeThresholdMeta = document.getElementById('code-threshold-meta');
const ruleCode = document.getElementById('rule-code');

const mlDataPanel = document.getElementById('ml-data-panel');
const recordToggle = document.getElementById('record-toggle');
const clearDataBtn = document.getElementById('clear-data-btn');
const dataCount = document.getElementById('data-count');
const dataEmpty = document.getElementById('data-empty');
const dataTable = document.getElementById('data-table');
const dataTbody = document.getElementById('data-tbody');

const boundaryPanelTitle = document.getElementById('boundary-panel-title');
const programmerControls = document.getElementById('programmer-controls');
const thresholdSlider = document.getElementById('threshold-slider');
const thresholdValue = document.getElementById('threshold-value');
const directionToggleBtn = document.getElementById('direction-toggle-btn');
const programmerResetBtn = document.getElementById('programmer-reset-btn');

const mlControls = document.getElementById('ml-controls');
const learnBtn = document.getElementById('learn-btn');
const resetBtn = document.getElementById('reset-btn');

const boundaryChart = document.getElementById('boundary-chart');
const modelStatus = document.getElementById('model-status');

function getProgrammerModel() {
  return {
    threshold: state.programmer.threshold,
    direction: state.programmer.direction,
  };
}

function getActiveModel() {
  return state.mode === 'programmer' ? getProgrammerModel() : state.ml.learnedModel;
}

function isSmartModeActive() {
  if (state.mode === 'programmer') {
    return state.programmer.smartMode;
  }
  return state.ml.smartMode && Boolean(state.ml.learnedModel);
}

function setActiveSmartMode(enabled) {
  if (state.mode === 'programmer') {
    state.programmer.smartMode = enabled;
  } else {
    state.ml.smartMode = enabled;
  }
}

function applySmartLamp() {
  const model = getActiveModel();
  if (isSmartModeActive() && model) {
    state.lightOn = predict(model, state.ambientLight) === 1;
  }
}

function renderModeChrome() {
  const isProgrammer = state.mode === 'programmer';
  const copy = MODE_COPY[state.mode];

  modeSubtitle.textContent = copy.subtitle;
  boundaryPanelTitle.textContent = copy.boundaryTitle;
  predLabel.textContent = copy.predLabel;

  for (const btn of tabButtons) {
    const active = btn.dataset.mode === state.mode;
    btn.classList.toggle('is-active', active);
    btn.setAttribute('aria-selected', String(active));
  }

  programmerCodePanel.classList.toggle('hidden', !isProgrammer);
  mlDataPanel.classList.toggle('hidden', isProgrammer);
  programmerControls.classList.toggle('hidden', !isProgrammer);
  mlControls.classList.toggle('hidden', isProgrammer);
}

function renderProgrammerPanel() {
  const model = getProgrammerModel();
  const op = model.direction === 'below_is_on' ? '<' : '>=';

  thresholdSlider.value = String(model.threshold);
  thresholdValue.textContent = `${model.threshold}%`;
  directionToggleBtn.textContent = `Rule: ON when Ambient Light ${op} θ`;
  codeThresholdMeta.textContent = `θ = ${model.threshold}%`;
  ruleCode.textContent = formatRuleCode(model);
}

function renderStatus() {
  if (state.mode === 'programmer') {
    const strong = document.createElement('strong');
    strong.textContent = formatRuleSummary(getProgrammerModel());
    modelStatus.replaceChildren('Manual 1-parameter rule: ', strong);
    return;
  }

  if (state.ml.statusLearned) {
    const { rule, correct, total, pct } = state.ml.statusLearned;
    const strong = document.createElement('strong');
    strong.textContent = rule;
    modelStatus.replaceChildren(
      'Learned 1-parameter rule: ',
      strong,
      ` (${correct}/${total} correct, ${pct}% accuracy)`
    );
    return;
  }

  modelStatus.textContent = state.ml.statusText;
}

function renderChart() {
  const isMl = state.mode === 'ml';
  renderBoundaryChart(boundaryChart, {
    ambientLight: state.ambientLight,
    model: getActiveModel(),
    trainingData: isMl ? state.ml.trainingData : [],
    showDataRows: isMl,
  });
}

function renderDataTable() {
  const count = state.ml.trainingData.length;
  dataCount.textContent = `${count} ${count === 1 ? 'example' : 'examples'}`;

  if (count === 0) {
    dataEmpty.classList.remove('hidden');
    dataTable.classList.add('hidden');
    dataTbody.replaceChildren();
    return;
  }

  dataEmpty.classList.add('hidden');
  dataTable.classList.remove('hidden');

  const rows = [...state.ml.trainingData]
    .reverse()
    .map((item, idx) => {
      const tr = document.createElement('tr');
      const num = count - idx;

      const tdNum = document.createElement('td');
      tdNum.className = 'mono muted';
      tdNum.textContent = String(num);

      const tdX = document.createElement('td');
      tdX.className = 'mono';
      tdX.textContent = `${item.x}%`;

      const tdY = document.createElement('td');
      const badge = document.createElement('span');
      badge.className = `badge ${item.label === 1 ? 'is-on' : 'is-off'}`;
      badge.textContent = item.label === 1 ? 'ON' : 'OFF';
      tdY.appendChild(badge);

      tr.append(tdNum, tdX, tdY);
      return tr;
    });

  dataTbody.replaceChildren(...rows);
}

function renderPrediction() {
  const model = getActiveModel();
  if (!model) {
    predictionBar.classList.add('hidden');
    return;
  }

  predictionBar.classList.remove('hidden');
  predX.textContent = `${state.ambientLight}%`;
  const predicted = predict(model, state.ambientLight);
  predBadge.textContent = predicted === 1 ? 'ON' : 'OFF';
  predBadge.className = `badge ${predicted === 1 ? 'is-on' : 'is-off'}`;
}

function renderControls() {
  const smartActive = isSmartModeActive();
  ambientValue.textContent = `${state.ambientLight}%`;
  lamp3d.update(state.ambientLight, state.lightOn);
  toggleLightBtn.classList.toggle('is-on', state.lightOn);
  toggleLightBtn.setAttribute('aria-checked', String(state.lightOn));
  lightStateText.textContent = state.lightOn ? 'ON' : 'OFF';
  smartLampBtn.classList.toggle('is-active', smartActive);
  smartLampBtn.textContent = `Smart Lamp: ${smartActive ? 'ON' : 'OFF'}`;
}

function renderAll() {
  renderModeChrome();
  renderProgrammerPanel();
  renderControls();
  renderPrediction();
  renderChart();
  renderDataTable();
  renderStatus();
}

function setMode(nextMode) {
  if (state.mode === nextMode) return;
  state.mode = nextMode;
  applySmartLamp();
  renderAll();
}

for (const btn of tabButtons) {
  btn.addEventListener('click', () => {
    setMode(btn.dataset.mode);
  });

  btn.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const nextMode = state.mode === 'programmer' ? 'ml' : 'programmer';
    setMode(nextMode);
    const nextTab = tabButtons.find((tab) => tab.dataset.mode === nextMode);
    nextTab?.focus();
  });
}

ambientSlider.addEventListener('input', (e) => {
  state.ambientLight = Number(e.target.value);
  applySmartLamp();
  renderControls();
  renderPrediction();
  renderChart();
});

toggleLightBtn.addEventListener('click', () => {
  setActiveSmartMode(false);
  state.lightOn = !state.lightOn;
  if (state.mode === 'ml' && state.ml.recordData) {
    state.ml.trainingData.push({
      x: state.ambientLight,
      label: state.lightOn ? 1 : 0,
    });
  }
  renderAll();
});

smartLampBtn.addEventListener('click', () => {
  if (!getActiveModel()) return;
  setActiveSmartMode(!isSmartModeActive());
  applySmartLamp();
  renderControls();
});

thresholdSlider.addEventListener('input', (e) => {
  state.programmer.threshold = Number(e.target.value);
  applySmartLamp();
  renderProgrammerPanel();
  renderControls();
  renderPrediction();
  renderChart();
  renderStatus();
});

directionToggleBtn.addEventListener('click', () => {
  state.programmer.direction =
    state.programmer.direction === 'below_is_on' ? 'above_is_on' : 'below_is_on';
  applySmartLamp();
  renderProgrammerPanel();
  renderControls();
  renderPrediction();
  renderChart();
  renderStatus();
});

programmerResetBtn.addEventListener('click', () => {
  state.programmer.threshold = DEFAULT_PROGRAMMER_THRESHOLD;
  state.programmer.direction = DEFAULT_PROGRAMMER_DIRECTION;
  state.programmer.smartMode = false;
  state.lightOn = false;
  renderAll();
});

recordToggle.addEventListener('change', (e) => {
  state.ml.recordData = e.target.checked;
});

learnBtn.addEventListener('click', () => {
  const result = learnDecisionBoundary(state.ml.trainingData);

  if (result.status !== 'learned') {
    state.ml.learnedModel = null;
    state.ml.smartMode = false;
    state.ml.statusLearned = null;
    state.ml.statusText = result.message;
    renderAll();
    return;
  }

  state.ml.learnedModel = {
    threshold: result.threshold,
    direction: result.direction,
  };
  applySmartLamp();

  state.ml.statusLearned = {
    rule: formatRuleSummary(state.ml.learnedModel),
    correct: result.correct,
    total: result.total,
    pct: Math.round(result.accuracy * 100),
  };
  renderAll();
});

clearDataBtn.addEventListener('click', () => {
  state.ml.trainingData = [];
  renderAll();
});

resetBtn.addEventListener('click', () => {
  state.ml.trainingData = [];
  state.ml.learnedModel = null;
  state.ml.smartMode = false;
  state.ml.statusLearned = null;
  state.ml.statusText = DEFAULT_ML_STATUS;
  state.lightOn = false;
  renderAll();
});

applySmartLamp();
renderAll();
