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
        if (expr.includes('x^3') || expr.includes('x**3')) return 3;
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