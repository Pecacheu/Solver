import rdl from 'readline';
import Color from './color.mjs';

function msg() {
	let a=arguments,l=a.length-1;
	if(typeof a[l]=='string') a[l]+=Color.Rst;
	else Array.prototype.push.call(a,Color.Rst);
	console.log(...a);
}
const use=(t,u) => msg(Color.Red+"Usage:",t,u),
rl=rdl.createInterface(process.stdin, process.stdout),
read=q => new Promise(r=>{rl.question(q+' ',n=>r(n))}),
RN=n => {try {n=eval(n)} catch(e) {n=null} if(typeof n!='number') throw "NaN!"; return n},
getN=q => read(q).then(RN), NA=Number.isFinite, IN=Number.isInteger,
LF=n => { //List Factors
	if(n>FACT_MAX) return [n]; let f=[],i=1;
	for(n=abs(n); i<=n; ++i) if(n%i===0) f.push(i); return f;
},
aPct=(a,p) => IN(p=(a.length-1)*p/100)?a[p]:(a[Math.floor(p)]+a[Math.ceil(p)])/2, //Percentile
//Math Functions:
abs=Math.abs, sqrt=Math.sqrt, cbrt=Math.cbrt, sin=Math.sin, cos=Math.cos, tan=Math.tan,
sec=x=>1/cos(x), csc=x=>1/sin(x), cot=x=>1/tan(x), asin=Math.asin, acos=Math.acos, atan=Math.atan,
rad=d=>d*2*Math.PI/360,
log=(b,x)=>b==2?Math.log2(x):b==10?Math.log10(x):Math.log(x)/(b?Math.log(b):1),
root=(x,n)=>(x>1||x<-1)&&0==n?1/0:(x>0||x<0)&&0==n?1:x<0&&n%2==0?`${(x<0?-x:x)**(1/n)}i`:3==n
	&&x<0?-cbrt(-x):x<0?-((x<0?-x:x)**(1/n)):3==n&&x>0?cbrt(x):(x<0?-x:x)**(1/n);

//From Utils.js
Array.prototype.each = function(fn,st,en) {
	let i=st||0,l=this.length,r; if(en) l=en<0?l-en:en;
	for(; i<l; i++) if((r=fn(this[i],i,l))==='!') this.splice(i--,1),l--; else if(r!=null) return r;
}

/*function tstRng(n,f,min,max,stp) {
	msg("Test",n,min,'->',max);
	let x,xm,xx,y,ym,ymx,yx,yxx,yl;
	for(x=min; x<=max; x+=stp) {
		y=f(x); if(NA(y)) {
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
}*/

//============================================== Polynomial Lib ==============================================

