"""Builds the Spanish (es/) and Portuguese (pt/) pages from the English pages at the root.

Run from anywhere:  python3 i18n/build.py

- The English pages are the source. Edit them, then update i18n/strings.py and run this again.
- es/ and pt/ are generated: hand edits there are overwritten on the next build.
- Fails (and writes nothing) if an English text in strings.py is no longer found in any page,
  so a change in the English copy never ships half-translated.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from strings import STRINGS  # noqa: E402

PAGES = ['index.html', 'project-1.html', 'project-2.html', 'project-3.html']
# lang code -> (folder, <html lang>, switcher aria-label, index into the STRINGS tuples)
LANGS = {
    'en': ('', 'en', 'Language', 0),
    'es': ('es/', 'es', 'Idioma', 1),
    'pt': ('pt/', 'pt-BR', 'Idioma', 2),
}
SWITCH_RE = re.compile(r'\n? *<nav class="lang-switch".*?</nav>', re.S)


def switcher(lang, page):
    """EN / ES / PT links to the same page in each language, current one marked."""
    up = '' if lang == 'en' else '../'
    links = []
    for code, (folder, html_lang, _, _) in LANGS.items():
        current = ' aria-current="page"' if code == lang else ''
        links.append(f'<a href="{up}{folder}{page}" hreflang="{html_lang}" lang="{html_lang}"{current}>{code.upper()}</a>')
    return (f'\n        <nav class="lang-switch" aria-label="{LANGS[lang][2]}">'
            + ''.join(links) + '</nav>')


def with_switcher(html, lang, page):
    html = SWITCH_RE.sub('', html)
    anchor = '<div class="nav-right">'
    assert html.count(anchor) == 1, f'{page}: header anchor not found'
    return html.replace(anchor, anchor + switcher(lang, page), 1)


def fix_paths(html):
    """Pages in es/ and pt/ share images, videos, CSS, JS and the CV with the root."""
    html = re.sub(r'\b(src|poster|data-src|href)="(images|assets)/', r'\1="../\2/', html)
    html = html.replace("url('images/", "url('../images/")
    html = re.sub(r'href="(styles\.css|Jesus-Reyna-[^"]+\.pdf)', r'href="../\1', html)
    html = html.replace('src="script.js', 'src="../script.js')
    return html


def check_paths(html, where):
    for m in re.finditer(r'\b(?:src|poster|data-src|href)="([^"]*)"', html):
        url = m.group(1)
        ok = (url.startswith(('../', 'http', '#', 'mailto:')) or url in PAGES
              or url.split('#')[0] in PAGES)
        if not ok:
            sys.exit(f'{where}: relative link not adjusted for the subfolder: {url}')


def main():
    sources = {}
    for page in PAGES:
        path = os.path.join(ROOT, page)
        html = with_switcher(open(path, encoding='utf-8').read(), 'en', page)
        sources[page] = html
        open(path, 'w', encoding='utf-8').write(html)

    # Every English text must still exist somewhere, or its translation would be silently lost.
    missing = [en for en, *_ in STRINGS if not any(en in h for h in sources.values())]
    if missing:
        sys.exit('English text not found in any page (update i18n/strings.py):\n  - '
                 + '\n  - '.join(missing))

    # One pass, longest match first, so translated text is never translated again.
    keys = sorted({en for en, *_ in STRINGS}, key=len, reverse=True)
    pattern = re.compile('|'.join(re.escape(k) for k in keys))

    for lang, (folder, html_lang, _, idx) in LANGS.items():
        if lang == 'en':
            continue
        table = {s[0]: s[idx] for s in STRINGS}
        os.makedirs(os.path.join(ROOT, folder), exist_ok=True)
        for page, html in sources.items():
            out = pattern.sub(lambda m: table[m.group(0)], html)
            out = out.replace('<html lang="en">', f'<html lang="{html_lang}">', 1)
            out = with_switcher(fix_paths(out), lang, page)
            check_paths(out, folder + page)
            open(os.path.join(ROOT, folder, page), 'w', encoding='utf-8').write(out)
        print(f'{folder}: {len(sources)} pages')


if __name__ == '__main__':
    main()
