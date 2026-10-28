// A tiny element builder, so the screens read as what they show.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function show(root, ...children) {
  root.replaceChildren(...children.flat().filter(Boolean));
  window.scrollTo(0, 0);
}

export function topBar(title, { back, right } = {}) {
  return h('div', { class: 'top' },
    back ? h('button', { class: 'iconbtn', 'aria-label': 'Back', onclick: back }, '‹') : h('span', { style: 'width:44px' }),
    h('h1', {}, title),
    right || h('span', { style: 'width:44px' }));
}

export function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
