
// ----- type methods ----- //

function isComma(ch) {
	return /,/.test(ch);
}

function isDot(ch) {
	return /\./.test(ch);
}

function isDigit(ch) {
	return /\d/.test(ch);
}

function isLetter(ch) {
	return /[a-z]/i.test(ch);
}

function isOperator(ch) {
	return /\+|-|\*|\/|\^/.test(ch);
}

function isLeftParenthesis(ch) {
	return /\(/.test(ch);
}

function isRightParenthesis(ch) {
	return /\)/.test(ch);
}

function isVariable(s) {
   return typeof s == "string" && s.length == 1 && isLetter(s);
}

function isOperator(ch) {
	return /\+|-|\*|\/|\^/.test(ch);
}

function isSpecial (s) {
	if (s.length == 0 || s[0] != '@') {
		return -1;
	}
	let x = Number(s.substr(1));
	if (isNaN(x) || !Number.isInteger(x)) {
		return -1;
	} else {
		return x;
	}
}

function isNumber (s) {
	return !isNaN(Number(s));
}


// --- Expression ---- //

// Tokenizes string based on parenthesis
function parseExpression (str) {
	// remove spaces
	str = removeSpaces(str);

  // Remove parenthesis
  const stack = [];
  const pols = [];
  let i = 0;
  while (i < str.length) {
    if (str[i] == '(') {
      stack.push(i);
      i++;
    } else if (str[i] == ')') {
      if (stack.length > 0) {
        let start = stack.pop();
        pols.push(str.substring(start + 1, i));
        let placeholder = `@${pols.length - 1}`
        str = str.substring(0,start) + placeholder + str.substr(i + 1);
        i = start + placeholder.length;
      } else {
        return null;
      }
    } else {
      i++;
    }
  }
	pols.push(str);
  if (stack.length > 0 || pols.length == 0) {
    return null;
  }
  console.log(pols);

	// parse each term
	for (let i = 0; i < pols.length; i++) {
		pols[i] = parsePolynomial(pols[i], pols);
	}

	pols[pols.length - 1].print();

}


// ---- Polynomials ----- //

function Polynomial (terms = []) {
	this.terms = terms;
}

Polynomial.prototype.print = function () {
	for (let i = 0; i < this.terms.length; i++) {
		console.log(this.terms[i].coef, this.terms[i].subterms);
	}
}

Polynomial.prototype.simplify = function () {

	for (let i = this.terms.length - 1; i >= 0; i--) {
		for (let j = i - 1; j >= 0; j--) {
			// console.log(i, j);
			if (this.terms[i].same(this.terms[j])) {
				// console.log("same");
				this.terms[j].coef += this.terms[i].coef;
				this.terms.splice(i, 1);
				// console.log(this.terms);
				break;
			}
		}
	}
}

Polynomial.prototype.add = function (pol2) {
	this.terms = this.terms.concat(pol2.terms);
	this.simplify();
}

Polynomial.prototype.subtract = function (pol2) {
	for (let i = 0; i < pol2.terms.length; i++) {
		pol2.terms[i].coef *= -1;
	}
	this.add(pol2);
}

function polynomialMultiply (p1, p2) {
	let result = [];
	for (let i = 0; i < p1.terms.length; i++) {
		let t1 = p1.terms[i];
		for (let j = 0; j < p2.terms.length; j++) {
			let t2 = p2.terms[j];
			//console.log(termMultiply(t1, t2));
			result.push(termMultiply(t1, t2));
		}
	}
	let resultPol = new Polynomial(result);
	resultPol.simplify();
	return resultPol;
}

function parsePolynomial (str, history = []) {
  // console.log(str);
  if (str.length == 0) {
    return null;
  }
  let lastCh = str[str.length - 1];
  if (isOperator(lastCh)) {
    return null;
  }

  let terms = [];
  let buffer = "";
  let operator = 1; //  + or -

  for (let i = 0; i < str.length; i++) {
    if (str[i] == '+') {
      if (buffer.length > 0) {
				terms.push({ operator, buffer });
				operator = 1;
        buffer = "";
      }
    } else if (str[i] == '-') {
      if (buffer.length > 0) {
				terms.push({ operator, buffer });
        operator = -1;
        buffer = "";
      } else {
        operator *= -1;
      }
    } else {
      buffer += str[i];
    }

  }
	terms.push({ operator, buffer }); // place leftover elements

	// pol gives us the regular part of the polynomial.
	let pol = new Polynomial();
	let special = [];

	// Split terms up into special and regular parts. If regular then parse while at it
	for (let i = 0; i < terms.length; i++) {
		if (terms[i].buffer.indexOf('@') < 0) {
			let term = parseTerm(terms[i].buffer);
			term.coef *= operator;
			pol.terms.push(term);
		} else {
			special.push(terms[i]);
		}
	}

	// parse the special terms
	for (let i = 0; i < special.length; i++) {
		if (special[i].operator == -1) {
			pol.subtract(parseSpecialTerm(special[i].buffer, history));
		} else {
			pol.add(parseSpecialTerm(special[i].buffer, history));
		}
	}

	return pol;
}


