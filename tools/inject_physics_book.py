#!/usr/bin/env python3
# 将 data/physics_book.json 注入 worker.js（幂等，带标记块可重复运行）
import json, re, os

WEB = "C:/Users/27264/WorkBuddy/2026-09-26-21-53-51/szgaokao-web"
data = json.load(open(os.path.join(WEB, "data/physics_book.json"), encoding="utf-8"))

# 紧凑 JSON（无多余空白，中文保留），可直接作为 JS 字面量
js_literal = json.dumps(data, ensure_ascii=False, separators=(",", ":"))

worker_path = "E:/szgaokao.cn/worker/src/worker.js"
src = open(worker_path, encoding="utf-8").read()

START = "// === PHYSICS_BOOK_DEFAULT_START ==="
END = "// === PHYSICS_BOOK_DEFAULT_END ==="

# 幂等：先删除已存在的块
pat = re.compile(re.escape(START) + r".*?" + re.escape(END) + r"\n?", re.S)
src = pat.sub("", src)

block = f"{START}\nvar physics_book_default = {js_literal};\n{END}\n"

anchor = "// === PHYSICS_DEFAULT_END ===\n"
assert anchor in src, "PHYSICS_DEFAULT_END 锚点缺失"
idx = src.index(anchor)
src = src[: idx + len(anchor)] + block + src[idx + len(anchor):]

open(worker_path, "w", encoding="utf-8").write(src)
print("injected physics_book_default, new worker size =", len(src), "bytes")
