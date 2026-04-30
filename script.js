// =========================
// Math Parser
// =========================
class MathParser {
    static normalizeExpression(expression) {
        if (typeof expression !== 'string') return '';

        let expr = expression.trim();
        expr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'pi');
        expr = expr.replace(/√/g, 'sqrt');

        // Handle common implicit multiplication cases: 2x, 2(x), x2, )(
        expr = expr.replace(/(\d)\s*(?=x\b)/gi, '$1*');
        expr = expr.replace(/x\s*(?=\d|\()/gi, 'x*');
        expr = expr.replace(/(\d|\))\s*\(/g, '$1*(');
        expr = expr.replace(/\)\s*(?=\d|x|\()/gi, ')*');

        expr = expr.replace(/\^/g, '**');
        expr = expr.replace(/sin\(/g, 'Math.sin(');
        expr = expr.replace(/cos\(/g, 'Math.cos(');
        expr = expr.replace(/tan\(/g, 'Math.tan(');
        expr = expr.replace(/sqrt\(/g, 'Math.sqrt(');
        expr = expr.replace(/abs\(/g, 'Math.abs(');
        expr = expr.replace(/log\(/g, 'Math.log10(');
        expr = expr.replace(/ln\(/g, 'Math.log(');
        expr = expr.replace(/exp\(/g, 'Math.exp(');
        expr = expr.replace(/pi/g, 'Math.PI');
        expr = expr.replace(/e(?![a-zA-Z0-9_])/g, 'Math.E');

        return expr;
    }

    static evaluate(expression, x) {
        try {
            const expr = this.normalizeExpression(expression);
            const func = new Function('x', `return ${expr}`);
            return func(x);
        } catch {
            return NaN;
        }
    }

    static evaluateExpression(expression) {
        try {
            const expr = this.normalizeExpression(expression);
            return eval(expr);
        } catch {
            return 'Error';
        }
    }
}

// =========================
// Equation Solver
// =========================
class EquationSolver {
    static containsVariable(expression) {
        return /(?:^|[^A-Za-z_])x(?![A-Za-z0-9_])/i.test(expression);
    }

    static solve(equation) {
        try {
            const expression = equation.trim();
            if (!expression.includes('=')) {
                if (this.containsVariable(expression)) {
                    return { type: 'error', message: 'Use an equation with = to solve for x' };
                }
                return {
                    type: 'expression',
                    result: MathParser.evaluateExpression(expression)
                };
            }

            const parts = expression.split('=');
            if (parts.length !== 2) {
                return { type: 'error', message: 'Invalid equation format' };
            }

            const left = parts[0].trim();
            const right = parts[1].trim();
            const containsX = this.containsVariable(left) || this.containsVariable(right);

            if (!containsX) {
                const leftVal = MathParser.evaluateExpression(left);
                const rightVal = MathParser.evaluateExpression(right);

                return {
                    type: 'equality',
                    equal: Math.abs(leftVal - rightVal) < 0.0001,
                    leftVal,
                    rightVal
                };
            }

            return this.solveForX(left, right);
        } catch (error) {
            return { type: 'error', message: error.message };
        }
    }

    static solveForX(left, right) {
        const expr = `(${left}) - (${right})`;
        const degree = this.detectDegree(expr);

        if (degree === 1) return this.solveLinear(expr);
        if (degree === 2) return this.solveQuadratic(expr);
        return this.solveNumerical(expr);
    }

    static detectDegree(expr) {
        const normalized = expr.replace(/\s+/g, '').toLowerCase();
        if (normalized.match(/x\*\*3|x\^3/)) return 3;
        if (normalized.match(/x\*\*2|x\^2|x\*x/)) return 2;
        if (normalized.includes('x')) return 1;
        return 0;
    }

    static solveLinear(expr) {
        const f0 = MathParser.evaluate(expr, 0);
        const f1 = MathParser.evaluate(expr, 1);

        if (!isFinite(f0) || !isFinite(f1) || Math.abs(f1 - f0) < 0.0000001) {
            return { type: 'error', message: 'No unique solution' };
        }

        const x = -f0 / (f1 - f0);
        return {
            type: 'solution',
            variable: 'x',
            value: x,
            solutions: [x]
        };
    }

    static solveQuadratic(expr) {
        const a = this.getCoefficient(expr, 2);
        const b = this.getCoefficient(expr, 1);
        const c = this.getCoefficient(expr, 0);

        const d = b * b - 4 * a * c;
        if (!isFinite(a) || !isFinite(b) || !isFinite(c)) {
            return this.solveNumerical(expr);
        }

        if (d < 0) {
            return { type: 'error', message: 'No real solutions (complex roots)' };
        }

        const x1 = (-b + Math.sqrt(d)) / (2 * a);
        const x2 = (-b - Math.sqrt(d)) / (2 * a);
        const solutions = Math.abs(x1 - x2) < 0.000001 ? [x1] : [x1, x2];

        return {
            type: 'solution',
            variable: 'x',
            value: solutions[0],
            solutions
        };
    }

    static getCoefficient(expr, degree) {
        const pts = [
            { x: 0, y: MathParser.evaluate(expr, 0) },
            { x: 1, y: MathParser.evaluate(expr, 1) },
            { x: -1, y: MathParser.evaluate(expr, -1) },
            { x: 2, y: MathParser.evaluate(expr, 2) }
        ];

        if (degree === 0) return pts[0].y;
        if (degree === 1) return (pts[1].y - pts[0].y) - this.getCoefficient(expr, 2);

        const d1 = pts[1].y - pts[0].y;
        const d2 = pts[3].y - pts[1].y;
        return (d2 - d1) / 2;
    }

    static solveNumerical(expr) {
        const f = (x) => MathParser.evaluate(expr, x);
        const roots = new Set();
        const searchMin = -100;
        const searchMax = 100;
        const steps = 400;

        let previousX = searchMin;
        let previousY = f(previousX);

        for (let i = 1; i <= steps; i++) {
            const currentX = searchMin + ((searchMax - searchMin) * i) / steps;
            const currentY = f(currentX);

            if (Math.abs(currentY) < 1e-7) {
                roots.add(this.roundRoot(currentX));
            }

            if (isFinite(previousY) && isFinite(currentY) && previousY * currentY < 0) {
                const root = this.bisect(f, previousX, currentX);
                if (root !== null) roots.add(this.roundRoot(root));
            }

            previousX = currentX;
            previousY = currentY;
        }

        if (roots.size === 0) {
            return { type: 'error', message: 'No real solutions found' };
        }

        const solutions = Array.from(roots).sort((a, b) => a - b);
        return {
            type: 'solution',
            variable: 'x',
            value: solutions[0],
            solutions
        };
    }

    static bisect(f, a, b) {
        let fa = f(a);
        let fb = f(b);

        if (!isFinite(fa) || !isFinite(fb) || fa * fb > 0) {
            return null;
        }

        for (let i = 0; i < 50; i++) {
            const mid = (a + b) / 2;
            const fm = f(mid);
            if (!isFinite(fm)) return null;
            if (Math.abs(fm) < 1e-10) return mid;
            if (fa * fm < 0) {
                b = mid;
                fb = fm;
            } else {
                a = mid;
                fa = fm;
            }
        }

        return (a + b) / 2;
    }

    static roundRoot(value) {
        return Math.round(value * 1e6) / 1e6;
    }
}

// =========================
// Graph Application
// =========================

class GraphApp {
    constructor() {
        this.functions = [];
        this.colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        this.colorIndex = 0;
        this.canvas = document.getElementById('graphCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.viewportX = { min: -10, max: 10 };
        this.viewportY = { min: -10, max: 10 };
        this.isDragging = false;
        this.dragStart = { x: 0, y: 0 };
        this.gridVisible = true;
        this.axesVisible = true;
        this.labelsVisible = true;
        this.scale = 1;
        this.pan = { x: 0, y: 0 };
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.draw();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.draw();
    }

    setupEventListeners() {
        // Add function button
        document.getElementById('addFunction').addEventListener('click', () => this.addFunction());

        // Quick calculation
        const quickCalcInput = document.getElementById('quickCalcInput');
        quickCalcInput.addEventListener('input', (e) => this.handleQuickCalc(e.target.value));

        // Viewport controls
        document.getElementById('xMin').addEventListener('change', (e) => {
            this.viewportX.min = parseFloat(e.target.value);
            this.draw();
        });
        document.getElementById('xMax').addEventListener('change', (e) => {
            this.viewportX.max = parseFloat(e.target.value);
            this.draw();
        });
        document.getElementById('yMin').addEventListener('change', (e) => {
            this.viewportY.min = parseFloat(e.target.value);
            this.draw();
        });
        document.getElementById('yMax').addEventListener('change', (e) => {
            this.viewportY.max = parseFloat(e.target.value);
            this.draw();
        });

        // Grid options
        document.getElementById('showGrid').addEventListener('change', (e) => {
            this.gridVisible = e.target.checked;
            this.draw();
        });
        document.getElementById('showAxes').addEventListener('change', (e) => {
            this.axesVisible = e.target.checked;
            this.draw();
        });
        document.getElementById('showLabels').addEventListener('change', (e) => {
            this.labelsVisible = e.target.checked;
            this.draw();
        });

        // Canvas interactions
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', () => this.handleMouseUp());
        this.canvas.addEventListener('mouseleave', () => this.handleMouseUp());
        this.canvas.addEventListener('wheel', (e) => this.handleZoom(e));

        // Zoom controls
        document.getElementById('zoomIn').addEventListener('click', () => this.zoom(1.2));
        document.getElementById('zoomOut').addEventListener('click', () => this.zoom(0.8333));
        document.getElementById('resetZoom').addEventListener('click', () => this.resetView());
    }

    handleQuickCalc(input) {
        const resultEl = document.getElementById('quickCalcResult');
        
        if (!input.trim()) {
            resultEl.classList.remove('visible');
            return;
        }

        const solution = EquationSolver.solve(input);

        if (solution.type === 'expression') {
            if (solution.result === 'Error' || isNaN(solution.result)) {
                resultEl.classList.remove('visible');
                return;
            }
            const formatted = typeof solution.result === 'number'
                ? solution.result.toFixed(6).replace(/\.?0+$/, '')
                : solution.result;
            resultEl.textContent = formatted;
            resultEl.classList.add('visible');
            return;
        }

        if (solution.type === 'equality') {
            resultEl.textContent = solution.equal ? 'true' : 'false';
            resultEl.classList.add('visible');
            return;
        }

        if (solution.type === 'solution') {
            const solutions = solution.solutions.map((value) => {
                if (Number.isFinite(value)) {
                    return value.toFixed(6).replace(/\.?0+$/, '');
                }
                return String(value);
            });
            resultEl.textContent = `x = ${solutions.join(', ')}`;
            resultEl.classList.add('visible');
            return;
        }

        resultEl.textContent = solution.message || 'Error';
        resultEl.classList.add('visible');
    }

    addFunction() {
        const id = Date.now();
        const color = this.colors[this.colorIndex % this.colors.length];
        this.colorIndex++;

        const func = {
            id,
            expression: 'x',
            color,
            enabled: true
        };

        this.functions.push(func);
        this.renderFunctionsList();
        this.draw();
    }

    deleteFunction(id) {
        this.functions = this.functions.filter(f => f.id !== id);
        this.renderFunctionsList();
        this.draw();
    }

    updateFunction(id, expression) {
        const func = this.functions.find(f => f.id === id);
        if (func) {
            func.expression = expression;
            this.draw();
        }
    }

    toggleFunction(id) {
        const func = this.functions.find(f => f.id === id);
        if (func) {
            func.enabled = !func.enabled;
            this.renderFunctionsList();
            this.draw();
        }
    }

    renderFunctionsList() {
        const list = document.getElementById('functionsList');
        list.innerHTML = '';

        this.functions.forEach(func => {
            const item = document.createElement('div');
            item.className = 'function-item';

            const header = document.createElement('div');
            header.className = 'function-header';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = func.enabled;
            checkbox.addEventListener('change', () => this.toggleFunction(func.id));
            checkbox.style.width = '18px';
            checkbox.style.height = '18px';
            checkbox.style.cursor = 'pointer';
            checkbox.style.accentColor = func.color;

            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'function-input';
            input.value = func.expression;
            input.placeholder = 'f(x) = ';
            input.addEventListener('change', (e) => this.updateFunction(func.id, e.target.value));
            input.addEventListener('input', (e) => {
                this.updateFunction(func.id, e.target.value);
            });

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '✕';
            deleteBtn.addEventListener('click', () => this.deleteFunction(func.id));

            header.appendChild(checkbox);
            header.appendChild(input);
            header.appendChild(deleteBtn);
            item.appendChild(header);
            list.appendChild(item);
        });
    }

    handleMouseDown(e) {
        this.isDragging = true;
        this.dragStart.x = e.clientX;
        this.dragStart.y = e.clientY;
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const deltaX = e.clientX - this.dragStart.x;
            const deltaY = e.clientY - this.dragStart.y;

            const xRange = this.viewportX.max - this.viewportX.min;
            const yRange = this.viewportY.max - this.viewportY.min;

            const panX = -(deltaX / this.canvas.width) * xRange;
            const panY = (deltaY / this.canvas.height) * yRange;

            this.viewportX.min += panX;
            this.viewportX.max += panX;
            this.viewportY.min += panY;
            this.viewportY.max += panY;

            this.updateViewportInputs();
            this.draw();

            this.dragStart.x = e.clientX;
            this.dragStart.y = e.clientY;
        } else {
            // Hover trace
            this.updateTrace(e);
        }
    }

    handleMouseUp() {
        this.isDragging = false;
    }

    handleZoom(e) {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(factor);
    }

    zoom(factor) {
        const centerX = (this.viewportX.min + this.viewportX.max) / 2;
        const centerY = (this.viewportY.min + this.viewportY.max) / 2;

        const rangeX = (this.viewportX.max - this.viewportX.min) / 2;
        const rangeY = (this.viewportY.max - this.viewportY.min) / 2;

        this.viewportX.min = centerX - rangeX / factor;
        this.viewportX.max = centerX + rangeX / factor;
        this.viewportY.min = centerY - rangeY / factor;
        this.viewportY.max = centerY + rangeY / factor;

        this.updateViewportInputs();
        this.draw();
    }

    resetView() {
        this.viewportX = { min: -10, max: 10 };
        this.viewportY = { min: -10, max: 10 };
        this.updateViewportInputs();
        this.draw();
    }

    updateViewportInputs() {
        document.getElementById('xMin').value = this.viewportX.min.toFixed(2);
        document.getElementById('xMax').value = this.viewportX.max.toFixed(2);
        document.getElementById('yMin').value = this.viewportY.min.toFixed(2);
        document.getElementById('yMax').value = this.viewportY.max.toFixed(2);
    }

    updateTrace(e) {
        const rect = this.canvas.getBoundingClientRect();
        const pixelX = e.clientX - rect.left;
        const pixelY = e.clientY - rect.top;

        const x = this.viewportX.min + (pixelX / this.canvas.width) * (this.viewportX.max - this.viewportX.min);
        const y = this.viewportY.max - (pixelY / this.canvas.height) * (this.viewportY.max - this.viewportY.min);

        const traceInfo = document.getElementById('traceInfo');
        const enabledFuncs = this.functions.filter(f => f.enabled);

        if (enabledFuncs.length > 0) {
            const func = enabledFuncs[0];
            const fValue = MathParser.evaluate(func.expression, x);

            document.getElementById('traceX').textContent = x.toFixed(2);
            document.getElementById('traceY').textContent = y.toFixed(2);
            document.getElementById('traceF').textContent = isNaN(fValue) ? '—' : fValue.toFixed(2);

            traceInfo.classList.add('visible');
        } else {
            traceInfo.classList.remove('visible');
        }
    }

    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // Clear canvas
        this.ctx.fillStyle = '#0a0e14';
        this.ctx.fillRect(0, 0, width, height);

        // Draw grid and axes
        if (this.gridVisible) this.drawGrid();
        if (this.axesVisible) this.drawAxes();

        // Draw functions
        this.drawFunctions();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(139, 148, 158, 0.15)';
        this.ctx.lineWidth = 1;

        const xStep = this.getGridStep(this.viewportX.max - this.viewportX.min);
        const yStep = this.getGridStep(this.viewportY.max - this.viewportY.min);

        // Vertical lines
        const startX = Math.ceil(this.viewportX.min / xStep) * xStep;
        for (let x = startX; x <= this.viewportX.max; x += xStep) {
            const pixelX = this.worldToPixelX(x);
            this.ctx.beginPath();
            this.ctx.moveTo(pixelX, 0);
            this.ctx.lineTo(pixelX, this.canvas.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        const startY = Math.ceil(this.viewportY.min / yStep) * yStep;
        for (let y = startY; y <= this.viewportY.max; y += yStep) {
            const pixelY = this.worldToPixelY(y);
            this.ctx.beginPath();
            this.ctx.moveTo(0, pixelY);
            this.ctx.lineTo(this.canvas.width, pixelY);
            this.ctx.stroke();
        }
    }

    drawAxes() {
        this.ctx.strokeStyle = 'rgba(139, 148, 158, 0.5)';
        this.ctx.lineWidth = 2;

        const originX = this.worldToPixelX(0);
        const originY = this.worldToPixelY(0);

        // X-axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, originY);
        this.ctx.lineTo(this.canvas.width, originY);
        this.ctx.stroke();

        // Y-axis
        this.ctx.beginPath();
        this.ctx.moveTo(originX, 0);
        this.ctx.lineTo(originX, this.canvas.height);
        this.ctx.stroke();

        // Labels
        if (this.labelsVisible) {
            this.ctx.fillStyle = 'rgba(139, 148, 158, 0.7)';
            this.ctx.font = '12px JetBrains Mono';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'top';

            const xStep = this.getGridStep(this.viewportX.max - this.viewportX.min);
            const startX = Math.ceil(this.viewportX.min / xStep) * xStep;
            for (let x = startX; x <= this.viewportX.max; x += xStep) {
                if (Math.abs(x) > 0.01) {
                    const pixelX = this.worldToPixelX(x);
                    this.ctx.fillText(x.toFixed(0), pixelX, originY + 5);
                }
            }

            this.ctx.textAlign = 'right';
            this.ctx.textBaseline = 'middle';

            const yStep = this.getGridStep(this.viewportY.max - this.viewportY.min);
            const startY = Math.ceil(this.viewportY.min / yStep) * yStep;
            for (let y = startY; y <= this.viewportY.max; y += yStep) {
                if (Math.abs(y) > 0.01) {
                    const pixelY = this.worldToPixelY(y);
                    this.ctx.fillText(y.toFixed(0), originX - 10, pixelY);
                }
            }
        }
    }

    drawFunctions() {
        this.functions.forEach(func => {
            if (!func.enabled) return;

            this.ctx.strokeStyle = func.color;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();

            let firstPoint = true;

            for (let pixelX = 0; pixelX < this.canvas.width; pixelX += 2) {
                const x = this.pixelToWorldX(pixelX);
                const y = MathParser.evaluate(func.expression, x);

                if (!isNaN(y) && isFinite(y)) {
                    const pixelY = this.worldToPixelY(y);

                    if (pixelY >= 0 && pixelY <= this.canvas.height) {
                        if (firstPoint) {
                            this.ctx.moveTo(pixelX, pixelY);
                            firstPoint = false;
                        } else {
                            this.ctx.lineTo(pixelX, pixelY);
                        }
                    } else {
                        firstPoint = true;
                    }
                } else {
                    firstPoint = true;
                }
            }

            this.ctx.stroke();
        });
    }

    worldToPixelX(x) {
        const normalized = (x - this.viewportX.min) / (this.viewportX.max - this.viewportX.min);
        return normalized * this.canvas.width;
    }

    worldToPixelY(y) {
        const normalized = (this.viewportY.max - y) / (this.viewportY.max - this.viewportY.min);
        return normalized * this.canvas.height;
    }

    pixelToWorldX(pixelX) {
        const normalized = pixelX / this.canvas.width;
        return this.viewportX.min + normalized * (this.viewportX.max - this.viewportX.min);
    }

    pixelToWorldY(pixelY) {
        const normalized = pixelY / this.canvas.height;
        return this.viewportY.max - normalized * (this.viewportY.max - this.viewportY.min);
    }

    getGridStep(range) {
        const magnitude = Math.pow(10, Math.floor(Math.log10(range)));
        if (range / magnitude < 2) return magnitude / 10;
        if (range / magnitude < 5) return magnitude / 5;
        return magnitude;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new GraphApp();
});
