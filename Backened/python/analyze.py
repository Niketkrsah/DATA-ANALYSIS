# #!/usr/bin/env python3
# import os
# import sys
# import re
# import argparse
# import warnings
# import json

# import pandas as pd
# import matplotlib.pyplot as plt
# import seaborn as sns
# from pptx import Presentation
# from pptx.util import Inches
# from pptx.dml.color import RGBColor
# import shutil

# def clean_output_dir(outdir):
#     if os.path.exists(outdir):
#         shutil.rmtree(outdir)
#     os.makedirs(outdir, exist_ok=True)

# # ─── Fix console encoding on Windows ───────────────────────────────────────────
# if os.name == 'nt':
#     sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# # ─── Config & Utilities ───────────────────────────────────────────────────────
# warnings.filterwarnings("ignore", message=".*Tight layout.*")
# plt.rcParams["font.family"] = "Segoe UI Emoji"
# sns.set(style="whitegrid")


# def parse_args():
#     p = argparse.ArgumentParser()
#     p.add_argument("-i", "--input", required=True, help="CSV file path")
#     p.add_argument("-o", "--outdir", required=True, help="Output folder")
#     p.add_argument("-n", "--sample", type=int, default=1_000_000,
#                    help="Max rows to read")
#     p.add_argument("--summary-col", default="City", help="Column to summarize in JSON")
#     return p.parse_args()


# def ensure_dirs(outdir):
#     imgs = os.path.join(outdir, "images")
#     os.makedirs(imgs, exist_ok=True)
#     return imgs


# def load_df(path, nrows):
#     return pd.read_csv(path, nrows=nrows)


# def cleanup_df(df):
#     df.columns = df.columns.str.strip()
#     if "Event Time" in df:
#         df["Event Time"] = pd.to_datetime(df["Event Time"], errors="coerce")
#     return df.ffill().infer_objects(copy=False)


# def save_dual_format(fig, name, imgs):
#     jpg_path = os.path.join(imgs, f"{name}.jpg")
#     fig.savefig(jpg_path, dpi=200, bbox_inches="tight")
#     plt.close(fig)
#     return jpg_path


# def bar_chart(vc, title, xlabel, name, imgs, figsize=(10, 5)):
#     fig, ax = plt.subplots(figsize=figsize)
#     sns.barplot(x=vc.index, y=vc.values, ax=ax)
#     ax.set(title=title, xlabel=xlabel, ylabel="Count")
#     plt.setp(ax.get_xticklabels(), rotation=45)
#     fig.tight_layout()
#     return save_dual_format(fig, name, imgs)


# def parse_logs(df, imgs):
#     col = "App Crash Process Info"
#     records = []
#     for log in df.get(col, pd.Series()).dropna().astype(str):
#         m = re.search(r"signal \d+ \((.*?)\)", log)
#         if m:
#             records.append(m.group(1))
#     out = []
#     if records:
#         vc = pd.Series(records).value_counts()
#         bar_chart(vc, "Crash Signal Frequency", "Signal", "crash_signals", imgs, (8, 5))
#         out.append(vc.to_dict())
#     return out
# # ─── Additional Imports for Extended Analysis ────────────────────────────────
# from datetime import datetime
# import numpy as np

# # ─── Helper: Safe regex extraction ───────────────────────────────────────────
# def extract(pattern, text, group=1):
#     match = re.search(pattern, text)
#     return match.group(group) if match else None

# # ─── Extended Log Parsing: Structured Crash Info ─────────────────────────────
# def parse_structured_crash_logs(df):
#     crash_column = "App Crash Process Info"
#     parsed_rows = []

#     for i, row in df[crash_column].dropna().items():
#         log = row
#         try:
#             parsed_rows.append({
#                 "Timestamp": extract(r"Timestamp: (.*?) pid", log),
#                 "App": extract(r">>> (.*?) <<<", log),
#                 "ABI": extract(r"ABI: '(.*?)'", log),
#                 "Process": extract(r"name: (.*?)\s+>>>", log),
#                 "Signal Name": extract(r"signal \d+ \((.*?)\)", log),
#                 "Signal Code": int(extract(r"signal (\d+)", log) or -1),
#                 "Error Name": extract(r"code -?\d+ \((.*?)\)", log),
#                 "Error Code": int(extract(r"code (-?\d+)", log) or -1),
#                 "Build": extract(r"Build fingerprint: '(.*?)'", log),
#                 "Libraries (Backtrace)": " → ".join(re.findall(r"#\d+\s+pc .*?\s+(.*?)\s", log)[:3]) or "N/A"
#             })
#         except Exception as e:
#             print(f"❌ Could not parse row {i}: {e}")

#     parsed_df = pd.DataFrame(parsed_rows)
#     parsed_df["Timestamp"] = pd.to_datetime(parsed_df["Timestamp"], errors="coerce", utc=True)
#     return parsed_df

# # ─── Helper: Annotate Bar Charts ─────────────────────────────────────────────
# def annotate_bars(ax):
#     for p in ax.patches:
#         height = p.get_height()
#         ax.annotate(f'{int(height)}',
#                     xy=(p.get_x() + p.get_width() / 2, height),
#                     xytext=(0, 6),
#                     textcoords='offset points',
#                     ha='center', va='bottom',
#                     fontsize=9, fontweight='bold')

