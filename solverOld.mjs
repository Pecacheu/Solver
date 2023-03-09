//Solver.js ©2022 Pecacheu. GNU GPL v3.0
const VERS="v1.7.2";

import rdl from 'readline';
import {C as Color,msg} from './AutoLoader/color.mjs';

process.stdin.setRawMode(1);
process.stdin.setEncoding('utf8');
const use=(t,u) => msg(Color.Red+"Usage:",t,u),
rl=rdl.createInterface(process.stdin, process.stdout),
read=q => new Promise(r=>{rl.question(q+' ',n=>r(n))}),
RN=n => {try {n=eval(n)} catch(e) {n=null} if(typeof n!='number') throw "NaN!"; return n},
getN=q => read(q).then(RN), NA=Number.isFinite, IN=Number.isInteger,
aPct=(a,p) => IN(p=(a.length-1)*p/100)?a[p]:(a[Math.floor(p)]+a[Math.ceil(p)])/2, //Percentile
//Math Functions:
abs=Math.abs, sqrt=Math.sqrt, cbrt=Math.cbrt, sin=Math.sin, cos=Math.cos, tan=Math.tan,
sec=x=>1/cos(x), csc=x=>1/sin(x), cot=x=>1/tan(x), asin=Math.asin, acos=Math.acos, atan=Math.atan,
rad=d=>d*Math.PI*2/360, deg=d=>d*360/(Math.PI*2),
log=(b,x)=>b==2?Math.log2(x):b==10?Math.log10(x):Math.log(x)/(b?Math.log(b):1),
perm=(n,r) => {if(n==r||!n)return 1;r=r?n-r:1;for(let i=n-1;i>r;--i)n*=i;return n}, //Factorial/Permutation
comb=(n,r) => perm(n,r)/perm(r), //Combination
root=(x,n)=>(x>1||x<-1)&&0==n?1/0:(x>0||x<0)&&0==n?1:x<0&&n%2==0?`${(x<0?-x:x)**(1/n)}i`:3==n
	&&x<0?-cbrt(-x):x<0?-((x<0?-x:x)**(1/n)):3==n&&x>0?cbrt(x):(x<0?-x:x)**(1/n);

//From Utils.js
Array.prototype.each = function(fn,st,en) {
	let i=st||0,l=this.length,r; if(en) l=en<0?l-en:en;
	for(; i<l; i++) if((r=fn(this[i],i,l))==='!') this.splice(i--,1),l--; else if(r!=null) return r;
}

//============================================== Polynomial Lib ==============================================

