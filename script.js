/**
 * Windows 11 Calculator, Bank Exchange Rate & 5-Category Unit Converter
 * 2026년 9월 15일 고시 기준
 * 은행: 하나은행 (https://www.kebhana.com/cybrexh/index.do) / 신한은행 (https://m.shinhan.com/rib/mnew/index.jsp#250ER0130003)
 * 단위 변환: 길이, 넓이, 무게, 부피, 온도 (네이버 단위변환 스타일 전체 비교)
 */

document.addEventListener('DOMContentLoaded', () => {
  // =========================================================================
  // 1. 애플리케이션 상태 관리
  // =========================================================================
  const state = {
    mode: 'standard', // 'standard' | 'scientific' | 'currency' | 'unit'

    // Calculator Expression State
    expression: '',
    currentDisplay: '0',
    isEvaluated: false,
    memory: 0,
    angleMode: 'DEG',
    historyList: [],

    // Currency Converter State (2026.09.15 기준)
    currencyInput: 10000,
    activeCurrencySource: 'from',
    fromCurrency: 'KRW',
    toCurrency: 'USD',
    selectedBank: 'hana',
    selectedRateType: 'base',
    discountRate: 90,

    // 2026년 9월 15일 은행별 상세 고시 환율 및 정확한 직결 링크
    bankRates: {
      hana: {
        name: '하나은행',
        linkName: "하나은행 '환전지갑' 외화구매 바로가기",
        linkUrl: 'https://www.kebhana.com/cybrexh/index.do',
        rates: {
          USD: { base: 1385.00, cashBuy: 1409.23, cashSell: 1360.77, remitSend: 1398.50, remitRecv: 1371.50 },
          EUR: { base: 1515.20, cashBuy: 1545.50, cashSell: 1484.90, remitSend: 1530.35, remitRecv: 1500.05 },
          JPY: { base: 9.7190,  cashBuy: 9.8890,  cashSell: 9.5490,  remitSend: 9.8142,  remitRecv: 9.6238 },
          KRW: { base: 1.0,     cashBuy: 1.0,     cashSell: 1.0,     remitSend: 1.0,     remitRecv: 1.0 }
        }
      },
      shinhan: {
        name: '신한은행',
        linkName: "신한은행 'SOL 환전' 외화구매 바로가기",
        linkUrl: 'https://m.shinhan.com/rib/mnew/index.jsp#250ER0130003',
        rates: {
          USD: { base: 1386.50, cashBuy: 1410.75, cashSell: 1362.25, remitSend: 1400.00, remitRecv: 1373.00 },
          EUR: { base: 1516.80, cashBuy: 1547.13, cashSell: 1486.47, remitSend: 1531.96, remitRecv: 1501.64 },
          JPY: { base: 9.7280,  cashBuy: 9.8982,  cashSell: 9.5578,  remitSend: 9.8232,  remitRecv: 9.6328 },
          KRW: { base: 1.0,     cashBuy: 1.0,     cashSell: 1.0,     remitSend: 1.0,     remitRecv: 1.0 }
        }
      }
    },

    currencyMeta: {
      USD: { symbol: '$', name: '미국 달러', country: '미국', flag: '🇺🇸', decimals: 2 },
      EUR: { symbol: '€', name: '유럽 유로', country: '유럽', flag: '🇪🇺', decimals: 2 },
      JPY: { symbol: '¥', name: '일본 엔', country: '일본', flag: '🇯🇵', decimals: 0 },
      KRW: { symbol: '₩', name: '대한민국 원', country: '대한민국', flag: '🇰🇷', decimals: 0 }
    },

    // 5대 단위 변환기 상태 및 데이터베이스
    unitCategory: 'length', // 'length' | 'area' | 'weight' | 'volume' | 'temp'
    unitInputVal: 1,
    activeUnitSource: 'from',
    fromUnit: 'm',
    toUnit: 'cm',
    unitDatabase: {
      length: {
        title: '길이 단위',
        defaultFrom: 'm',
        defaultTo: 'cm',
        baseUnit: 'm',
        units: {
          'mm': { name: '밀리미터', symbol: 'mm', factor: 0.001 },
          'cm': { name: '센티미터', symbol: 'cm', factor: 0.01 },
          'm': { name: '미터', symbol: 'm', factor: 1 },
          'km': { name: '킬로미터', symbol: 'km', factor: 1000 },
          'in': { name: '인치', symbol: 'in', factor: 0.0254 },
          'ft': { name: '피트', symbol: 'ft', factor: 0.3048 },
          'yd': { name: '야드', symbol: 'yd', factor: 0.9144 },
          'mile': { name: '마일', symbol: 'mile', factor: 1609.344 },
          '자': { name: '자(척)', symbol: '자', factor: 10 / 33 },
          '간': { name: '간(間)', symbol: '간', factor: 60 / 33 }
        }
      },
      area: {
        title: '넓이 단위',
        defaultFrom: 'm2',
        defaultTo: 'pyeong',
        baseUnit: 'm2',
        units: {
          'm2': { name: '제곱미터', symbol: 'm²', factor: 1 },
          'a': { name: '아르', symbol: 'a', factor: 100 },
          'ha': { name: '헥타르', symbol: 'ha', factor: 10000 },
          'km2': { name: '제곱킬로미터', symbol: 'km²', factor: 1000000 },
          'ft2': { name: '제곱피트', symbol: 'ft²', factor: 0.092903 },
          'yd2': { name: '제곱야드', symbol: 'yd²', factor: 0.836127 },
          'ac': { name: '에이커', symbol: 'ac', factor: 4046.85642 },
          'pyeong': { name: '평', symbol: '평', factor: 400 / 121 },
          'danbo': { name: '단보', symbol: '단', factor: 4000 / 121 },
          'jeongbo': { name: '정보', symbol: '정', factor: 40000 / 121 }
        }
      },
      weight: {
        title: '무게 단위',
        defaultFrom: 'kg',
        defaultTo: 'g',
        baseUnit: 'g',
        units: {
          'mg': { name: '밀리그램', symbol: 'mg', factor: 0.001 },
          'g': { name: '그램', symbol: 'g', factor: 1 },
          'kg': { name: '킬로그램', symbol: 'kg', factor: 1000 },
          't': { name: '톤', symbol: 't', factor: 1000000 },
          'gr': { name: '그레인', symbol: 'gr', factor: 0.06479891 },
          'oz': { name: '온스', symbol: 'oz', factor: 28.349523 },
          'lb': { name: '파운드', symbol: 'lb', factor: 453.59237 },
          'don': { name: '돈', symbol: '돈', factor: 3.75 },
          'nyang': { name: '냥', symbol: '냥', factor: 37.5 },
          'geun': { name: '근', symbol: '근', factor: 600 },
          'gwan': { name: '관', symbol: '관', factor: 3750 }
        }
      },
      volume: {
        title: '부피 단위',
        defaultFrom: 'L',
        defaultTo: 'mL',
        baseUnit: 'L',
        units: {
          'mL': { name: '밀리리터', symbol: 'mL', factor: 0.001 },
          'L': { name: '리터', symbol: 'L', factor: 1 },
          'cm3': { name: '세제곱센티미터', symbol: 'cm³', factor: 0.001 },
          'm3': { name: '세제곱미터', symbol: 'm³', factor: 1000 },
          'in3': { name: '세제곱인치', symbol: 'in³', factor: 0.016387064 },
          'ft3': { name: '세제곱피트', symbol: 'ft³', factor: 28.316847 },
          'yd3': { name: '세제곱야드', symbol: 'yd³', factor: 764.55486 },
          'gal': { name: '갤런(미국)', symbol: 'gal', factor: 3.785412 },
          'bbl': { name: '배럴(석유)', symbol: 'bbl', factor: 158.9873 },
          'hop': { name: '홉', symbol: '홉', factor: 0.18039 },
          'doe': { name: '되', symbol: '되', factor: 1.8039 },
          'mal': { name: '말', symbol: '말', factor: 18.039 }
        }
      },
      temp: {
        title: '온도 단위',
        defaultFrom: 'C',
        defaultTo: 'F',
        baseUnit: 'C',
        units: {
          'C': { name: '섭씨온도', symbol: '℃' },
          'F': { name: '화씨온도', symbol: '℉' },
          'K': { name: '절대온도', symbol: 'K' },
          'R': { name: '란씨온도', symbol: '°R' }
        }
      }
    }
  };

  // =========================================================================
  // 2. DOM 요소 참조
  // =========================================================================
  const app = document.getElementById('calculatorApp');
  const menuBtn = document.getElementById('menuBtn');
  const navDrawer = document.getElementById('navDrawer');
  const drawerOverlay = document.getElementById('drawerOverlay');
  const currentModeTitle = document.getElementById('currentModeTitle');
  const drawerItems = document.querySelectorAll('.drawer-item');

  // Calculator Views
  const calcView = document.getElementById('calcView');
  const currencyView = document.getElementById('currencyView');
  const unitView = document.getElementById('unitView');

  const historyExpressionEl = document.getElementById('historyExpression');
  const currentDisplayEl = document.getElementById('currentDisplay');

  // Memory & Angle
  const btnMC = document.getElementById('btnMC');
  const btnMR = document.getElementById('btnMR');
  const btnMPlus = document.getElementById('btnMPlus');
  const btnMMinus = document.getElementById('btnMMinus');
  const btnMS = document.getElementById('btnMS');
  const btnMView = document.getElementById('btnMView');
  const btnAngleMode = document.getElementById('btnAngleMode');

  // History Panel
  const historyToggleBtn = document.getElementById('historyToggleBtn');
  const historyPanel = document.getElementById('historyPanel');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyListEl = document.getElementById('historyList');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  // Currency Converter Controls
  const bankTabs = document.querySelectorAll('.bank-tab');
  const bankDirectLink = document.getElementById('bankDirectLink');
  const bankDirectTitle = document.getElementById('bankDirectTitle');

  const typeChips = document.querySelectorAll('.type-chip');
  const discChips = document.querySelectorAll('.disc-chip');
  const discountSlider = document.getElementById('discountSlider');
  const discountBadge = document.getElementById('discountBadge');
  const discountSaveInfo = document.getElementById('discountSaveInfo');
  const selectedRateSummary = document.getElementById('selectedRateSummary');

  const fromCurrencyCard = document.getElementById('fromCurrencyCard');
  const toCurrencyCard = document.getElementById('toCurrencyCard');
  const fromCurrencySelect = document.getElementById('fromCurrencySelect');
  const toCurrencySelect = document.getElementById('toCurrencySelect');
  const swapCurrencyBtn = document.getElementById('swapCurrencyBtn');
  const fromCurrencySymbol = document.getElementById('fromCurrencySymbol');
  const toCurrencySymbol = document.getElementById('toCurrencySymbol');
  const fromCurrencyInput = document.getElementById('fromCurrencyInput');
  const toCurrencyInput = document.getElementById('toCurrencyInput');
  const fromCurrencyUnit = document.getElementById('fromCurrencyUnit');
  const toCurrencyUnit = document.getElementById('toCurrencyUnit');
  const exchangeRateDetail = document.getElementById('exchangeRateDetail');
  const multiCurrencyGrid = document.getElementById('multiCurrencyGrid');

  // Unit Converter Controls
  const unitCatTabs = document.querySelectorAll('.unit-cat-tab');
  const fromUnitCard = document.getElementById('fromUnitCard');
  const toUnitCard = document.getElementById('toUnitCard');
  const fromUnitSelect = document.getElementById('fromUnitSelect');
  const toUnitSelect = document.getElementById('toUnitSelect');
  const swapUnitBtn = document.getElementById('swapUnitBtn');
  const fromUnitInput = document.getElementById('fromUnitInput');
  const toUnitInput = document.getElementById('toUnitInput');
  const fromUnitSymbol = document.getElementById('fromUnitSymbol');
  const toUnitSymbol = document.getElementById('toUnitSymbol');
  const fromUnitFullName = document.getElementById('fromUnitFullName');
  const toUnitFullName = document.getElementById('toUnitFullName');
  const unitFormulaDetail = document.getElementById('unitFormulaDetail');
  const allUnitsTitle = document.getElementById('allUnitsTitle');
  const multiUnitGrid = document.getElementById('multiUnitGrid');

  // =========================================================================
  // 3. 모드 전환 로직
  // =========================================================================
  function switchMode(newMode) {
    state.mode = newMode;
    drawerItems.forEach(item => {
      item.classList.toggle('active', item.dataset.mode === newMode);
    });

    app.classList.remove('mode-scientific', 'mode-currency', 'mode-unit');

    calcView.classList.remove('active');
    currencyView.classList.remove('active');
    unitView.classList.remove('active');

    if (newMode === 'standard') {
      currentModeTitle.textContent = '표준';
      calcView.classList.add('active');
    } else if (newMode === 'scientific') {
      currentModeTitle.textContent = '공학용';
      app.classList.add('mode-scientific');
      calcView.classList.add('active');
    } else if (newMode === 'currency') {
      currentModeTitle.textContent = '환율 (하나/신한은행)';
      app.classList.add('mode-currency');
      currencyView.classList.add('active');
      updateCurrencyConverter();
    } else if (newMode === 'unit') {
      currentModeTitle.textContent = '단위 변환기';
      app.classList.add('mode-unit');
      unitView.classList.add('active');
      initUnitCategory(state.unitCategory);
    }

    closeDrawer();
  }

  function openDrawer() {
    navDrawer.classList.add('open');
    drawerOverlay.classList.add('active');
  }

  function closeDrawer() {
    navDrawer.classList.remove('open');
    drawerOverlay.classList.remove('active');
  }

  menuBtn.addEventListener('click', openDrawer);
  drawerOverlay.addEventListener('click', closeDrawer);

  drawerItems.forEach(item => {
    item.addEventListener('click', () => {
      switchMode(item.dataset.mode);
    });
  });

  // =========================================================================
  // 4. 복합 수식 & 괄호 ( ) 계산기 엔진
  // =========================================================================

  function updateDisplay() {
    let display = state.currentDisplay;
    let expr = state.expression;
    if (!state.isEvaluated && expr) {
      historyExpressionEl.textContent = formatExpressionDisplay(expr);
    } else if (state.isEvaluated) {
      historyExpressionEl.textContent = expr ? formatExpressionDisplay(expr) + ' =' : '';
    } else {
      historyExpressionEl.textContent = '';
    }

    if (!isNaN(display) && display !== '' && !display.includes('e') && !display.endsWith('.')) {
      const parts = display.split('.');
      parts[0] = Number(parts[0]).toLocaleString('en-US');
      display = parts.join('.');
    }

    currentDisplayEl.textContent = display || '0';
  }

  function formatExpressionDisplay(rawExpr) {
    return rawExpr
      .replace(/\*/g, ' × ')
      .replace(/\//g, ' ÷ ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' − ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function inputDigit(digit) {
    if (state.isEvaluated) {
      state.expression = '';
      state.currentDisplay = '';
      state.isEvaluated = false;
    }

    if (state.currentDisplay === '0' && digit !== '.') {
      state.currentDisplay = String(digit);
    } else {
      state.currentDisplay += String(digit);
    }

    state.expression += String(digit);
    updateDisplay();
  }

  function inputDecimal() {
    if (state.isEvaluated) {
      state.expression = '0.';
      state.currentDisplay = '0.';
      state.isEvaluated = false;
      updateDisplay();
      return;
    }

    const lastTokenMatch = state.expression.match(/(\d+\.?\d*)$/);
    if (lastTokenMatch && lastTokenMatch[0].includes('.')) {
      return;
    }

    if (!lastTokenMatch) {
      state.expression += '0.';
      state.currentDisplay = '0.';
    } else {
      state.expression += '.';
      state.currentDisplay += '.';
    }
    updateDisplay();
  }

  function inputParen(paren) {
    if (state.isEvaluated) {
      if (paren === '(') {
        state.expression = '(';
        state.currentDisplay = '(';
        state.isEvaluated = false;
        updateDisplay();
        return;
      }
    }

    const lastChar = state.expression.slice(-1);

    if (paren === '(') {
      if (/\d|\)/.test(lastChar)) {
        state.expression += '*(';
      } else {
        state.expression += '(';
      }
      state.currentDisplay = '(';
    } else if (paren === ')') {
      const openCount = (state.expression.match(/\(/g) || []).length;
      const closeCount = (state.expression.match(/\)/g) || []).length;
      if (openCount > closeCount && !/[+\-*/(]/.test(lastChar)) {
        state.expression += ')';
        state.currentDisplay = ')';
      }
    }

    updateDisplay();
  }

  function inputOperator(op) {
    if (state.isEvaluated) {
      state.expression = state.currentDisplay;
      state.isEvaluated = false;
    }

    if (!state.expression) {
      if (op === '-') {
        state.expression = '-';
        state.currentDisplay = '-';
        updateDisplay();
      }
      return;
    }

    const lastChar = state.expression.slice(-1);
    if (/[+\-*/]/.test(lastChar)) {
      state.expression = state.expression.slice(0, -1) + op;
    } else {
      state.expression += op;
    }

    state.currentDisplay = '';
    updateDisplay();
  }

  function handleBackspace() {
    if (state.isEvaluated) {
      clearAll();
      return;
    }
    if (state.expression.length > 0) {
      state.expression = state.expression.slice(0, -1);
      const lastToken = state.expression.split(/[+\-*/()]/).filter(Boolean).pop() || '0';
      state.currentDisplay = lastToken;
    } else {
      state.currentDisplay = '0';
    }
    updateDisplay();
  }

  function clearAll() {
    state.expression = '';
    state.currentDisplay = '0';
    state.isEvaluated = false;
    updateDisplay();
  }

  function clearEntry() {
    if (state.isEvaluated) {
      clearAll();
      return;
    }
    const lastOpIdx = Math.max(
      state.expression.lastIndexOf('+'),
      state.expression.lastIndexOf('-'),
      state.expression.lastIndexOf('*'),
      state.expression.lastIndexOf('/'),
      state.expression.lastIndexOf('(')
    );
    if (lastOpIdx >= 0) {
      state.expression = state.expression.slice(0, lastOpIdx + 1);
      state.currentDisplay = '0';
    } else {
      clearAll();
    }
    updateDisplay();
  }

  function handleNegate() {
    if (state.currentDisplay && state.currentDisplay !== '0') {
      const val = parseFloat(state.currentDisplay);
      const negated = -val;
      state.currentDisplay = String(negated);
      state.expression = state.expression.replace(/(-?\d+\.?\d*)$/, String(negated));
      updateDisplay();
    }
  }

  function evaluateExpression(exprStr) {
    try {
      const openCount = (exprStr.match(/\(/g) || []).length;
      const closeCount = (exprStr.match(/\)/g) || []).length;
      let sanitized = exprStr;
      for (let i = 0; i < (openCount - closeCount); i++) {
        sanitized += ')';
      }

      if (!/^[0-9+\-*/().\s^e]+$/.test(sanitized)) {
        return '수식 오류';
      }

      sanitized = sanitized.replace(/\^/g, '**');
      const fn = new Function(`'use strict'; return (${sanitized});`);
      const result = fn();

      if (!isFinite(result) || isNaN(result)) {
        return '0으로 나눌 수 없습니다';
      }

      return Number(Math.round(result + 'e12') + 'e-12');
    } catch (e) {
      return '수식 오류';
    }
  }

  function handleEquals() {
    if (!state.expression) return;

    const fullExpr = state.expression;
    const result = evaluateExpression(fullExpr);

    if (typeof result === 'string') {
      state.currentDisplay = result;
      state.isEvaluated = true;
      updateDisplay();
      return;
    }

    addHistoryItem(formatExpressionDisplay(fullExpr) + ' =', String(result));

    state.currentDisplay = String(result);
    state.isEvaluated = true;
    updateDisplay();
  }

  function handleUnary(action) {
    let val = parseFloat(state.currentDisplay) || 0;
    let res = 0;
    let exprFormat = '';

    switch (action) {
      case 'percent':
        res = val / 100;
        exprFormat = `${val}%`;
        break;
      case 'reciprocal':
        if (val === 0) {
          state.currentDisplay = '0으로 나눌 수 없습니다';
          state.isEvaluated = true;
          updateDisplay();
          return;
        }
        res = 1 / val;
        exprFormat = `1/(${val})`;
        break;
      case 'square':
        res = Math.pow(val, 2);
        exprFormat = `sqr(${val})`;
        break;
      case 'sqrt':
        if (val < 0) {
          state.currentDisplay = '잘못된 입력';
          state.isEvaluated = true;
          updateDisplay();
          return;
        }
        res = Math.sqrt(val);
        exprFormat = `√(${val})`;
        break;
    }

    res = Number(Math.round(res + 'e12') + 'e-12');
    state.currentDisplay = String(res);
    state.expression = String(res);
    state.isEvaluated = true;
    historyExpressionEl.textContent = exprFormat;
    updateDisplay();
  }

  function handleScientific(func) {
    let val = parseFloat(state.currentDisplay) || 0;
    let res = 0;
    const toRad = (a) => state.angleMode === 'DEG' ? (a * Math.PI) / 180 : a;
    const toAngle = (r) => state.angleMode === 'DEG' ? (r * 180) / Math.PI : r;

    switch (func) {
      case 'sin': res = Math.sin(toRad(val)); break;
      case 'cos': res = Math.cos(toRad(val)); break;
      case 'tan': res = Math.tan(toRad(val)); break;
      case 'asin': res = toAngle(Math.asin(val)); break;
      case 'acos': res = toAngle(Math.acos(val)); break;
      case 'atan': res = toAngle(Math.atan(val)); break;
      case 'pi':
        inputDigit(Math.PI.toFixed(8));
        return;
      case 'e':
        inputDigit(Math.E.toFixed(8));
        return;
      case '10^x': res = Math.pow(10, val); break;
      case 'log': res = Math.log10(val); break;
      case 'ln': res = Math.log(val); break;
      case 'abs': res = Math.abs(val); break;
      case 'fact':
        if (val < 0 || !Number.isInteger(val)) {
          state.currentDisplay = '잘못된 입력';
          state.isEvaluated = true;
          updateDisplay();
          return;
        }
        let f = 1;
        for (let i = 2; i <= Math.min(val, 170); i++) f *= i;
        res = f;
        break;
      case 'x^y':
        inputOperator('^');
        return;
      case 'exp':
        inputOperator('*10^');
        return;
    }

    res = Number(Math.round(res + 'e12') + 'e-12');
    state.currentDisplay = String(res);
    state.expression = String(res);
    state.isEvaluated = true;
    updateDisplay();
  }

  if (btnAngleMode) {
    btnAngleMode.addEventListener('click', () => {
      state.angleMode = state.angleMode === 'DEG' ? 'RAD' : 'DEG';
      btnAngleMode.textContent = state.angleMode;
    });
  }

  function updateMemoryState() {
    const hasMemory = state.memory !== 0;
    btnMC.disabled = !hasMemory;
    btnMR.disabled = !hasMemory;
    btnMView.disabled = !hasMemory;
  }

  btnMPlus.addEventListener('click', () => {
    state.memory += parseFloat(state.currentDisplay) || 0;
    updateMemoryState();
  });

  btnMMinus.addEventListener('click', () => {
    state.memory -= parseFloat(state.currentDisplay) || 0;
    updateMemoryState();
  });

  btnMS.addEventListener('click', () => {
    state.memory = parseFloat(state.currentDisplay) || 0;
    updateMemoryState();
  });

  btnMR.addEventListener('click', () => {
    state.currentDisplay = String(state.memory);
    state.expression += String(state.memory);
    updateDisplay();
  });

  btnMC.addEventListener('click', () => {
    state.memory = 0;
    updateMemoryState();
  });

  function addHistoryItem(expr, res) {
    state.historyList.unshift({ expr, res });
    renderHistory();
  }

  function renderHistory() {
    if (state.historyList.length === 0) {
      historyListEl.innerHTML = '<div class="empty-state">아직 기록이 없습니다.</div>';
      return;
    }

    historyListEl.innerHTML = state.historyList.map(item => `
      <div class="history-item" data-res="${item.res}">
        <span class="history-item-exp">${item.expr}</span>
        <span class="history-item-res">${Number(item.res).toLocaleString('en-US')}</span>
      </div>
    `).join('');

    historyListEl.querySelectorAll('.history-item').forEach(item => {
      item.addEventListener('click', () => {
        state.currentDisplay = item.dataset.res;
        state.expression = item.dataset.res;
        state.isEvaluated = true;
        updateDisplay();
      });
    });
  }

  clearHistoryBtn.addEventListener('click', () => {
    state.historyList = [];
    renderHistory();
  });

  historyToggleBtn.addEventListener('click', () => {
    historyPanel.classList.toggle('open');
  });

  closeHistoryBtn.addEventListener('click', () => {
    historyPanel.classList.remove('open');
  });

  document.querySelectorAll('#standardKeypad .calc-btn, #scientificKeypad .calc-btn, .bracket-bar .calc-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const val = btn.dataset.value;

      switch (action) {
        case 'number': inputDigit(val); break;
        case 'decimal': inputDecimal(); break;
        case 'paren': inputParen(val); break;
        case 'operator': inputOperator(val); break;
        case 'equals': handleEquals(); break;
        case 'clear-all': clearAll(); break;
        case 'clear-entry': clearEntry(); break;
        case 'backspace': handleBackspace(); break;
        case 'negate': handleNegate(); break;
        case 'percent':
        case 'reciprocal':
        case 'square':
        case 'sqrt':
          handleUnary(action);
          break;
        case 'sci-func':
          handleScientific(val);
          break;
      }
    });
  });

  // =========================================================================
  // 5. 은행별(하나/신한) 우대 환율 변환 시스템 & 양방향 직접 타이핑
  // =========================================================================

  function getEffectiveRateInKRW(currencyCode, bank, type, discount) {
    if (currencyCode === 'KRW') return 1.0;

    const bankData = state.bankRates[bank].rates[currencyCode];
    const baseRate = bankData.base;
    const targetTypeRate = bankData[type];

    if (type === 'base' || discount === 0) {
      return targetTypeRate;
    }

    const spread = targetTypeRate - baseRate;
    const discountFactor = (100 - discount) / 100;
    const discountedSpread = spread * discountFactor;

    return baseRate + discountedSpread;
  }

  function convertBankCurrency(amount, fromCode, toCode) {
    if (isNaN(amount) || amount === 0) return 0;
    const bank = state.selectedBank;
    const type = state.selectedRateType;
    const discount = state.discountRate;

    const rateFrom = getEffectiveRateInKRW(fromCode, bank, type, discount);
    const amountInKRW = amount * rateFrom;

    const rateTo = getEffectiveRateInKRW(toCode, bank, type, discount);
    return amountInKRW / rateTo;
  }

  function formatCurrencyDisplay(val, code) {
    const decimals = state.currencyMeta[code].decimals;
    return val.toLocaleString('ko-KR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  function updateCurrencyConverter() {
    const fromCode = state.fromCurrency;
    const toCode = state.toCurrency;
    const bank = state.selectedBank;
    const type = state.selectedRateType;
    const discount = state.discountRate;

    const fromMeta = state.currencyMeta[fromCode];
    const toMeta = state.currencyMeta[toCode];
    const bankInfo = state.bankRates[bank];

    // 1. 은행 바로가기 링크 업데이트 (요청된 URL 완벽 반영)
    bankDirectTitle.textContent = bankInfo.linkName;
    bankDirectLink.href = bankInfo.linkUrl;
    bankDirectLink.className = `bank-direct-link ${bank === 'hana' ? 'hana-link' : 'shinhan-link'}`;

    // 2. 환율 요약 헤더 업데이트
    const rateTypeNames = {
      base: '매매기준율',
      cashBuy: '현찰 살 때',
      cashSell: '현찰 팔 때',
      remitSend: '송금 보낼 때',
      remitRecv: '송금 받을 때'
    };

    selectedRateSummary.textContent = `${bankInfo.name} · ${rateTypeNames[type]} (${discount}% 우대)`;
    discountBadge.textContent = `${discount}% 우대`;
    discountSaveInfo.textContent = discount > 0 ? `스프레드 ${discount}% 우대 할인 적용 중` : '우대율 미적용 (기본)';

    fromCurrencySymbol.textContent = fromMeta.symbol;
    toCurrencySymbol.textContent = toMeta.symbol;

    const rawFromVal = state.currencyInput;
    const convertedToVal = convertBankCurrency(rawFromVal, fromCode, toCode);

    if (document.activeElement !== fromCurrencyInput) {
      fromCurrencyInput.value = formatCurrencyDisplay(rawFromVal, fromCode);
    }
    if (document.activeElement !== toCurrencyInput) {
      toCurrencyInput.value = formatCurrencyDisplay(convertedToVal, toCode);
    }

    fromCurrencyUnit.textContent = `${formatCurrencyDisplay(rawFromVal, fromCode)} ${fromMeta.name}`;
    toCurrencyUnit.textContent = `${formatCurrencyDisplay(convertedToVal, toCode)} ${toMeta.name}`;

    const singleRate = convertBankCurrency(1, fromCode, toCode);
    const inverseRate = convertBankCurrency(1, toCode, fromCode);
    const singleDec = toMeta.decimals > 0 ? toMeta.decimals : 2;
    const invDec = fromMeta.decimals > 0 ? fromMeta.decimals : 2;
    exchangeRateDetail.textContent = `1 ${fromCode} = ${singleRate.toFixed(singleDec)} ${toCode} · 1 ${toCode} = ${inverseRate.toFixed(invDec)} ${fromCode}`;

    renderMultiCurrencyGrid(rawFromVal, fromCode);
  }

  function renderMultiCurrencyGrid(baseAmount, baseCode) {
    const currencies = ['USD', 'EUR', 'JPY', 'KRW'];

    multiCurrencyGrid.innerHTML = currencies.map(code => {
      const meta = state.currencyMeta[code];
      const converted = convertBankCurrency(baseAmount, baseCode, code);
      const isBase = code === baseCode;

      return `
        <div class="comp-card ${isBase ? 'active-base' : ''}" data-code="${code}" title="${meta.name}을(를) 기준 통화로 설정">
          <div class="comp-header">
            <span class="comp-country">${meta.flag} ${meta.country}</span>
            <span class="comp-code">${code}</span>
          </div>
          <div class="comp-value">${meta.symbol} ${formatCurrencyDisplay(converted, code)}</div>
          <div class="comp-rate-hint">${meta.name} ${isBase ? '(기준)' : ''}</div>
        </div>
      `;
    }).join('');

    multiCurrencyGrid.querySelectorAll('.comp-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedCode = card.dataset.code;
        if (state.fromCurrency !== selectedCode) {
          const newVal = convertBankCurrency(state.currencyInput, state.fromCurrency, selectedCode);
          state.currencyInput = Math.round(newVal * 100) / 100;
          state.fromCurrency = selectedCode;
          fromCurrencySelect.value = selectedCode;
          updateCurrencyConverter();
        }
      });
    });
  }

  function parseInputNumber(str) {
    const cleaned = str.replace(/,/g, '').trim();
    if (cleaned === '' || cleaned === '.') return 0;
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  fromCurrencyInput.addEventListener('input', (e) => {
    state.activeCurrencySource = 'from';
    fromCurrencyCard.classList.add('active-source');
    toCurrencyCard.classList.remove('active-source');

    const val = parseInputNumber(e.target.value);
    state.currencyInput = val;
    updateCurrencyConverter();
  });

  fromCurrencyInput.addEventListener('focus', () => {
    state.activeCurrencySource = 'from';
    fromCurrencyCard.classList.add('active-source');
    toCurrencyCard.classList.remove('active-source');
  });

  toCurrencyInput.addEventListener('input', (e) => {
    state.activeCurrencySource = 'to';
    toCurrencyCard.classList.add('active-source');
    fromCurrencyCard.classList.remove('active-source');

    const toVal = parseInputNumber(e.target.value);
    const calculatedFrom = convertBankCurrency(toVal, state.toCurrency, state.fromCurrency);
    state.currencyInput = calculatedFrom;
    updateCurrencyConverter();
  });

  toCurrencyInput.addEventListener('focus', () => {
    state.activeCurrencySource = 'to';
    toCurrencyCard.classList.add('active-source');
    fromCurrencyCard.classList.remove('active-source');
  });

  bankTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      bankTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.selectedBank = tab.dataset.bank;
      updateCurrencyConverter();
    });
  });

  typeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      typeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      state.selectedRateType = chip.dataset.type;
      updateCurrencyConverter();
    });
  });

  discChips.forEach(chip => {
    chip.addEventListener('click', () => {
      discChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const val = parseInt(chip.dataset.rate, 10);
      state.discountRate = val;
      discountSlider.value = val;
      updateCurrencyConverter();
    });
  });

  discountSlider.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.discountRate = val;
    discChips.forEach(c => {
      c.classList.toggle('active', parseInt(c.dataset.rate, 10) === val);
    });
    updateCurrencyConverter();
  });

  fromCurrencySelect.addEventListener('change', (e) => {
    state.fromCurrency = e.target.value;
    updateCurrencyConverter();
  });

  toCurrencySelect.addEventListener('change', (e) => {
    state.toCurrency = e.target.value;
    updateCurrencyConverter();
  });

  swapCurrencyBtn.addEventListener('click', () => {
    const temp = state.fromCurrency;
    state.fromCurrency = state.toCurrency;
    state.toCurrency = temp;

    fromCurrencySelect.value = state.fromCurrency;
    toCurrencySelect.value = state.toCurrency;
    updateCurrencyConverter();
  });

  document.querySelectorAll('.currency-keypad button[data-cval]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.cval;
      let currentStr = String(state.currencyInput);
      if (currentStr === '0' && val !== '.') {
        currentStr = val;
      } else {
        if (val === '.' && currentStr.includes('.')) return;
        if (currentStr.length < 14) currentStr += val;
      }
      state.currencyInput = parseInputNumber(currentStr);
      updateCurrencyConverter();
    });
  });

  document.getElementById('currBtnCE').addEventListener('click', () => {
    state.currencyInput = 0;
    updateCurrencyConverter();
  });

  document.getElementById('currBtnClear').addEventListener('click', () => {
    state.currencyInput = 0;
    updateCurrencyConverter();
  });

  document.getElementById('currBtnBack').addEventListener('click', () => {
    let currentStr = String(state.currencyInput);
    if (currentStr.length > 1) currentStr = currentStr.slice(0, -1);
    else currentStr = '0';
    state.currencyInput = parseInputNumber(currentStr);
    updateCurrencyConverter();
  });

  document.getElementById('currBtnDone').addEventListener('click', () => {
    updateCurrencyConverter();
  });

  // =========================================================================
  // 6. 단위 변환기 로직 (길이, 넓이, 무게, 부피, 온도)
  // =========================================================================

  function initUnitCategory(catKey) {
    state.unitCategory = catKey;
    const catData = state.unitDatabase[catKey];

    // 1. 카테고리 탭 활성화 상태 변경
    unitCatTabs.forEach(tab => {
      tab.classList.toggle('active', tab.dataset.category === catKey);
    });

    // 2. 단위 셀렉트 옵션 빌드
    const unitKeys = Object.keys(catData.units);
    state.fromUnit = catData.defaultFrom;
    state.toUnit = catData.defaultTo;

    fromUnitSelect.innerHTML = unitKeys.map(k => `
      <option value="${k}" ${k === state.fromUnit ? 'selected' : ''}>
        ${catData.units[k].name} (${catData.units[k].symbol})
      </option>
    `).join('');

    toUnitSelect.innerHTML = unitKeys.map(k => `
      <option value="${k}" ${k === state.toUnit ? 'selected' : ''}>
        ${catData.units[k].name} (${catData.units[k].symbol})
      </option>
    `).join('');

    allUnitsTitle.textContent = `${catData.title} 전체 동시 비교`;
    updateUnitConverter();
  }

  // 단위 환산 계산 함수
  function convertUnits(val, fromKey, toKey, catKey) {
    if (isNaN(val)) return 0;
    if (fromKey === toKey) return val;

    // 온도 특수 변환
    if (catKey === 'temp') {
      let inCelsius = val;
      // 1. From -> Celsius
      if (fromKey === 'F') inCelsius = (val - 32) * 5 / 9;
      else if (fromKey === 'K') inCelsius = val - 273.15;
      else if (fromKey === 'R') inCelsius = (val - 491.67) * 5 / 9;

      // 2. Celsius -> To
      if (toKey === 'C') return inCelsius;
      if (toKey === 'F') return (inCelsius * 9 / 5) + 32;
      if (toKey === 'K') return inCelsius + 273.15;
      if (toKey === 'R') return (inCelsius + 273.15) * 9 / 5;
      return inCelsius;
    }

    // 일반 단위 변환 (BaseUnit 기준 Factor)
    const catData = state.unitDatabase[catKey];
    const fromFactor = catData.units[fromKey].factor;
    const toFactor = catData.units[toKey].factor;

    const inBase = val * fromFactor;
    return inBase / toFactor;
  }

  function formatUnitNumber(num) {
    if (isNaN(num)) return '0';
    if (Math.abs(num) >= 1000000 || (Math.abs(num) < 0.0001 && num !== 0)) {
      return num.toExponential(4).replace(/\.0000e/, 'e');
    }
    // 소수점 6자리 반올림 후 불필요한 0 제거
    const fixed = Number(Math.round(num + 'e6') + 'e-6');
    return fixed.toLocaleString('ko-KR', { maximumFractionDigits: 6 });
  }

  function updateUnitConverter() {
    const catKey = state.unitCategory;
    const catData = state.unitDatabase[catKey];
    const fromKey = state.fromUnit;
    const toKey = state.toUnit;

    const fromMeta = catData.units[fromKey];
    const toMeta = catData.units[toKey];

    fromUnitSymbol.textContent = fromMeta.symbol;
    toUnitSymbol.textContent = toMeta.symbol;

    fromUnitFullName.textContent = `${fromMeta.name} (${fromMeta.symbol})`;
    toUnitFullName.textContent = `${toMeta.name} (${toMeta.symbol})`;

    const rawFromVal = state.unitInputVal;
    const convertedToVal = convertUnits(rawFromVal, fromKey, toKey, catKey);

    if (document.activeElement !== fromUnitInput) {
      fromUnitInput.value = formatUnitNumber(rawFromVal);
    }
    if (document.activeElement !== toUnitInput) {
      toUnitInput.value = formatUnitNumber(convertedToVal);
    }

    // 단위 공식 표기
    const oneUnitTo = convertUnits(1, fromKey, toKey, catKey);
    const oneUnitFrom = convertUnits(1, toKey, fromKey, catKey);
    unitFormulaDetail.textContent = `1 ${fromMeta.symbol} = ${formatUnitNumber(oneUnitTo)} ${toMeta.symbol} (1 ${toMeta.symbol} = ${formatUnitNumber(oneUnitFrom)} ${fromMeta.symbol})`;

    // 전체 단위 비교 카드 렌더링
    renderMultiUnitGrid(rawFromVal, fromKey, catKey);
  }

  function renderMultiUnitGrid(baseVal, baseKey, catKey) {
    const catData = state.unitDatabase[catKey];
    const unitKeys = Object.keys(catData.units);

    multiUnitGrid.innerHTML = unitKeys.map(k => {
      const meta = catData.units[k];
      const converted = convertUnits(baseVal, baseKey, k, catKey);
      const isBase = k === baseKey;

      return `
        <div class="unit-comp-card ${isBase ? 'active-base' : ''}" data-unit="${k}" title="${meta.name}을(를) 기준 단위로 설정">
          <div class="comp-header">
            <span class="unit-name-label">${meta.name}</span>
            <span class="unit-symbol-label">${meta.symbol}</span>
          </div>
          <div class="unit-comp-value">${formatUnitNumber(converted)}</div>
          <div class="comp-rate-hint">${isBase ? '● 기준 단위' : meta.symbol}</div>
        </div>
      `;
    }).join('');

    multiUnitGrid.querySelectorAll('.unit-comp-card').forEach(card => {
      card.addEventListener('click', () => {
        const selectedUnit = card.dataset.unit;
        if (state.fromUnit !== selectedUnit) {
          const newVal = convertUnits(state.unitInputVal, state.fromUnit, selectedUnit, state.unitCategory);
          state.unitInputVal = newVal;
          state.fromUnit = selectedUnit;
          fromUnitSelect.value = selectedUnit;
          updateUnitConverter();
        }
      });
    });
  }

  // 단위 카테고리 탭 클릭 이벤트
  unitCatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      initUnitCategory(tab.dataset.category);
    });
  });

  // 단위 선택 변경 이벤트
  fromUnitSelect.addEventListener('change', (e) => {
    state.fromUnit = e.target.value;
    updateUnitConverter();
  });

  toUnitSelect.addEventListener('change', (e) => {
    state.toUnit = e.target.value;
    updateUnitConverter();
  });

  swapUnitBtn.addEventListener('click', () => {
    const temp = state.fromUnit;
    state.fromUnit = state.toUnit;
    state.toUnit = temp;

    fromUnitSelect.value = state.fromUnit;
    toUnitSelect.value = state.toUnit;
    updateUnitConverter();
  });

  // 단위 직접 타이핑 이벤트
  fromUnitInput.addEventListener('input', (e) => {
    state.activeUnitSource = 'from';
    fromUnitCard.classList.add('active-source');
    toUnitCard.classList.remove('active-source');

    const val = parseInputNumber(e.target.value);
    state.unitInputVal = val;
    updateUnitConverter();
  });

  fromUnitInput.addEventListener('focus', () => {
    state.activeUnitSource = 'from';
    fromUnitCard.classList.add('active-source');
    toUnitCard.classList.remove('active-source');
  });

  toUnitInput.addEventListener('input', (e) => {
    state.activeUnitSource = 'to';
    toUnitCard.classList.add('active-source');
    fromUnitCard.classList.remove('active-source');

    const toVal = parseInputNumber(e.target.value);
    const calculatedFrom = convertUnits(toVal, state.toUnit, state.fromUnit, state.unitCategory);
    state.unitInputVal = calculatedFrom;
    updateUnitConverter();
  });

  toUnitInput.addEventListener('focus', () => {
    state.activeUnitSource = 'to';
    toUnitCard.classList.add('active-source');
    fromUnitCard.classList.remove('active-source');
  });

  // 단위 전용 키패드
  document.querySelectorAll('.unit-view .currency-keypad button[data-uval]').forEach(btn => {
    btn.addEventListener('click', () => {
      const val = btn.dataset.uval;
      let currentStr = String(state.unitInputVal);

      if (val === 'neg') {
        state.unitInputVal = -state.unitInputVal;
        updateUnitConverter();
        return;
      }

      if (currentStr === '0' && val !== '.') {
        currentStr = val;
      } else {
        if (val === '.' && currentStr.includes('.')) return;
        if (currentStr.length < 14) currentStr += val;
      }
      state.unitInputVal = parseInputNumber(currentStr);
      updateUnitConverter();
    });
  });

  document.getElementById('unitBtnCE').addEventListener('click', () => {
    state.unitInputVal = 0;
    updateUnitConverter();
  });

  document.getElementById('unitBtnClear').addEventListener('click', () => {
    state.unitInputVal = 0;
    updateUnitConverter();
  });

  document.getElementById('unitBtnBack').addEventListener('click', () => {
    let currentStr = String(state.unitInputVal);
    if (currentStr.length > 1) currentStr = currentStr.slice(0, -1);
    else currentStr = '0';
    state.unitInputVal = parseInputNumber(currentStr);
    updateUnitConverter();
  });

  document.getElementById('unitBtnDone').addEventListener('click', () => {
    updateUnitConverter();
  });

  // =========================================================================
  // 7. 글로벌 키보드 핸들러 (계산기 모드)
  // =========================================================================
  window.addEventListener('keydown', (e) => {
    if (state.mode === 'currency' || state.mode === 'unit') {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      inputDigit(e.key);
    } else if (e.key === '.') {
      inputDecimal();
    } else if (e.key === '(') {
      inputParen('(');
    } else if (e.key === ')') {
      inputParen(')');
    } else if (e.key === '+') {
      inputOperator('+');
    } else if (e.key === '-') {
      inputOperator('-');
    } else if (e.key === '*' || e.key === 'x') {
      inputOperator('*');
    } else if (e.key === '/') {
      e.preventDefault();
      inputOperator('/');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleEquals();
    } else if (e.key === 'Backspace') {
      handleBackspace();
    } else if (e.key === 'Escape') {
      clearAll();
    } else if (e.key === '%') {
      handleUnary('percent');
    }
  });

  // 초기 렌더링
  updateDisplay();
  updateCurrencyConverter();
});