# # ─── Extended Charts from Structured Crash Logs ──────────────────────────────
# def generate_extended_crash_charts(parsed_df, imgs, summary):
#     # 1. Crash Frequency by Signal
#     if "Signal Name" in parsed_df:
#         vc = parsed_df["Signal Name"].value_counts()
#         fig, ax = plt.subplots(figsize=(10, 8))
#         vc.plot(kind="bar", color="teal", ax=ax)
#         annotate_bars(ax)
#         ax.set_title("Crash Frequency by Signal")
#         ax.set_xlabel("Signal")
#         ax.set_ylabel("Occurrences")
#         ax.grid(axis='y', linestyle='--', alpha=0.6)
#         fig.tight_layout()
#         save_dual_format(fig, "signal_frequency", imgs)
#         summary["Crash Frequency by Signal"] = vc.to_dict()

#     # 2. Top 10 Backtrace Chains
#     if "Libraries (Backtrace)" in parsed_df:
#         vc = parsed_df["Libraries (Backtrace)"].value_counts().head(10)
#         fig, ax = plt.subplots(figsize=(12, 8))
#         vc.plot(kind="barh", color="steelblue", ax=ax)
#         for p in ax.patches:
#             width = p.get_width()
#             ax.annotate(f'{int(width)}',
#                         xy=(width, p.get_y() + p.get_height() / 2),
#                         xytext=(6, 0),
#                         textcoords='offset points',
#                         ha='left', va='center',
#                         fontsize=9, fontweight='bold')
#         ax.set_title("Top 10 Backtrace Chains")
#         ax.set_xlabel("Occurrences")
#         ax.invert_yaxis()
#         fig.tight_layout()
#         save_dual_format(fig, "top_backtrace_chains", imgs)
#         summary["Top Backtrace Chains"] = vc.to_dict()

#     # 3. Top Error Types
#     if "Error Name" in parsed_df:
#         vc = parsed_df["Error Name"].value_counts()
#         fig, ax = plt.subplots(figsize=(14, 8))
#         vc.plot(kind="bar", color="salmon", ax=ax)
#         annotate_bars(ax)
#         ax.set_title("Top Error Types")
#         ax.set_ylabel("Count")
#         ax.set_xticklabels(ax.get_xticklabels(), rotation=45)
#         fig.tight_layout()
#         save_dual_format(fig, "top_error_types", imgs)
#         summary["Top Error Types"] = vc.to_dict()

# def build_ppt_from_folder(img_folder, outdir):
#     prs = Presentation()
#     blank_layout = next(
#         (ly for ly in prs.slide_layouts if ly.name.lower().startswith("blank")),
#         prs.slide_layouts[6]
#     )

#     image_paths = sorted([
#         os.path.join(img_folder, f)
#         for f in os.listdir(img_folder)
#         if f.lower().endswith((".png", ".jpg", ".jpeg"))
#     ])

#     print("🖼️ Images added to PPT:")
#     for img in image_paths:
#         print(" -", img)
#         slide = prs.slides.add_slide(blank_layout)

#         for shp in list(slide.shapes):
#             if shp.shape_type != 13:
#                 el = shp.element
#                 el.getparent().remove(el)

#         fill = slide.background.fill
#         fill.solid()
#         fill.fore_color.rgb = RGBColor(0xFF, 0xFF, 0xFF)

#         slide.shapes.add_picture(
#             img,
#             0, 0,
#             width=prs.slide_width,
#             height=prs.slide_height
#         )

#     pptx_path = os.path.join(outdir, "presentation.pptx")
#     prs.save(pptx_path)
#     print(f"✅ PPTX generated: {pptx_path} ({len(image_paths)} slides)")
#     return pptx_path


# def main():
#     args = parse_args()
#     clean_output_dir(args.outdir)

#     imgs = ensure_dirs(args.outdir)

#     df = load_df(args.input, args.sample)
#     df = cleanup_df(df)

#     summary = {}

#     # Chart 1: Crashes by State
#     if "State" in df:
#         vc = df["State"].value_counts()
#         bar_chart(vc, "Crashes by State", "State", "by_state", imgs, (12, 6))
#         summary["Crashes by State"] = vc.to_dict()

#     # Chart 2: Crash Signal Frequency from logs
#     signal_summary = parse_logs(df, imgs)
#         # 📦 Extended Report: Structured Crash Log Analysis
#     parsed_df = parse_structured_crash_logs(df)
#     generate_extended_crash_charts(parsed_df, imgs, summary)
#     if signal_summary:
#         summary["Crash Signal Frequency"] = signal_summary[0]

#     # Chart 3: Summary column (e.g., City)
#     if args.summary_col in df:
#         vc = df[args.summary_col].dropna().astype(str).value_counts().sort_index()
#         bar_chart(vc, f"Crashes by {args.summary_col}", args.summary_col, f"by_{args.summary_col.lower()}", imgs)
#         summary[f"Crashes by {args.summary_col}"] = vc.to_dict()
#     else:
#         print(f"⚠️ Column '{args.summary_col}' not found in data.")

#     # Save JSON summary
#     json_path = os.path.join(args.outdir, "crash_summary.json")
#     with open(json_path, "w", encoding="utf-8") as f:
#         json.dump(summary, f, indent=2, ensure_ascii=False)
#     print(f"✅ JSON saved: {json_path}")

#     # Build PPT from all images
#     build_ppt_from_folder(imgs, args.outdir)


# if __name__ == "__main__":
#     main()