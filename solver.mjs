//Solver.js ©2023 Pecacheu. GNU GPL v3.0
const VER=">>>Beta<<< v2.0 b6";

import rdl from 'readline';
import {C,msg} from './AutoLoader/color.mjs';
import {Decimal as Dec} from './decimal.min.mjs';
Dec.set({precision:25, rounding:4});
let FRAC=1,DEG; const MAT_COL_W=4, FACT_MAX=1000000000,
TCON="G1s0bRtbMW0bWzQybRtbMzdtMS4gQXNzZXJ0IHlvdXIgRG9taW5hbmNlG1swbRtbMzZtCiAgICAgICAgI\
CAgXiAgICBeCiAgICAgICAgICjNocKwIM2cypYgzaHCsCkKICAgICAgIF9fX18rICAgK19fX18KICAgICAgICAg\
ICB8IH4gfAogICAgICAgICp+fnxfX198CiAgICAgICAgICAgfCAgIHwKICAgICAgICAgICAtICAgLQogIBtbMzN\
tVElQOiBULVBvc2luZyBsZXRzIG90aGVyIG1hdGhlbWF0aWNzIHN0dWRlbnRzCiAga25vdyB5b3Ugb2NjdXB5IG\
EgZ2VvbWV0cmljIHBsYW5lIG9mIHN1cGVyaW9yCiAgaW50ZWxsZWN0LiBVc2UgdGhlIBtbMzRtdHBvc2UoKRtbM\
zNtIGZ1bmN0aW9uIHRvIGFzc2lzdC4KICBSZW1lbWJlciwgG1sxbWludGVsbGlnZW5jZSA9IGleMm5eMnRlXjNs\
XjJnYxtbMG0bWzMzbS4";

msg(C.Un+C.Red+"WARNING! This BETA release is not yet finished. Some things are still being worked on, such as SOLVER mode. Please return to the last stable release to use any missing features!");
msg("TIP: The last stable version is bundled in as "+C.Un+"solverOld.mjs"+C.Rst+". If you want to run the old version, start the script as 'solver old'.\n");

process.stdin.setRawMode(1);
process.stdin.setEncoding('utf8');
const use=(t,u) => msg(C.Red+"Usage:",t,u),
rl=rdl.createInterface(process.stdin, process.stdout),
read=q => new Promise(r=>{rl.question(q+' ',n=>r(n))}),
//RN=n => {try {n=eval(n)} catch(e) {n=null} if(typeof n!='number') throw "NaN!"; return n},
//getN=q => read(q).then(RN),
NUM=(d,f)=>d instanceof Dec?(f?1:d.isFinite()):Number.isFinite(d),
INT=d=>d instanceof Dec?d.isInteger():Number.isInteger(d),
//Math Functions:
NAN=Dec(NaN), abs=d=>{try{return Dec.abs(d)}catch(e){}return NAN},
PI=Dec.acos(-1), PI2=PI.mul(2);
/*perm=(n,r) => {if(n==r||!n)return 1;r=r?n-r:1;for(let i=n-1;i>r;--i)n*=i;return n}, //Factorial/Permutation
comb=(n,r) => perm(n,r)/perm(r), //Combination
root=(x,n)=>(x>1||x<-1)&&0==n?1/0:(x>0||x<0)&&0==n?1:x<0&&n%2==0?`${(x<0?-x:x)**(1/n)}i`:3==n
	&&x<0?-cbrt(-x):x<0?-((x<0?-x:x)**(1/n)):3==n&&x>0?cbrt(x):(x<0?-x:x)**(1/n);*/

//From Utils.js
Array.prototype.each = function(fn,st,en) {
	let i=st||0,l=this.length,r; if(en) l=en<0?l-en:en;
	for(; i<l; ++i) if((r=fn(this[i],i,l))==='!') this.splice(i--,1),l--; else if(r!=null) return r;
}

//============================================== Polynomial Lib ==============================================