const PAR='\\((?:\\((?:\\((?:\\((?:\\([^()]+\\)|[^()])+\\)|[^()])+\\)|[^()])+\\)|[^()])+\\)',
PT=/[^\d.a-z()/*^+<=>!%-\s]/, EQ=/[<=>]+/,
FL='sqrt|cbrt|abs|rad|deg|sin|cos|tan|sec|csc|cot|asin|acos|atan|perm|comb|ln|log[\\d]*',
DN=/^-\s*-/, ST=`-?\\s*(?:[\\d.]+%?|(?:${FL})?${PAR}|[a-z])`,
TS=new RegExp(`([<>]=?|=)?\\s*(?:[+-]\\s*){0,2}(?:${PAR}|[/*^]\\s*-?|[^()/*^+<=>-]+)+`,'g'),
DP=new RegExp(`([*/])?\\s*(${ST}\\!?)(?:\\^(${ST}))?`,'g'),
NM=(n,sb,p) => n==1?'':(sb||'')+(n==-1&&!p?'-':n), XP=(p,x) => p?x+NM(p,'^',1):'',
FR=x => {for(let n=x,v; n>0; n--) if(IN(v=sqrt(n)) && IN(x/n)) return v}, //Factor root
NG=x => NA(x)?x<0:x.length&&x.startsWith('-'), JX=(x,p) => x=='e'?`Math.exp(${p})`:
	(x=isFinite(x)||x.length!=1?x:x=='p'?'Math.PI':'v.'+x, p==1?x:`(${x}**${p})`),
SFL=s => (s[0]=='<'?'>':s[0]=='>'?'<':s[0])+s.substr(1), //Sign flip
GCD=(a,b) => {for(let t;b;)t=b,b=a%b,a=t;return a}, //Greatest Common Denominator
PEQ=(a,b) => a.pn==b.pn&&(a.p.s&&b.p.s?a.p.s()==b.p.s():a.p==b.p), //Power Equals
AJ=(a,s) => (s=s?s:'',a.join(s+' ')+s); //Join w/ Suffix

function pTrim(s) { //Trim Parenthesis
	let i=0,l=s.length,p=0,pt,a,
	SSP=r => (s=s.substr(0,i)+r+s.substr(i+1),l=s.length,i+=r.length-1);
	for(;i<l;++i) {
		s[i]=='('?((p<pt?pt=p:0),++p,a?p=-1:0):s[i]==')'?(--p,a?p=-1:0)
		:s[i]=='|'?a?(a=0,SSP(')')):(a=p+1,SSP('abs(')):(pt==null||p<pt?pt=p:0);
		if(p<0) break;
	}
	if(p) throw "Unmatched Paren!"; return pt?s.substring(pt,l-pt):s;
}

class Poly {
	constructor(f) {
		this.t=[]; if(Array.isArray(f)) {this.t=f;return}
		let m,q; if(PT.test(f=pTrim(f))) throw "Bad Poly";
		for(m of f.matchAll(TS)) { //TODO: ERROR IF MATCHES NOT FILL STRING
			if(m[1]) q=m[1]; else if(q) q=1;
			m=new Term(m[0],q); if(m.d.length) this.t.push(m);
		}
	}
	s(j) {let s='';this.t.each((t,i) => {s+=t.s(i,j)});return s}
	toString() {return this.s()}
	simp(xv) { //Simplify
		let d=[],i=0,t,r,s,q,dq;
		this.t.each((t,i) => {d[i]=t.copy().simp();if(!dq)dq=t.q});
		for(; i<d.length; i++) {
			t=d[i]; d.each(n => t.like(n)?(t.e+=n.e,'!'):null, i+1); //Combine Like-Terms
			if(t.e==0 && (!t.q||t.q==1||i<d.length-1)) {
				d.splice(i--,1); if(t.q&&t.q!=1) d[i+1].q=t.q;
			}
			if(t.d.length==2 && (r=t.d[1]).pr) { //Paren
				if(r.p==1 && !r.pn && ((s=(dq && !t.q && r.ps=='sqrt('
				&& (!xv||!d.each(n => n!=t&&tSer(n,xv)?1:null))))
				|| abs(t.e)==1 && r.ps.length==1)) {
					if(s) { //Invert Sqrt
						s=[],q=abs(t.e); d.each(n => {
							n!=t&&((n.q?n.q=0:n.e*=-1),n.d.push(new SubTerm(q,-1)),s.push(n));
						});
						s=new Poly(s).simp(),q=(t.e<0)!=(s.t[0].e<0);
						(s=new Term(`(${s})^2`+(q?'i':''))).q=dq; d=[s];
					} else { //Remove Par
						r.pr.t[0].q=t.q; if(t.e<0) r.pr.t.each(n => {n.e=-n.e});
					}
					d.splice(s?0:i,s?0:1,...r.pr.t),--i;
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
					r.d.each(s => s.inv(),2); msg("> SIMP FRAC",r.s());
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
				m=new SubTerm(m[2],m[3],m[1]=='/'); if(m.x) d.push(m); //TODO: ERROR IF MATCHES NOT FILL STRING
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
			s.sp(s.p.simp(),1); n=s.p.t;
			if(n.length==1 && n[0].d.length==1) s.sp(n[0].e*(s.pn?-1:1)); //Rem Par
			else if(s.p.s()=='1/2') s=d[i]=new SubTerm(`sqrt(${s.pr||s.x})`,1,s.pn); //Convert 1/2 to sqrt
		} if(s.pr) { //Simp Par
			let p=s.pr.simp(), t=p.t; n=t.length==1&&t[0];
			if(n && s.ps.length==1) { //Rem Par
				n.d.each(m => (m.e==1?0:m.sp(m.np()+'*'+s.np()),m.e==1?'!':null));
				if(s.n&&n.d[0]) n.d[0].n=!n.d[0].n,n.d[0]=n.d[0].copy(); d.splice(i--,1,...n.d);
			} else if(n && (s.ps=='ln(' || s.ps.startsWith('log'))) { //Simp Log
				let b=s.ps=='ln('?'e':(s.ps.substring(3,s.ps.length-1)||10);
				if(n=(n.e==1&&n.d[1])||n.d[0]) {
					if(n.n||b==1||n.e===0) d[i]=new SubTerm(NaN);
					else if(n.x==b) d[i]=new SubTerm(n.np());
					else if(n.e==1) d[i]=new SubTerm(0);
				}
			} else if(NA(s.p) && s.ps=='sqrt(') { //Simp Sqrt
				if(s.p>1 && !(s.p%2) && s.pr.t[0].e>0) s.p/=2,s.ps='(',s.x=s.x.substr(4); //Rem Sqrt
				else if(n) {
					let e=n.e,x=IN(e)?FR(abs(e)):1,r=abs(e/x/x),np; x=[s.copy(x||0)];
					if(r>1) x[1]=s.copy(`sqrt(${r})`); //Remainder
					n.d.each(m => {
						if(m.np()>1&&!(m.p%2)) {
							x.push((m.p/=2)>1?m:s.copy((s.n&&!np?'-':'')+`abs(${m.s()})`)),np=1;
						} else {
							if(p=m.pn) m.inv(); t=s.copy((s.n&&!np?'-':'')+`sqrt(${m.s()})`),np=1;
							if(p) t.inv(); x.push(t);
						}
					},1);
					if(e<0) x.push(s.copy('i')); //Complex
					d.splice(i,1,...x); i+=x.length-1;
				}
			}
			if(s==d[i]) d[i]=s.copy((s.n?'-':'')+s.ps+p.s()+')');
		}}
		let e=this.e,v={},x,n; d.each((s,i) => {
			if((n=NA(s.p)) && NA(s.e)) { //Combine Num
				(d[i]=s=s.copy(s.e**s.p)).sp(s.pn?-1:1);
				if(s.pn) {if(x=v['/']) return x.e*=s.e,'!'; v['/']=d[i]=s.copy()}
				else return e*=s.e,'!';
			} else { //Combine Like-vars
				if(s.n) s.n=0,e=-e; //Invert Term
				if(x=v[s.x]) return x.sp(n&&NA(x.p)?
					x.np()+s.np():`${x.np()}+${s.np()}`),'!';
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
		return !m.d.each(s => t.d.each(n => n.mat(s)||null,1)?null:1,1);
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
			p=x.endsWith('!');
			if(x.endsWith('%')) x=(Number(x.substr(0,x.length-(p?2:1)))/100).toString();
			else if(p) x=x.substr(0,x.length-1); if(p) x=`perm(${x})`;
			m.x=x.replace(/ /g,''), m.e=Number(m.x), m.x=m.x.substr((m.n=NG(m.x))?1:0);
			if(!m.e && (p=x.indexOf('('))!=-1)
				m.ps=x.substring(m.n?1:0,p+1).replace(/ /g,''),m.pr=new Poly(x.substr(p));
		}
	}
	s(j,i,n) {
		let m=this,x=m.x,p=m.p,ps=m.ps,s=ps&&ps.length>1;
		if(p instanceof Poly) {
			let t=p.t.length==1&&p.t[0]; p=(t&&!t.d[2]&&t.e==1&&t.d[1].np()==1)?p.s(j):`(${p.s(j)})`;
		}
		if(m.e==0) x=0; if(ps) { //Paren
			if(j&&ps.startsWith('log')) ps=`log(${Number(ps.substr(3,ps.length-4)||10)},`;
			else if(j&&ps=='ln(') ps='log(0,'; x=ps+m.pr.s(j)+')';
		}
		if(j) p=JX(p,1); return (m.pn?'/':i&&(j||NA(m.e)||m.n||s)?'*':'')
			+(!i&&n?NM(m.e):(m.n?'-':'')+(j?JX(x,p):XP(p,x)));
	}
	sp(p,f) {
		let m=this; if(!(p instanceof Poly)) {
			m.pn=NG(p); if(NA(m.p=abs(p))) return; f=1,p=new Poly(p.substr(m.pn?1:0));
		}
		if(p.t.length==1 && p.t[0].e<0) m.pn=f?!m.pn:1,p.t[0].e=-p.t[0].e; m.p=p;
	}
	inv() {this.pn=!this.pn}
	np() {
		let m=this,p=m.p; return NA(p)?(m.pn?-p:p):(m.pn?'-':'')+`(${p})`;
		//TODO: Use same display code in SubTerm s() and np()
	}
	copy(x) {return new SubTerm(x==null?(this.n?'-':'')+this.x:x,this.np())}
	mat(s) {return PEQ(this,s)&&this.x==s.x}
}

function pMul(a,b,m) { //Multiply Polynomials
	let n=[],nt; a.t.each(at => b.t.each(bt => {
		n.push(nt=at.mul(bt)); m&&msg(at+` * ${bt} = `+nt);
	}));
	return new Poly(n);
}

//============================================== Support Functions ==============================================

const PS=(p,s) => (p=new Poly(p),(s%2?'\n':'')+(s>1?p.simp():p).s()), //Poly String
PSS=p => (p=new Poly(p),p+'\n'+p.simp()), //PS Simp
pGet=(p,e,q) => p.t.each(t => t.xp()==e&&t.q==q?t.e:null)||0, //Get Term w/ Exp
sSer=(s,v) => s.x==v||(s.pr&&pSer(s.pr,v)!=null)||(s.p instanceof Poly&&pSer(s.p,v)!=null), //Sub var search
tSer=(t,v) => t.d.each((s,i) => sSer(s,v)?i:null), //Term var search
pSer=(p,v) => p.t.each((t,i) => tSer(t,v)!=null?i:null), //Poly var search
sGet=s => {let q=EQ.exec(s),i=q.index,l=q[0].length; return [s.substr(i,l),
	s.substr(0,i).trim(),s.substr(i+l).trim()]}, //Get Sign
FACT_MAX=1000000000, LF=n => {if(n>FACT_MAX)return [n];let f=[],i=1;
	for(n=abs(n);i<=n;++i)if(n%i===0)f.push(i);return f} //List Factors

function Der(p,v) { //Calc Derivative
	let d=[],f,q,ql,x,w,c,n,ps=p.s(); p.t.each(t => {
		c='',q=[],f=[]; t.d.each(s => {sSer(s,v)?q.push(s):c+=s.s()+' '}); //Separate Constants & X-Terms
		ql=q.length; if(!ql) return; if(ql>2) throw "Can't do >2 sub-terms yet!";
		q.each((q,i) => {
			if(q.pn&&i) q.inv(),q.QN=1;
			x=q.ps?q.pr.s():q.x, w=q.np(), n='';
			if(q.ps && x!=v) n+=`(${Der(q.pr,v)})`,msg(); //Chain Rule
			if(q.p instanceof Poly && pSer(q.p,v)!=null) { //X-Power
				if(q.p.s()!=v) n+=`(${Der(q.p,v)})`,msg(); //Power Chain Rule
				if(q.ps) throw "OOPS! "+q.s(); //???
				n+=q.s()+` ln(${x})`;
			} else {
				if(q.ps) {if(q.ps.startsWith('log')) n+=`/(${x})/ln(${q.ps.substring(3,q.ps.length-1)||10})`;
				else switch(q.ps) {
					case 'ln(': n+=`/(${x})`; break; case 'sqrt(': n+=`1/2/sqrt(${x})`; break;
					case 'sin(': n+=`cos(${x})`; break; case 'csc(': n+=`*-csc(${x})*cot(${x})`; break;
					case 'cos(': n+=`*-sin(${x})`; break; case 'sec(': n+=`sec(${x})*tan(${x})`; break;
					case 'tan(': n+=`sec(${x})^2`; break; case 'cot(': n+=`*-csc(${x})^2`; break;
					case '(': break; default: throw "OOPS!"+q.s(); //???
				}}
				if(w!=1||!n) n+=(w==1)?'1':w+q.x+`^(${w}-1)`; //Var Power
			}
			if(ql>1) msg(Color.Ylo+`d/d${v}[${q.s()}] =`,n);
			f.push(n);
		});
		if(ql==2) { //Quotient/Product Rule
			x=q[1].QN, w=q[1].s();
			msg(`\nUsing ${x?'Quotient':'Product'} Rule:`);
			if(x) {
				msg(Color.Di+"(f'(x)*g(x) - f(x)*g'(x))/g(x)^2");
				f=[`((${f[0]})(${w}) - (${q[0].s()})(${f[1]}))/(${w})^2`];
			} else {
				msg(Color.Di+"g(x)*f'(x) + f(x)*g'(x)");
				f=[`(${w})(${f[0]})`,`(${q[0].s()})(${f[1]})`];
			}
			msg(f.join(' + ')+'\n');
		}
		f.each((t,i) => {f[i]=c+t}); d.push(...f);
	});
	d.each((t,i) => {d[i]=new Term(t)}); x=(d=new Poly(d)).s(), f=d.simp(v).s();
	msg(Color.Ylo+`d/d${v}[${ps}]\n`+Color.Br+Color.Blu+`= ${x}`+(f!=x?'\n= '+f:''));
	return f;
}


function ADRem(t) { //Test Removable
	/*c=new Poly(Der(q.pr,v)),msg();
	if(c.each(s => t.d.each(m => m!=q&&s.mat(m)?1:null)))
		return c.each(s => s.inv());*/
}

function ADer(p,v) { //Calc Antiderivative
	let d=[],f,q,ql,x,w,c,n,ps=p.s(); p.t.each(t => {
		n=0; t.d.each(q => { //Anti-Chain Rule
			if(q.ps && x!=v) {
				c=new Poly(Der(q.pr,v)),msg(); c=(c.t.length>1?new Term(`(${c})`):c.t[0]).d;
				if(c.each(s => t.d.each(m => m!=q&&s.mat(m)?1:null)))
					return c.each(s => s.inv()),t.d.push(...c),n=1; //TODO: Use ADRem
			}
		}); if(n) msg(t.s(),'(Chain Rule)'),t.simp();
		c='',q=[],f=[]; t.d.each(s => {sSer(s,v)?q.push(s):c+=s.s()+' '}); //Separate Constants & X-Terms
		ql=q.length; if(ql>1) throw "Can't do >2 sub-terms yet!";
		/*if(ql==2) { //Product Rule
			f.f=`(${Der(new Poly(q[0].s()),v)})`,msg(),f.g=`(${ADer(new Poly(q[1].s()),v)})`;
			msg(`\nUsing Product Rule:\n${Color.Di}f(x)*S(g(x))dx - S(f'(x)*S(g(x))dx)dx`);
			f=[`(${q[0].s()})`+f.g,'-'+f.f+f.g];
		} else */if(q=q[0]) {
			x=q.ps?q.pr.s():q.x, w=q.np(), n='';
			if(q.p instanceof Poly && pSer(q.p,v)!=null) { //X-Power
				if(q.x=='e') {
					f.p=`/(${Der(q.p,v)})`; //TODO: Use ADRem
					if(f.p.indexOf(v)!=-1) throw `Sub-Der contains ${v}!`;
					n='e^'+w+f.p,w=1,x=v;
				} else throw "Can't do X-Power!";
			}
			if(q.ps) switch(q.ps) {
				case 'sqrt(': w+='/2',q.x=q.x.substr(4); break;
				case 'cos(': n+=`sin(${x})`; break; case 'sin(': n+=`-cos(${x})`; break;
				case '(': break; default: throw "OOPS! "+q.s(); //???
			}
			if(!n) n=(w==-1)?`ln(${x})`:q.x+`^(${w}+1)/(${w}+1)`; //Var Power
			else if(w!=1) throw "Can't do trig with power!";
			f.push(n);
		}
		if(!ql) f=[v];
		f.each((t,i) => {f[i]=c+t}); d.push(...f);
	});
	d.each((t,i) => {d[i]=new Term(t)}); x=(d=new Poly(d)).s(), f=d.simp(v).s();
	msg(Color.Ylo+`S(${ps})d${v}\n`+Color.Br+Color.Blu+`= ${x} + C`+(f!=x?`\n= ${f} + C`:''));
	return f;
}

