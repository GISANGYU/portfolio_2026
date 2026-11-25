/* FILTERED — 그림 헬퍼 (리듬세상풍 굵은 외곽선 캐릭터, 인라인 SVG) */

window.DR = (function () {
  const INK = '#1d1b1a';

  // 얼굴: eyes 'dot' | 'closed' | 'cry' | 'wide' | 'angry' | 'squint'
  //       mouth 'smile' | 'grin' | 'flat' | 'frown' | 'o' | 'open' | 'strain'
  function face(x, y, r, o) {
    o = o || {};
    const skin = o.skin || '#ffd9b8', eyes = o.eyes || 'dot', mouth = o.mouth || 'smile';
    let s = '';
    if (o.hairBack) s += `<ellipse cx="${x}" cy="${y + r * 0.2}" rx="${r * 1.1}" ry="${r * 1.2}" fill="${o.hairBack}" stroke="${INK}" stroke-width="4"/>`;
    s += `<circle cx="${x}" cy="${y}" r="${r}" fill="${skin}" stroke="${INK}" stroke-width="4"/>`;
    if (o.hair) s += `<path d="M${x - r} ${y - r * 0.1} Q${x - r} ${y - r * 1.15} ${x} ${y - r * 1.05} Q${x + r} ${y - r * 1.15} ${x + r} ${y - r * 0.1} Q${x + r * 0.4} ${y - r * 0.55} ${x - r} ${y - r * 0.1}Z" fill="${o.hair}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    const ex = r * 0.38, ey = y - r * 0.08;
    const eye = (cx) => {
      if (eyes === 'closed') return `<path d="M${cx - r * 0.16} ${ey} q${r * 0.16} ${r * 0.12} ${r * 0.32} 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
      if (eyes === 'squint') return `<path d="M${cx - r * 0.16} ${ey + 2} l${r * 0.32} 0" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`;
      if (eyes === 'wide') return `<circle cx="${cx}" cy="${ey}" r="${r * 0.16}" fill="#fff" stroke="${INK}" stroke-width="3"/><circle cx="${cx}" cy="${ey}" r="${r * 0.07}" fill="${INK}"/>`;
      if (eyes === 'angry') return `<circle cx="${cx}" cy="${ey + 2}" r="${r * 0.08}" fill="${INK}"/><path d="M${cx - r * 0.2} ${ey - r * 0.2} l${r * 0.4} ${cx < x ? r * 0.12 : -r * 0.12}" stroke="${INK}" stroke-width="4" stroke-linecap="round" transform="${cx < x ? '' : ''}"/>`;
      return `<circle cx="${cx}" cy="${ey}" r="${r * 0.09}" fill="${INK}"/>`;
    };
    s += eye(x - ex) + eye(x + ex);
    if (eyes === 'cry') s += `<path d="M${x - ex} ${ey + r * 0.12} q-4 ${r * 0.3} 0 ${r * 0.42} q4 -${r * 0.12} 0 -${r * 0.42}" fill="#6ec3ff" stroke="${INK}" stroke-width="2"/><path d="M${x + ex} ${ey + r * 0.12} q-4 ${r * 0.3} 0 ${r * 0.42} q4 -${r * 0.12} 0 -${r * 0.42}" fill="#6ec3ff" stroke="${INK}" stroke-width="2"/>`;
    const my = y + r * 0.42;
    const M = {
      smile: `<path d="M${x - r * 0.3} ${my - 4} q${r * 0.3} ${r * 0.3} ${r * 0.6} 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      grin: `<path d="M${x - r * 0.35} ${my - 6} q${r * 0.35} ${r * 0.45} ${r * 0.7} 0 z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`,
      flat: `<path d="M${x - r * 0.22} ${my} l${r * 0.44} 0" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`,
      frown: `<path d="M${x - r * 0.28} ${my + 4} q${r * 0.28} -${r * 0.25} ${r * 0.56} 0" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      o: `<ellipse cx="${x}" cy="${my}" rx="${r * 0.12}" ry="${r * 0.15}" fill="${INK}"/>`,
      open: `<ellipse cx="${x}" cy="${my}" rx="${r * 0.22}" ry="${r * 0.18}" fill="#7a2530" stroke="${INK}" stroke-width="3"/>`,
      strain: `<rect x="${x - r * 0.3}" y="${my - r * 0.1}" width="${r * 0.6}" height="${r * 0.2}" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/><path d="M${x - r * 0.3} ${my} l${r * 0.6} 0" stroke="${INK}" stroke-width="2"/>`,
    };
    s += M[mouth] || M.smile;
    if (o.blush) s += `<ellipse cx="${x - r * 0.6}" cy="${y + r * 0.25}" rx="${r * 0.14}" ry="${r * 0.08}" fill="#ff9aa2" opacity=".8"/><ellipse cx="${x + r * 0.6}" cy="${y + r * 0.25}" rx="${r * 0.14}" ry="${r * 0.08}" fill="#ff9aa2" opacity=".8"/>`;
    if (o.hat === 'chef') s += `<path d="M${x - r * 0.7} ${y - r * 0.75} l0 -${r * 0.45} q-${r * 0.3} -${r * 0.7} ${r * 0.35} -${r * 0.6} q${r * 0.35} -${r * 0.5} ${r * 0.7} 0 q${r * 0.65} -${r * 0.1} ${r * 0.35} ${r * 0.6} l0 ${r * 0.45} z" fill="#fff" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>`;
    if (o.hat === 'cap') s += `<path d="M${x - r * 0.95} ${y - r * 0.35} a${r * 0.95} ${r * 0.95} 0 0 1 ${r * 1.9} 0 z" fill="${o.capColor || '#e63946'}" stroke="${INK}" stroke-width="4"/><path d="M${x + r * 0.5} ${y - r * 0.38} l${r * 0.8} 0" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>`;
    return s;
  }

  // 사람: 몸통 + 얼굴. arm: 'down' | 'up' | 'pull' | 'forward'
  function person(x, y, s, o) {
    o = o || {};
    const r = 26 * s, bw = 50 * s, bh = 58 * s, hy = y - bh - r * 0.9;
    let out = '';
    const col = o.body || '#4f9dde';
    const arm = (dir) => {
      const sx = x + dir * bw * 0.45, sy = y - bh * 0.8;
      let ex = sx + dir * 12 * s, ey = sy + 34 * s;
      if (o.arm === 'up') { ex = sx + dir * 14 * s; ey = sy - 36 * s; }
      if (o.arm === 'pull') { ex = sx - dir * 6 * s + 34 * s * (o.pullDir || 1); ey = sy + 6 * s; }
      if (o.arm === 'forward') { ex = sx + 30 * s * (o.faceDir || 1); ey = sy + 8 * s; }
      return `<path d="M${sx} ${sy} L${ex} ${ey}" stroke="${INK}" stroke-width="${12 * s}" stroke-linecap="round"/><path d="M${sx} ${sy} L${ex} ${ey}" stroke="${o.skin || '#ffd9b8'}" stroke-width="${6 * s}" stroke-linecap="round"/>`;
    };
    out += arm(-1) + arm(1);
    out += `<rect x="${x - bw / 2}" y="${y - bh}" width="${bw}" height="${bh}" rx="${16 * s}" fill="${col}" stroke="${INK}" stroke-width="4"/>`;
    if (o.apron) out += `<rect x="${x - bw * 0.3}" y="${y - bh * 0.7}" width="${bw * 0.6}" height="${bh * 0.7}" rx="${6 * s}" fill="#fff" stroke="${INK}" stroke-width="3"/>`;
    if (o.tie) out += `<path d="M${x} ${y - bh + 4} l-${5 * s} ${10 * s} l${5 * s} ${22 * s} l${5 * s} -${22 * s} z" fill="${o.tie}" stroke="${INK}" stroke-width="2"/>`;
    out += face(x, hy, r, o);
    return out;
  }

  const svg = (vb, inner, cls) => `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" ${cls ? `class="${cls}"` : ''}>${inner}</svg>`;

  function knife(x, y, s) { return `<g transform="translate(${x} ${y}) rotate(-35) scale(${s})"><rect x="-4" y="0" width="8" height="22" rx="3" fill="#6b4a2b" stroke="${INK}" stroke-width="3"/><path d="M-6 0 L-6 -46 Q4 -40 6 0 Z" fill="#dfe6ea" stroke="${INK}" stroke-width="3"/></g>`; }

  function heart(x, y, s, fill) { return `<path transform="translate(${x} ${y}) scale(${s})" d="M0 6 C-10 -6 -22 4 -12 14 L0 26 L12 14 C22 4 10 -6 0 6Z" fill="${fill || '#ff4d6d'}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`; }

  return { INK, face, person, svg, knife, heart };
})();
