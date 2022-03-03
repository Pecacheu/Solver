import rdl from 'readline';

const msg=console.log, rl=rdl.createInterface(process.stdin, process.stdout);
function read(q) {return new Promise(r=>{rl.question(q+' ',n=>r(n))})}
function getN(q) {
	return read(q).then(n => {
		try {n=eval(n)} catch(e) {n=null}
		if(typeof n!='number') throw "NaN!"; return n;
	});
}
function use(t,u) {msg("Usage:",t,u)}
function NM(n,sb) {return n==1?'':(sb||'')+(n==-1?'-':n)} //Print Multiplier
function XP(p,x) {if(!x)x='x';return p?NM(p,x+'^')||x:''} //Print Power
function LF(n) { //List Factors
	let f=[],i=1; n=Math.abs(n); for(; i<=n; i++) if(n%i==0) f.push(i); return f;
}
//function nPre(n) {let i=(n=n.toString()).indexOf('.'); return i==-1?0:n.length-i-1} //Precision
function aPct(a,p) { //Percentile
	if(Number.isInteger(p=(a.length-1)*p/100)) return a[p];
	return (a[Math.floor(p)]+a[Math.ceil(p)])/2;
}

//From Utils.js
Array.prototype.each = function(fn,st,en) {
	let i=st||0,l=this.length,r; if(en) l=en<0?l-en:en;
	for(; i<l; i++) if((r=fn(this[i],i,l))=='!') this.splice(i--,1),l--; else if(r!=null) return r;
}

function tstRng(n,f,min,max,stp) {
	msg("Test",n,min,'->',max);
	let x,xm,xx,y,ym,ymx,yx,yxx,yl;
	for(x=min; x<=max; x+=stp) {
		y=f(x); if(!Number.isNaN(y)) {
			if(xm==null) xm=x; else xx=x;
			if(ym==null || y<ym) ym=y,ymx=x; if(yx==null || y>yx) yx=y,yxx=x;
			if(x==min+1) { if(y>yl) ym=null; else if(y<yl) yx=null; } //Start Trajectory
			else if(x==max) { if(y>yl) yx=null; else if(y<yl) ym=null; } //End Trajectory
		}
		yl=y;
	}
	return [xm==min?null:xm, xx==max?null:xx, ym, ymx, yx, yxx];
}

async function getF(A) {
	let f=A[3]||await read("Formula?"); msg('Formula:',f);
	f=new Poly(f).s(1); msg(f+'\n'); return eval('x=>'+f);
}

//============================================== Polynomial Lib ==============================================

const PT=/[^\d.a-z()/*^+=-\s]/, DN=/^-\s*-/,
TS=/(?:^|\(|(?:[+=-]\s*){1,2})(?:\((?:\([^()]+\)|[^()])+\)|[/*^]\s*-?|[^()/*^+=-]+)+/g,
DP=/([*/])?\s*(-?\s*(?:[\d.]+|(?:sqrt)?\((?:\([^()]+\)|[^()])+\)|[a-z]))(?:\^(-?[a-z]|-?[\d.]+))?/g;

