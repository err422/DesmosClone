// =========================
// Math Parser
// =========================
class MathParser {
    static evaluate(expression, x) {
        try {
            let expr = expression
                .replace(/\^/g, '**')
                .replace(/sin/g, 'Math.sin')
                .replace(/cos/g, 'Math.cos')
                .replace(/tan/g, 'Math.tan')
                .replace(/sqrt/g, 'Math.sqrt')
                .replace(/abs/g, 'Math.abs')
                .replace(/log/g, 'Math.log10')
                .replace(/ln/g, 'Math.log')
                .replace(/exp/g, 'Math.exp')
                .replace(/pi/g, 'Math.PI')
                .replace(/e(?![a-z])/g, 'Math.E');

            const func = new Function('x', `return ${expr}`);
            return func(x);
        } catch {
            return NaN;
        }
    }

    static evaluateExpression(expression) {
        try {
            let expr = expression
                .replace(/\^/g, '**')
                .replace(/×/g, '*')
                .replace(/÷/g, '/')
                .replace(/√/g, 'Math.sqrt')
                .replace(/sin\(/g, 'Math.sin(')
                .replace(/cos\(/g, 'Math.cos(')
                .replace(/tan\(/g, 'Math.tan(')
                .replace(/sqrt\(/g, 'Math.sqrt(')
                .replace(/abs\(/g, 'Math.abs(')
                .replace(/log\(/g, 'Math.log10(')
                .replace(/ln\(/g, 'Math.log(')
                .replace(/exp\(/g, 'Math.exp(')
                .replace(/pi/g, 'Math.PI')
                .replace(/e(?![a-z])/g, 'Math.E');

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
    static solve(equation) {
        try {
            if (!equation.includes('=')) {
                return {
                    type: 'expression',
                    result: MathParser.evaluateExpression(equation)
                };
            }

            const parts = equation.split('=');
            if (parts.length !== 2) {
                return { type: 'error', message: 'Invalid equation format' };
            }

            const left = parts[0].trim();
            const right = parts[1].trim();

            // No variable → just compare
            if (!left.includes('x') && !right.includes('x')) {
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
        if (degree > 2) return this.solveNumerical(expr);

        return { type: 'error', message: 'Cannot determine equation type' };
    }

    static detectDegree(expr) {
        if (expr.includes('x^3') || exper.includes('x**3')) return 3;
        if (expr.includes('x^2') || expr.includes('x**2') || expr.includes('x*x')) return 2;
        if (expr.includes('x')) return 1;
        return 0;
    }

    static solveLinear(expr) {
        const f0 = MathParser.evaluate(expr, 0);
        const f1 = MathParser.evaluate(expr, 1);

        if (Math.abs(f1 - f0) < 0.0001) {
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

        if (d < 0) {
            return { type: 'error', message: 'No real solutions (complex roots)' };
        }

        const x1 = (-b + Math.sqrt(d)) / (2 * a);
        const x2 = (-b - Math.sqrt(d)) / (2 * a);

        const solutions = Math.abs(x1 - x2) < 0.0001 ? [x1] : [x1, x2];

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

        if (degree === 1) {
            return (pts[1].y - pts[0].y) -
                this.getCoefficient(expr, 2);
        }

        if (degree === 2) {
            const d1 = pts[1].y - pts[0].y;
            const d2 = pts[3].y - pts[1].y;
            return (d2 - d1) / 2;
        }

        return 0;
    }

    static solveNumerical(expr) {
        let x = 1;
        const tol = 0.0001;
        const h = 0.0001;

        for (let i = 0; i < 100; i++) {
            const fx = MathParser.evaluate(expr, x);
            const d = (MathParser.evaluate(expr, x + h) - fx) / h;

            if (Math.abs(d) < tol) break;

            const xNew = x - fx / d;

            if (Math.abs(xNew - x) < tol) {
                return {
                    type: 'solution',
                    variable: 'x',
                    value: xNew,
                    solutions: [xNew]
                };
            }

            x = xNew;
        }

        if (Math.abs(MathParser.evaluate(expr, x)) < 0.01) {
            return {
                type: 'solution',
                variable: 'x',
                value: x,
                solutions: [x]
            };
        }

        return { type: 'error', message: 'Could not find solution numerically' };
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

        try {
            const result = MathParser.evaluateExpression(input);
            if (result === 'Error' || isNaN(result)) {
                resultEl.classList.remove('visible');
            } else {
                // Format the result
                const formatted = typeof result === 'number' ? result.toFixed(6).replace(/\.?0+$/, '') : result;
                resultEl.textContent = formatted;
                resultEl.classList.add('visible');
            }
        } catch {
            resultEl.classList.remove('visible');
        }
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
