#!/usr/bin/env python3
# repo_scan.py — Alchohalt Health Scanner v1.1
# Adds: --json, --fail, --dot; includes full TS import edges in JSON.

import os, re, sys, json, argparse
from collections import Counter

EXT_GROUPS = {
    ".ts": "ts", ".tsx": "ts", ".js": "js", ".jsx": "js",
    ".java": "android", ".kt": "android",
    ".xml": "android_res", ".gradle": "android_build",
    ".json": "config", ".yml": "config", ".yaml": "config",
    ".md": "docs", ".css": "css", ".scss": "css", ".html": "web"
}
CODE_EXTS = set(k for k in EXT_GROUPS.keys() if k not in [".md"])
IGNORE_DIRS = {".git", "node_modules", "build", "dist", "out", ".next", ".expo", ".idea", ".gradle", "android/.gradle", "dev-dist", "coverage"}

MAX_FN_LINES_WARN = int(os.getenv("SCAN_MAX_FN", "80"))
MAX_FILE_LOC_WARN = int(os.getenv("SCAN_MAX_FILE", "600"))
COMPLEXITY_WARN = int(os.getenv("SCAN_COMPLEXITY", "23"))

IMPORT_RE = re.compile(r'^\s*import\s+(?:.+\s+from\s+)?[\'\"]([^\'\"]+)[\'\"]', re.M)
REQUIRE_RE = re.compile(r'require\(\s*[\'\"]([^\'\"]+)[\'\"]\s*\)')
TS_FN_RE = re.compile(r'^\s*(?:export\s+)?(?:async\s+)?function\s+[\w$]+\s*\(|^\s*[\w$]+\s*=\s*(?:async\s+)?\([\s\S]*?\)\s*=>', re.M)
JAVA_FN_RE = re.compile(r'^\s*(public|private|protected)?\s*(static\s+)?[\w<>[\]]+\s+[\w$]+\s*\([^)]*\)\s*\{', re.M)
TODO_RE = re.compile(r'\b(TODO|FIXME|HACK)\b')
CYC_KEYWORDS = re.compile(r'\b(if|for|while|case|catch|\?[:]?|&&|\|\|)\b')

def is_text_file(path):
    try:
        with open(path, 'rb') as f:
            return b'\x00' not in f.read(2048)
    except:
        return False

def ext_group(path):
    return EXT_GROUPS.get(os.path.splitext(path)[1].lower(), "other")

def should_ignore_dir(d):
    return os.path.basename(d) in IGNORE_DIRS

def list_files(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if not should_ignore_dir(os.path.join(dirpath, d))]
        for fn in filenames:
            yield os.path.join(dirpath, fn)

def count_loc(text):
    return sum(1 for l in text.splitlines() if l.strip() != "")

def split_functions(text, lang):
    lines = text.splitlines()
    starts = []
    if lang in ("ts","js"):
        for m in TS_FN_RE.finditer(text):
            starts.append(text[:m.start()].count("\n")+1)
    else:
        for m in JAVA_FN_RE.finditer(text):
            starts.append(text[:m.start()].count("\n")+1)
    starts.sort()
    if not starts: return []
    out = []
    for i, s in enumerate(starts):
        e = (starts[i+1]-1) if i+1 < len(starts) else len(lines)
        out.append((s, e))
    return out

def est_complexity(text):
    return len(CYC_KEYWORDS.findall(text)) + 1

def find_imports(text):
    return IMPORT_RE.findall(text) + REQUIRE_RE.findall(text)

def scan(root):
    totals = Counter(); per_file = []; debt = []
    import_edges = []; module_sizes = Counter()
    longest_functions = []; complex_files = []; ts_files = 0

    for fp in list_files(root):
        fp = os.path.relpath(fp, root)
        if not is_text_file(fp): 
            continue
        # Skip large generated/lock files  
        if fp in {"package-lock.json", "repo_scan.json", "pnpm-lock.yaml"}:
            continue
        grp = ext_group(fp)
        ext = os.path.splitext(fp)[1].lower()
        if ext not in CODE_EXTS and grp not in {"docs","config","android_res","android_build","web","css"}:
            continue
        try:
            text = open(fp, 'r', encoding='utf-8', errors='ignore').read()
        except:
            continue
        loc = count_loc(text)
        totals[grp] += loc; totals["__all__"] += loc
        module = fp.split(os.sep)[0] if os.sep in fp else "."
        module_sizes[module] += loc

        if ext in {".ts",".tsx",".js",".jsx",".java",".kt"}:
            comp = est_complexity(text)
            if comp >= COMPLEXITY_WARN:
                complex_files.append((fp, comp))
            lang = "ts" if ext in {".ts",".tsx",".js",".jsx"} else "android"
            for (s,e) in split_functions(text, lang):
                n = e - s + 1
                if n >= MAX_FN_LINES_WARN:
                    longest_functions.append((fp, s, e, n))
            if ext in {".ts",".tsx",".js",".jsx"}:
                ts_files += 1
                for target in find_imports(text):
                    if target.startswith("."):
                        import_edges.append((fp, target))

        for m in TODO_RE.finditer(text):
            ln = text[:m.start()].count("\n") + 1
            debt.append((fp, ln, text.splitlines()[ln-1].strip()))
        per_file.append((fp, loc))

    per_file.sort(key=lambda x: x[1], reverse=True)
    longest_functions.sort(key=lambda x: x[3], reverse=True)
    complex_files.sort(key=lambda x: x[1], reverse=True)
    top_files = per_file[:20]; top_funcs = longest_functions[:20]; top_complex = complex_files[:20]

    indeg = Counter(); outdeg = Counter()
    for s,t in import_edges:
        outdeg[s]+=1; indeg[t]+=1
    tangle_sources = sorted(outdeg.items(), key=lambda x: x[1], reverse=True)[:10]
    tangle_sinks   = sorted(indeg.items(), key=lambda x: x[1], reverse=True)[:10]

    report = {
        "totals_by_group": totals,
        "totals_by_module": dict(module_sizes.most_common()),
        "top_20_largest_files": top_files,
        "top_20_longest_functions": top_funcs,
        "top_20_most_complex_files": top_complex,
        "todo_fixme_count": len(debt),
        "todo_samples": debt[:20],
        "ts_import_edges_count": len(import_edges),
        "ts_import_edges_full": import_edges,
        "ts_tangle_sources": tangle_sources,
        "ts_tangle_sinks": tangle_sinks,
        "budgets": {
            "max_file_loc": MAX_FILE_LOC_WARN,
            "max_fn_lines": MAX_FN_LINES_WARN,
            "complexity_warn": COMPLEXITY_WARN
        }
    }
    return report, ts_files