class Poly {
	constructor(f) {
		this.t=[]; if(Array.isArray(f)) {this.t=f;return}
		let m; if(PT.test(f)) throw "Bad Poly";
		for(m of f.matchAll(TS)) {m=new Term(m[0]);if(m.d.length)this.t.push(m)}
	}
	s(j) {let s='';this.t.each((t,i) => {s+=t.s(i,j)});return s}
	toString() {return this.s()}
	simp(m) { //Simplify
		let d=this.t.concat(),i=0,t;
		for(; i<d.length; i++) {
			t=d[i]; t.simp(m);
			d.each(n => {if(t.mat(n)) return t.e+=n.e,'!'},i+1);
		}
		return new Poly(d);
	}
	lt() { //Leading Term
		let l; this.t.each(t => {if((!l || t.xp()>l.xp()) && !t.q) l=t}); return l;
	}
}
class Term {
	constructor(t) {
		let d=this.d=[],m;
		if(Array.isArray(t)) this.d=d=t; else {
			t=t.toString().replace(DN,'');
			if(t.startsWith('=')) this.q=1;
			for(m of t.matchAll(DP)) { //Multi/Power
				m=new SubTerm(m[2],m[3],m[1]=='/'); if(m.e!=0 && m.x) d.push(m);
			}
		}
		if(!d[0]) return;
		Object.defineProperty(this,'e',{get:()=>d[0].e, set:n=>d[0]=d[0].copy(n)});
		if(!this.e || d[0].p!=1 || d[0].d) {
			if(m=d[0].x.startsWith('-')) this.e=d[0].x.substr(1);
			d.splice(0,0,new SubTerm(m?-1:1));
		}
	}
	s(t,j) {
		let s='', n=this.d.length!=1&&!this.d[1].d;
		this.d.each((t,i) => {s+=t.s(j,i,n)});
		if(this.q) return ' = '+s;
		return t?this.e<0?' - '+s.substr(1):' + '+s:s;
	}
	toString() {return this.s()}
	simp(m) {
		let d=this.d;
		d.each((s,i) => { //Simplify Pow & Par
			if(s.e && s.p!=1) (d[i]=s=s.copy(Math.pow(s.e,s.p))).p=1;
			if(s.pr) s.pr=s.pr.simp(m);
		});
		let e=this.e,v={},x; d.each((s,i) => { //Combine Exponents & Like-vars
			if(s.e) {if(s.p==1&&!s.d) return e*=s.e,'!'} else {
				if(x=v[s.x]) return (s.d?x.p-=s.p:x.p+=s.p),'!';
				v[s.x]=d[i]=s=s.copy(); if(s.d) s.d=0,s.p=-s.p;
			}
		},1);
		d.each((s,i) => { //Simplify Fractions
			if(!s.p) return '!'; //Delete 0s
			if(!s.d) return; let fa=LF(e), fb=LF(s.e), n=fa.length-1,f;
			if(m) msg("Factors",fa,fb); for(; n>=0; n--) if(fb.indexOf(f=fa[n])!=-1) {
				e=e/f, d[i]=s.copy(s.e/f); return (s.e/f==1)?'!':null;
			}
		});
		this.e=e;
	}
	xp() {return this.d.length>1&&this.d[1].x=='x'?this.d[1].p:0} //X Power
	et() {let s=this.d[0];return this.d.length==1 && s.e && !s.d && s.p==1}
	mat(t) { //Check if Terms match
		if(this.q||t.q) return 0; if(this.et()) return t.et();
		let n = !this.d.each(s => {
			if(s.e && !s.d && s.p==1) return;
			if(!t.d.each(n => (!n.e && s.x==n.x && s.p==n.p && s.d==n.d)||null)) return 1;
		});
		return n;
	}
	mul(b) { //Multiply Terms
		if(typeof b=='number') b=new Term(b);
		let n=this.d.concat(b.length?b:b.d),d=1,v={},x;
		if(n.each(s => {
			if(s.e==0) return 1; if(s.e) s.d?d/=s.e:d*=s.e;
			else (x=v[s.x])?(s.d?x.p-=s.p:x.p+=s.p):v[s.x]=s.copy();
		})) return 0;
		d=[new SubTerm(d)]; for(x in v) d.push(x);
		return new Term(d);
	}
	div(b) { //Divide Terms
		b=b.d.concat(); b.each((t,i) => {(b[i]=t.copy()).d=1});
		return this.mul(b);
	}
	add(b,s) { //Add/Sub Terms
		if(typeof b=='number') b=new Term(b);
		if(!this.mat(b)) throw "Cannot add "+b+" to "+this;
		let t=new Term(this.d.concat()); t.e+=s?-b.e:b.e; return t;
	}
}
class SubTerm {
	constructor(x,p,d) {
		let m=this; m.d=d;
		if(p==0) x=p=1; else m.p=Number(p)||p||1;
		if(typeof x=='number') m.x=m.e=x; else {
			m.x=x.replace(/ /g,''),m.e=Number(m.x);
			if((p=x.indexOf('('))!=-1)
				m.ps=x.substr(0,p+1),m.pr=new Poly(x.substring(p+1,m.x.length-1));
		}
	}
	s(j,i,n) {
		let e=this.e,x=this.x; if(this.pr) x=this.ps+this.pr.s(j)+')';
		if(j) return (i?this.d?'/':'*':'')+(this.p!=1?'Math.pow('+x+','+this.p+')':x);
		return (this.d?'/':i&&e?'*':'')+(e&&!i&&n?NM(e):XP(this.p,x));
	}
	copy(x) {return new SubTerm(x||this.x,this.p,this.d)}
}

