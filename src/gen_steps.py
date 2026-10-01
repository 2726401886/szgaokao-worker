# -*- coding: utf-8 -*-
"""为数学题批量生成「分步解题」steps 字段（AI 初稿，由 analysis/tip 派生，须人工复核）。

数据真相链：源 JSON(src/math_*.json) -> _inject_math.py 整行注入 worker.js。
本脚本只改源 JSON，把每题的 analysis（优先）或 tip（兜底）拆成结构化 steps：
    steps: [{ "title": "第N步", "detail": "..." }, ...]

拆分规则（确定性启发式，非模型生成）：
  - 以句末标点 。！？ 与分号 ； 切分为天然步骤边界；
  - 过滤空串；若源文本本身无有效讲解则跳过（不强行编步骤）。
仅当题目尚无 steps 字段时才写入，便于后续人工精修后不丢失。

⚠️ 红线：本脚本产出的是 AI/规则派生初稿，正确性未经逐题人工校验，
   上线后应由人工抽样核对，尤其计算类步骤符号与推理表述。
"""
import json, os, re

SRC = os.path.dirname(os.path.abspath(__file__))
FILES = ["math_primary.json", "math_middle.json", "math_high.json"]

SENT_SPLIT = re.compile(r"[。！？\n]")
SEMI_SPLIT = re.compile(r"[；;]")


def decompose(text):
    if not text or not text.strip():
        return None
    text = text.strip()
    parts = []
    for seg in SENT_SPLIT.split(text):
        seg = seg.strip()
        if not seg:
            continue
        for sub in SEMI_SPLIT.split(seg):
            sub = sub.strip()
            if sub:
                parts.append(sub)
    if not parts:
        return None
    return [{"title": "第%d步" % (i + 1), "detail": p} for i, p in enumerate(parts)]


def main():
    for fn in FILES:
        path = os.path.join(SRC, fn)
        data = json.load(open(path, encoding="utf-8"))
        nq = 0
        nstep = 0
        nskip = 0
        for vol in data.get("volumes", []):
            for q in vol.get("questions", []):
                nq += 1
                if q.get("steps"):
                    # 已有手工精修步骤，保留不覆盖
                    nskip += 1
                    continue
                src = q.get("analysis") or q.get("tip") or ""
                st = decompose(src)
                if st:
                    q["steps"] = st
                    nstep += 1
        json.dump(data, open(path, "w", encoding="utf-8"),
                  ensure_ascii=False, indent=1)
        print("%s: 题数=%d, 新增steps=%d, 跳过(已有)=%d" %
              (fn, nq, nstep, nskip))


if __name__ == "__main__":
    main()
