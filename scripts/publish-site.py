#!/usr/bin/env python3
"""Export only public website assets and publish isolated GitHub Pages branches.

Preparation is the default. --publish requires an explicit --target. No code or
manuscript checkout is read, and no repository default branch is changed.
"""
import argparse
import json
from pathlib import Path
import shutil
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
URL = 'https://tianfuwang.tech/agentic-consensus/'
SOURCE = 'GeminiLight/agentic-consensus-site'
TARGETS = {'primary': ('GeminiLight/agentic-consensus', 'gh-pages'),
           'legacy': (SOURCE, 'legacy-redirect')}
FILES = ['index.html', 'styles.css', 'script.js', 'robots.txt', 'sitemap.xml',
         'llms.txt', 'site.webmanifest']


def run(*args, cwd=None, capture=False):
    return subprocess.check_output(args, cwd=cwd, text=True).strip() if capture else subprocess.check_call(args, cwd=cwd)


def prepare(destination):
    sha = run('git', 'rev-parse', 'HEAD', cwd=ROOT, capture=True)
    for target in TARGETS:
        out = destination / target
        out.mkdir(parents=True, exist_ok=True)
        (out / '.nojekyll').touch()
        # These assets already belong to the public website source repository.
        shutil.copytree(ROOT / 'assets', out / 'assets', dirs_exist_ok=True)
        (out / 'release.json').write_text(json.dumps({'source': SOURCE, 'commit': sha, 'target': target}, indent=2) + '\n')
        if target == 'primary':
            for name in FILES:
                shutil.copy2(ROOT / name, out / name)
        else:
            redirect = '''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Agentic Consensus — Website moved</title>
<link rel="canonical" href="https://tianfuwang.tech/agentic-consensus/">
<script>
const path = location.pathname.replace(/^\\/agentic-consensus-site\\/?/, "").replace(/^index\\.html$/, "");
location.replace("https://tianfuwang.tech/agentic-consensus/" + path + location.search + location.hash);
</script>
<meta http-equiv="refresh" content="0;url=https://tianfuwang.tech/agentic-consensus/">
<style>body{margin:12vh auto;padding:24px;max-width:600px;background:#f7f7f2;color:#173f35;font:18px/1.7 system-ui}a{color:inherit}</style>
</head><body><h1>Agentic Consensus</h1><p>Our project website has moved.</p><a href="https://tianfuwang.tech/agentic-consensus/">Continue to the website →</a></body></html>
'''
            (out / 'index.html').write_text(redirect)
            (out / '404.html').write_text(redirect)
            (out / 'robots.txt').write_text(f'User-agent: *\nAllow: /\nSitemap: {URL}sitemap.xml\n')
    print(f'Prepared public assets in {destination}')


def publish(destination, target):
    repo, branch = TARGETS[target]
    with tempfile.TemporaryDirectory(prefix='consensus-pages-git-') as directory:
        checkout = Path(directory)
        run('git', 'init', '-q', directory)
        remote = f'https://github.com/{repo}.git'
        run('git', 'remote', 'add', 'origin', remote, cwd=checkout)
        existing = run('git', 'ls-remote', '--heads', 'origin', branch, cwd=checkout, capture=True)
        if existing:
            run('git', 'fetch', '--depth=1', 'origin', branch, cwd=checkout)
            run('git', 'checkout', '-q', '-b', branch, 'FETCH_HEAD', cwd=checkout)
            marker = checkout / 'release.json'
            if not marker.exists() or json.loads(marker.read_text()).get('source') != SOURCE:
                raise SystemExit('Refusing to overwrite a branch not managed by this website.')
            for item in checkout.iterdir():
                if item.name == '.git':
                    continue
                shutil.rmtree(item) if item.is_dir() else item.unlink()
        else:
            run('git', 'checkout', '-q', '--orphan', branch, cwd=checkout)
        shutil.copytree(destination / target, checkout, dirs_exist_ok=True)
        run('git', 'add', '--all', cwd=checkout)
        if subprocess.call(['git', 'diff', '--cached', '--quiet'], cwd=checkout) == 0:
            print(f'{repo}:{branch} already matches the prepared release')
            return
        run('git', 'commit', '-q', '-m', f'Publish project website ({target})', cwd=checkout)
        run('git', 'push', 'origin', f'HEAD:refs/heads/{branch}', cwd=checkout)
        print(f'Published {repo}:{branch}; configure Pages to serve this branch at /')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True, help='New, empty export directory')
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--target', choices=TARGETS)
    args = parser.parse_args()
    if args.publish and not args.target:
        parser.error('--publish requires --target primary or --target legacy')
    if args.output.exists() and any(args.output.iterdir()):
        parser.error('--output must be empty; refusing to replace existing files')
    if args.publish and run('git', 'status', '--porcelain', cwd=ROOT, capture=True):
        parser.error('Publish from a clean, verified checkout; commit or preserve pending source changes first')
    prepare(args.output)
    if args.publish:
        publish(args.output, args.target)
