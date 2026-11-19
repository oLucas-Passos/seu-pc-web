#!/usr/bin/env python3
"""Gera a versão para Artifact do claude.ai.

O Artifact recebe só o conteúdo da página (sem <html>/<head>/<body>) e só aceita
scripts externos de CDNs liberadas. Por isso:
  - html/index.html vira um fragmento, com um import map apontando "three" para o jsDelivr;
  - os arquivos de js/vendor/ viram "atalhos" que reexportam o three.js do jsDelivr.

Uso: python3 tools/build-artifact.py <pasta-de-saida>
Imprime um JSON {caminho_publicado: caminho_no_disco} com todos os arquivos.
"""
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0'
SHIMS = {
    'js/vendor/three.module.min.js': f'{CDN}/build/three.module.min.js',
    'js/vendor/OrbitControls.js': f'{CDN}/examples/jsm/controls/OrbitControls.js',
    'js/vendor/RoundedBoxGeometry.js': f'{CDN}/examples/jsm/geometries/RoundedBoxGeometry.js',
    'js/vendor/RoomEnvironment.js': f'{CDN}/examples/jsm/environments/RoomEnvironment.js',
}


def main(out_dir: str) -> None:
    out = pathlib.Path(out_dir).resolve()
    (out / 'js' / 'vendor').mkdir(parents=True, exist_ok=True)

    page = (ROOT / 'html' / 'index.html').read_text(encoding='utf-8')
    page = page.replace('"../css/', '"css/').replace('"../js/', '"js/')
    page = re.sub(r'<!doctype html>\s*', '', page, flags=re.I)
    for tag in ['<html lang="pt-BR">', '</html>', '<head>', '</head>', '<body>', '</body>',
                '<meta charset="utf-8">\n',
                '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n']:
        page = page.replace(tag, '')
    importmap = '<script type="importmap">{"imports":{"three":"%s/build/three.module.min.js"}}</script>\n' % CDN
    page = page.replace('<script type="module" src="js/main.js"></script>', importmap + '<script type="module" src="js/main.js"></script>')
    (out / 'index.html').write_text(page.strip() + '\n', encoding='utf-8')

    files = {}
    for published, url in SHIMS.items():
        p = out / published
        p.write_text(f"export * from '{url}';\n", encoding='utf-8')
        files[published] = str(p)
    for sub in ['css', 'js']:
        for f in sorted((ROOT / sub).rglob('*')):
            if f.is_file() and f.suffix in ('.css', '.js') and 'vendor' not in f.parts:
                files[str(f.relative_to(ROOT))] = str(f)
    print(json.dumps(files, ensure_ascii=False))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'dist-artifact')