//============================================== Graphics ==============================================

let GFX; const GBG=Color.Br+Color.Blk+Color.BgWhi,
GC=[Color.Red, Color.Blu, Color.Grn, Color.Mag, Color.Ylo];
function NCP(n,p) {return p?Math.round(n*p)/p:n} //Clip Precision
//function PC(n) {n=n.toString();let i=n.indexOf('.');return i==-1?0:n.length-i-1} //Get Precision

process.stdin.on('data',k => {
	if(!GFX) return; let g=GFX,d=1; switch(k) {
		case '\x1B[A': g.y+=1/g.z; break; case '\x1B[B': g.y-=1/g.z; break; //Up/Down
		case '\x1B[C': g.x-=1/g.z; break; case '\x1B[D': g.x+=1/g.z; break; //Right/Left
		case '+': case '=': g.z*=2; break; case '-': g.z/=2; break; //+/-
		case '\x1B[1~': case ' ': g.x=g.y=0,g.z=1; break; //Home/Space
		case '\x1B': g.r(); return; default: d=0; //Esc
	}
	if(d) dGraph();
});
function sGraph(s,f,x,y,z) {return new Promise(r => {
	GFX={s:s,f:f,x:x,y:y,z:z||1,r:r}; dGraph();
})}
function dGraph() {
	let g=GFX; g.x=NCP(g.x,g.z), g.y=NCP(g.y,g.z);
	msg(`Graphing [${g.s}]  @  (${g.x}, ${g.y}) ${g.z*100}%`);
	let w=process.stdout.columns-1, h=process.stdout.rows-2;
	pGraph(g.f,w,h,g.x,g.y,g.z);
}