function pMul(a,b) { //Multiply Polynomials
	let n=[],nt; a.t.each(at => b.t.each(bt => {
		n.push(nt=at.mul(bt)); msg(`${at} * ${bt} = ${nt}`);
	}));
	return new Poly(n);
}
function pDiv(a,b,p) { //Divide Polynomials
	if(b.t.length != 2) throw "Do not know how to solve when b terms != 2!";
	let n=[],nt,rt,ts,st; a.t.each((at,i) => {
		nt=(st||at).div(b.t[0]);
		if(p) msg(`${st||at} / ${b.t[0]} = ${nt}`);
		if(nt.d[0].e != Math.floor(nt.d[0].e)) {
			n.push(new Term((st||at)+'/('+b+')')); msg('Fully divided!'); return 1;
		}
		n.push(nt); if(ts=a.t[i+1]) {
			rt=nt.mul(b.t[1]), st=ts?ts.add(rt,1):'';
			if(p) msg(`Remainder: ${ts} - (${nt} * ${b.t[1]}) = ${ts} - ${rt} = ${st}`);
		} else msg('Done!');
	});
	return new Poly(n);
}

function PS(p,s) {p=new Poly(p);return (s%2?'\n':'')+(s>1?p.simp():p).s()} //Poly String
function PSS(p) {p=new Poly(p);return p+'\n'+p.simp()} //PS Simp
function pGet(p,e,q) { //Get Term w/ Exp
	return p.t.each(t => t.xp()==e&&t.q==q?t.e:null)||0;
}

//============================================== Code ==============================================

const ML = {
	r:'Run Matrix', p:'Polynomial Info', q:'Quadratic Solver',
	tp:'Two-Point Solver', ps:'Point-Slope Solver', es:'Equation System Solver',
	/*qv:'Quadratic to Vertex Form', vq:'Vertex Form to Quadratic',
	lf:'List Factors of N', f:'Factor Polynomial', u:'Formula Evaluator', dr:'Domain/Range Check',
	mp:'Multiply Polynomial', dp:'Divide Polynomial', sr:'Square Rule', a:'Dataset Analysis'*/
	//, h:'Histogram'
}, CS=/(?:^|\s+)("[^"]+"|\S+)/g, CC='`';

let MS='',n; for(let k in ML) MS+=(MS?','+(n?' ':'\n'):'')+CC+k+' = '+ML[k], n=!n;
msg("Pecacheu's Math Solver v1.6.1"); await run(process.argv);

async function runCmd(s) {
	let c=[0,0],m; while(m=CS.exec(s)) {
		m=m[1]; if(m.startsWith('"')) m=m.substr(1,m.length-2); c.push(m);
	}
	if(!s || c[2]=='r') use(CC+"<cmd> ...",'');
	else try {await run(c)} catch(e) {msg('-> '+e)}
}