const VPV='[a-df-z]', VPP='[a-zPA]', VRT=new RegExp(VPV), VST=new RegExp(`^${VPV}$`),
VPR=new RegExp(`^${VPP}$`), VSV=new RegExp(`^(${VPV})\\s=\\s`), VEQ=/^[^\[=<>]+(=|[<>]=?)[^\[=<>]+$/,
MQ=/^(;?\s*([<>]=?|=)?\s*)(?:[+-]\s*){0,2}/, DN=/^(?:-\s*-\s*|\+\s*)|\s+$/g,
PAR='\\((?:\\((?:\\((?:\\((?:\\([^()]+\\)|[^()])+\\)|[^()])+\\)|[^()])+\\)|[^()])+\\)',
FL='sqrt|cbrt|abs|rad|deg|sin|cos|tan|sec|csc|cot|asin|acos|atan|\
perm|comb|ln|log|tpose|sum|dot|dotPow|norm|rows|cols|det|inv|rref|eye',
ST=`-?\\s*(?:[\\d.]+(?:e[+-]\\d+)?|(?:${FL})?${PAR}|${VPP}|\\[[^\\[\\]]+\\])%?`,
DP=new RegExp(`([*/])?\\s*(${ST}\\!?)(?:\\^(${ST}))?\\s*`,'g'),
//TODO: Better method than REGEX for DP (SubTerm detect)?
NM=(n,sb,p) => n==1?'':(sb||'')+(n==-1&&!p?'-':n),
XP=(p,x,f) => f&&p!=1?`(${x}**${p})`:(p?x+NM(p,'^',1):''),
FR=(x,f) => { //Factor Root
	if(x.lt(FACT_MAX)) {
		x=Number(abs(x)); for(let n=x,v; n>0; --n) if(INT(v=Math[f](n)) && INT(x/n)) return Dec(v);
	}
	return Dec(0);
}, NG=x => NUM(x)?x instanceof Dec?x.lt(0):x<0:x.length&&x.startsWith('-'), //isNegative
SFL=s => (s[0]=='<'?'>':s[0]=='>'?'<':s[0])+s.substr(1), //Sign flip
GCD=(a,b) => {for(let t;!b.isZero();)t=b,b=a.mod(b),a=t;return a}, //Greatest Common Denominator
PEQ=(a,b) => a.pn==b.pn&&(NUM(a.p)?a.p.eq(b.p):!NUM(b.p)&&a.p.s()==b.p.s()), //Power Equals
VRS=t => VRT.test(t.s()), //Has Vars
PZ=p => p.t.length==1&&p.t[0].e.eq(0), //Poly Zero
ACT=(l,n) => {if(l!=n) throw `Wrong Args Count (${l} != ${n})`}, //Arg Count
MAT=(s,i=0) => (s.pr&&(s=s.pr[i],s=!s.t[1]&&s.t[0]),s&&s.e==1&&s.d.length==2&&s.d[1].m), //Get Mat
MFN=(s,f,l,nm) => { //Matrix Func
	ACT(l,1); let n=s.pr[0].t,m; if(n.length!=1) return;
	n=n[0]; if(n.e==1 && (m=MAT(s))) return f=nm===2?m[f]:m[f](),s.sx(nm?`(${f})`:f),1;
	else if(f=='tpose' && n.e==1 && !n.d[2]) msg(Buffer.from(TCON,'base64')+''),s.sx(0);
	else if(!VRS(n)) throw "Bad input to "+f;
}, SQC=(s,f,rt,l) => { //Sqrt/Cbrt
	ACT(l,1); let n=s.pr[0].t;
	if(l=MAT(s)) return s.sx(l.func(f)),1; //Matrix
	if(INT(s.p) && !s.p.eq(0) && s.p.mod(rt).eq(0)
		&& n[0].e.gt(0)) return s.p=s.p.div(rt),s.ps='(',1; //Root Pow
	if(n.length!=1) return;
	n=n[0]; let sq,e=n.e,re=!(rt%2),x=FRAC&&INT(e)?FR(e,f):Dec(0),t;
	if(x.eq(0)) x=[new SubTerm((re?abs(e):e)[f]())], sq=!e.eq(1); else {
		l=abs(e.div(x.pow(rt))), sq=!x.eq(1), x=[new SubTerm(!re&&e.lt(0)?x.neg():x)];
		if(!l.eq(1)) x[1]=new SubTerm(f+`(${l})`); //Remainder
	}
	n.d.each(m => {
		if(INT(m.p) && m.p.mod(rt).eq(0)) { //Simp Sqrt/Cbrt
			x.push(!(m.p=m.p.div(rt)).eq(1)?m:new SubTerm((re?'abs':'')+`(${m.s()})`)),sq=1;
		} else {
			if(l=m.pn) m.inv(); t=new SubTerm(f+`(${m.s()})`); if(l) t.inv(),m.inv(); x.push(t);
		}
	},1);
	if(re&&e.lt(0)) x.push(new SubTerm('i')),sq=1; //Complex
	if(sq || x.length==1) return n.d=x,s.ps='(',1;
}, SFN=(s,f,l) => {
	ACT(l,1); let n=s.pr[0].t,r,a;
	if(n[1]) return; n=n[0]; if(f[0]=='a') { //Inverse
		if(n.d[1]) return;
		if(n.e.gt(1)||n.e.lt(-1)) s.sx(NAN);
		else if(!FRAC&&!n.d[1]) a=Dec[f](n.e),s.sx(DEG?a.mul(360).div(PI2):a);
		//TODO: Handle inverse special angles
	} else {
		a=DEG?n:new Term(`deg(${n.s()})`).simp();
		let fs=f=='sin',ft=f=='tan'; a=!a.d[1]&&Number(a.e);
		if(a===0) s.sx(fs||ft?0:1);
		else if(a==30) s.sx(fs?'(1/2)':`(sqrt(3)/${ft?3:2})`),r=1;
		else if(a==45) s.sx(ft?1:'(sqrt(2)/2)'),r=1;
		else if(a==60) s.sx(fs||ft?'(sqrt(3)'+(ft?')':'/2)'):'(1/2)'),r=1;
		else if(a==90&&!ft) s.sx(fs?1:0);
		else if(!FRAC&&!n.d[1]) s.sx(Dec[f](DEG?n.e.mul(PI2).div(360):n.e));
		//TODO: Handle Sin Cos Identities ex. addition
	}
	return r;
}

function pSplit(s,sep) { //Split Poly
	let i=0,l=s.length,p=0,ml,c,sp=[],lm=0,sl=sep.length;
	for(;i<l;++i) {
		c=s[i]; if(c=='(') ++p; else if(c==')') --p;
		else if(c=='[') ml=1; else if(c==']') ml=0;
		else if(!p&&!ml && c==sep) sp.push(s.substring(lm,i)),lm=i+sl;
	}
	if(p) throw "Paren Error"; sp.push(s.substr(lm)); return sp;
}
function pFind(s,mat) { //Match Term
	let q=MQ.exec(s),i=q[0].length,l=s.length,p=0,ml,m,c,nr;
	for(;i<l;++i) {
		c=s[i]; if(c=='(') ++p,m=0; else if(c==')') --p;
		else if(c=='[') {if(ml) throw "Bad Matrix"; ml=1}
		else if(c==']') {
			if(mat) {nr=2;break} if(!ml) throw "Bad Matrix"; ml=0;
		} else if(!p) {
			if(mat&&(c==' '||c==';')) {nr=1;break}
			else if(c=='*'||c=='/') m=1; else if(m&&c!=' ') m=0;
			else if(!mat&&!ml && ((c=='<'||c=='>'||c=='=') || (c=='+'||c=='-')
				&& s[i-1]!='^' && (s[i-1]!='e'||!Number(s[i-2])||!Number(s[i+1])))) break;
		}
		if(p||mat) {
			if(c=='<'||c=='>'||c=='=') throw "Bad Equation";
		}
	}
	if(p) throw "Paren Error";
	return {m:s.substring(q[1].length,i),i:nr==2?l:i,q:q[2],nr:nr};
}
function pTrim(s,pr) { //Trim Paren
	let i=0,l=s.length,c,p=0,pt,a,e,
	SSP=r => (s=s.substr(0,i)+r+s.substr(i+1),l=s.length,--i);
	for(;i<l;++i) {
		c=s[i]; if(c=='(') (p<pt?pt=p:0),++p; else if(c==')') (p==pt?e=i:0),--p;
		else if(c=='|') a?((p!=a&&(p=-1)),a=0,SSP(')')):(a=p+1,SSP('abs('));
		else if(c!='-'&&c!=' ') pt==null||p<pt?pt=p:0; if(p<0) break;
	}
	if(p) throw "Unmatched Paren"; a=0; if(pt) {
		for(i=0,p=0;i<l;++i) if(s[i]=='-') a=!a; else if(s[i]=='(' && ++p==pt) break;
		s=s.substring(i+1,e).trim();
	} else s=s.trim();
	if(pr && e!=null) s=`(${s})`;
	return a?'-'+s:s;
}

class Poly {
	constructor(f) {
		this.t=[]; if(Array.isArray(f)) {this.t=f;return}
		f=pTrim(f); let m,q; while(f.length) {
			m=pFind(f); if(m.q) {
				if(q) throw "Multipart Equation not supported!"; q=m.q;
			} else if(q) q=1;
			f=f.substr(m.i); this.t.push(new Term(m.m,q));
		}
	}
	q() {return this.t.each(t => t.q)} //Equation type
	s(fn) {let s='';this.t.each((t,i) => {s+=t.s(i,fn)});return s}
	simp(xv,cc) { //Simplify
		if(cc) FRAC=0;
		let p=this.t,i=0,l=p.length,t,m,ts,dq;
		p.each(t => {t.simp(xv);if(!dq)dq=t.q});
		function cut(f) {
			let n=p[i+1]; if(!f && (t.q===dq?!n:(!i&&n&&n.q===dq))) return;
			p.splice(i,1), t.q===dq&&(n.q=dq), f?(i=-1,l=p.length):(--i,--l);
		}
		for(; i<l; ++i) {
			t=p[i],m=MAT(t),ts=0; p.each(n => {
				if(t.like(n)) t.e=t.e.add(n.e),n=1; //Like-Terms
				else if(m && !t.q==!n.q && (n=MAT(n))) t.d[0].sx(m.add(n)),n=1; //Mat Add
				if(n===1) return ts=1,--l,'!'; //Del Term
			}, i+1);
			if(ts) t.simp(); //Simp Flag
			if(!NUM(t.e)) {p.splice(0,i),p.splice(i+1);break} //Del All
			if(t.e.eq(0)) cut(); else t.d.each(s => { //SubTerms
				if(s.ps && s.ps.length==1 && s.np()==1) { //Paren
					ACT(s.pr.length,1); let m='',tn=[],q=0;
					t.d.each(n => {s!=n&&(m+=n.s()+' ')});
					s.pr[0].t.each(t => {tn.push(new Term(m+t).simp())});
					if(dq) q=p.each((t,i) => t.q?i:null);
					p.splice(i>=q?l:q,0,...tn),cut(1); return 1;
				}
			},1);
		}
		/*for(i=0; i<d.length; ++i) { //2nd Cycle
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
		}*/
		if(!p[0]||p[0].q) p.splice(0,0,new Term(0));
		if(cc) FRAC=1; return this;
	}
	/*lt(q) { //Leading Term
		let l; this.t.each(t => {if((!l || t.xp()>l.xp()) && (!t.q)==(!q)) l=t}); return l;
	}*/
}
class Term {
	constructor(t,q) {
		let d,m,l=0; this.q=q;
		if(Array.isArray(t)) d=this.d=t;
		else if(NUM(t)) d=this.d=[new SubTerm(t)]; else {
			d=this.d=[]; t=t.replace(DN,'');
			for(m of t.matchAll(DP)) { //Multi/Power
				l+=m[0].length; d.push(new SubTerm(m[2],m[3],m[1]=='/'));
			}
			if(l!=t.length||!d[0]) throw "Bad Term "+t;
		}
		Object.defineProperty(this,'e',{get:()=>this.d[0].e, set:n=>this.d[0]=this.d[0].copy(n)});
		if(!NUM(d[0].e) || d[0].np()!=1) d.splice(0,0,new SubTerm(d[0].n?-1:1)),d[1].snf();
	}
	s(t,fn) { //String
		let m=this,d=m.d,n=abs(m.e).eq(1)&&d.length>1&&!d[1].pn,s='';
		d.each((t,i) => {s+=t.s(i,fn)},1), s=d[0].s(n?-1:0)+(n&&s.startsWith('*')?s.substr(1):s);
		return m.q&&m.q!==1?` ${fn&&m.q=='='?'==':m.q} `+s:t?d[0].n?' - '+s.substr(1):' + '+s:s;
	}
	simp(xv) { //Simplify
		let d=this.d,mt;
		for(let i=0,l=d.length,s,n; i<l; ++i) {
			if((s=d[i]).p instanceof Poly) { //Simp Pow
				s.sp(s.p.simp(xv),1); n=s.p.t;
				if(n.length==1 && n[0].d.length==1) s.sp(n[0].e.mul(s.pn?-1:1)); //Rem Par
				else if((n=s.p.s())=='1/2') s=d[i]=new SubTerm(`sqrt(${s.xs()})`,1,s.pn); //Sqrt
				else if(n=='1/3') s=d[i]=new SubTerm(`cbrt(${s.xs()})`,1,s.pn); //Cbrt
			}
			if(s.pr) for(let pn=0,pl=s.pr.length,p,t; pn<pl; ++pn) { //Simp Par
				p=s.pr[pn].simp(xv), t=p.t, n=t.length==1&&t[0];
				if(n && s.ps.length==1) { //Rem Par
					ACT(pl,1); p=s.np(), t=INT(p);
					if(!t && n.d[0].n) continue; t=t&&!(p%2), p==1&&(p=null);
					n.d.each(m => (t&&m.snf(),m.e==1?'!':(p&&m.sp(m.np()+'*'+p),null)));
					if(s.n&&(t=n.d[0])) t.snf(); d.splice(i--,1,...n.d),l=d.length;
				} else if(n && s.ps=='abs(') { //Simp Abs
					ACT(pl,1); if(t=MAT(n)) s.sx(t.func('abs')),--i;
					else if(!VRS(n)) (t=n.d[0]).n&&t.snf(),s.ps='(',--i;
				} else if(s.ps=='ln('||s.ps=='log(') { //Simp Log
					if(s.ps=='ln(') ACT(pl,1),p='e'; else if(pl==1) p=10; else {
						ACT(pl,2); if(pn!=1) continue; p=n&&!n.d[1]?n.e:p;
						n=s.pr[0].t,n=n.length==1&&n[0];
					}
					if(n) {
						if(p instanceof Poly) p=p.s(); if(n.e.lte(0)||p<=1) s.sx(NAN);
						else if(n.e.eq(1)&&!n.d[1]) s.sx(0); else if(n.s()==p) s.sx(1);
						else if(!FRAC&&!n.d[1]&&(NUM(p)||p=='e'))
							s.sx(p=='e'?Dec.ln(n.e):Dec.log(n.e,p));
					}
				} else if(s.ps=='sqrt(') SQC(s,'sqrt',2,pl)&&--pn;
				else if(s.ps=='cbrt(') SQC(s,'cbrt',3,pl)&&--pn;
				else if(s.ps=='rad(') ACT(pl,1),s.sx(`(2P(${p})/360)`),--pn;
				else if(s.ps=='deg(') ACT(pl,1),s.sx(`(360(${p})/2/P)`),--pn;
				else if(s.ps=='sin(') SFN(s,'sin',pl)&&--pn;
				else if(s.ps=='cos(') SFN(s,'cos',pl)&&--pn;
				else if(s.ps=='tan(') SFN(s,'tan',pl)&&--pn;
				else if(s.ps=='sec(') ACT(pl,1),s.sx(`(1/cos(${p}))`),--pn;
				else if(s.ps=='csc(') ACT(pl,1),s.sx(`(1/sin(${p}))`),--pn;
				else if(s.ps=='cot(') ACT(pl,1),s.sx(`(1/tan(${p}))`),--pn;
				else if(s.ps=='asin(') SFN(s,'asin',pl)&&--pn;
				else if(s.ps=='acos(') SFN(s,'acos',pl)&&--pn;
				else if(s.ps=='atan(') SFN(s,'atan',pl)&&--pn;
				//TODO: perm|comb
				//Matrix
				else if(s.ps=='tpose(') MFN(s,'tpose',pl)&&--pn;
				else if(s.ps=='det(') MFN(s,'det',pl,1)&&--i;
				else if(s.ps=='inv(') MFN(s,'inv',pl)&&--pn;
				else if(s.ps=='rref(') MFN(s,'rref',pl)&&--pn;
				else if(s.ps=='sum(') MFN(s,'sum',pl,1)&&--i;
				else if(s.ps=='rows(') MFN(s,'r',pl,2);
				else if(s.ps=='cols(') MFN(s,'c',pl,2);
				else if(s.ps=='dot(') {
					ACT(pl,2); if(pn!=1) continue; let a=MAT(s),b=MAT(s,1);
					if(a&&b) s.sx(a.dot(b)),--i; else if(!VRS(n)) throw "Bad input to dot";
				} else if(s.ps=='dotPow(') {
					ACT(pl,2); if(pn!=1) continue; let a=MAT(s),b=MAT(s,1);
					if(a&&!b) s.sx(a.dotPow(p)),--i; else if(!VRS(n)) throw "Bad input to dotPow";
				} else if(s.ps=='norm(') {
					let a,b; if(pl==1) p=2; else {ACT(pl,2); if(pn!=1) continue; b=MAT(s,1)}
					a=MAT(s); if(a&&!b) s.sx(a.norm(p)),--i; else if(!VRS(n)) throw "Bad input to norm";
				} else if(n && s.ps=='eye(') {
					ACT(pl,1); if(!n.d[1]&&INT(n.e)&&n.e>0) s.sx(Matrix.eye(Number(n.e))),mt=1;
					else if(!VRS(n)) throw "Non-Int Identity";
				}
			} else if(s.m) s.m.simp(xv),mt=1; //Matrix Simp
			else if(xv&&xv[s.x]) s.sx(`(${xv[s.x]})`),--i; //Set Var
			else if(!FRAC) { //Irrational Const
				if(s.x=='P') s.sx(PI);
				else if(s.x=='e' && NUM(n=s.np())) s.sx(Dec.exp(n));
			}
		}
		let e=this.e,v={},x,n; d.each(s => {
			if((n=NUM(s.p)) && NUM(s.e)) { //Apply Pow
				if(s.p!=1) s.sx(abs(s.e).pow(s.p).mul(s.n?-1:1)),s.sp(s.pn?-1:1);
				if(s.pn) {if(x=v[0]) return x.e=x.e.mul(s.e),'!'; v[0]=s}
				else return e=e.mul(s.e),'!';
			} else { //Combine Like-vars
				if(s.n) s.snf(),e=e.neg(); //Invert Term
				if(x=v[s.xs()]) return x.sp(n&&NUM(x.p)?
					x.np().add(s.np()):x.np()+'+'+s.np()),'!';
				v[s.xs()]=s;
			}
		},1);
		d.each(s => {
			if(s.p==0) return '!'; //Del 0-Pow
			let p=s.np(), ne=NUM(s.e);
			if(s.e && !ne) return e=NAN; //Set NaN
			if(!NUM(p) && ne && abs(s.e).eq(1)) s.sp(1);
			else if(p==-1) { //Simp Frac, Div-by-zero
				if(s.e==0) return e=NAN; if(NUM(e) && s.e) {
					if(!FRAC||!INT(e)||!INT(s.e)) return e=e.div(s.e),'!'; else {
						//TODO: If not int, but only a few digits after the decimal place, probably fine to GCD?
						let f=GCD(e,s.e), n=s.e.div(f); if(n<0) f=-f,n=-n;
						e=e.div(f), s.sx(n); if(n==1) return '!';
					}
				}
			}
		});
		if(mt && e!=0 && NUM(e)) for(let i=1,s; i<d.length; ++i) if((s=d[i]).m) {
			if(s.p!=1) throw "MAT POW NOT IMPLEMENTED!"; //TODO: Matrix pow
			if(s.pn) {e=NAN;break} else if(mt===1) { //Mat Scalar
				let ms=[new SubTerm(e)]; d.each(n => n.m?null:(ms.push(n),'!'),1);
				if(e!=1 || ms.length>1) s.m.scl(new Term(ms)).simp(xv),e=1;
				mt=s; //TODO: Reduce i if vars removed before mat somehow??
			} else mt.m=mt.m.mul(s.m).simp(xv),d.splice(i--,1); //Mat x Mat
		}
		if(e==0 || !NUM(e)) d.splice(1); //Del All
		this.e=e; return this;
	}
	like(t) { //Check Like-Terms
		let m=this; if((!m.q)!=(!t.q) || m.d.length!=t.d.length) return 0;
		return !m.d.each(s => t.d.each(n => n.mat(s)||null,1)?null:1,1);
	}
}
class SubTerm {
	constructor(x,p,d) {
		if(p==0) x=p=1; this.sx(x); this.sp(p||1); if(d) this.inv();
	}
	s(i,fn) { //String
		let m=this,p=m.p,ps=m.ps,s=ps&&ps.length>1;
		if(p instanceof Poly) p=`(${p})`; if(fn && m.m) throw "Matrix Incompatible";
		return (m.pn?'/':fn||(i>0&&(m.n||s||m.e))?'*':'')
			+(i===-1?NM(m.e):(m.n?'-':'')+XP(p,m.xs(),fn));
	}
	xis() {let m=this; return m.x||m.m?m.xs():m.pr[0]} //Inner exp
	xs() { //Get exponent string
		let m=this; return m.m?m.m.toString():(m.x||m.ps+m.pr.join(', ')+')');
	}
	sx(x) { //Set exponent
		let m=this,p; delete m.ps,delete m.pr,delete m.x,delete m.e,delete m.m;
		if(NUM(x,1)) m.x=abs(m.e=x instanceof Dec?x:Dec(x)).toString(),m.n=NG(m.e);
		else if(x instanceof Matrix) m.m=x,m.n=0; //Raw Matrix
		else { //String
			x=x.indexOf('(')!=-1?pTrim(x,1):x.trim();
			if(x.endsWith('%')) x=`(${x.substr(0,x.length-1)}/100)`;
			if(x[0]=='[') { //Matrix
				if(x.endsWith('!')) throw "Illegal Operator";
				let mt,mr=[]; m.m=new Matrix(), m.n=NG(x=x.substr(1));
				while(x.length>1) {
					mt=pFind(x,1); mr.push(new Poly(mt.m));
					x=x.substr(mt.i); if(mt.nr) m.m.nRow(mr),mr=[];
				}
				return;
			}
			if(x.endsWith('!')) x=`perm(${x.substr(0,x.length-1)})`;
			m.n=NG(x); if(m.n) x=x.substr(1).trim();
			try {m.e=Dec(x),m.x=m.e.toString(),m.n&&(m.e=m.e.neg())} catch(e) {
				if((p=x.indexOf('('))!=-1) {
					m.ps=x.substr(0,p+1), p=pSplit(x.substring(p+1,x.length-1),',');
					m.pr=[]; p.forEach(a => m.pr.push(new Poly(a)));
				} else if(VPR.test(x)) m.x=x; else throw "Bad SubTerm "+x;
			}
		}
	}
	np() { //Get power
		let m=this,p=m.p; return NUM(p)?(m.pn?p.neg():p):(m.pn?'-':'')+`(${p})`;
	}
	sp(p,f) { //Set power
		let m=this; if(!(p instanceof Poly)) {
			try {p=Dec(p)} catch(e) {} m.pn=NG(p);
			if(NUM(p,1)) {if(!NUM(m.p=abs(p))) m.sx(NAN);return}
			f=1,p=new Poly(p.substr(m.pn?1:0));
		}
		if(p.t.length==1 && NG(p.t[0].e)) m.pn=f?!m.pn:1,p.t[0].e=p.t[0].e.neg(); m.p=p;
	}
	inv() {this.pn=!this.pn} //Toggle div flag
	snf(n) {this.n=n;if(this.e)this.e=abs(this.e).mul(n?-1:1)} //Set neg flag
	copy(x) {return new SubTerm(x==null?(this.n?'-':'')+this.xs():x,this.np())} //Create copy
	mat(s) {return PEQ(this,s)&&this.xs()==s.xs()} //Check match
}
Poly.prototype.toString=Poly.prototype.s;
Term.prototype.toString=Term.prototype.s;

class Matrix {
	constructor(a) {
		let m=this; if(a) m.a=a,m.r=a.length,m.c=a[0].length;
		else m.r=m.c=0,m.a=[];
	}
	static eye(e) { //Identity
		let m=new Array(e),r=0,c;
		for(; r<e; ++r) for(c=0,m[r]=new Array(e); c<e; ++c) m[r][c]=new Poly([new Term(c==r?1:0)]);
		return new Matrix(m);
	}
	nRow(r) { //New Row
		let m=this; ++m.r; if(!m.c) m.c=r.length;
		else if(m.c!=r.length) throw "Matrix Dimension";
		m.a.push(r);
	}
	ns(r,c,p) {r=this.a[r][c];return p||r.t.length>1?`(${r})`:r.s()} //Item Str
	toString(p) {
		let m=this,s,r,c,d,dd,cl,f=m.c-1; if(p) {
			for(c=0,dd=0,cl=new Array(m.c); c<m.c; ++c) {
				for(r=0,cl[c]=0; r<m.r; ++r) if((d=m.ns(r,c).length)>cl[c]) cl[c]=d; //Col Len
				dd+=cl[c]+MAT_COL_W;
			}
			s=` ${m.r}x${m.c} `, d=dd-MAT_COL_W+4, dd='+'+'-'.repeat(d-2)+'+';
			d=d/2-s.length/2, s=`\n${dd.substr(0,d)+s+dd.substr(d+s.length)}\n`;
		} else s='[';
		for(r=0; r<m.r; ++r) {
			if(r) s+=p?'\n':'; '; if(p) s+='| ';
			for(c=0; c<m.c; ++c) d=m.ns(r,c), s+=d+(p?' '.repeat
				(cl[c]-d.length+(c==f?0:MAT_COL_W)):c==f?'':' ');
			if(p) s+=' |';
		}
		if(p) s=m.toString()+s+'\n'+dd; else s+=']';
		return s;
	}
	simp(xv) {let m=this,r=0,c;for(; r<m.r; ++r) for(c=0; c<m.c; ++c) m.a[r][c].simp(xv);return m}
	scl(x) { //Scalar
		let m=this,r=0,c;for(; r<m.r; ++r) for(c=0; c<m.c; ++c) m.a[r][c]=new Poly(m.ns(r,c)+'*'+x);
		return m;
	}
	sum() { //Sum
		let m=this,r=0,c,s='';for(; r<m.r; ++r) for(c=0; c<m.c; ++c) s+=(s?'+':'')+m.ns(r,c);
		return `(${s})`;
	}
	func(f) {
		let m=this,r=0,c;for(; r<m.r; ++r) for(c=0; c<m.c; ++c) m.a[r][c]=new Poly(f+m.ns(r,c,1));
		return m;
	}
	mul(b) { //Mat x Mat
		let m=this,n=new Array(m.r); if(m.c!=b.r) throw "Matrix Multiply Dimension";
		for(let r=0,c,z,ns; r<m.r; ++r) for(c=0,n[r]=new Array(b.c); c<b.c; ++c) {
			for(z=0,ns=''; z<m.c; ++z) ns+=(z?'+':'')+m.ns(r,z,1)+b.ns(z,c,1); n[r][c]=new Poly(ns);
		}
		return new Matrix(n);
	}
	dot(b) { //Mat * Mat
		let m=this; if(m.r!=b.r || m.c!=b.c) throw "Matrix Dot Dimension";
		for(let r=0,c; r<m.r; ++r) for(c=0; c<m.c; ++c) m.a[r][c]=new Poly(m.ns(r,c,1)+b.ns(r,c,1));
		return m;
	}
	dotPow(p) { //Mat ^ p
		let m=this,r=0,c; p=`^(${p})`;
		for(; r<m.r; ++r) for(c=0; c<m.c; ++c) m.a[r][c]=new Poly(m.ns(r,c,1)+p);
		return m;
	}
	norm(p) {return '('+this.dotPow(p).func('abs').sum()+`^(1/(${p})))`} //p-norm
	add(b) { //Mat + Mat
		let m=this,r=0,c; if(m.r!=b.r || m.c!=b.c) throw "Matrix Add Dimension";
		for(; r<m.r; ++r) for(c=0; c<m.c; ++c) m.a[r][c].t.push(...b.a[r][c].t);
		return m;
	}
	tpose() { //Transpose
		let m=this,c=0,r,n=new Array(m.c);
		for(; c<m.c; ++c) for(r=0,n[c]=new Array(m.r); r<m.r; ++r) n[c][r]=m.a[r][c];
		return new Matrix(n);
	}
	det() { //Determinant
		let m=this,c=0,i,b,aj,bj,g,s='',sl=m.r-1;
		if(m.r!=m.c) throw "Non-Square Determinant"; if(m.r==1) return m.ns(0,0);
		if(m.r==2) return `(${m.ns(0,0,1)+m.ns(1,1,1)}-${m.ns(0,1,1)+m.ns(1,0,1)})`;
		for(; c<m.r; ++c) {
			for(i=0,b=new Array(sl); i<sl; ++i) for(aj=0,bj=0,b[i]=new Array(sl); aj<m.r; ++aj)
				if(aj!=c) b[i][bj++]=m.a[i+1][aj];
			s+=(s?g?'-':'+':'')+m.ns(0,c,1)+new Matrix(b).det(), g=!g;
		}
		return s;
	}
	inv() { //Inverse
		throw "INVERSE NOT IMPLEMENTED";
		/*let m=this,r=0,c,l=m.r,nr=new Array(l),d=new Poly(m.det()).simp();
		if(PZ(d)) throw "Non-Invertible Matrix"; d=`/(${d})`;
		for(; r<l; ++r) for(c=0,nr[r]=new Array(l); c<l; ++c) nr[r][c]=new Poly(`(${m.a[(c+1)%l][(r+1)%l]})`
			+`(${m.a[(c+2)%l][(r+2)%l]})${d}-(${m.a[(c+1)%l][(r+2)%l]})(${m.a[(c+2)%l][(r+1)%l]})${d}`);
		m.a=nr; return m;*/ //Only works for 3x3!
	}
	rref() { //Row-Reduce
		let m=this,r=0,ld=0,i,c,n;
		for(; r<m.r; ++r,++ld) {
			i=r; if(m.c <= ld) return m;
			while(PZ(m.a[i][ld])) if(++i == m.r) {i=r; if(++ld == m.c) return m}
			n=m.a[i], m.a[i]=m.a[r], m.a[r]=n; //Swap rows i and r
			if(!PZ(n=m.a[r][ld])) { //Div row r by n
				for(c=0,n=`/(${n})`; c<m.c; ++c) m.a[r][c]=new Poly(m.ns(r,c)+n).simp();
			}
			for(i=0; i<m.r; ++i) if(i!=r) {
				for(c=0,n='-'+m.ns(i,ld,1); c<m.c; ++c) { //row i -= m.a[i][ld]*row r
					m.a[i][c].t.push(new Term(n+m.ns(r,c))); m.a[i][c].simp();
				}
			}
		}
		return m;
	}
}

//============================================== Support Functions ==============================================

const EQ=/[<>]=?|=/,//PS=(p,s) => (p=new Poly(p),(s%2?'\n':'')+(s>1?p.simp():p).s()), //Poly String
//PSS=p => (p=new Poly(p),p+'\n'+p.simp()), //PS Simp
//pGet=(p,e,q) => p.t.each(t => t.xp()==e&&t.q==q?t.e:null)||0, //Get Term w/ Exp
sSer=(s,v) => s.x===v||(s.pr&&s.pr.each(p => pSer(p,v))!=null)
	||(s.p instanceof Poly&&pSer(s.p,v)!=null), //SubTerm var search
tSer=(t,v) => t.d.each((s,i) => sSer(s,v)?i:null), //Term var search
pSer=(p,v) => p.t.each((t,i) => tSer(t,v)!=null?i:null), //Poly var search
sGet=s => {let q=EQ.exec(s),i=q.index,l=q[0].length; return [s.substr(i,l),
	s.substr(0,i).trim(),s.substr(i+l).trim()]}; //Get Sign
//LF=n => {if(n>FACT_MAX)return [n];let f=[],i=1;
//	for(n=abs(n);i<=n;++i)if(n%i===0)f.push(i);return f} //List Factors

function Der(p,v) { //Calc Derivative
	let d=[],f,q,ql,x,w,c,n,ps=p.s(); p.t.each(t => {
		c='',q=[],f=[]; t.d.each(s => { //Separate Const & X-Term
			if(s.m) throw "Matrix not supported!"; sSer(s,v)?q.push(s):c+=s.s()+' ';
		});
		ql=q.length; if(!ql) return; if(ql>2) throw "Can't do >2 sub-terms yet!";
		q.each((q,i) => {
			if(q.pn&&i) q.inv(),q.QN=1; x=q.xis(),w=q.np(),n='';
			if(q.ps && x!=v) n+=`(${Der(q.pr[0],v)})`,msg(); //Chain Rule
			if(q.p instanceof Poly && pSer(q.p,v)!=null) { //X-Power
				if(q.p.s()!=v) n+=`(${Der(q.p,v)})`,msg(); //Power Chain Rule
				if(q.ps) throw "OOPS! "+q.s(); //???
				n+=q.s()+` ln(${x})`;
			} else {
				if(q.ps) switch(q.ps) {
					case 'log(': n+=`/(${x})/ln(${q.pr[1]||10})`; break;
					case 'ln(': n+=`/(${x})`; break; case 'sqrt(': n+=`1/2/sqrt(${x})`; break;
					case 'sin(': n+=`cos(${x})`; break; case 'csc(': n+=`*-csc(${x})*cot(${x})`; break;
					case 'cos(': n+=`*-sin(${x})`; break; case 'sec(': n+=`sec(${x})*tan(${x})`; break;
					case 'tan(': n+=`sec(${x})^2`; break; case 'cot(': n+=`*-csc(${x})^2`; break;
					case '(': break; default: throw "OOPS! "+q.s(); //???
				}
				if(w!=1||!n) n+=w==1?'1':w+q.xs()+`^(${w}-1)`; //Var Power
			}
			if(ql>1) msg(C.Ylo+`d/d${v}[${q.s()}] =`,n);
			f.push(n);
		});
		if(ql==2) { //Quotient/Product Rule
			x=q[1].QN, w=q[1].s();
			msg(`\nUsing ${x?'Quotient':'Product'} Rule:`);
			if(x) {
				msg(C.Di+"(f'(x)*g(x) - f(x)*g'(x))/g(x)^2");
				f=[`((${f[0]})(${w}) - (${q[0].s()})(${f[1]}))/(${w})^2`];
			} else {
				msg(C.Di+"g(x)*f'(x) + f(x)*g'(x)");
				f=[`(${w})(${f[0]})`,`(${q[0].s()})(${f[1]})`];
			}
			msg(f.join(' + ')+'\n');
		}
		f.each((t,i) => {f[i]=c+t}); d.push(...f);
	});
	d.each((t,i) => {d[i]=new Term(t)}); x=(d=new Poly(d)).s(), f=d.simp(v).s();
	msg(C.Ylo+`d/d${v}[${ps}]\n`+C.Br+C.Blu+`= ${x}`+(f!=x?'\n= '+f:''));
	return f;
}

/*function ADRem(t) { //Test Removable
	/*c=new Poly(Der(q.pr,v)),msg();
	if(c.each(s => t.d.each(m => m!=q&&s.mat(m)?1:null)))
		return c.each(s => s.inv());*
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
			msg(`\nUsing Product Rule:\n${C.Di}f(x)*S(g(x))dx - S(f'(x)*S(g(x))dx)dx`);
			f=[`(${q[0].s()})`+f.g,'-'+f.f+f.g];
		} else *if(q=q[0]) {
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
	msg(C.Ylo+`S(${ps})d${v}\n`+C.Br+C.Blu+`= ${x} + C`+(f!=x?`\n= ${f} + C`:''));
	return f;
}*/

//============================================== Graphics ==============================================

let GFX; const GBG=C.Br+C.Blk+C.BgWhi, GC=[C.Red, C.Blu, C.Grn, C.Mag, C.Ylo],
NCP=(n,p,l) => (n=p?Math.round(n*p)/p:n,l?n.toString().substr(0,l):n); //Clip Precision

process.stdin.on('data',k => {
	if(!GFX) return; let g=GFX,d=1; switch(k) {
		case '\x1B[A': g.y+=2/g.z; break; case '\x1B[B': g.y-=2/g.z; break; //Up/Down
		case '\x1B[C': g.x-=2/g.z; break; case '\x1B[D': g.x+=2/g.z; break; //Right/Left
		case '+': case '=': g.z*=2; break; case '-': g.z/=2; break; //+/-
		case '\x1B[1~': case ' ': g.x=g.y=0,g.z=1; break; //Home/Space
		case 'q': case '\x1B': return GFX=0,g.r(); default: d=0; //Esc
	}
	if(d) dGraph();
});
function sGraph(s,f,x,y,z) {return new Promise(r => {
	GFX={s:s,f:f,x:x,y:y,z:z||1,r:r}; dGraph();
})}
function dGraph() {
	let g=GFX, w=process.stdout.columns-1, h=process.stdout.rows-2, z=g.z, z2=z*2,
	s=`Graphing [${g.s}]  @  (${g.x=NCP(g.x,z)}, ${g.y=NCP(g.y,z)}) ${z*100}%\n`,
	cx=Math.floor(w/2)+g.x*z,cy=Math.floor(h/2)+g.y*z,fx=new Array(w),
	fn=g.f.length,x=0,y=0,f,ox,oy,a,n,xf; for(; x<w; ++x) { //Compute Func List
		fx[x]=xf=new Array(fn); for(f=0; f<fn; ++f) a=g.f[f]((x-cx)/z2)*z,
			oy=Math.round(a), xf[f]=[oy,a===oy];
	}
	for(; y<h; ++y) { //Draw Graph
		s+=GBG; for(x=0; x<w;) {
			ox=x-cx,oy=cy-y; for(f=fn-1; f>=0; --f) {
				xf=fx[x][f]; if(oy===xf[0]) {a=GC[f]+(xf[1]?'*':'~')+GBG,n=1; break}
			}
			if(!n) a=y===cy?x===cx?'+':ox%6?'_':NCP(ox/z2,10,w-x)
				:x===cx?oy%2?'|':NCP(oy/z,10,w-x):' ';
			s+=a,x+=n||a.length,n=0;
		}
		s+=C.Rst+'\n';
	}
	process.stdout.write(s);
}

//============================================== Commands ==============================================

const ML = {
	r:'Run', s:'Solver', g:'Graph', d:'Derivative'
}, CS=/(?:^|\s+)("[^"]+"|\S+)/g,
CC='`', CM=C.BgBlu+C.Whi, CD=C.Br+C.Cya,
CR=C.Blk, CV=C.Rst+C.Di, CH=C.Br+C.BgYlo+C.Whi;

let n,HLP=`${CD}dec/frac${CR} = Toggle Fractions\n${CD}deg${CR} = Toggle Deg/Rad Mode\n\
${CD}sv${CR} = Substitute Vars\n${CD}js${CR} = JavaScript Mode\n\
${CD}vars${CR} = List Vars\n${CD}del <x>${CR} = Delete Var\n\n\
${CH}Functions${C.Rst}\n\
sqrt(x) = Square Root\ncbrt(x) = Cube Root\nabs(x) or |x| = Absolute Value\n\
ln(x) = Natural Log (Base e)\nlog(x,b=10) = Log Base b\n\
sin|cos|tan|sec|csc|cot(a) = Sine Functions\nasin|acos|atan(x) = Arcsine Functions\n\
rad|deg(a) = Convert Angles\n\
${C.Di}{ BETA: More Coming Soon! }\n\n\
${C.Rst+CH}Matrix Functions${C.Rst}\n\
rows(m)/cols(m)\ntpose(m) = Transpose\ndot(a,b) = Dot Product\n\
dotPow(m,p) = Dot Power\nsum(m) = Sum\ndet(m) = Determinant\n\
rref(m) = Reduced Echelon\nnorm(m,p=2) = Norm/Magnitude\n\
eye(x) = Identity Matrix\n\n\
${CH}Commands${C.Rst}\n`;

for(let k in ML) HLP+=(n!=null?','+(n?' ':'\n'):'')+CC+k+' = '+ML[k],n=!n;
HLP+=`\n\nMore help: ${C.Cya}https://github.com/Pecacheu/Solver`;

msg(C.Br+C.Grn+"Pecacheu's Math Solver "+C.Ylo+VER);
await run(process.argv); rl.close();

async function runCmd(s,vt) {
	let c=[0,0],m; while(m=CS.exec(s)) {
		if((m=m[1]).startsWith('"')) m=m.substr(1,m.length-2); c.push(m);
	}
	if(!s) use(CC+"<cmd> ...",''); else await run(c,vt);
}

async function run(A,VT) {
let T=A[2], AL=A.length;
if(!T) T='r'; else if(T=='?') return msg(HLP);
msg(C.BgMag+"Mode:",ML[T]?ML[T]+C.Rst+'\n':"Not Supported");
if(T=='r') { //RUN
	msg("Type '?' for help, 'q' to quit.");
	const VAR={}; let f,n,r,S=1,FR=1;
	while((f=(await read('>')).trim())!='q') try {
		if(f=='?') msg(HLP); else if(f.startsWith(CC)) await runCmd(f.substr(1),S&&VAR);
		else if(S==2) RUN(f); else pSplit(f,';').each(RUN);
	} catch(e) {msg(C.Red+'->',e)}
	function RUN(s) {
		if(s=='dec'||s=='frac') msg(CM+((FR=FR==1?0:1)?"Fractional":"Decimal"),"Output");
		else if(s=='sv') msg(CM+"Substitution",(S=S==1?0:1)?"On":"Off");
		else if(s=='js') msg(CM+"JS Mode",(S=S==2?1:2)==2?"On":"Off");
		else if(s=='deg') msg(CM+"Angle Mode:",(DEG=DEG?0:1)?"Deg":"Rad");
		else if(s.startsWith('del ')) delete(VAR[s=s.substr(4).trim()]),msg("Delete",s);
		else if(s=='vars') msg(VAR); else {
			if(S==2) try {n=s,r=eval(s)} catch(e) {r=C.Red+e} //JS
			else {
				s=new Poly(s),n=s.s(); s.simp(S&&VAR);
				if(!FR) s.simp(null,1); r=s.s();
				if(f=n.match(VSV)) { //Set Var
					r=r.substr(r.indexOf('=')+2);
					if(f[1]==r) throw "Cannot set var to itself!";
					VAR[f[1]]=r, r=CV+`Set ${C.Ylo+f[1]+CV} to `+C.Rst+C.Ylo+r;
				} else if(!VRT.test(r) && VEQ.test(r)) { //Eval T/F
					if(FR) s.simp(null,1); r=s.s()+C.Grn+" ~ "+eval(s.s(1));
				}
				if(!s.t[1] && (f=MAT(s.t[0]))) r=f.toString(1); //Mat Print
				r=C.Ylo+r;
			}
			msg(C.Di+n,C.Rst+'\n->',r);
		}
	}
} else if(T=='s') { //Solve
	let p=A[3], v=A[4]||'x', pm=p&&Array.from(p.matchAll(new RegExp(EQ,'g')));
	if(AL<4 || !pm.length || !VST.test(v)) return use(T,"<equation> [var]");
	let pl=[],re=[],x,q,qd=0; //Convert Multi-Poly:
	pm.each((_,i,l) => {pl.push(new Poly(p.substring(i?pm[i-1].index+
		pm[i-1][0].length:0, i==l-1?p.length:pm[i+1].index-1)))});
	for(p=0; p<pl.length; p++) { //Solve Poly
		let a,s,s2,m,LP=0; if(p) msg("\nSolve Split #"+p);
		while((s=pl[p].s()) != s2) { //Run Solver
			x=[],a=pl[p]; if(++LP>30) throw "Stuck!"; msg(s,C.Di+(m?`(${m})`:''));
			m=0,s2=a.simp(VT).s(),a=a.t; if(s2!=s) msg(s2,C.Di+"(Simplify)");
			if(!a.each((t,i) => { //Move Term
				if(t.e.eq(0)) return;
				if((q=tSer(t,v))!=null) x.push({t:t,s:t.d[q]});
				if(!q==!t.q) { //Non-zero terms on wrong side of eq
					q=t.q; if(q&&q!==1) (a[i+1]?a[i+1]:a[i+1]=new Term(0)).q=q;
					t.q=0, m="Move Term "+t.s(), t.e=t.e.neg(), t.q=q?0:1;
					if(!q&&!i&&a[i+1].q) a.splice(i,1,new Term(0)); else a.splice(i,1);
					a.splice(q?i-1:a.length,0,t); return 1;
				}
			})) { //All terms moved
				/*if(qd<2 && (q=x.each(x => x.t.d.each(s => s.pr&&NUM(s.p)&&(x.s=s)||null)?x:null))) { //Paren
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
						let r,w,ml=[]; m=0; q.t.d.each(s => { if(NUM(w=s.np())) {
							if(s==q.s) r=(w>2 || (w>1 && x.length>1)),s.NP=--w; //Power
							else r=(s.e!=1 && ((!s.ps && w>0) || (s.ps && s.ps.length==1 && w==1))); //SubTerm
							if(r) s.pr?(m=s.pr,s.NP=w-1):(ml.push(s.s()),s.NP=0);
						}});
						if(m || ml.length) {
							if(!m) m=new Poly(ml.join(' ')); msg(C.Cya+`\nMultiply (${q.s.pr}) by (${m})`);
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
						msg(q[0],C.Di+`(Add (b/2a)^2 = ${m})`);
						if(q[0]!=q[1]) msg(q[1],C.Di+"(Simplify)");
						m=(a=pl[p].t).each((t,i) => t.q?i:null);
						a.splice(0,m,new Term(`(${v}+${b}/2)^2`));
						m="Reverse Square Rule", qd=2; continue;
					}
				} else if(qd>1) qd=0;*/
				q=[]; //TEMP?
				m=[]; if(!q.length) {
					if(x.each(x => NUM(x.s.p)&&x.s.np().gt(2)?1:null)) q=[new SubTerm(v)];
					else x.each(x => x.t.d.each(s => {
						(NUM(s.e)&&s.e.eq(1))||(s.pn?m.push(s):sSer(s,v)?0:q.push(s));
					}));
				}
				if(q.length||m.length) { //Divide/Multiply
					m.length?(q=m,m=1):m=0; let n,r='';
					q.each(s => {r+=' '+(m?s.s().substr(1):s.s()); if(s.n) n=!n});
					a.each(t => {
						if(t.q && t.q!==1 && n) t.q=SFL(t.q); //Flip inequality
						q.each(s => {(s=s.copy()).inv(),t.d.push(s)});
					});
					m=`${m?"Multiply":"Divide"} by`+r; continue;
				}
				/*if(x.length != 1) break; //Couldn't solve!
				if((x=x[0]).s.np() != 1) { //Square Pow
					if(x.s.np() != 2) return msg(C.Red+"Can't handle non-square pow yet!");
					x.s.sp(1), q=a[1].q, m=sGet(s2), s=`sqrt(${m[2]})`;
					a.splice(1,a.length,new Term(s)), pl.push(new Poly(x.t+SFL(m[0])+'-'+s));
					a[1].q=q, m="Undo Square; Split #"+(pl.length-1);
				}*/
			}
		}
		m=s===s2?sGet(s):0;
		if(!m || !s.startsWith(v+' '+m[0])) msg(C.Red+"Couldn't solve!"); else {
			msg(C.Ylo+"Done!"); re.push(pl[p]); q=m[0][0], x=m[0][1];
			if(q=='>') re.gt=eval(m[2]),re.gq=(x?'[':'(')+m[2];
			else if(q=='<') re.lt=eval(m[2]),re.lq=m[2]+(x?']':')');
		}
	}
	q=''; if(re.gt >= re.lt) q=`(-infinity, ${re.lq}U${re.gq}, infinity)`;
	else if(re.gt < re.lt) q=re.gq+', '+re.lq; else if(re.gt != null) q=re.gq+', infinity)';
	else if(re.lt != null) q='(-infinity, '+re.lq;
	if(re.length) msg(C.Br+C.Blu+'\n'+re.join('; '),q?'\n'+q:'');
	if(VT && re.length==1 && (q=re[0].s()) && (x=q.match(VSV))) { //Set Var
		q=q.substr(q.indexOf('=')+2), VT[x[1]]=q, msg(CV+`Set ${C.Ylo+x[1]+CV} to `+C.Rst+C.Ylo+q);
	}
} else if(T=='g') { //Graph
	if(AL<4) return use(T,"<poly1> [x] [y] [zoom] [poly2] [poly3]...");
	if(VT) delete VT.x; let e,i=7,f=[],s=[], x=Number(A[4])||0, y=Number(A[5])||0,
	p=[new Poly(A[3]).simp(VT)]; for(; i<AL; ++i) p.push(new Poly(A[i]).simp(VT));
	try {p.each((p,i) => {
		msg(p.s(1));
		e=eval(`x=>(${p.s(1)})`),e(1),f.push(e),s.push(C.Br+GC[i%GC.length]+p.s()+C.Rst);
	})} catch(e) {throw `Bad Func (${e})`}
	await sGraph(s.join(', '),f,x,y,Number(A[6]));
} else if(T=='d') { //Derivative
	let v=A[4]||'x';
	if(AL<4 || !VST.test(v)) return use(T,"<poly> [var]");
	Der(new Poly(A[3]).simp(),v);
}}
/*} else if(T=='ad') { //Antiderivative
	let v=A[4]||'x';
	if(AL<4 || !VST.test(v)) return use(T,"<poly> [var]");
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
} *else if(T=='mp') { //Multiply Poly
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
}*else if(T=='sm') { //Summation
	let n=Number(A[4]),i=Number(A[5]); if(!n) return use(T,"<poly> <n> [k]\nE[n;i=k](poly)");
	if(Number.isNaN(i)) i=1; let r='',p=new Poly(A[3]).simp().s();
	msg(C.Ylo+`E[${n};i=${i}](${p})`);
	for(; i<=n; ++i) r+=(r.length?" + ":'')+`(${p.replace(/i/g,`(${i})`)})`;
	msg('= '+r); msg(C.Br+C.Blu+'= '+new Poly(r).simp());
}}*/