import rdl from 'readline';

const msg=console.log, rl=rdl.createInterface(process.stdin, process.stdout);
function read(q) {return new Promise(r=>{rl.question(q+' ',n=>r(n))})}
function getN(q) {
	return read(q).then(n => {
		try {n=eval(n)} catch(e) {n=null}
		if(typeof n!='number') msg("NaN!"),process.exit(); return n;
	});
}
function NS(n) {return n<0?'- '+(-n):'+ '+n} //Print Neg/Pos Term
function LF(n) { //List Factors
	let f=[],i=1; n=Math.abs(n); for(; i<=n; i++) if(n%i==0) f.push(i); return f;
}

const ML = {
	q:'Quadratic Solver', p:'Two Point Solver', y:'Point-Slope Solver',
	s:'Equation System Solver', lf:'List Factors of N'
};

msg("Pecacheu's Math Solver v1.1");
let MS='',n; for(let k in ML) MS+=(MS?','+(n?' ':'\n'):'')+k+' = '+ML[k], n=!n;
let A=process.argv, T=A[2]||await read(MS+'\nType?');
msg(ML[T]?`Mode: ${ML[T]}\n`:"Not Supported!");

if(T=='q') {
	msg("y = ax^2 + bx + c");
	let a=await getN("A?"), b=await getN("B?"), c=await getN("C?"),
	y=await getN("Y?"), yca=(y-c)/a, n=b/(2*a), ns=Math.pow(n,2);

	msg(`\n${a}x^2 + ${b}x + ${c} = ${y}\n${a}x^2 + ${b}x = ${y-c}`);
	msg(`x^2 + ${b}x/${a} = ${y-c}/${a}`);
	msg(`x^2 + ${b/a}x + ${ns} = ${yca} + ${ns} (Add (b/2a)^2 = ${ns} to both sides)`);
	msg(`(x ${NS(n)})^2 = ${yca+ns} (Apply square rule)`);
	msg(`x ${NS(n)} = +/-sqrt(${yca+ns})`);
	msg(`x = sqrt(${yca+ns}) ${NS(-n)}; x = -sqrt(${yca+ns}) ${NS(-n)}`);
	msg(`x = ${Math.sqrt(yca+ns)-n}; x = ${-Math.sqrt(yca+ns)-n}`);
} else if(T=='p') {
	let x1=await getN("X1?"), y1=await getN("Y1?"), x2=await getN("X2?"),
	y2=await getN("Y2?"), m=(y2-y1)/(x2-x1), mx=m*-x1, b=mx+y1;

	msg(`\nPoints: (${x1},${y1}) and (${x2},${y2})`);
	msg(`Slope:\nm = (${y2}-${y1})/(${x2}-${x1})\nm = ${y2-y1}/${x2-x1}\nm = ${m}\n`);
	msg(`Point-Slope:\ny - y1 = m(x - x1)\ny - ${y1} = ${m}(x - ${x1})`);
	msg(`y - ${y1} = ${m}x - ${m}*${x1}\ny = ${m}x ${NS(mx)} + ${y1}`);
	msg(`y = ${m}x ${NS(b)}`);
} else if(T=='y' || T=='s') {
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
} else if(T=='lf') {
	msg("Factors:",LF(await getN("N?")));
}
rl.close();