async function run(A) {
let T=A[2], AL=A.length;
if(!T) T='r'; else if(T=='?') return msg(MS);
msg(ML[T]?`Mode: ${ML[T]}\n`:"Not supported!");
if(T=='r') {
	msg("Type '?' for help, 'q' to quit.");
	let f,v; while((f=(await read('>')).trim())!='q') {
		if(f=='?') msg(MS); else if(f.startsWith(CC)) await runCmd(f.substr(1));
		else if(f.startsWith('simp ')) msg(new Poly(f.substr(5)).simp(1).s());
		else f.split(';').each(s => {
			if(s.indexOf('=')!=-1) s='global.'+s; else s=new Poly(s).s(1);
			try{v=eval(s)} catch(e) {v=e.toString()} msg(s,'->',v);
		});
	}
} else if(T=='p') { //Poly Info
	if(AL != 4) return use(T,"<poly>");
	let p=new Poly(A[3]).simp(), t=p.lt();
	msg(p+"\nDegree:",t.xp(),"Lead Term: "+t);
} else if(T=='q') { //Quad Solve
	let p=new Poly(A[3]).simp();
	if(AL != 4 || p.lt().xp() > 2) return use(T,"<ax^2 + bx + c = y>");
	let a=pGet(p,2), b=pGet(p,1), c=pGet(p,0), y=pGet(p,0,1),
	yc=y-c, n=b/(2*a), ns=PS(`${b}^2/${2*a}^2`,2), ycs=`${yc}/${a}+${ns}`, ycn=PS(ycs);

	msg(p.s(),PS(`${a}x^2+${b}x=${yc}`,1),PS(`x^2+${b}x/${a}=${yc}/${a}`,1));
	msg(PS(`x^2+${b}x/${a}+${ns}=${ycs}`,2),`(Add (b/2a)^2 = ${ns} to both sides)`);
	msg(PS(`(x+${b}/${2*a})^2=${yc}/${a}+${ns}`),"(Apply square rule)")
	msg(PS(`x+${n}`),`= +/-sqrt(${ycn})`);
	msg(PS(`x=sqrt(${ycn})-${n}`)+';',PS(`x=-sqrt(${ycn})-${n}`));
	msg(`x = ${Math.sqrt(yc/a+Math.pow(n,2))-n}; x = ${-Math.sqrt(yc/a+Math.pow(n,2))-n}`);
} else if(T=='tp') { //Two-Point
	let x1=await getN("X1?"), y1=await getN("Y1?"), x2=await getN("X2?"),
	y2=await getN("Y2?"), m=(y2-y1)/(x2-x1), mx=m*-x1;

	msg(`\nPoints: (${x1},${y1}) and (${x2},${y2})`);
	msg(`Slope:\nm = (${y2}-${y1})/(${x2}-${x1})\nm = ${y2-y1}/${x2-x1}\nm = ${m}\n`);
	msg(`Point-Slope:\ny - y1 = m(x - x1)\ny - ${y1} = ${m}(x - ${x1})`);
	msg(`y - ${y1} = ${m}x - ${m}*${x1}`,'\n'+PS(`y=${m}x+${mx}+${y1}`));
	msg(PS(`y=${m}x+${mx+y1}`));
}/* else if(T=='ps' || T=='es') { //Point-Slope / Eq Sys
	msg("1st Equation (ax/b + cy/d = n)");
	let a=await getN("A?"), b=await getN("B?"), c=await getN("C?"), d=await getN("D?"),
	n=await getN("N?"), nd=n*d, ad=a*d, bc=b*c, a2,b2,c2,d2,n2,mt,c3,b3,m,rq,x,y;

	if(T=='s') {
		msg("2nd Equation (ax/b + cy/d = n)");
		a2=await getN("A?"), b2=await getN("B?"), c2=await getN("C?"), d2=await getN("D?"),
		n2=await getN("N?"), mt=c2*nd/(c*d2), c3=ad*c2, b3=bc*d2, m=b2*b3, rq=(n2-mt)*m,
		x=rq/((a2*b3)-(c3*b2)), y=(nd/c)-(ad*x/bc);
	}

	msg(T=='s'?"\nExpress First Equation as Y:":'');
	msg(`${a}x/${b} + ${c}y/${d} = ${n}\n${c}y/${d} = ${n} - ${a}x/${b}`);
	msg(`${c}y = ${n}*${d} - ${a}x*${d}/${b}\n${c}y = ${nd} - ${ad}x/${b}`);
	msg(`y = ${nd}/${c} - ${ad}x/(${b}*${c})\ny = ${nd/c} - ${ad}x/${bc}`);
	if(T=='s') {
		msg(`\nSubstitute Into Second Equation:\n${a2}x/${b2} + ${c2}y/${d2} = ${n2}`);
		msg(`${a2}x/${b2} + ${c2}(${nd/c} - ${ad}x/${bc})/${d2} = ${n2}`);
		msg(`${a2}x/${b2} + ${nd*c2/c}/${d2} - ${c3}x/${b3} = ${n2}`);
		msg(`${a2}x/${b2} - ${c3}x/${b3} = ${n2} - ${mt}`);
		msg(`${a2}x/${b2} - ${c3}x/${b3} = ${n2-mt}`);
		msg(`${a2*m}x/${b2} - ${c3*m}x/${b3} = ${rq} (Multiply all terms by ${b2}*${b3} = ${m})`);
		msg(`${a2*b3}x - ${c3*b2}x = ${rq} (Cancel out ${b2} and ${b3})`);
		msg(`${(a2*b3)-(c3*b2)}x = ${rq}`);
		msg(`x = ${rq}/${(a2*b3)-(c3*b2)}\nx = ${x}`);

		msg(`\nSolve for Y:\ny = ${nd/c} - ${ad}x/${bc}`);
		msg(`y = ${nd/c} - ${ad}*${x}/${bc}\ny = ${nd/c} - ${ad*x}/${bc}`);
		msg(`y = ${y}\n\nSolution: (${x},${y})`);
	}
} else if(T=='qv') {
	msg("y = ax^2 + bx + c");
	let a=await getN("ax^2?"), b=await getN("bx?"), c=await getN("c?"),
	ad=NM(a,'/'), h=b/(2*a), h2=Math.pow(h,2), k=c-h2*a;

	msg(`\ny = ${NM(a)}x^2 ${NS(b)}x ${NS(c)}`);
	if(ad) msg(`y${ad} = x^2 ${NS(b)}x${ad} ${NS(c)}${ad}`);
	msg(`y${ad} + ${h2} = x^2 ${NS(b/a)}x + ${h2} ${NS(c)}${ad} (Add (b/2a)^2 = ${h2} to both sides)`);
	msg(`y${ad} + ${h2} = (x ${NS(h)})^2 ${NS(c)}${ad} (Apply square rule)`);
	msg(`y${ad} = (x ${NS(h)})^2 ${NS(c/a)} - ${h2}`);
	msg(`y = ${NM(a)}(x ${NS(h)})^2 ${NS(k)}`);
	msg(`Vertex: (${-h},${k})`);
} else if(T=='vq') {
	msg("y = a(x - h)^2 + k");
	let a=await getN("A?"), h=await getN("H?"),
	k=await getN("K?"), as=NM(a), h2=Math.pow(h,2);

	msg(`\ny = ${as}(x ${NS(-h)})^2 ${NS(k)}`);
	msg(`y = ${as}x^2 ${NS(-h*a*2)}x ${NS(h2*a)} ${NS(k)}`);
	msg(`y = ${as}x^2 ${NS(-h*a*2)}x ${NS(h2*a+k)}`);
} else if(T=='lf') {
	msg("Factors:",LF(await getN("N?")));
} else if(T=='f') {
	let t=(await getN("Power?"))+1, tl=[],lt,s='';
	for(let i=0,n,l; i<t; i++) {
		tl[i]=n=await getN(String.fromCharCode(i+97)+XP(t-i-1)+'?'); //Read Values
		if(n) s += (i?' '+NS(n):n)+XP(t-i-1); //Build String
		n=Math.abs(n); if((l==null || n<l) && n!=0) l=n,lt=i; //Find Lowest Term
	}
	//Test Factors
	let fl=LF(tl[lt]),f,ft=[],xm=1;
	msg(`\ny = ${s}\nFactors of ${tl[lt]}:`,fl);
	for(let fc=fl.length,fn=fc-1,i; fn>=0; fn--) {
		f=fl[fn]; msg("Testing",f); for(i=0; i<t; i++) {
			ft[i]=tl[i]/f; msg(tl[i]+'/'+f+' = '+ft[i]);
			if(!Number.isInteger(ft[i])) { msg("Not Integer!"),f=0; break; }
		}
		if(f) { msg("GCF Found!"); break; }
	}
	//Calculate GCF of X
	for(let i=t-1; i>=0; i--) if(ft[i]) { xm=t-i; break; }
	s=''; for(let i=0,n; i<t; i++) {
		n=ft[i]; if(n) s+=(i?' '+NS(n):n)+XP(t-i-xm); //Build String
	}
	xm-=1; msg(`\nGCF of X: ${xm}\n\n${f+XP(xm)}(${s})`);
	if(t-xm==3) {
		let n=ft[1]/(2*ft[0]), s=Math.sqrt(-ft[2]/ft[0]+Math.pow(n,2));
		msg(`${f+XP(xm)}(x ${NS(-s+n)})(x ${NS(s+n)})`);
	}
} else if(T=='u') {
	let f=await getF(A), x=await getN("\nSolve N?");
	msg("Result:",f(x));
} else if(T=='dr') {
	const TMax=5000000, TStp=50, SStp=.1;
	let f=await getF(A), t=tstRng('Scan',f,-TMax,TMax,TStp); msg(t);
	t=[t[0]==null?'(-infinity':'['+tstRng('X-Min',f,t[0]-TStp,t[0]+TStp,SStp)[0],
		t[1]==null?'infinity)':tstRng('X-Max',f,t[1]-TStp,t[1]+TStp,SStp)[1]+']',
		t[2]==null?'(-infinity':'['+tstRng('Y-Min',f,t[3]-TStp,t[3]+TStp,SStp)[2],
		t[4]==null?'infinity)':tstRng('Y-Max',f,t[5]-TStp,t[5]+TStp,SStp)[4]+']'];
	msg(`Domain: ${t[0]},${t[1]}; Range: ${t[2]},${t[3]}`);
} else if(T=='mp') { //Multiply Poly
	if(AL != 5) return use(T,"<p1> <p2>");
	let p1=new Poly(A[3]), p2=new Poly(A[4]); msg(`(${p1}) * (${p2})\n\nFOIL Multiply:`);
	let m=pMul(p1,p2,1); msg('\n'+m+'\nSimplify: '+m.simp());
} else if(T=='dp') { //Divide Poly
	if(AL != 5) return use(T,"<p1> <p2>");
	let p1=new Poly(A[3]), p2=new Poly(A[4]); msg(`(${p1}) / (${p2})\n\nDivide:`);
	let m=pDiv(p1,p2,1); msg('\n'+m+'\nSimplify: '+m.simp());
} else if(T=='sr') { //Square Rule
	if(AL != 4) return use(T,"<poly>");
	let p=new Poly(A[3]); if(p.t.length != 2) throw "Must be two terms!";
	msg(`(${p})^2\n`+new Poly(`(${p.t[0]})^2 + ${p.t[0].mul(p.t[1]).mul(2)} + (${p.t[1]})^2`));
} else if(T=='a') { //Dataset Analysis
	if(AL < 4) return use(T,"<poly> [frac]");
	let a=A[3].split(/[;,]/g),b,l=a.length,rf=[],cf=0,cr=[],t=0,o={},k,m;
	//Calc Averages:
	a.each((n,i) => {t+=(a[i]=n=Number(n.replace(/[$,]/g,'')));o[n]?o[n]++:o[n]=1});
	for(let n in o) {n=Number(n);if(!m||o[n]>m) m=o[n],k=[n]; else if(o[n]==m) k.push(n)}
	b=Array.from(a); a.sort((a,b) => a-b); let N=t/l,M=aPct(a,50),v=0;
	if(k.length==1) k=k[0]; //Calc St Dev, Rel Freq:
	b.each((n,i) => {
		v+=Math.pow(n-N,2), cf+=n, A[4]?(rf[i]=n+'/'+t, cr[i]=cf+'/'+t):
		(rf[i]=Math.round(n*100/t)/100, cr[i]=Math.round(cf*100/t)/100);
	});
	//Basic Info:
	msg(a,"\nRel. Freq",rf,"\nCum. Freq",cr,"\nSize:",l,"Mean:",N,"Median:",M,"Mode:",k,'('+m+')');
	msg("St. Dev:",Math.sqrt(v/l),"Skew:",N==M?'Center':N<M?'Left':'Right');
	//Quadrants:
	let Q1=aPct(a,25), Q3=aPct(a,75), Q=Q3-Q1; o=[];
	a.each(n => {if(n < Q1-1.5*Q || n > Q3+1.5*Q) o.push(n)});
	msg("\nMin:",a[0],"Q1:",Q1,"Q2:",M,"Q3:",Q3,"Max:",a[l-1],"\nIQR:",Q,"Outliers:",o);
} else if(T=='h') { //Histogram
	let a=(A[3]||await read("Data?")).split(';'),
	B=await getN("Bars?"), R=await read("Range?"),S,E,P,p;
	if(R) R=R.split(','),S=Number(R[0]),E=Number(R[1]);
	else a.each((n,i) => {
		a[i]=n=Number(n.replace(/[$,]/g,'')),p=nPre(n);
		if(P==null||p>P) P=p; if(S==null||n<S) S=n; if(E==null||n>E) E=n;
	}), P=5/Math.pow(10,P), S-=P, E+=P;
	let W=(E-S)/B, r=[],i; for(i=0; i<B; i++) r[i]=[];
	msg("Bars:",B,"Width:",W,"Min:",S,"Max:",E);
	a.each(n => {
		for(i=0; i<B; i++) if(n>=S+W*i && n<S+W*(i+1)) {
			return r[i].push(n),msg(n,'between',S+W*i,'->',S+W*(i+1));
		}
		msg("No match for",n);
	});
	msg(); r.each((d,i) => {msg(S+W*i,'->',S+W*(i+1),'=',d.length)});
}*/}
rl.close();