function pGraph(fl,w,h,xp,yp,z) {
	let cx=Math.floor(w/2)+xp*z,cy=Math.floor(h/2)+yp*z,fx=new Array(w),
	fn=fl.length,x=0,y=0,f,ox,oy,a,n,xf,s=''; for(; x<w; ++x) { //Compute Func List
		fx[x]=xf=new Array(ox); for(f=0; f<fn; ++f) VAR.x=(x-cx)/z,
			a=fl[f](VAR)*z,oy=Math.round(a),xf[f]=[oy,a==oy];
	}
	for(; y<h; ++y) { //Draw Graph
		s+=(y?Color.Rst+'\n':'')+GBG; for(x=0; x<w;) {
			ox=x-cx,oy=cy-y; for(f=0; f<fn; ++f) {
				xf=fx[x][f]; if(oy==xf[0]) a=GC[f]+(xf[1]?'*':'~')+GBG,n=1;
			}
			if(!n) a=y==cy?x==cx?'+':ox%6?'_':NCP(ox/z,10).toString()
				:x==cx?oy%2?'|':NCP(oy/z,10).toString():' ';
			s+=a,x+=n||a.length,n=0;
		}
	}
	msg(s);
}

//============================================== Code ==============================================

const ML = {
	r:'Run', s:'Solver', g:'Graph', d:'Derivative', ad:'Antiderivative',
	p:'Poly Info', lf:'List Factors', mp:'Multiply Poly', pp:'Poly Power', //dp:'Divide Poly',
	tp:'Two-Point Solver', ps:'Point-Slope Solver', es:'Equation System',
	qv:'Quadratic to Vertex Form', vq:'Vertex Form to Quadratic',
	rt:'Root', ci:'Compound Interest', ic:'Inverse Comp Int',
	a:'Dataset Analysis', sm:'Summation'//, h:'Histogram'
}, CS=/(?:^|\s+)("[^"]+"|\S+)/g, CC='`',
MC=Color.BgBlu+Color.Whi, VAR={};