// ---- Terms ----- //

function Term () {
	this.coef = 1;
	this.subterms = {}
}

Term.prototype.same = function (t) {
	const k1 = Object.keys(this.subterms);
	const k2 = Object.keys(t.subterms);

	if (k1.length != k2.length) {
		return false;
	}

	for (let i = 0; i < k1.length; i++) {
		if (k1[i] != k2[i]) {
			return false;
		}
		if (Math.abs(this.subterms[k1[i]] - t.subterms[k2[i]]) > 0.0000000001) {
			return false;
		}
	}

	return true;
}

 function termMultiply (t1, t2) {
	 let result = new Term();
	 result.coef = t1.coef * t2.coef;
	 result.subterms = Object.assign( {}, t1.subterms);

	 const k2 = Object.keys(t2.subterms);

	 for (let i = 0; i < k2.length; i++) {
		 let property = k2[i];
		 if (result.subterms.hasOwnProperty(property)) {
				 result.subterms[property] += t2.subterms[property];
			 } else {
				 result.subterms[property] = t2.subterms[property];
		 }
	 }

	 return result;
 }

 /*

 let terms = [];
 let buffer = "";
 let operator = 1; //  + or -

 for (let i = 0; i < str.length; i++) {
	 if (str[i] == '+') {
		 if (buffer.length > 0) {
			 terms.push({ operator, buffer });
			 operator = 1;
			 buffer = "";
		 }
	 } else if (str[i] == '-') {
		 if (buffer.length > 0) {
			 terms.push({ operator, buffer });
			 operator = -1;
			 buffer = "";
		 } else {
			 operator *= -1;
		 }
	 } else {
		 buffer += str[i];
	 }

 }
 terms.push({ operator, buffer }); // place leftover elements

 */

 function tokenizeTerm (str) {
	 let subterms = [];
	 let buffer = "";
	 let operator = true;
	 for (let i = 0; i < str.length; i++) {
		 if (str[i] == '*' || str[i] == '/') {
			 if (buffer.length == 0) {
				 console.log("Invalid subterm expression: two operators * or / next to each other");
				 return null;
			 } else {
				 subterms.push({operator, subterm: buffer});
				 buffer = "";
			 }
			 if (str[i] == '*') {
				 operator = true;
			 } else {
				 operator = false;
			 }
		 } else {
			 buffer += str[i];
		 }
	 }
	 subterms.push({operator, subterm: buffer});
	 return subterms;
 }

 function constructTermFromSubterms (tokens) {
	 let term = new Term();

		for (let i = 0; i < tokens.length; i++) {
			if (isNaN(tokens[i].subterm)) {

				if (!tokens[i].operator) {
					tokens[i].subterm.exp *= -1;
				}

				if (term.hasOwnProperty(tokens[i].coef)) {
					term.subterms[tokens[i].subterm.coef] += tokens[i].subterm.exp;
				} else {
					term.subterms[tokens[i].subterm.coef] = tokens[i].subterm.exp;
				}
			} else {
				if (tokens[i].operator) {
					term.coef *= tokens[i].subterm;
				} else {
					term.coef /= tokens[i].subterm;
				}
			}
		}
		return term;
 }

function parseTerm (str) {
  // console.log(str);
  if (str.length == 0 || isOperator(str[0]) || isOperator(str[str.length - 1])) {
    return null;
  }

  let subterms = tokenizeTerm(str);
	for (let i = 0; i < subterms.length; i++) {
		subterms[i].subterm = parseSubterm(subterms[i].subterm);
	}
  let result = constructTermFromSubterms(subterms);

  return result;
}


function parseSpecialTerm (str, history) {
  // console.log(str);
  if (str.length == 0 || isOperator(str[0]) || isOperator(str[str.length - 1])) {
    return null;
  }

	// tokenize the string into subterms based of *
  let subterms = tokenizeTerm(str);

	// split up subterms into regular and special
	let special = [];
	let regular = [];
	let middle;

	for (let i = 0; i < subterms.length; i++) {
		if (subterms[i].subterm.indexOf('@') < 0) {
			middle = parseSubterm(subterms[i].subterm);
			subterms[i].subterm = middle
			regular.push(subterms[i]);
		} else {
			middle = parseSpecialSubterm(subterms[i].subterm, history);
			subterms[i].subterm = middle;
			special.push(subterms[i]);
		}
	}

	// construct term from regular subterms
	let term = constructTermFromSubterms(regular);

	// now I want to multiply the regular and special terms together
	let p = new Polynomial([term]);

	for (let i = 0; i < special.length; i++) {
		p = polynomialMultiply(p, special[i].subterm);
	}

  return p;
}


