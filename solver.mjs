import { normalize } from 'path/win32';
import rdl from 'readline';

const msg=console.log, use=(t,u) => msg("Usage:",t,u),
rl=rdl.createInterface(process.stdin, process.stdout),
read=q => new Promise(r=>{rl.question(q+' ',n=>r(n))}),
RN=n => {
	try {n=eval(n)} catch(e) {n=null}
	if(typeof n!='number') throw "NaN!"; return n;
}, getN=q => read(q).then(RN), //Get Num
LF=n => { //List Factors
	let f=[],i=1; n=Math.abs(n); for(; i<=n; i++) if(n%i==0) f.push(i); return f;
}, NA=Number.isNaN;
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
		y=f(x); if(!NA(y)) {
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
DP=/([*/])?\s*(-?\s*(?:[\d.]+|(?:sqrt)?\((?:\([^()]+\)|[^()])+\)|[a-z]))(?:\^(-?[a-z]|-?[\d.]+))?/g,
NM=(n,sb,p) => n==1?'':(sb||'')+(n==-1&&!p?'-':n), XP=(p,x) => p?x+NM(p,'^',1):'';
class Poly {
	constructor(f) {
		this.t=[]; if(Array.isArray(f)) {this.t=f;return}
		let m,q; if(PT.test(f)) throw "Bad Poly";
		for(m of f.matchAll(TS)) {
			if(m[0].startsWith('=')) q=2; else if(q) q=1;
			m=new Term(m[0],q); if(m.d.length) this.t.push(m);
		}
	}
	s(j) {let s='';this.t.each((t,i) => {s+=t.s(i,j)});return s}
	toString() {return this.s()}
	simp() { //Simplify
		let d=[],i=0,t;
		this.t.each((t,i) => {d[i]=t.copy().simp()});
		for(; i<d.length; i++) {
			t=d[i], d.each(n => {if(t.mat(n)) return t.e+=n.e,'!'},i+1);
			if(!t.e && i && t.q!=2) d.splice(i--,1); //Delete 0s
		}
		d.each(t => {t.simp()}); //2nd Cycle
		return new Poly(d.length?d:'0');
	}
	lt(q) { //Leading Term
		let l; this.t.each(t => {if((!l || t.xp()>l.xp()) && (!t.q)==(!q)) l=t}); return l;
	}
}
class Term {
	constructor(t,q) {
		let d=this.d=[],m; this.q=q;
		if(Array.isArray(t)) this.d=d=t; else {
			t=t.toString().replace(DN,'');
			for(m of t.matchAll(DP)) { //Multi/Power
				m=new SubTerm(m[2],m[3],m[1]=='/'); if(m.x) d.push(m);
			}
		}
		if(!d[0]) return;
		Object.defineProperty(this,'e',{get:()=>d[0].e, set:n=>d[0]=d[0].copy(n)});
		if(NA(this.e) || d[0].p!=1) {
			if(m=d[0].x.startsWith('-')) this.e=d[0].x.substr(1);
			d.splice(0,0,new SubTerm(m?-1:1));
		}
	}
	s(t,j) {
		let m=this, s='', n=m.d.length!=1&&m.d[1].p>0;
		m.d.each((t,i) => {s+=t.s(j,i,n)}); if(m.q==2) return ' = '+s;
		return t?m.e<0?' - '+s.substr(1):' + '+s:s;
	}
	toString() {return this.s()}
	simp() {
		let d=this.d;
		for(let i=0,s; i<d.length; i++) if((s=d[i]).pr) { //Simp Par
			let p=s.pr.simp(),t=p.t,n=t[0]; if(s.ps.length==1 && t.length==1) {
				if(s.p<0) n.d.each(s => {s.p=-s.p}); d.splice.apply(d,([i--,1]).concat(n.d));
			} else d[i]=s.copy(s.ps+p.s()+')');
		}
		d.each((s,i) => {if(s.e) (d[i]=s.copy(Math.pow(s.e,Math.abs(s.p)))).p=s.p>0?1:-1}); //Simp Pow
		let e=this.e,v={},x; d.each((s,i) => {
			if(!NA(s.e) && s.p==1) { //Combine Exponents
				if(s.p<0) {if(x=v['/']) return x.e*=s.e,'!'; v['/']=d[i]=s.copy()}
				else return e*=s.e,'!';
			} else { //Combine Like-vars
				if(s.n) s.x=s.xp,s.n=0,e=-e; //Invert Term
				if(x=v[s.x]) return x.p+=s.p,'!'; v[s.x]=d[i]=s=s.copy();
			}
		},1);
		d.each((s,i) => { //Simp Frac
			if(!s.p) return '!'; //Del 0-Pow
			if(s.p>0) return; if(s.e==0) e='NaN';
			let fa=LF(e), fb=LF(s.e), n=fa.length-1,f;
			for(; n>=0; n--) if(fb.indexOf(f=fa[n])!=-1) {
				if(s.e<0) f=-f; e=e/f, d[i]=s.copy(s.e/f); return (s.e/f==1)?'!':null;
			}
		});
		if(!e || e==='NaN') this.d.splice(1); //Del All
		this.e=e; return this;
	}
	xp() {return this.d.length>1&&this.d[1].x=='x'?this.d[1].p:0} //X Power
	mat(t) { //Check if Terms match
		let m=this; if((!m.q)!=(!t.q) || m.d.length!=t.d.length) return 0;
		return !m.d.each(s => t.d.each(n => n.mat(s)||null)?null:1);
	}
	mul(b) { //Multiply Terms
		if(typeof b=='number') b=new Term(b);
		return this.copy(this.d.concat(b.length?b:b.d)).simp();
	}
	div(b) { //Divide Terms
		b=b.d.concat(); b.each((t,i) => {(b[i]=t.copy()).p=-t.p});
		return this.mul(b);
	}
	add(b,s) { //Add/Sub Terms
		if(typeof b=='number') b=new Term(b);
		if(!this.mat(b)) throw "Cannot add "+b+" to "+this;
		let t=this.copy(this.d.concat()); t.e+=s?-b.e:b.e; return t;
	}
	copy(d) {let n=new Term(d||this.d,this.q);return n}
}
class SubTerm {
	constructor(x,p,d) {
		let m=this; if(p==0) x=p=1; m.p=Number(p)||p||1; if(d) m.p=-m.p;
		if(typeof x=='number') m.x=(m.e=x).toString(); else {
			m.x=x=x.replace(/ /g,''); if(m.e=Number(x)) return;
			m.xp=x.substr((m.n=x.startsWith('-'))?1:0);
			if((p=x.indexOf('('))!=-1 && x.endsWith(')'))
				m.ps=x.substr(0,p+1),m.pr=new Poly(x.substr(p+1,x.length-2));
		}
	}
	s(j,i,n) {
		let m=this,x=m.x,d=m.p<0,p=d?-m.p:m.p; if(m.pr) x=m.ps+m.pr.s(j)+')';
		if(j) return (d?'/':i?'*':'')+(p!=1?'Math.pow('+x+','+p+')':x);
		return (d?'/':i&&(!NA(m.e)||m.n)?'*':'')+(m.e&&!i&&n?NM(m.e):XP(p,x));
	}
	copy(x) {return new SubTerm(x==null?this.x:x,this.p)}
	mat(s) {let m=this;return m.p==s.p && (m.p<0?m.x==s.x:m.xp==s.xp)}
}

function pMul(a,b) { //Multiply Polynomials
	let n=[],nt; a.t.each(at => b.t.each(bt => {
		n.push(nt=at.mul(bt)); msg(`${at} * ${bt} = ${nt}`);
	}));
	return new Poly(n);
}
/*function pDiv(a,b,p) { //Divide Polynomials
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
}*/

function PS(p,s) {p=new Poly(p);return (s%2?'\n':'')+(s>1?p.simp():p).s()} //Poly String
function PSS(p) {p=new Poly(p);return p+'\n'+p.simp()} //PS Simp
function pGet(p,e,q) {return p.t.each(t => t.xp()==e&&t.q==q?t.e:null)||0} //Get Term w/ Exp

//============================================== Code ==============================================

const ML = {
	r:'Run Matrix', p:'Poly Info', q:'Quadratic Solver',
	lf:'List Factors', f:'Factor Poly', mp:'Multiply Poly', //dp:'Divide Poly',
	sr:'Square Rule', tp:'Two-Point Solver', ps:'Point-Slope Solver', es:'Equation System Solver',
	/*qv:'Quadratic to Vertex Form', vq:'Vertex Form to Quadratic',
	u:'Formula Evaluator', dr:'Domain/Range Check'*/
	a:'Dataset Analysis'
	//, h:'Histogram'
}, CS=/(?:^|\s+)("[^"]+"|\S+)/g, CC='`';

let MS='',n; for(let k in ML) MS+=(MS?','+(n?' ':'\n'):'')+CC+k+' = '+ML[k], n=!n;
msg("Pecacheu's Math Solver v1.6.2"); await run(process.argv);

async function runCmd(s) {
	let c=[0,0],m; while(m=CS.exec(s)) {
		if((m=m[1]).startsWith('"')) m=m.substr(1,m.length-2); c.push(m);
	}
	if(!s || c[2]=='r') use(CC+"<cmd> ...",''); else await run(c);
}

async function run(A) {
let T=A[2], AL=A.length;
if(!T) T='r'; else if(T=='?') return msg(MS);
msg(ML[T]?`Mode: ${ML[T]}\n`:"Not supported!");
if(T=='r') {
	msg("Type '?' for help, 'q' to quit.");
	let f,v,S; while((f=(await read('>')).trim())!='q') try {
		if(f=='?') msg(MS); else if(f.startsWith(CC)) await runCmd(f.substr(1));
		else f.split(';').each(s => {
			if(s=='simp') msg("Simplify",(S=!S)?"On":"Off");
			else if(S) msg(new Poly(f).simp().s()); else {
				if(s.indexOf('=')!=-1) s='global.'+s; else s=new Poly(s).s(1);
				try{v=eval(s)} catch(e) {v=e.toString()} msg(s,'->',v);
			}
		});
	} catch(e) {msg('->',e.toString())}
} else if(T=='p') { //Poly Info
	if(AL!=4) return use(T,"<poly>");
	let p=new Poly(A[3]).simp(), t=p.lt();
	msg(p+"\nDegree:",t.xp(),"Lead Term: "+t);
} else if(T=='q') { //Quad Solve
	let p=A[3]?new Poly(A[3]).simp():0;
	if(AL<4 || p.lt().xp()>2) return use(T,"<ax^2 + bx + c = y>");
	let a=pGet(p,2), b=pGet(p,1), c=pGet(p,0), y=pGet(p,0,1),
	n=b/(2*a), ns=PS(`${b}^2/${2*a}^2`,2), yca=PS(`${y-c}/${a}`,2), ycn=PS(`${yca}+${ns}`,2),
	xs=PS(`${b}/${2*a}`), xb=PS(`x+${xs}`), na=Math.sqrt((y-c)/a+Math.pow(n,2));

	msg(p.s(),PS(`${a}x^2+${b}x=${y-c}`,1),PS(`x^2+${b}x/${a}=${yca}`,3));
	msg(PS(`x^2+${b}x/${a}+${ns}=${yca}+${ns}`),`(Add (b/2a)^2 = ${ns} to both sides)`);
	msg(`(${xb})^2 = ${ycn} (Apply square rule)\n${xb} = +/-sqrt(${ycn})`);
	msg(PS(`x=sqrt(${ycn})-${xs}`)+';',PS(`x=-sqrt(${ycn})-${xs}`));
	if(A[4]) return `(x+${na-n})(x+${-na-n})`; msg(`x = ${na-n}; x = ${-na-n}`);
} else if(T=='lf') { //List Factors
	if(AL!=4) return use(T,"<x>");
	msg("Factors:",LF(RN(A[3])));
} else if(T=='f') { //Factor Poly
	if(AL!=4) return use(T,"<poly>");
	let p=new Poly(A[3]).simp(), t=p.lt().xp()+1, tl=[],lt,s='y=';
	for(let i=0,n,l; i<t; i++) {
		tl[i]=n=pGet(p,t-i-1); s+='+'+n+'x^'+(t-i-1); //Build String
		n=Math.abs(n); if((l==null || n<l) && n!=0) l=n,lt=i; //Find Lowest Term
	}
	//Test Factors
	let fl=LF(tl[lt]),f,ft=[],xm=1;
	msg(`\n${PS(s)}\nFactors of ${tl[lt]}:`,fl);
	for(let fc=fl.length,fn=fc-1,i; fn>=0; fn--) {
		f=fl[fn]; msg("Testing",f); for(i=0; i<t; i++) {
			ft[i]=tl[i]/f; msg(tl[i]+'/'+f+' = '+ft[i]);
			if(!Number.isInteger(ft[i])) { msg("Not Integer!"),f=0; break; }
		}
		if(f) { msg("GCF Found!"); break; }
	}
	//Calculate GCF of X
	for(let i=t-1; i>=0; i--) if(ft[i]) { xm=t-i; break; }
	s=''; for(let i=0; i<t; i++) s+='+'+ft[i]+'x^'+(t-i-xm); //Build String
	xm-=1, f+='x^'+xm; msg(`\nGCF of X: ${xm}\n`,PS(`${f}(${s})`,1));
	if(t-xm==3) msg(PS(f+await run([0,0,'q',s,1]),1));
} else if(T=='mp') { //Multiply Poly
	if(AL!=5) return use(T,"<p1> <p2>");
	let p1=new Poly(A[3]), p2=new Poly(A[4]); msg(`(${p1}) * (${p2})\n\nFOIL Multiply:`);
	let m=pMul(p1,p2,1); msg('\n'+m+'\nSimplify: '+m.simp());
}/* else if(T=='dp') { //Divide Poly
	if(AL!=5) return use(T,"<p1> <p2>");
	let p1=new Poly(A[3]), p2=new Poly(A[4]); msg(`(${p1}) / (${p2})\n\nDivide:`);
	let m=pDiv(p1,p2,1); msg('\n'+m+'\nSimplify: '+m.simp());
} */else if(T=='sr') { //Square Rule
	if(AL!=4) return use(T,"<poly>");
	let p=new Poly(A[3]),p2; if(p.t.length != 2) throw "Must be two terms!";
	p2=new Poly(`(${p.t[0]})^2+${p.t[0]}*${p.t[1]}*2+(${p.t[1]})^2`);
	msg(`(${p})^2\n`+p2,'\n'+p2.simp());
} else if(T=='tp') { //Two-Point
	let x1=await getN("X1?"), y1=await getN("Y1?"), x2=await getN("X2?"),
	y2=await getN("Y2?"), m=(y2-y1)/(x2-x1), mx=m*-x1;

	msg(`\nPoints: (${x1},${y1}) and (${x2},${y2})`);
	msg(`Slope:\nm = (${y2}-${y1})/(${x2}-${x1})\nm = ${y2-y1}/${x2-x1}\nm = ${m}\n`);
	msg(`Point-Slope:\ny - y1 = m(x - x1)`,PS(`y-${y1}=${m}(x-${x1})`,1));
	msg(PS(`y-${y1}=${m}x-${m}*${x1}`),'\n'+PSS(`y=${m}x+${mx}+${y1}`));
} else if(T=='ps' || T=='es') { //Point-Slope / Eq Sys
	msg("1st Equation (ax/b + cy/d = n)");
	let a=await getN("A?"), b=await getN("B?"), c=await getN("C?"), d=await getN("D?"),
	n=await getN("N?"), nd=n*d, ad=a*d, bc=b*c, eq=PS(`${nd}/${c}-${ad}x/${bc}`,2),
	a2,b2,c2,d2,n2,ab,cd,c3,b3,m,rq,xf,xd,x,y;
	if(T=='es') {
		msg("2nd Equation (ax/b + cy/d = n)");
		a2=await getN("A?"), b2=await getN("B?"), c2=await getN("C?"), d2=await getN("D?"),
		n2=await getN("N?"), ab=`${a2}x/${b2}`, cd=`${nd*c2}/${d2*c}`, c3=ad*c2, b3=bc*d2,
		m=b2*b3, rq=(n2-((nd*c2)/(d2*c)))*m, xf=`${a2*b3}x-${c3*b2}x=${rq}`,
		xd=(a2*b3)-(c3*b2), x=PS(rq+'/'+xd,2), y=(nd/c)-(ad*rq/(xd*bc));
	}
	msg(T=='es'?"\nExpress 1st Equation as Y:":'');
	msg(PS(`${a}x/${b}+${c}y/${d}=${n}`),PS(`${c}y/${d}=${n}-${a}x/${b}`,1));
	msg(PSS(`${c}y=${n}*${d}-${a}x*${d}/${b}`),'\ny =',eq);
	if(T=='es') {
		msg("\nSubstitute Into 2nd Equation:");
		msg(PS(`${ab}+${c2}y/${d2}=${n2}`),PS(`${ab}+${c2}(${eq})/${d2}=${n2}`,1));
		msg(PSS(`${ab}+${cd}-${c3}x/${b3}=${n2}`),PS(`${ab}-${c3}x/${b3}=${n2}-${cd}`,3));
		msg(PS(`${a2*m}x/${b2}-${c3*m}x/${b3}=${rq}`),`(Multiply all terms by ${b2}*${b3} = ${m})`);
		msg(PS(xf),`(Cancel out ${b2} and ${b3})`,PS(xf,3),'\nx =',x);
		msg("\nSolve for Y:\ny =",eq,'\n'+PSS(`y=${nd}/${c}-${ad}*${rq}/${xd*bc}`),`\n\nSolution: (${x},${y})`);
	}
}/* else if(T=='qv') { //Quad to Vertex
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
} else if(T=='vq') { //Vertex to Quad
	msg("y = a(x - h)^2 + k");
	let a=await getN("A?"), h=await getN("H?"),
	k=await getN("K?"), as=NM(a), h2=Math.pow(h,2);

	msg(`\ny = ${as}(x ${NS(-h)})^2 ${NS(k)}`);
	msg(`y = ${as}x^2 ${NS(-h*a*2)}x ${NS(h2*a)} ${NS(k)}`);
	msg(`y = ${as}x^2 ${NS(-h*a*2)}x ${NS(h2*a+k)}`);
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
} */else if(T=='a') { //Dataset Analysis
	if(AL < 4) return use(T,"<data> [frac]");
	let a=A[3].split(/[;,]/g),b,l=a.length,rf=[],cf=0,cr=[],t=0,o={},k,m;
	//Calc Averages:
	a.each((n,i) => {t+=(a[i]=n=Number(n.replace(/[$:]/g,'')));o[n]?o[n]++:o[n]=1});
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
}/* else if(T=='h') { //Histogram
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