const PAR='\\((?:\\((?:\\((?:\\((?:\\([^()]+\\)|[^()])+\\)|[^()])+\\)|[^()])+\\)|[^()])+\\)',
FACT_MAX=1000000000, PT=/[^\d.a-z()/*^+<=>%-\s]/, EQ=/[<=>]+/,
FL='sqrt|cbrt|abs|rad|sin|cos|tan|sec|csc|cot|asin|acos|atan|ln|log[\\d]*',
DN=/^-\s*-/, ST=`(-?\\s*(?:[\\d.]+%?|(?:${FL})?${PAR}|[a-z]))`,
TS=new RegExp(`([<>]=?|=)?\\s*(?:[+-]\\s*){0,2}(?:${PAR}|[/*^]\\s*-?|[^()/*^+<=>-]+)+`,'g'),
DP=new RegExp(`([*/])?\\s*${ST}(?:\\^${ST})?`,'g'),
NM=(n,sb,p) => n==1?'':(sb||'')+(n==-1&&!p?'-':n), XP=(p,x) => p?x+NM(p,'^',1):'',
FR=x => {for(let n=x,v; n>0; n--) if(IN(v=sqrt(n)) && IN(x/n)) return v}, //Factor root
NG=x => NA(x)?x<0:x.length&&x.startsWith('-'), JX=(x,p) => x=='e'?`Math.exp(${p})`:
	(x=isFinite(x)||x.length!=1?x:x=='p'?'Math.PI':'v.'+x, p==1?x:`(${x}**${p})`),
SFL=s => (s[0]=='<'?'>':s[0]=='>'?'<':s[0])+s.substr(1), //Sign flip
GCD=(a,b) => {for(let t;b;)t=b,b=a%b,a=t;return a}, //Greatest Common Denominator
PEQ=(a,b) => a.pn==b.pn&&(a.p.s&&b.p.s?a.p.s()==b.p.s():a.p==b.p), //Power Equals
AJ=(a,s) => (s=s?s:'',a.join(s+' ')+s); //Join w/ Suffix

class Poly {
	constructor(f) {
		this.t=[]; if(Array.isArray(f)) {this.t=f;return}
		let m,q; if(PT.test(f)) throw "Bad Poly";
		for(m of f.matchAll(TS)) {
			if(m[1]) q=m[1]; else if(q) q=1;
			m=new Term(m[0],q); if(m.d.length) this.t.push(m);
		}
	}
	s(j) {let s='';this.t.each((t,i) => {s+=t.s(i,j)});return s}
	toString() {return this.s()}
	simp(xv) { //Simplify
		let d=[],i=0,t,r,s,q,dq;
		this.t.each((t,i) => {d[i]=t.copy().simp();if(t.q)dq=1});
		for(; i<d.length; i++) {
			t=d[i]; d.each(n => t.like(n)?(t.e+=n.e,'!'):null, i+1); //Combine Like-Terms
			if(t.e==0 && (!t.q||t.q==1||i<d.length-1)) {
				d.splice(i--,1); if(t.q&&t.q!=1) d[i+1].q=t.q;
			}
			if(t.d.length==2 && (r=t.d[1]).pr) { //Paren
				if(r.p==1 && ((s=(dq & r.ps=='sqrt(' && !i && (!d[1] || d[1].q)))
				|| abs(t.e)==1 && r.ps.length==1)) {
					if(s) { //Invert Sqrt
						s='',q=d[1]&&d[1].q; d.each(n => {n.e*=t.e,n.q=0,s+=' '+n},1);
						(s=new Term((t.e<0?'-':'')+`(${s})^2`)).q=t.e<0?SFL(q):q; d=[s];
					} else { //Remove Par
						r.pr.t[0].q=t.q; if(t.e<0) r.pr.t.each(n => {n.e=-n.e});
					}
					d.splice.apply(d,([i--,s?0:1]).concat(r.pr.t));
				} else if(r.ps.startsWith('l')) { //Simp Log Terms
					d.each(n => { if(n.d.length>1 && n.d[1].ps==r.ps && PEQ(n,t)) {
						r.pr=new Poly(`(${r.pr})^${t.e}(${n.d[1].pr})^${n.e}`).simp();
						t.e=1; return '!';
					}},i+1);
				}
			}
		}
		for(i=0; i<d.length; i++) { //2nd Cycle
			t=d[i]; t.simp(); q=t.d.each(s => s.pn||null);
			d.each((n,v) => {
				if((q || n.d.each(s => s.pn||null)) && !n.q==!t.q
				&& (!xv || (tSer(t,xv)!=null)==(tSer(n,xv)!=null))) { //Simp Frac
					let an=[],ad=[],bn=[],bd=[],am,bm;
					t.d.each(s => {if(s.pn) s.inv(),ad.push(s.s()),s.inv(); else an.push(s.s())});
					n.d.each(s => {if(s.pn) s.inv(),bd.push(s.s()),s.inv(); else bn.push(s.s())});
					am=ad=' '+AJ(ad), bm=bd=' '+AJ(bd); if(ad==bd) am=bm=bd='';
					(r=new Term(`(${AJ(an)+bm}+${AJ(bn)+am})`+ad+bd)).q=t.q;
					r.d.each(s => s.inv(),2); //msg("> SIMP FRAC",r.s());
					r.simp(); if(!bd.length || !r.d[1].pr) d[i]=r,d.splice(v,1);
					return 1;
				}
			},i+1);
		}
		if(!d[0]||d[0].q) d.splice(0,0,new Term(0));
		return new Poly(d);
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
		if(!NA(this.e) || d[0].np()!=1) d.splice(0,0,new SubTerm(d[0].n?-1:1)),d[1].n=0;
	}
	s(t,j) {
		let m=this,d=m.d,n=abs(m.e)==1&&d.length>1&&!d[1].pn,s='';
		d.each((t,i) => {s+=t.s(j,i)},1); s=d[0].s(j,0,n)+(n&&s.startsWith('*')?s.substr(1):s);
		return m.q&&m.q!=1?` ${m.q} `+s:t?m.e<0||m.n?' - '+s.substr(1):' + '+s:s;
	}
	toString() {return this.s()}
	simp() {
		let d=this.d;
		for(let i=0,s,n; i<d.length; i++) { if((s=d[i]).p instanceof Poly) { //Simp Pow
			n=s.pn; s.sp(s.p.simp()); if(n&&n!=s.pn) s.pn=!s.pn; n=s.p.t;
			if(n.length==1 && n[0].d.length==1) s.p=n[0].e; //Rem Par
			else if(s.p.s()=='1/2') s=d[i]=new SubTerm(`sqrt(${s.pr||s.x})`,1,s.pn); //Convert 1/2 to sqrt
		} if(s.pr) { //Simp Par
			let p=s.pr.simp(), t=p.t; n=NA(s.p)&&t.length==1&&t[0];
			if(n && s.ps.length==1 && (s.np()==1||!n.d.each(m => NA(m.p)?null:1))) {
				n.d.each(m => m.sp(m.np()+'*'+s.np())); d.splice.apply(d,([i--,1]).concat(n.d));
			} else if(n && s.ps=='sqrt(') { //Simp Sqrt
				if(s.p>1 && !(s.p%2) && s.pr.t[0].e>0) s.p/=2,s.ps='(',s.x=s.x.substr(4); //Rem Sqrt
				else {
					let e=n.e,x=IN(e)?FR(abs(e)):1,r=abs(e/x/x); x=[s.copy(x||0)];
					if(r>1) x[1]=s.copy(`sqrt(${r})`); //Remainder
					n.d.each(m => {
						if(m.np()>1&&!(m.p%2)) x.push((m.p/=2)>1?m:s.copy(`abs(${m.s()})`));
						else {
							if(p=m.pn) m.inv(); t=s.copy(`sqrt(${m.s()})`);
							if(p) t.inv(); x.push(t);
						}
					},1);
					if(e<0) x.push(s.copy('i')); //Complex
					d.splice.apply(d,([i,1]).concat(x)); i+=x.length-1;
				}
			} else d[i]=s.copy((s.n?'-':'')+s.ps+p.s()+')');
		}}
		let e=this.e,v={},x,n; d.each((s,i) => {
			if((n=NA(s.p)) && NA(s.e)) { //Combine Num
				(d[i]=s=s.copy(s.e**s.p)).sp(s.pn?-1:1);
				if(s.pn) {if(x=v['/']) return x.e*=s.e,'!'; v['/']=d[i]=s.copy()}
				else return e*=s.e,'!';
			} else { //Combine Like-vars
				if(s.n) s.n=0,e=-e; //Invert Term
				if(x=v[s.x]) return x.sp(n&&NA(x.p)?
					x.np()+s.np():`(${x.np()})+(${s.np()})`),'!';
				v[s.x]=d[i]=s.copy();
			}
		},1);
		d.each((s,i) => { //Del 0-Pow & Simp Frac
			if(!s.p) return '!'; if(s.np()==-1) {
				if(s.e==0) return e='n'; if(e && s.e) {
					let f=GCD(e,s.e), n=s.e/f; if(n<0) f=-f,n=-n;
					e=e/f, d[i]=s.copy(n); if(n==1) return '!';
				}
			}
		});
		if(!e || e==='n') this.d.splice(1); //Del All
		this.e=e; return this;
	}
	xp(v) {return (v=tSer(this,v||'x'))!=null?this.d[v].np():0} //X Power
	like(t) { //Check if Like-Terms
		let m=this; if((!m.q)!=(!t.q) || m.d.length!=t.d.length) return 0;
		return !m.d.each(s => t.d.each(n => n.mat(s)||null)?null:1);
	}
	mul(b) { //Multiply Terms
		if(typeof b=='number') b=new Term(b);
		return this.copy(this.d.concat(b.length?b:b.d)).simp();
	}
	div(b) { //Divide Terms
		b=b.d.concat(); b.each((t,i) => (b[i]=t.copy()).inv());
		return this.mul(b);
	}
	copy(d) {return new Term(d||this.d,this.q)}
}
class SubTerm {
	constructor(x,p,d) {
		let m=this; if(p==0) x=p=1; m.sp(p||1); if(d) m.inv();
		if(typeof x=='number') m.x=abs(m.e=x).toString(),m.n=x<0; else {
			m.x=x.replace(/ /g,'');
			if(m.x.endsWith('%')) m.x=(Number(m.x.substr(0,m.x.length-1))/100).toString();
			m.e=Number(m.x); m.x=m.x.substr((m.n=NG(m.x))?1:0);
			if(!m.e && (p=x.indexOf('('))!=-1 && x.endsWith(')'))
				m.ps=x.substring(m.n?1:0,p+1).replace(/ /g,''),m.pr=new Poly(x.substr(p+1,x.length-2));
		}
	}
	s(j,i,n) {
		let m=this,x=m.x,p=m.p,ps=m.ps,s=ps&&ps.length>1;
		if(p instanceof Poly) p=(p.t.length==1&&p.t[0].d.length==2&&p.t[0].e==1)?p.s(j):`(${p.s(j)})`;
		if(m.e==0) x=0; if(ps) { //Paren
			if(j&&ps.startsWith('log')) ps=`log(${Number(ps.substr(3,ps.length-4)||10)},`;
			else if(j&&ps=='ln(') ps='log(0,'; x=ps+m.pr.s(j)+')';
		}
		if(j) p=JX(p,1); return (m.pn?'/':i&&(j||NA(m.e)||m.n||s)?'*':'')
			+(!i&&n?NM(m.e):(m.n?'-':'')+(j?JX(x,p):XP(p,x)));
	}
	sp(p) {
		let m=this; if(p instanceof Poly) {
			if(p.t.length==1 && p.t[0].e<0) m.pn=1,p.t[0].e=-p.t[0].e; return m.p=p;
		}
		m.pn=NG(p); if(!NA(m.p=abs(p))) p=p.substr(m.pn?1:0),
			m.p=new Poly(p.startsWith('(')&&p.endsWith(')')?p.substr(1,p.length-2):p);
	}
	inv() {this.pn=!this.pn}
	np() {let m=this,p=m.p; return NA(p)?(m.pn?-p:p):(m.pn?'-':'')+p}
	copy(x) {return new SubTerm(x==null?(this.n?'-':'')+this.x:x,this.np())}
	mat(s) {let m=this;return PEQ(m,s) && (m.pn?m.e==s.e:1) && ((NA(m.e)&&NA(s.e))||m.x==s.x)}
}

function pMul(a,b,m) { //Multiply Polynomials
	let n=[],nt; a.t.each(at => b.t.each(bt => {
		n.push(nt=at.mul(bt)); m&&msg(at+' * '+bt+' = '+nt);
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

//============================================== Support Functions ==============================================

const PS=(p,s) => (p=new Poly(p),(s%2?'\n':'')+(s>1?p.simp():p).s()), //Poly String
PSS=p => (p=new Poly(p),p+'\n'+p.simp()), //PS Simp
pGet=(p,e,q) => p.t.each(t => t.xp()==e&&t.q==q?t.e:null)||0, //Get Term w/ Exp
sSer=(s,v) => s.x==v||(s.pr&&pSer(s.pr,v)!=null)||(s.p instanceof Poly&&pSer(s.p,v)!=null), //Sub var search
tSer=(t,v) => t.d.each((s,i) => sSer(s,v)?i:null), //Term var search
pSer=(p,v) => p.t.each((t,i) => tSer(t,v)!=null?i:null), //Poly var search
sGet=s => {let q=EQ.exec(s),i=q.index,l=q[0].length; return [s.substr(i,l),
	s.substr(0,i).trim(),s.substr(i+l).trim()]} //Get Sign

function Der(p,v) { //Calc Derivative
	let d=[],f,q,ql,x,w,c,n; p.t.each(t => {
		c='',q=[],f=[]; t.d.each(s => {sSer(s,v)?q.push(s):c+=s.s()+' '}); //Separate Constants & X-Terms
		ql=q.length; if(!ql) return; if(ql>2) return msg(Color.Red+"Can't do >2 sub-terms yet!");
		q.each((q,i) => {
			if(q.pn) q.inv(),q.QN=1;
			if(q.QN&&!i) return msg(Color.Red+"Can't do negative pow terms!");
			x=q.ps?q.pr.s():q.x, w=q.np(), n='';
			if(q.ps && x!=v) n+=`(${Der(q.pr,v)})`,msg(); //Chain Rule
			if(q.p instanceof Poly && pSer(q.p,v)!=null) { //X-Power
				if(q.p.s()!=v) n+=`(${Der(q.p,v)})`,msg(); //Power Chain Rule
				if(q.ps) return msg(Color.Red+"OOPS!"+Color.Rst,t,q); //???
				n+=q.s()+` ln(${q.x})`;
			} else {
				if(q.ps) {if(q.ps.startsWith('log')) n+=`/(${x})/ln(${q.ps.substring(3,q.ps.length-1)||10})`;
				else switch(q.ps) {
					case 'ln(': n+=`/(${x})`; break; case 'sqrt(': n+=`1/2/sqrt(${x})`; break;
					case 'sin(': n+=`cos(${x})`; break; case 'csc(': n+=`-csc(${x})*cot(${x})`; break;
					case 'cos(': n+=`-sin(${x})`; break; case 'sec(': n+=`sec(${x})*tan(${x})`; break;
					case 'tan(': n+=`sec(${x})^2`; break; case 'cot(': n+=`-csc(${x})^2`; break;
					case '(': break; default: return msg(Color.Red+"OOPS!"+Color.Rst,t,q); //???
				}}
				if((!q.ps||q.ps=='(') && w!==1) n+=w+q.x+`^(${w}-1)`; //Var Power
			}
			if(ql>1) msg(`d/d${v}[${q.s()}] = `+n); f.push(n);
		});
		if(ql==2) { //Quotient/Product Rule
			 if(q[0].QN) {
				x=1;
			}
			x=q[1].QN;
			msg(`\nUsing ${x?'Quotient':'Product'} Rule:`); w=q[1].s();
			if(x) {
				msg("f'(x)/g(x) - f(x)*g'(x)/g(x)^2");
				f=[`(${f[0]})/(${w})`,`-(${q[0].s()})*(${f[1]})/(${w})^2`];
			} else {
				msg("g(x)*f'(x) + f(x)*g'(x)");
				f=[`(${w})*(${f[0]})`,`(${q[0].s()})*(${f[1]})`];
			}
			msg(f.join(' + ')+'\n');
		}
		f.each((t,i) => {f[i]=c+t}); d.push(...f);
	});
	d.each((t,i) => {d[i]=new Term(t)}); x=(d=new Poly(d)).s(), f=d.simp(v).s();
	msg(Color.Ylo+`d/d${v}[${p}]\n`+Color.Br+Color.Blu+`= ${x}`+(f!=x?'\n= '+f:''));
	return f;
}

//============================================== Code ==============================================

const ML = {
	r:'Run', s:'Solver', d:'Derivative', p:'Poly Info', lf:'List Factors',
	mp:'Multiply Poly', pp:'Poly Power', //dp:'Divide Poly',
	tp:'Two-Point Solver', ps:'Point-Slope Solver', es:'Equation System',
	qv:'Quadratic to Vertex Form', vq:'Vertex Form to Quadratic',
	rt:'Root', ci:'Compound Interest', ic:'Inverse Comp Int',
	/*dr:'Domain/Range Check'*/ a:'Dataset Analysis'//, h:'Histogram'
}, CS=/(?:^|\s+)("[^"]+"|\S+)/g, CC='`',
MC=Color.BgBlu+Color.Whi, VAR={};

let MS='',n; for(let k in ML) MS+=(MS?','+(n?' ':'\n'):'')+CC+k+' = '+ML[k], n=!n;
msg(Color.Grn+"Pecacheu's Math Solver v1.6.8"); await run(process.argv);

async function runCmd(s) {
	let c=[0,0],m; while(m=CS.exec(s)) {
		if((m=m[1]).startsWith('"')) m=m.substr(1,m.length-2); c.push(m);
	}
	if(!s || c[2]=='r') use(CC+"<cmd> ...",''); else await run(c);
}

async function run(A) {
let T=A[2], AL=A.length;
if(!T) T='r'; else if(T=='?') return msg(MS);
msg(Color.BgMag+"Mode:",ML[T]?ML[T]+Color.Rst+'\n':"Not Supported");
if(T=='r') { //RUN
	msg("Type '?' for help, 'q' to quit.");
	let f,r,v=VAR,S; while((f=(await read('>')).trim())!='q') try {
		if(f=='?') msg(MS); else if(f.startsWith(CC)) await runCmd(f.substr(1));
		else f.split(';').each(s => {
			if(s=='simp') msg(MC+"Simplify",(S=S==1?0:1)?"On":"Off");
			else if(s=='sx') msg(MC+"Simp X",(S=S==2?0:2)?"On":"Off");
			else if(s=='code') msg(MC+"Code",(S=S==3?0:3)?"On":"Off");
			else if(s.startsWith('del ')) delete(v[s=s.substr(4).trim()]),msg("Delete",s);
			else if(s=='vars') msg(v); else if(S && (S<2||S==2&&s.indexOf('=')==-1)) {
				if(S==2) msg(s.replace(/x/g,' '+v.x+' '));
				s=new Poly(S==2&&NA(v.x)?s.replace(/x/g,' '+v.x+' '):s).simp();
				msg((S==2?`f(${NA(v.x)?v.x:'x'}) = `:'')+Color.Ylo+s);
			} else {
				if(S!=3) s=new Poly(s).s(1); try {r=eval(s)}
				catch(e) {r=Color.Red+e} msg(Color.Di+s,Color.Rst+'->',r);
			}
		});
	} catch(e) {msg(Color.Red+'-> '+e)}
} else if(T=='s') { //Solve
	let p=A[3], v=A[4]||'x', pm=Array.from(p.matchAll(new RegExp(EQ,'g')));
	if(AL<4 || !pm.length || !(/^[a-z]$/).test(v)) return use(T,"<poly> <var>");
	let pl=[],re=[],x,q,qd=0; //Convert Multi-Poly:
	pm.each((_,i,l) => {pl.push(new Poly(p.substring(i?pm[i-1].index+
		pm[i-1][0].length:0, i==l-1?p.length:pm[i+1].index-1)))});
	for(p=0; p<pl.length; p++) { //Solve Poly
		let a,s,s2,m,LP=0; if(p) msg("\nSolve Split #"+p);
		while((s=pl[p].s()) != s2) { //Run Solver
			x=[]; if(++LP>20) throw "Stuck!"; msg(s,Color.Di+(m?`(${m})`:''));
			m=0,a=(pl[p]=pl[p].simp(v)).t; if((s2=pl[p].s()) != s) msg(s2,Color.Di+"(Simplify)");
			if(!a.each((t,i) => { //Move Term
				if((q=tSer(t,v))!=null) x.push({t:t,s:t.d[q]});
				if(t.e && !q==!t.q) { //Non-zero terms on wrong side of eq
					q=t.q; if(q&&q!=1) (a[i+1]?a[i+1]:a[i+1]=new Term(0)).q=q;
					m="Move Term "+t.s().trim(), t.e=-t.e, t.q=!q;
					if(!q&&!i&&a[i+1].q) a.splice(i,1,new Term(0)); else a.splice(i,1);
					a.splice(q?i-1:a.length,0,t); return 1;
				}
			})) { //All terms moved
				if(qd<2 && (q=x.each(x => x.t.d.each(s => s.pr&&NA(s.p)&&(x.s=s)||null)?x:null))) { //Paren
					if((q.s.ps=='sin(' || q.s.ps=='cos(' || q.s.ps=='tan(') && q.s.np()==1 && q.t.e==1) {
						s=''; a.each((t,i) => {if(t.q) (q.q?0:(m=i,q.q=t.q)),t.q=0,s+=t});
						pl[p]=new Poly(q.s.pr+q.q+'a'+q.s.ps+s+')'); m="Arc Function"; continue;
					} else if(q.s.ps=='abs(' && q.s.np()==1) { //Undo Abs
						//TODO: Handle other pow on abs?
						q.s.ps='(', q.n=new Term(q.t.s()), q.n.e=-q.n.e;
						(m=new Poly(s2)).t.splice(a.indexOf(q.t),1,q.n), pl.push(m);
						m="Undo Abs; Split #"+(pl.length-1); continue;
					} else if(q.s.ps.length==1 && !q.s.pn) { //Multiply
						//TODO: If s.pn, then move parenthesis term to other side (s.inv()), pMul on ENTIRE contents of other side (as if enclosed in paren, but saves a processing step)
						let r,w,ml=[]; m=0; q.t.d.each(s => { if(NA(w=s.np())) {
							if(s==q.s) r=(w>2 || (w>1 && x.length>1)),s.NP=--w; //Power
							else r=(s.e!=1 && ((!s.ps && w>0) || (s.ps && s.ps.length==1 && w==1))); //SubTerm
							if(r) s.pr?(m=s.pr,s.NP=w-1):(ml.push(s.s()),s.NP=0);
						}});
						if(m || ml.length) {
							if(!m) m=new Poly(ml.join(' ')); msg(Color.Cya+`\nMultiply (${q.s.pr}) by (${m})`);
							q.t.d.each((s,i) => s.NP==null?null:s.NP?s.sp(s.NP):i?'!':(q.t.d[i]=new SubTerm(1),null));
							q.t.d.push(new SubTerm(`(${pMul(q.s.pr,m,1)})`)),msg(),m="Distribute"; continue;
						}
					}
				}
				q=[],m={};
				if(x.length==2 && !x.each(x => x.s.np()==2?(m.a=x.t,null)
				:x.s.np()==1?(m.b=x.t,null):1) && m.a && m.b) { //Quadratic
					if(!qd) {
						let a=new Term(m.a.s());
						a.d.each(s => s.e==1||sSer(s,v)?'!':null); qd=1,q=a.d;
					}
					if(!q.length) {
						let b=new Term(m.b.s()); b.d.each(s => sSer(s,v)?'!':null);
						m=new Term(`(${b}/2)^2`); m.simp();
						a.each((t,i) => t.q?(a.splice(i,0,m),1):null);
						(q=m.copy()).q=1; a.push(q);
						q=[pl[p].s(),(pl[p]=pl[p].simp()).s()];
						msg(q[0],Color.Di+`(Add (b/2a)^2 = ${m})`);
						if(q[0]!=q[1]) msg(q[1],Color.Di+"(Simplify)");
						m=(a=pl[p].t).each((t,i) => t.q?i:null);
						a.splice(0,m,new Term(`(${v}+${b}/2)^2`));
						m="Reverse Square Rule", qd=2; continue;
					}
				} else if(qd>1) qd=0;
				m=[]; if(!q.length) {
					if(x.each(x => x.s.np()>2?1:null)) q=[new SubTerm(v)];
					else x.each(x => x.t.d.each(s => {
						s.e==1||(s.pn?m.push(s):sSer(s,v)?0:q.push(s));
					}));
				}
				if(q.length||m.length) { //Divide/Multiply
					m.length?(q=m,m=1):m=0; let n,r='';
					q.each(s => {r+=' '+(m?s.s().substr(1):s.s()); if(s.n) n=!n});
					a.each(t => {
						if(t.q && t.q!=1 && n) t.q=SFL(t.q); //Flip inequality
						q.each(s => {(s=s.copy()).inv(),t.d.push(s)});
					});
					m=`${m?"Multiply":"Divide"} by`+r; continue;
				}
				if(x.length != 1) break; //Couldn't solve!
				if((x=x[0]).s.np() != 1) { //Square Pow
					if(x.s.np() != 2) return msg(Color.Red+"Can't handle non-square pow yet!");
					x.s.sp(1), q=a[1].q, m=sGet(s2), s=`sqrt(${m[2]})`;
					a.splice(1,a.length,new Term(s)), pl.push(new Poly(x.t+SFL(m[0])+'-'+s));
					a[1].q=q, m="Perfect Square; Split #"+(pl.length-1);
				}
			}
		}
		m=s==s2?sGet(s):0;
		if(!m || !s.startsWith(v+' '+m[0])) msg(Color.Red+"Couldn't solve!"); else {
			msg(Color.Ylo+"Done!"); re.push(pl[p]); q=m[0][0], x=m[0][1];
			if(q=='>') re.gt=eval(m[2]),re.gq=(x?'[':'(')+m[2];
			else if(q=='<') re.lt=eval(m[2]),re.lq=m[2]+(x?']':')');
		}
	}
	q=''; if(re.gt >= re.lt) q=`(-infinity, ${re.lq}U${re.gq}, infinity)`;
	else if(re.gt < re.lt) q=re.gq+', '+re.lq; else if(re.gt != null) q=re.gq+', infinity)';
	else if(re.lt != null) q='(-infinity, '+re.lq;
	if(re.length) msg(Color.Br+Color.Blu+'\n'+re.join('; '),q?'\n'+q:'');
	if(re.length==1 && re[0].t.each(t => t.q)=='=') {
		q=eval(sGet(re[0].s(1))[2]); if(NA(q)) msg(Color.Di+`Set var ${v} to`,VAR[v]=q);
	}
} else if(T=='d') { //Derivative
	let v=A[4]||'x';
	if(AL<4 || !(/^[a-z]$/).test(v)) return use(T,"<poly> <var>");
	Der(new Poly(A[3]).simp(),v);
} else if(T=='p') { //Poly Info
	if(AL!=4) return use(T,"<poly>");
	let p=new Poly(A[3]).simp(), t=p.lt();
	msg(p+"\nDegree:",t.xp(),"Lead Term: "+t);
} else if(T=='lf') { //List Factors
	if(AL!=4) return use(T,"<x>");
	msg("Factors:",LF(RN(A[3])));
}/* else if(T=='f') { //Factor Poly
	if(AL!=4) return use(T,"<poly>");
	let p=new Poly(A[3]).simp(), t=p.lt().xp()+1, tl=[],lt,s='y=',i,n,l;
	for(i=0; i<t; i++) {
		tl[i]=n=pGet(p,t-i-1); s+='+'+n+'x^'+(t-i-1); //Build String
		n=abs(n); if((l==null || n<l) && n!=0) l=n,lt=i; //Find Lowest Term
	}
	//Test Factors
	let fl=LF(tl[lt]),f,ft=[],xm=1;
	msg(`\n${PS(s)}\nFactors of ${tl[lt]}:`,fl);
	for(let fc=fl.length,fn=fc-1,i; fn>=0; fn--) {
		f=fl[fn]; msg("Testing",f); for(i=0; i<t; i++) {
			ft[i]=tl[i]/f; msg(tl[i]+'/'+f+' = '+ft[i]);
			if(!IN(ft[i])) { msg("Not Integer!"),f=0; break; }
		}
		if(f) { msg("GCF Found!"); break; }
	}
	//Calculate GCF of X
	for(i=t-1; i>=0; i--) if(ft[i]) { xm=t-i; break; }
	s=''; for(i=0; i<t; i++) s+='+'+ft[i]+'x^'+(t-i-xm); //Build String
	xm-=1, f+='x^'+xm; msg(`\nGCF of X: ${xm}\n`,PS(`${f}(${s})`,3));
	if(t-xm==3) msg(PS(f+await run([0,0,'q',s,1]),3));
} */else if(T=='mp') { //Multiply Poly
	let p1,p2; if(A[3] && A[3][0]=='(') {
		A.splice(0,3); p1=A.join(' '), p2=p1.indexOf(')');
		A[3]=p1.substr(1,p2-1), A[4]=p1.substring(p2+1).replace(/[()]/g,'');
	}
	if(!A[3] || !A[4] || p2==-1) return use(T,"<p1> <p2> | <(p1)(p2)>");
	p1=new Poly(A[3]).simp(), p2=new Poly(A[4]).simp();
	msg(`(${p1}) * (${p2})\n\nFOIL Multiply:`);
	let m=pMul(p1,p2,1); msg('\n'+m+'\nSimplify: '+m.simp());
} else if(T=='pp') { //Poly Power
	let p=A[3]&&new Poly(A[3]).simp(), n=Number(A[4]), pn=p;
	if(AL!=5 || n<=1) return use(T,"<poly> <pow>");
	while(--n) {
		msg(`(${pn}) * (${p})`); pn=pMul(pn,p);
		msg(pn+'\nSimplify: '+pn.simp());
	}
}/* else if(T=='dp') { //Divide Poly
	if(AL!=5) return use(T,"<p1> <p2>");
	let p1=new Poly(A[3]), p2=new Poly(A[4]); msg(`(${p1}) / (${p2})\n\nDivide:`);
	let m=pDiv(p1,p2,1); msg('\n'+m+'\nSimplify: '+m.simp());
} */else if(T=='qv') { //Quad to Vertex
	msg("y = ax^2 + bx + c");
	let a=await getN("ax^2?"), b=await getN("bx?"), c=await getN("c?"),
	ca=`+${c}/${a}`, ns=PS(`${b}^2/${2*a}^2`,2), xs=`(x+${ns})^2`;

	msg(PS(`y=${a}x^2+${b}x+${c}`,1),a==1?'':PS(`y/${a}=x^2+${b}x/${a}${ca}`,1));
	msg(PS(`y/${a}+${ns}=x^2+${b}x/${a}+${ns}${ca}`),`(Add (b/2a)^2 = ${ns} to both sides)`);
	msg(PS(`y/${a}+${ns}=${xs}${ca}`),'(Apply square rule)',PS(`y/${a}=${xs}${ca}-${ns}`,1));
	msg(PS(`y=${a}${xs}+${c}-${a}*${ns}`,2),`\nVertex: (${PS('-'+ns)}, ${c-((b/(2*a))**2)*a})`);
} else if(T=='vq') { //Vertex to Quad
	msg("y = a(x - h)^2 + k");
	let a=await getN("A?"), h=await getN("H?"), k=await getN("K?"), as=NM(a), h2=h**2;
	msg(PS(`y=${as}(x-${h})^2+${k}`)+'\n'+PSS(`y=${as}x^2-${h*a*2}x+${h2*a}+${k}`));
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
} /*else if(T=='dr') {
	const TMax=5000000, TStp=50, SStp=.1;
	let f=await getF(A), t=tstRng('Scan',f,-TMax,TMax,TStp); msg(t);
	t=[t[0]==null?'(-infinity':'['+tstRng('X-Min',f,t[0]-TStp,t[0]+TStp,SStp)[0],
		t[1]==null?'infinity)':tstRng('X-Max',f,t[1]-TStp,t[1]+TStp,SStp)[1]+']',
		t[2]==null?'(-infinity':'['+tstRng('Y-Min',f,t[3]-TStp,t[3]+TStp,SStp)[2],
		t[4]==null?'infinity)':tstRng('Y-Max',f,t[5]-TStp,t[5]+TStp,SStp)[4]+']'];
	msg(`Domain: ${t[0]},${t[1]}; Range: ${t[2]},${t[3]}`);
} */else if(T=='rt') {
	if(AL!=5) return use(T,"<x> <n>");
	msg(eval(`root(${A[3]},${A[4]})`));
} else if(T=='ci' || T=='ic') { //Comp Int
	let i=T=='ic', p=Number(A[3]), r=A[4], n=Number(A[5]), t=Number(A[6]);
	r=r&&r.endsWith('%')?Number(r.substr(0,r.length-1))/100:Number(r);
	if(!(p>0) || !NA(r) || !(n>0) || !(t>0))
		return use(T,(i?"<target>":"<value>")+" <rate> <comp/t> <time>");
	n=(1+r/n)**(n*t); msg(i?`P(${t})`:`Value after ${t}t`,'=',(i?p/n:p*n).toFixed(2));
} else if(T=='a') { //Dataset Analysis
	if(AL<4) return use(T,"<data> [frac]");
	let a=A[3].split(/[;,]/g),b,l=a.length,rf=[],cf=0,cr=[],t=0,o={},k,m;
	//Calc Averages:
	a.each((n,i) => {t+=(a[i]=n=Number(n.replace(/[$:]/g,'')));o[n]?o[n]++:o[n]=1});
	for(let n in o) {n=Number(n);if(!m||o[n]>m) m=o[n],k=[n]; else if(o[n]==m) k.push(n)}
	b=Array.from(a); a.sort((a,b) => a-b); let N=t/l,M=aPct(a,50),v=0;
	if(k.length==1) k=k[0]; //Calc St Dev, Rel Freq:
	b.each((n,i) => {
		v+=(n-N)**2, cf+=n, A[4]?(rf[i]=n+'/'+t, cr[i]=cf+'/'+t):
		(rf[i]=Math.round(n*100/t)/100, cr[i]=Math.round(cf*100/t)/100);
	});
	//Basic Info:
	msg(a,"\nRel. Freq",rf,"\nCum. Freq",cr,"\nSize:",l,"Mean:",N,"Median:",M,"Mode:",k,'('+m+')');
	msg("St. Dev:",sqrt(v/l),"Skew:",N==M?'Center':N<M?'Left':'Right');
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
	}), P=5/(10**P), S-=P, E+=P;
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