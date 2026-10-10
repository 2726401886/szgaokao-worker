# -*- coding: utf-8 -*-
import json, sys, time, urllib.request, urllib.error

BASE = 'https://szgaokao.toolshe.cn'
PROXY = 'http://127.0.0.1:65428'
U = 'e2e_exam_' + str(abs(hash(time.time())))[-6:]
P = 'E2eTest123'

opener = urllib.request.build_opener(urllib.request.ProxyHandler({'https': PROXY, 'http': PROXY}))

def call(method, path, token=None, body=None):
    url = BASE + path
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header('Content-Type', 'application/json')
    req.add_header('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36')
    req.add_header('Accept', 'application/json')
    if token:
        req.add_header('authorization', token)
    try:
        with opener.open(req, timeout=30) as r:
            return r.status, json.loads(r.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode('utf-8'))
        except Exception:
            return e.code, {}
    except Exception as e:
        return 0, {'error': str(e)}

ok = True
def check(name, cond, extra=''):
    global ok
    print(('PASS' if cond else 'FAIL'), name, extra)
    if not cond:
        ok = False

# 注册
s, j = call('POST', '/api/register', body={'username': U, 'password': P})
check('register', s == 200 and j.get('token'), 's=' + str(s))
token = j.get('token')
if not token:
    print('NO TOKEN, abort'); sys.exit(1)

# 题库
s, j = call('GET', '/api/physics-exam', token=token)
check('exam 200', s == 200, 's=' + str(s))
qs = j.get('questions', [])
topics = j.get('topics', [])
check('exam total >= 264', len(qs) >= 264, 'n=' + str(len(qs)))
check('exam topics include 质量与密度(八)', '质量与密度(八)' in topics, str(topics))

from collections import Counter, defaultdict
gc = defaultdict(Counter)
for q in qs:
    gc[q['grade']][q['type']] += 1
print('grade distribution:')
for g in sorted(gc):
    print('  grade', g, dict(gc[g]))
check('grade 7 present', 7 in gc, 'g7=' + str(dict(gc.get(7, {}))))
check('grade 7 meets quota',
      gc[7]['choice'] >= 25 and gc[7]['fill'] >= 15 and gc[7]['read'] >= 3 and gc[7]['write'] >= 1,
      str(dict(gc[7])))

# 模拟前端模板组卷 genTemplate
TPL = {
    'choice': {'choice': 25},
    'fill': {'fill': 15, 'choice': 5},
    'mock': {'choice': 14, 'fill': 8, 'read': 3, 'write': 1},
}
QORDER = ['choice', 'fill', 'read', 'write']
allpass = True
for g in [7, 8, 9, 10, 11, 12]:
    pool = [q for q in qs if q['grade'] == g]
    for kind, cnt in TPL.items():
        picked = 0
        for t in QORDER:
            need = cnt.get(t, 0)
            if not need:
                continue
            arr = [q for q in pool if q['type'] == t]
            picked += min(need, len(arr))
        need_total = sum(cnt.values())
        if picked < need_total:
            allpass = False
            print('  FAIL template', kind, 'grade', g, 'picked', picked, 'need', need_total)
print('PASS templates all grades full' if allpass else 'FAIL some template short')
check('all templates full for all grades', allpass)

print('OVERALL', 'PASS' if ok else 'FAIL')
sys.exit(0 if ok else 1)