// ---- Subterms ----- //

function Subterm (coef, exp = 1) {
	this.coef = coef;
	this.exp = exp;
}

function splitUpSubterm (str) {
	if (str.length == 0) {
		return null;
	}

	let coef;
	let exp;
	let index = str.indexOf('^');
	if (index < 0) {
		coef = str;
		exp = 1;
	} else {
		coef = str.substring(0, index);
		exp = str.substr(index + 1);
		if (exp.length == 0 || coef.length == 0) {
			console.log("exponent and coefficients cannot be empty string");
			return null;
		}
	}
	return {coef, exp};
}

// Either a number or an exponent
function parseSubterm (str) {
	let subterm = splitUpSubterm(str);
	if (!subterm) {
		return null;
	}
	let {coef, exp} = subterm;

  // Exponent must be a number for now
  exp = Number(exp);
  if(isNaN(exp)) {
    console.log("exponents must be numeric");
    return null;
  }

  if (isVariable(coef)) {
    return new Subterm( coef, exp );
  }

  coef = Number(coef);

  if (isNaN(coef)) {
    console.log("Coefficient must be either a variable or a number");
    return null;
  }

  return Math.pow(coef, exp)
}


function parseSpecialSubterm (str, specialArr) {
	let subterm = splitUpSubterm(str);
	if (!subterm) {
		return null;
	}
	let {coef, exp} = subterm;

	// handle coefficient
	if (isSpecial(coef) >= 0) {
		let indx = isSpecial(coef);
		coef = specialArr[indx];
		if (exp === 1) {
			return specialArr[indx];
		}
		if (isPolynomailNumber(coef)) {
			coef = getPolynomialNumber(coef);
		} else if (isPolynomailVariable(coef)) {
		 	coef = getPolynomialVariable(coef);
		} else {
			console.log("invalid exponent");
			return null;
		}
	} else if (isVariable(coef)) {

	} else if (isNumber(coef)) {
		coef = Number(coef);
	} else {
		console.log("invalid exponent");
		return null;
	}

	// handle exponent
	if (isSpecial(exp) >= 0) {
		let indx = isSpecial(exp);
		exp = specialArr[indx];
		if (isPolynomailNumber(exp)) {
			exp = getPolynomialNumber(exp);
		} else {
			console.log("invalid exponent");
			return null;
		}
	} else if (isNumber(exp)) {
		exp = Number(exp);
	} else {
		console.log("invalid exponent");
		return null;
	}

	// handle return type
	if (!isNaN(coef) && !isNaN(exp)) {
		let term = new Term();
		term.coef = Math.pow(coef, exp);
		return new Polynomial([term]);
	} else {
		let term = new Term();
		term.subterms[coef] = exp;
		return new Polynomial([term]);
	}
}

// ---- Helpers ---- //

/*
function Polynomial (terms) {
	this.terms = terms;
}

function Term () {
	this.coef = 1;
	this.subterms = {}
}

function Subterm (coef, exp = 1) {
	this.coef = coef;
	this.exp = exp;
}

*/

function isPolynomailNumber (p) {
	if (p.terms.length != 1) {
		return false;
	}
	if (Object.keys(p.terms[0].subterms).length != 0) {
		return false;
	}
	return true;
}

function getPolynomialNumber (p) {
	return p.terms[0].coef;
}

function isPolynomailVariable (p) {
	if (p.terms.length != 1) {
		return false;
	}
	let k = Object.keys(p.terms[0].subterms);
	if (k.length != 1) {
		return false;
	}
	if (p.terms[0].subterms[k[0]] != 1 || p.terms[0].subterms.coef != 1) {
		return false;
	}
	return true;
}

function getPolynomialVariable () {
	let k = Object.keys(p.terms[0].subterms);
	return k[0];
}

function removeSpaces (s) {
	return s.replace(/\s+/g, '');
}

 //parseExpression('(5*x^2 + 1) + x^3 + 1');
parseExpression('1/t^2*t^(1/2) + y^(1/3)/y^(1/2)');

// let pol1 = parsePolynomial("5");
// let pol2 = parsePolynomial("x^3 + 2");
//pol1.print();
//pol2.print();
// let pol3 = polynomialAdd(pol1, pol2);
// pol3.print();

// console.log( parseTerm('2'));

// console.log(parseSubterm("3^2"));