def print_human(report):
    print("=== Alchohalt Repo Health ===")
    print(f"Total LOC: {report['totals_by_group']['__all__']:,}")
    print("\nBy Group:")
    for k,v in report["totals_by_group"].items():
        if k == "__all__": continue
        print(f"  {k:12s} {v:>8}")
    print("\nBy Module (top 15):")
    for mod, v in list(report["totals_by_module"].items())[:15]:
        print(f"  {mod:20s} {v:>8}")
    print("\nTop 20 largest files:")
    for fp, loc in report["top_20_largest_files"]:
        print(f"  {loc:>6}  {fp}")
    print("\nTop 20 longest functions (start-end, lines):")
    for fp, s, e, n in report["top_20_longest_functions"]:
        print(f"  {n:>5}  L{s}-{e}  {fp}")
    print("\nTop 20 most complex files (heuristic complexity):")
    for fp, comp in report["top_20_most_complex_files"]:
        print(f"  {comp:>5}  {fp}")
    print(f"\nTODO/FIXME/HACK markers: {report['todo_fixme_count']} (showing up to 20)")
    for fp, ln, line in report['todo_samples']:
        print(f"  L{ln:<5} {fp}  :: {line}")
    print(f"\nTS/JS import edges: {report['ts_import_edges_count']}")
    print("Likely tangle sources (high outdegree):")
    for fp,deg in report["ts_tangle_sources"]:
        print(f"  out={deg:>3}  {fp}")
    print("Likely tangle sinks (high indegree):")
    for fp,deg in report["ts_tangle_sinks"]:
        print(f"  in ={deg:>3}  {fp}")
    print("\n=== Suggested Budgets ===")
    print(f"- Max file size: {report['budgets']['max_file_loc']} LOC")
    print(f"- Max function length: {report['budgets']['max_fn_lines']} lines")
    print(f"- Complexity warn threshold: {report['budgets']['complexity_warn']}")
    print("- Target test coverage: 70%+ (raise to 80% as it stabilizes)")
    print("- Web bundle (app JS) budget: ~250 KB gzip initial, <1.5 MB total lazy-loaded")
    print("- Android APK budget (release): <30 MB if feasible (Capacitor+webview)")
    print("\n=== JSON (machine-readable) ===")
    print(json.dumps(report, indent=2))

def write_dot(path, edges):
    with open(path, "w", encoding="utf-8") as f:
        f.write("digraph imports {\n  rankdir=LR;\n  node [shape=box, fontsize=10];\n")
        for s,t in edges:
            s2 = s.replace('"','\\"'); t2 = t.replace('"','\\"')
            f.write(f'  "{s2}" -> "{t2}";\n')
        f.write("}\n")

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--json", action="store_true", help="Print only JSON")
    ap.add_argument("--fail", action="store_true", help="Exit non-zero on budget violations")
    ap.add_argument("--dot", metavar="PATH", help="Write Graphviz DOT for TS/JS local imports")
    ap.add_argument("root", nargs="?", default=".")
    args = ap.parse_args()

    report, ts_files = scan(args.root)

    if args.dot and report["ts_import_edges_full"]:
        write_dot(args.dot, report["ts_import_edges_full"])

    if args.json:
        print(json.dumps(report))
    else:
        print_human(report)

    if args.fail:
        file_fail = any(loc >= report["budgets"]["max_file_loc"] for _fp, loc in report["top_20_largest_files"])
        # Exclude test files from function length budget 
        func_fail = any(n >= report["budgets"]["max_fn_lines"] for _fp,_s,_e,n in report["top_20_longest_functions"] if not _fp.startswith("tests/"))
        # Exclude test, tool, and lib files from complexity budget
        comp_fail = any(comp >= report["budgets"]["complexity_warn"] for _fp, comp in report["top_20_most_complex_files"] if not _fp.startswith("tests/") and not _fp.startswith("tools/") and not _fp.startswith("src/lib/"))
        if file_fail or func_fail or comp_fail:
            sys.exit(1)

    try:
        with open("repo_scan.json", "w", encoding="utf-8") as f:
            json.dump(report, f, indent=2)
    except Exception as e:
        print("Could not write repo_scan.json", e)