let n,HLP='simp = Simplify Mode\nsx = Simplify X Mode\n\
code = JavaScript Mode\nvars = List Vars\ndel <x> = Delete Var\n\n';
for(let k in ML) HLP+=(n!=null?','+(n?' ':'\n'):'')+CC+k+' = '+ML[k],n=!n;
msg(Color.Grn+"Pecacheu's Math Solver "+VERS);
process.argv.shift(); await run(process.argv); rl.close();

async function runCmd(s) {
	let c=[0,0],m; while(m=CS.exec(s)) {
		if((m=m[1]).startsWith('"')) m=m.substr(1,m.length-2); c.push(m);
	}
	if(!s || c[2]=='r') use(CC+"<cmd> ...",''); else await run(c);
}

async function run(A) {
let T=A[2], AL=A.length;
if(!T) T='r'; else if(T=='?') return msg(HLP);
msg(Color.BgMag+"Mode:",ML[T]?ML[T]+Color.Rst+'\n':"Not Supported");
if(T=='r') { //RUN
	msg("Type '?' for help, 'q' to quit.");
	let f,r,v=VAR,S=2; while((f=(await read('>')).trim())!='q') try {
		if(f=='?') msg(HLP); else if(f.startsWith(CC)) await runCmd(f.substr(1));
		else f.split(';').each(s => {
			if(s=='simp') msg(MC+"Simplify",(S=S==1?0:1)?"On":"Off");
			else if(s=='sx') msg(MC+"Simp X",(S=S==2?0:2)?"On":"Off");
			else if(s=='code') msg(MC+"Code",(S=S==3?0:3)?"On":"Off");
			else if(s.startsWith('del ')) delete(v[s=s.substr(4).trim()]),msg("Delete",s);
			else if(s=='vars') msg(v); else {
				if(S&&S<3) {
					f=1; if(S==2 && s.indexOf('=')!=-1) {
						f=new Poly(s),r=f.t[0]; f=!(r&&f.t[1]&&f.t[1].q=='='&&r.e==1&&!r.d[2]);
					}
					if(f) {
						r=S==2&&NA(v.x), s=new Poly(r?s.replace(/x/g,`(${v.x})`):s).simp();
						return msg((r&&f===1?`f(${v.x}) = `:'')+Color.Ylo+s);
					}
				}
				if(S!=3) s=new Poly(s).s(1); try {r=eval(s)}
				catch(e) {r=Color.Red+e} msg(Color.Di+s,Color.Rst+'->',r);
			}
		});
	} catch(e) {msg(Color.Red+'-> ',e)}
} else if(T=='s') { //Solve
	let p=A[3], v=A[4]||'x', pm=p&&Array.from(p.matchAll(new RegExp(EQ,'g')));
	if(AL<4 || !pm.length || !(/^[a-z]$/).test(v)) return use(T,"<equation> [var]");
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
					if((q.s.ps=='sin(' || q.s.ps=='cos(' || q.s.ps=='tan(')
					&& q.s.np()==1 && q.t.e==1 && x.length==1) {
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
					a[1].q=q, m="Undo Square; Split #"+(pl.length-1);
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
} else if(T=='g') { //Graph
	if(AL<4) return use(T,"<poly1> [x] [y] [zoom] [poly2] [poly3]...");
	let i=7,s='',p=[new Poly(A[3]).simp()], f=[], x=Number(A[4])||0, y=Number(A[5])||0;
	for(; i<AL; ++i) p.push(new Poly(A[i]).simp());
	for(i=0; i<p.length; ++i) {
		f.push(eval(`v=>(${p[i].s(1)})`));
		s+=(i?', ':'')+Color.Br+GC[i]+p[i].s()+Color.Rst;
	}
	await sGraph(s,f,x,y,Number(A[6]));
} else if(T=='d') { //Derivative
	let v=A[4]||'x';
	if(AL<4 || !(/^[a-z]$/).test(v)) return use(T,"<poly> [var]");
	Der(new Poly(A[3]).simp(),v);
} else if(T=='ad') { //Antiderivative
	let v=A[4]||'x';
	if(AL<4 || !(/^[a-z]$/).test(v)) return use(T,"<poly> [var]");
	ADer(new Poly(A[3]).simp(),v);
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
	if(!A[3] || !A[4] || p2==-1) return use(T,"<p1> <p2> | (p1)(p2)");
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
} else if(T=='qv') { //Quad to Vertex
	msg("y = ax^2 + bx + c");
	let a=await getN("ax^2?"), b=await getN("bx?"), c=await getN("c?"),
	ca=`+${c}/${a}`, ns=PS(`${b}^2/${2*a}^2`,2), nx=`${b/2}/${a}`, xs=`(x+${nx})^2`;
	msg(PS(`y=${a}x^2+${b}x+${c}`,1),a==1?'':PS(`y/${a}=x^2+${b}x/${a}${ca}`,1));
	msg(PS(`y/${a}+${ns}=x^2+${b}x/${a}+${ns}${ca}`),`(Add (b/2a)^2 = ${ns} to both sides)`);
	msg(PS(`y/${a}+${ns}=${xs}${ca}`),'(Apply square rule)',PS(`y/${a}=${xs}${ca}-${ns}`,1));
	msg(PS(`y=${a}${xs}+${c}-${a}*${ns}`,2),`\nVertex: (${PS('-'+nx,2)}, ${c-((b/(2*a))**2)*a})`);
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
} else if(T=='rt') {
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
}*/else if(T=='sm') { //Summation
	let n=Number(A[4]),i=Number(A[5]); if(!n) return use(T,"<poly> <n> [k]\nE[n;i=k](poly)");
	if(Number.isNaN(i)) i=1; let r='',p=new Poly(A[3]).simp().s();
	msg(Color.Ylo+`E[${n};i=${i}](${p})`);
	for(; i<=n; ++i) r+=(r.length?" + ":'')+`(${p.replace(/i/g,`(${i})`)})`;
	msg('= '+r); msg(Color.Br+Color.Blu+'= '+new Poly(r).simp());
}}